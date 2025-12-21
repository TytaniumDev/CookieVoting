import React, { useState, useRef, useEffect } from 'react';
import { type Category, type CookieCoordinate } from '../lib/types';
import { uploadImage } from '../lib/storage';
import { addCategory, updateCategoryCookies, getCategories, addBaker, removeBaker, getBakers } from '../lib/firestore';
import { validateImage, validateCategoryName, validateMakerName, sanitizeInput } from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { detectCookiesGemini } from '../lib/cookieDetectionGemini';
import { getAllImageDetections } from '../lib/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ImageWithDetections, type DetectedCookie } from './ImageWithDetections';
import { calculateSmartLabelPositions, calculateBoundsFromCookie } from '../lib/labelPositioning';
import styles from './EventSetupWizard.module.css';

// Helper function to generate a stable ID for a detected cookie based on image URL and coordinates
// This ensures the same cookie always gets the same ID
function generateDetectedCookieId(imageUrl: string, cookie: { x: number; y: number }): string {
    // Use a hash of image URL + coordinates to create a stable ID
    // Extract file identifier from URL for consistency
    const extractFileName = (url: string): string => {
        try {
            const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
            if (uuidMatch) return uuidMatch[1];
            const urlObj = new URL(url.split('?')[0]);
            const pathParts = urlObj.pathname.split('/');
            return pathParts[pathParts.length - 1].split('.')[0];
        } catch {
            return url;
        }
    };
    
    const fileId = extractFileName(imageUrl);
    // Round coordinates to 1 decimal place for stability (avoid floating point issues)
    const x = Math.round(cookie.x * 10) / 10;
    const y = Math.round(cookie.y * 10) / 10;
    return `detected_${fileId}_${x}_${y}`;
}

// Helper function to assign IDs to detected cookies if they don't have them
function assignDetectedCookieIds(imageUrl: string, cookies: DetectedCookie[]): DetectedCookie[] {
    return cookies.map(cookie => ({
        ...cookie,
        id: cookie.id || generateDetectedCookieId(imageUrl, cookie)
    }));
}

interface Props {
    eventId: string;
    eventName: string;
    onComplete: () => void;
    onCancel: () => void;
    initialCategoryId?: string;
    autoAdvance?: boolean; // Whether to auto-advance after tagging
}

type SetupStep = 'upload' | 'nameCategories' | 'addBakers' | 'tagCookies';

interface UploadedImage {
    file: File;
    preview: string;
    uploaded: boolean;
    imageUrl?: string;
    categoryName?: string;
}

interface Baker {
    id: string;
    name: string;
}

export function EventSetupWizard({ eventId, eventName, onComplete, onCancel, initialCategoryId }: Props) {
    const [step, setStep] = useState<SetupStep>('upload');
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [bakers, setBakers] = useState<Baker[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentBakerIndex, setCurrentBakerIndex] = useState(0);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [taggedCookies, setTaggedCookies] = useState<Record<string, Record<string, CookieCoordinate[]>>>({}); // categoryId -> bakerId -> cookies[]
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [detectionError, setDetectionError] = useState<string | null>(null);
    const [detectedCookies, setDetectedCookies] = useState<DetectedCookie[]>([]);
    const [loadingDetection, setLoadingDetection] = useState(false);
    const [selectedDetectedCookie, setSelectedDetectedCookie] = useState<DetectedCookie | null>(null);
    const [showBakerSelect, setShowBakerSelect] = useState(false);
    const [bakerSelectPosition, setBakerSelectPosition] = useState<{x: number, y: number} | null>(null);
    const [allCookiesTagged, setAllCookiesTagged] = useState(false);
    const [categoryCompletion, setCategoryCompletion] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const categoryInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Keep refs array in sync with images array
    useEffect(() => {
        categoryInputRefs.current = categoryInputRefs.current.slice(0, images.length);
    }, [images.length]);

    // Load existing data when editing
    useEffect(() => {
        const loadExistingData = async () => {
            try {
                const existingCategories = await getCategories(eventId);
                
                if (existingCategories.length > 0) {
                    // Event has existing categories - load them
                    setCategories(existingCategories);
                    
                    // Convert categories to images format for display
                    const categoryImages: UploadedImage[] = existingCategories.map(cat => ({
                        file: {} as File, // Not needed for existing
                        preview: cat.imageUrl,
                        uploaded: true,
                        imageUrl: cat.imageUrl,
                        categoryName: cat.name
                    }));
                    setImages(categoryImages);
                    
                    // Load bakers from Firestore
                    const savedBakers = await getBakers(eventId);
                    const bakerMap = new Map<string, Baker>();
                    
                    // Add saved bakers
                    savedBakers.forEach(baker => {
                        bakerMap.set(baker.name, {
                            id: baker.id,
                            name: baker.name
                        });
                    });
                    
                    // Also extract bakers from existing cookies (for backward compatibility)
                    existingCategories.forEach(cat => {
                        cat.cookies.forEach(cookie => {
                            if (cookie.makerName && cookie.makerName !== CONSTANTS.DEFAULT_MAKER_NAME) {
                                if (!bakerMap.has(cookie.makerName)) {
                                    bakerMap.set(cookie.makerName, {
                                        id: cookie.makerName,
                                        name: cookie.makerName
                                    });
                                }
                            }
                        });
                    });
                    
                    const existingBakers = Array.from(bakerMap.values());
                    setBakers(existingBakers);
                    
                    // Load existing tagged cookies
                    const existingTagged: Record<string, Record<string, CookieCoordinate[]>> = {};
                    existingCategories.forEach(cat => {
                        existingTagged[cat.id] = {};
                        cat.cookies.forEach(cookie => {
                            // Find baker by name
                            const baker = bakerMap.get(cookie.makerName);
                            if (baker) {
                                if (!existingTagged[cat.id][baker.id]) {
                                    existingTagged[cat.id][baker.id] = [];
                                }
                                existingTagged[cat.id][baker.id].push(cookie);
                            }
                        });
                    });
                    setTaggedCookies(existingTagged);
                    
                    // Start at appropriate step based on what's complete or initialCategoryId
                    if (initialCategoryId) {
                        // Navigate directly to tagging for the specified category
                        const categoryIndex = existingCategories.findIndex(cat => cat.id === initialCategoryId);
                        if (categoryIndex !== -1 && existingBakers.length > 0) {
                            setStep('tagCookies');
                            setCurrentBakerIndex(0);
                            setCurrentCategoryIndex(categoryIndex);
                        } else if (categoryIndex !== -1 && existingBakers.length === 0) {
                            // Need to add bakers first
                            setStep('addBakers');
                        } else {
                            // Category not found, start at normal flow
                            if (existingBakers.length > 0) {
                                setStep('tagCookies');
                                setCurrentBakerIndex(0);
                                setCurrentCategoryIndex(0);
                            } else if (existingCategories.length > 0) {
                                setStep('addBakers');
                            } else {
                                setStep('nameCategories');
                            }
                        }
                    } else {
                        // Normal flow - we'll auto-advance to first incomplete category in a separate effect
                        if (existingBakers.length > 0) {
                            setStep('tagCookies');
                            setCurrentBakerIndex(0);
                            // Start at 0, will be adjusted by auto-advance effect
                            setCurrentCategoryIndex(0);
                        } else if (existingCategories.length > 0) {
                            setStep('addBakers');
                        } else {
                            setStep('nameCategories');
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load existing data:', err);
                setError('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };
        
        loadExistingData();
    }, [eventId, initialCategoryId]);

    // Auto-advance to first incomplete category when wizard opens
    useEffect(() => {
        // Skip auto-advance if initialCategoryId was provided (user specifically requested a category)
        if (step !== 'tagCookies' || categories.length === 0 || loading || initialCategoryId) return;
        
        const findFirstIncompleteCategory = async () => {
            try {
                // Load all detections
                const allDetections = await getAllImageDetections();
                
                // Helper to extract file identifier from URL
                const extractFileName = (url: string): string | null => {
                    try {
                        const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                        if (uuidMatch) return uuidMatch[1];
                        const urlObj = new URL(url.split('?')[0]);
                        const pathParts = urlObj.pathname.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        return fileName.split('.')[0];
                    } catch {
                        return null;
                    }
                };
                
                // Check each category to find the first incomplete one
                for (let i = 0; i < categories.length; i++) {
                    const category = categories[i];
                    const categoryFileName = extractFileName(category.imageUrl);
                    
                    // Find matching detection for this category
                    const matchingDetection = categoryFileName
                        ? allDetections.find(d => {
                            const detectionFileName = extractFileName(d.imageUrl);
                            return detectionFileName === categoryFileName || d.imageUrl === category.imageUrl;
                        })
                        : allDetections.find(d => d.imageUrl === category.imageUrl);
                    
                    if (!matchingDetection || matchingDetection.detectedCookies.length === 0) {
                        // No detections yet for this category, consider it incomplete
                        setCurrentCategoryIndex(i);
                        return;
                    }
                    
                    // Get all tagged cookies for this category
                    const allTaggedCoords = Object.values(taggedCookies[category.id] || {}).flat();
                    
                    // Check if all detected cookies are tagged
                    const allCookiesTagged = matchingDetection.detectedCookies.every(detected => {
                        return allTaggedCoords.some(tagged => {
                            const distance = Math.sqrt(
                                Math.pow(tagged.x - detected.x, 2) + 
                                Math.pow(tagged.y - detected.y, 2)
                            );
                            return distance < 5; // 5% threshold
                        });
                    });
                    
                    if (!allCookiesTagged) {
                        // Found first incomplete category
                        setCurrentCategoryIndex(i);
                        return;
                    }
                }
                
                // All categories are complete, start from beginning
                setCurrentCategoryIndex(0);
            } catch (error) {
                console.error('[EventSetupWizard] Error finding first incomplete category:', error);
                // On error, just start from beginning
                setCurrentCategoryIndex(0);
            }
        };
        
        findFirstIncompleteCategory();
    }, [step, categories, taggedCookies, loading, initialCategoryId]);

    // Track completion status for each category (all detected cookies tagged)
    useEffect(() => {
        if (step !== 'tagCookies' || categories.length === 0 || loading) {
            return;
        }

        const checkCategoryCompletion = async () => {
            try {
                const allDetections = await getAllImageDetections();
                
                const extractFileName = (url: string): string | null => {
                    try {
                        const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                        if (uuidMatch) return uuidMatch[1];
                        const urlObj = new URL(url.split('?')[0]);
                        const pathParts = urlObj.pathname.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        return fileName.split('.')[0];
                    } catch {
                        return null;
                    }
                };
                
                const completion: Record<string, boolean> = {};
                
                for (const category of categories) {
                    console.log(`[CategoryCompletion] Checking category: ${category.name} (${category.id})`);
                    const categoryFileName = extractFileName(category.imageUrl);
                    console.log(`[CategoryCompletion] Category file identifier: ${categoryFileName}`);
                    console.log(`[CategoryCompletion] Category image URL: ${category.imageUrl}`);
                    
                    const matchingDetection = categoryFileName
                        ? allDetections.find(d => {
                            const detectionFileName = extractFileName(d.imageUrl);
                            return detectionFileName === categoryFileName || d.imageUrl === category.imageUrl;
                        })
                        : allDetections.find(d => d.imageUrl === category.imageUrl);
                    
                    if (!matchingDetection) {
                        console.log(`[CategoryCompletion] ✗ No matching detection found for category ${category.name}`);
                        completion[category.id] = true; // No detections = complete
                        continue;
                    }
                    
                    if (matchingDetection.detectedCookies.length === 0) {
                        console.log(`[CategoryCompletion] ✓ Category ${category.name} has no detected cookies - marked complete`);
                        completion[category.id] = true;
                        continue;
                    }
                    
                    console.log(`[CategoryCompletion] Found ${matchingDetection.detectedCookies.length} detected cookies for category ${category.name}`);
                    
                    // Assign IDs to detected cookies if they don't have them
                    const detectedCookiesWithIds = assignDetectedCookieIds(category.imageUrl, matchingDetection.detectedCookies);
                    
                    // Get ALL tagged cookies for this category, regardless of which baker tagged them
                    // This flattens all bakers' cookies into a single array
                    const categoryTaggedCookies = taggedCookies[category.id] || {};
                    console.log(`[CategoryCompletion] Tagged cookies structure:`, Object.keys(categoryTaggedCookies).map(bakerId => ({
                        bakerId,
                        count: Array.isArray(categoryTaggedCookies[bakerId]) ? categoryTaggedCookies[bakerId].length : 0
                    })));
                    
                    const allTaggedCookies: CookieCoordinate[] = [];
                    Object.values(categoryTaggedCookies).forEach(bakerCookies => {
                        if (Array.isArray(bakerCookies)) {
                            allTaggedCookies.push(...bakerCookies);
                        }
                    });
                    
                    console.log(`[CategoryCompletion] Total tagged cookies (across all bakers): ${allTaggedCookies.length}`);
                    
                    if (allTaggedCookies.length === 0) {
                        console.log(`[CategoryCompletion] ✗ Category ${category.name} has detected cookies but no tagged cookies - marked incomplete`);
                        completion[category.id] = false;
                        continue;
                    }
                    
                    // Migrate old coordinate-based tags to ID-based tags
                    // Check if any tagged cookies don't have detectedCookieId and migrate them
                    let needsMigration = false;
                    const migratedTaggedCookies = { ...taggedCookies };
                    
                    if (migratedTaggedCookies[category.id]) {
                        Object.values(migratedTaggedCookies[category.id]).forEach(bakerCookies => {
                            if (Array.isArray(bakerCookies)) {
                                bakerCookies.forEach(cookie => {
                                    if (!cookie.detectedCookieId) {
                                        // Find matching detected cookie by coordinates
                                        const matchingDetected = detectedCookiesWithIds.find(d => {
                                            const dx = cookie.x - d.x;
                                            const dy = cookie.y - d.y;
                                            const distance = Math.sqrt(dx * dx + dy * dy);
                                            return distance < 6; // 6% threshold
                                        });
                                        if (matchingDetected?.id) {
                                            cookie.detectedCookieId = matchingDetected.id;
                                            needsMigration = true;
                                        }
                                    }
                                });
                            }
                        });
                    }
                    
                    // If migration happened, save to state (will be saved to Firestore on next autosave)
                    if (needsMigration) {
                        console.log(`[CategoryCompletion] Migrated ${category.name} tags to ID-based`);
                        setTaggedCookies(migratedTaggedCookies);
                        // Trigger autosave to persist migration
                        const allCookiesForSave = Object.values(migratedTaggedCookies[category.id] || {}).flat();
                        updateCategoryCookies(eventId, category.id, allCookiesForSave).catch(err => {
                            console.error(`[CategoryCompletion] Failed to save migrated tags:`, err);
                        });
                    }
                    
                    // For each detected cookie, check if it has at least one matching tagged cookie
                    // Use ID-based matching first, fall back to coordinate-based for migration
                    const unmatchedDetectedCookies: Array<{detected: {x: number, y: number, id?: string}, reason: string}> = [];
                    
                    // Use migrated tags for checking
                    const tagsToCheck = needsMigration ? migratedTaggedCookies[category.id] : categoryTaggedCookies;
                    const allTaggedCookiesToCheck: CookieCoordinate[] = [];
                    Object.values(tagsToCheck || {}).forEach(bakerCookies => {
                        if (Array.isArray(bakerCookies)) {
                            allTaggedCookiesToCheck.push(...bakerCookies);
                        }
                    });
                    
                    const allDetectedCookiesTagged = detectedCookiesWithIds.every((detectedCookie) => {
                        const detectedId = detectedCookie.id;
                        if (!detectedId) {
                            unmatchedDetectedCookies.push({
                                detected: { x: detectedCookie.x, y: detectedCookie.y },
                                reason: 'No ID assigned'
                            });
                            return false;
                        }
                        
                        // Use ID-based matching
                        const matchingById = allTaggedCookiesToCheck.find(taggedCookie => 
                            taggedCookie.detectedCookieId === detectedId
                        );
                        if (matchingById) {
                            return true;
                        }
                        
                        // Fall back to coordinate-based matching only if migration hasn't run yet
                        if (!needsMigration) {
                            let minDistance = Infinity;
                            let hasMatchingTag = false;
                            
                            allTaggedCookiesToCheck.forEach(taggedCookie => {
                                // Skip if this tagged cookie already has a detectedCookieId (already migrated)
                                if (taggedCookie.detectedCookieId) return;
                                
                                const dx = taggedCookie.x - detectedCookie.x;
                                const dy = taggedCookie.y - detectedCookie.y;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                if (distance < minDistance) {
                                    minDistance = distance;
                                }
                                if (distance < 6) { // 6% threshold
                                    hasMatchingTag = true;
                                }
                            });
                            
                            if (!hasMatchingTag) {
                                unmatchedDetectedCookies.push({
                                    detected: { x: detectedCookie.x, y: detectedCookie.y, id: detectedId },
                                    reason: minDistance === Infinity ? 'No tagged cookies' : `Closest distance: ${minDistance.toFixed(2)}`
                                });
                            }
                            
                            return hasMatchingTag;
                        } else {
                            // Migration ran, so only ID-based matching should be used
                            unmatchedDetectedCookies.push({
                                detected: { x: detectedCookie.x, y: detectedCookie.y, id: detectedId },
                                reason: 'No ID match found'
                            });
                            return false;
                        }
                    });
                    
                    if (!allDetectedCookiesTagged) {
                        console.log(`[CategoryCompletion] ✗ Category ${category.name} is INCOMPLETE`);
                        console.log(`[CategoryCompletion] Unmatched detected cookies (${unmatchedDetectedCookies.length}):`, unmatchedDetectedCookies);
                        console.log(`[CategoryCompletion] Detected cookies (${detectedCookiesWithIds.length}):`, detectedCookiesWithIds.map(d => ({ id: d.id, x: d.x, y: d.y })));
                        console.log(`[CategoryCompletion] Tagged cookies (${allTaggedCookiesToCheck.length}):`, allTaggedCookiesToCheck.map(t => ({ id: t.id, detectedCookieId: t.detectedCookieId, x: t.x, y: t.y, baker: t.makerName })));
                    } else {
                        console.log(`[CategoryCompletion] ✓ Category ${category.name} is COMPLETE - all ${detectedCookiesWithIds.length} detected cookies are tagged`);
                    }
                    
                    completion[category.id] = allDetectedCookiesTagged;
                }
                
                setCategoryCompletion(completion);
            } catch (error) {
                console.error('[EventSetupWizard] Error checking category completion:', error);
            }
        };
        
        checkCategoryCompletion();
    }, [step, categories, taggedCookies, loading, detectedCookies, currentCategoryIndex, eventId]);

    // Refresh bakers when navigating to the "addBakers" step
    // This ensures we see bakers that were added on the admin page
    useEffect(() => {
        const refreshBakers = async () => {
            if (step === 'addBakers') {
                try {
                    const savedBakers = await getBakers(eventId);
                    const bakerMap = new Map<string, Baker>();
                    
                    // Add saved bakers
                    savedBakers.forEach(baker => {
                        bakerMap.set(baker.name, {
                            id: baker.id,
                            name: baker.name
                        });
                    });
                    
                    // Also extract bakers from existing cookies (for backward compatibility)
                    categories.forEach(cat => {
                        cat.cookies.forEach(cookie => {
                            if (cookie.makerName && cookie.makerName !== CONSTANTS.DEFAULT_MAKER_NAME) {
                                if (!bakerMap.has(cookie.makerName)) {
                                    bakerMap.set(cookie.makerName, {
                                        id: cookie.makerName,
                                        name: cookie.makerName
                                    });
                                }
                            }
                        });
                    });
                    
                    const existingBakers = Array.from(bakerMap.values());
                    setBakers(existingBakers);
                } catch (err) {
                    console.error('Failed to refresh bakers:', err);
                }
            }
        };
        
        refreshBakers();
    }, [step, eventId, categories]);

    // Check if all detected cookies across all categories are tagged
    // This uses the categoryCompletion state which is updated by the previous useEffect
    useEffect(() => {
        if (step !== 'tagCookies' || categories.length === 0 || loading) {
            setAllCookiesTagged(false);
            return;
        }
        
        // Check if all categories with detections are complete
        // Categories without detections (completion[cat.id] === undefined) are considered complete
        // Categories with detections must have completion[cat.id] === true
        const allComplete = Object.keys(categoryCompletion).length > 0
            ? categories.every(cat => {
                const isComplete = categoryCompletion[cat.id];
                // If undefined, the category has no detections, so consider it complete
                // If true, all detections are tagged, so it's complete
                // If false, some detections aren't tagged, so it's incomplete
                return isComplete === undefined || isComplete === true;
            })
            : false;
        
        setAllCookiesTagged(allComplete);
    }, [step, categories, loading, categoryCompletion]);

    // Watch for detection results when category changes (real-time updates)
    useEffect(() => {
        console.log('[EventSetupWizard] Detection useEffect triggered:', { 
            step, 
            currentCategoryIndex, 
            categoriesLength: categories.length,
            category: categories[currentCategoryIndex]?.name 
        });
        
        const category = categories[currentCategoryIndex];
        if (step === 'tagCookies' && category) {
            setLoadingDetection(true);
            console.log(`[EventSetupWizard] Setting up detection listener for category: ${category.name}, imageUrl: ${category.imageUrl}`);
            
            // Load detection results using the same approach as audit page
            // (Load all detections and match by URL, rather than using document ID lookup)
            console.log(`[EventSetupWizard] Loading detection results for imageUrl: ${category.imageUrl}`);
            
            getAllImageDetections().then((allDetections) => {
                console.log(`[EventSetupWizard] Loaded ${allDetections.length} total detections`);
                
                // Extract file path from category URL to match against detection URLs
                // Firebase Storage URLs can be in different formats:
                // - firebasestorage.googleapis.com/v0/b/...?alt=media&token=...
                // - storage.googleapis.com/...
                const extractFileName = (url: string): string | null => {
                    try {
                        // Try to extract filename from URL
                        // Look for UUID pattern (8-4-4-4-12 hex digits)
                        const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                        if (uuidMatch) {
                            return uuidMatch[1];
                        }
                        // Fallback: extract filename from path
                        const urlObj = new URL(url.split('?')[0]); // Remove query params
                        const pathParts = urlObj.pathname.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        // Remove extension for matching
                        return fileName.split('.')[0];
                    } catch {
                        return null;
                    }
                };
                
                const categoryFileName = extractFileName(category.imageUrl);
                console.log(`[EventSetupWizard] Category file identifier: ${categoryFileName}`);
                
                // Match by file identifier (UUID or filename) instead of exact URL
                const matchingDetection = categoryFileName 
                    ? allDetections.find(d => {
                        const detectionFileName = extractFileName(d.imageUrl);
                        return detectionFileName === categoryFileName || d.imageUrl === category.imageUrl;
                    })
                    : allDetections.find(d => d.imageUrl === category.imageUrl);
                
                if (matchingDetection) {
                    console.log(`[EventSetupWizard] ✓ Found matching detection!`, {
                        detectionImageUrl: matchingDetection.imageUrl,
                        categoryImageUrl: category.imageUrl,
                        cookieCount: matchingDetection.detectedCookies.length
                    });
                    setDetectedCookies(matchingDetection.detectedCookies);
                    setLoadingDetection(false);
                } else {
                    console.warn(`[EventSetupWizard] ✗ No matching detection found for imageUrl:`, category.imageUrl);
                    console.warn(`[EventSetupWizard] Category file identifier: ${categoryFileName}`);
                    console.warn(`[EventSetupWizard] Available detections:`, 
                        allDetections.map(d => ({ 
                            id: d.id, 
                            imageUrl: d.imageUrl,
                            fileId: extractFileName(d.imageUrl)
                        }))
                    );
                    setDetectedCookies([]);
                    setLoadingDetection(false);
                }
            }).catch((error) => {
                console.error('[EventSetupWizard] Error loading all image detections:', error);
                setDetectedCookies([]);
                setLoadingDetection(false);
            });
            
            // Set up real-time listener - watch entire collection and re-match by URL
            // This ensures we pick up new detections even if document IDs don't match
            // Extract file identifier helper (same as above)
            const extractFileName = (url: string): string | null => {
                try {
                    const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                    if (uuidMatch) {
                        return uuidMatch[1];
                    }
                    const urlObj = new URL(url.split('?')[0]);
                    const pathParts = urlObj.pathname.split('/');
                    const fileName = pathParts[pathParts.length - 1];
                    return fileName.split('.')[0];
                } catch {
                    return null;
                }
            };
            
            const categoryFileName = extractFileName(category.imageUrl);
            
            // Set up real-time listener - watch entire collection and re-match by file identifier
            const detectionsRef = collection(db, 'image_detections');
            const unsubscribe = onSnapshot(detectionsRef, async () => {
                console.log('[EventSetupWizard] Detection document changed, reloading...');
                try {
                    const allDetections = await getAllImageDetections();
                    const matchingDetection = categoryFileName
                        ? allDetections.find(d => {
                            const detectionFileName = extractFileName(d.imageUrl);
                            return detectionFileName === categoryFileName || d.imageUrl === category.imageUrl;
                        })
                        : allDetections.find(d => d.imageUrl === category.imageUrl);
                    
                    if (matchingDetection) {
                        console.log(`[EventSetupWizard] Watch: Updated to ${matchingDetection.detectedCookies.length} cookies`);
                        // Assign IDs to detected cookies if they don't have them
                        const cookiesWithIds = assignDetectedCookieIds(category.imageUrl, matchingDetection.detectedCookies);
                        setDetectedCookies(cookiesWithIds);
                    } else {
                        setDetectedCookies([]);
                    }
                    setLoadingDetection(false);
                } catch (error) {
                    console.error('[EventSetupWizard] Error reloading detections on change:', error);
                    setLoadingDetection(false);
                }
            }, (error) => {
                console.error('[EventSetupWizard] Error watching detections:', error);
            });

            // Cleanup listener when category changes or component unmounts
            return () => {
                console.log(`[EventSetupWizard] Cleaning up detection listener for category: ${category.name}`);
                unsubscribe();
            };
        } else {
            console.log('[EventSetupWizard] Not setting up detection listener - step:', step, 'category:', category?.name);
            setDetectedCookies([]);
            setLoadingDetection(false);
        }
    }, [step, categories, currentCategoryIndex]);

    // Step 1: Upload Images
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        
        const files = Array.from(e.target.files);
        const validFiles: UploadedImage[] = [];
        
        for (const file of files) {
            const validation = validateImage(file);
            if (validation.valid) {
                validFiles.push({
                    file,
                    preview: URL.createObjectURL(file),
                    uploaded: false
                });
            } else {
                setError(validation.error || CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE);
            }
        }
        
        setImages([...images, ...validFiles]);
        if (e.target.files) {
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        URL.revokeObjectURL(newImages[index].preview);
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const handleUploadImages = async () => {
        if (images.length === 0) {
            setError('Please upload at least one image');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const uploadedImages: UploadedImage[] = [];
            // Store images in shared location so they can be reused across multiple events
            const storagePath = `shared/cookies`;
            for (const img of images) {
                const imageUrl = await uploadImage(img.file, storagePath);
                uploadedImages.push({ ...img, uploaded: true, imageUrl });
            }
            setImages(uploadedImages);
            setStep('nameCategories');
        } catch (err) {
            console.error('Failed to upload images:', err);
            setError(err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD);
        } finally {
            setUploading(false);
        }
    };

    // Step 2: Name Categories
    const handleCategoryNameChange = (index: number, name: string) => {
        const newImages = [...images];
        newImages[index].categoryName = name;
        setImages(newImages);
    };

    const handleCreateCategories = async () => {
        // Get images that have been uploaded and have a category name
        // Filter for images that have imageUrl (uploaded) and categoryName (named)
        // but don't have a corresponding category in Firestore yet
        const imagesToCreate = images.filter(img => img.imageUrl && img.categoryName && img.categoryName.trim());
        
        // Validate all images that need categories created
        for (let i = 0; i < imagesToCreate.length; i++) {
            const img = imagesToCreate[i];
            if (!img.categoryName || !img.categoryName.trim()) {
                setError(`Please name category ${i + 1}`);
                return;
            }
            const validation = validateCategoryName(img.categoryName);
            if (!validation.valid) {
                setError(validation.error || `Invalid name for category ${i + 1}`);
                return;
            }
        }

        if (imagesToCreate.length === 0) {
            setError('No images with category names to create');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const newCategories: Category[] = [];
            // Create categories for all images that have been uploaded and named
            for (let i = 0; i < imagesToCreate.length; i++) {
                const img = imagesToCreate[i];
                if (img.imageUrl && img.categoryName) {
                    const sanitizedName = sanitizeInput(img.categoryName);
                    console.log(`Creating category: ${sanitizedName} with image: ${img.imageUrl}`);
                    const category = await addCategory(eventId, sanitizedName, img.imageUrl);
                    console.log(`✅ Created category: ${category.id} - ${category.name}`);
                    newCategories.push(category);
                }
            }
            console.log(`✅ Created ${newCategories.length} category/categories`);
            // Reload all categories to get the updated list
            const allCategories = await getCategories(eventId);
            console.log(`📋 Total categories in database: ${allCategories.length}`);
            setCategories(allCategories);
            setStep('addBakers');
        } catch (err) {
            console.error('Failed to create categories:', err);
            setError(err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE);
        } finally {
            setUploading(false);
        }
    };

    // Step 3: Add Bakers
    const [newBakerName, setNewBakerName] = useState('');
    
    const handleAddBaker = async () => {
        if (!newBakerName.trim()) return;
        
        const validation = validateMakerName(newBakerName);
        if (!validation.valid) {
            setError(validation.error || 'Invalid baker name');
            return;
        }

        const sanitizedName = sanitizeInput(newBakerName);
        // Check if baker already exists
        const existingBaker = bakers.find(b => b.name === sanitizedName);
        if (existingBaker) {
            setError('Baker already exists');
            return;
        }
        
        try {
            // Save baker to Firestore immediately
            const baker = await addBaker(eventId, sanitizedName);
            setBakers([...bakers, baker]);
            setNewBakerName('');
            setError(null);
        } catch (err) {
            console.error('Failed to save baker:', err);
            setError(err instanceof Error ? err.message : 'Failed to save baker');
        }
    };

    const handleRemoveBaker = async (id: string) => {
        try {
            // Remove baker from Firestore
            await removeBaker(eventId, id);
            setBakers(bakers.filter(b => b.id !== id));
            // Remove tagged cookies for this baker
            const newTagged = { ...taggedCookies };
            Object.keys(newTagged).forEach(catId => {
                delete newTagged[catId][id];
            });
            setTaggedCookies(newTagged);
        } catch (err) {
            console.error('Failed to remove baker:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove baker');
        }
    };

    const handleResetTags = async () => {
        if (!currentCategory) return;
        
        try {
            // Remove all tags for the current category
            const newTagged = { ...taggedCookies };
            newTagged[currentCategory.id] = {};
            setTaggedCookies(newTagged);
            
            // Save empty array to Firestore
            await updateCategoryCookies(eventId, currentCategory.id, []);
        } catch (err) {
            console.error('Failed to reset tags:', err);
            setError(err instanceof Error ? err.message : 'Failed to reset tags');
        }
    };

    const handleStartTagging = () => {
        if (bakers.length === 0) {
            setError('Please add at least one baker');
            return;
        }
        setCurrentBakerIndex(0);
        setCurrentCategoryIndex(0);
        setStep('tagCookies');
    };

    // Step 4: Tag Cookies
    const currentBaker = bakers[currentBakerIndex];
    const currentCategory = categories[currentCategoryIndex];

    // Handle clicking on a detected cookie to assign a baker
    // ImageWithDetections already filters out tagged cookies, so this callback
    // will only receive untagged cookies
    const handlePolygonClick = (e: React.MouseEvent, detected: DetectedCookie) => {
        e.stopPropagation();
        
        if (!currentCategory) return;
        
        // Store the detected cookie object directly
        setSelectedDetectedCookie(detected);
        setBakerSelectPosition({ x: e.clientX, y: e.clientY });
        setShowBakerSelect(true);
    };

    // Assign a baker to a detected cookie (or reassign if already tagged)
    const handleAssignBaker = async (bakerId: string) => {
        if (!currentCategory || !selectedDetectedCookie) return;
        
        const detected = selectedDetectedCookie;

        const baker = bakers.find(b => b.id === bakerId);
        if (!baker) return;

        const newTagged = { ...taggedCookies };
        if (!newTagged[currentCategory.id]) {
            newTagged[currentCategory.id] = {};
        }
        
        // Ensure detected cookie has an ID
        if (!detected.id) {
            detected.id = generateDetectedCookieId(currentCategory.imageUrl, detected);
        }
        
        // Check if this detected cookie is already tagged (for reassignment)
        // Use ID-based matching first, fall back to coordinate-based for migration
        let existingTaggedCookie: CookieCoordinate | null = null;
        let existingBakerId: string | null = null;
        
        Object.entries(newTagged[currentCategory.id] || {}).forEach(([bid, cookies]) => {
            if (!Array.isArray(cookies)) return;
            // First try ID-based matching
            const matchingCookieById = cookies.find((c: CookieCoordinate) => 
                c.detectedCookieId === detected.id
            );
            if (matchingCookieById) {
                existingTaggedCookie = matchingCookieById;
                existingBakerId = bid;
                return;
            }
            // Fall back to coordinate-based matching for migration
            const matchingCookie = cookies.find((c: CookieCoordinate) => {
                if (c.detectedCookieId) return false; // Already migrated, skip coordinate match
                const distance = Math.sqrt(
                    Math.pow(c.x - detected.x, 2) + 
                    Math.pow(c.y - detected.y, 2)
                );
                return distance < 6; // 6% threshold
            });
            if (matchingCookie) {
                existingTaggedCookie = matchingCookie;
                existingBakerId = bid;
            }
        });
        
        // If already tagged, remove from old baker first
        if (existingTaggedCookie !== null && existingBakerId !== null) {
            const existingBakerCookies = newTagged[currentCategory.id][existingBakerId];
            if (existingBakerCookies && Array.isArray(existingBakerCookies)) {
                const cookieToRemove: CookieCoordinate = existingTaggedCookie as CookieCoordinate;
                newTagged[currentCategory.id][existingBakerId] = existingBakerCookies.filter(
                    (c: CookieCoordinate) => c.id !== cookieToRemove.id
                );
                // If no cookies left for this baker, remove the array
                const updatedCookies = newTagged[currentCategory.id][existingBakerId];
                if (updatedCookies && updatedCookies.length === 0) {
                    delete newTagged[currentCategory.id][existingBakerId];
                }
            }
        }
        
        // Add to new baker (or same baker if reassigning)
        if (!newTagged[currentCategory.id][bakerId]) {
            newTagged[currentCategory.id][bakerId] = [];
        }

        // Add the cookie (use existing ID if reassigning, otherwise create new)
        const cookieId = existingTaggedCookie !== null ? (existingTaggedCookie as CookieCoordinate).id : uuidv4();
        const cookie: CookieCoordinate = {
            id: cookieId,
            number: 0, // Will be calculated when saving
            makerName: baker.name,
            x: detected.x,
            y: detected.y,
            detectedCookieId: detected.id, // Store the detected cookie ID
        };

        newTagged[currentCategory.id][bakerId] = [...newTagged[currentCategory.id][bakerId], cookie];
        setTaggedCookies(newTagged);

        // Note: We don't remove from detectedCookies state here anymore.
        // The filtering happens in the render where we pass untaggedCookies to ImageWithDetections.
        // This keeps the detectedCookies as the source of truth, and we filter on render.

        // Autosave immediately (will calculate and save correct numbers)
        await autosaveCategory(currentCategory.id);
        
        // Update local state with the calculated numbers
        const updatedCookies = sortAndNumberCookies(currentCategory.id);
        const updatedTagged = { ...taggedCookies };
        updatedTagged[currentCategory.id] = {};
        // Reorganize cookies back by baker
        updatedCookies.forEach(cookie => {
            const baker = bakers.find(b => b.name === cookie.makerName);
            if (baker) {
                if (!updatedTagged[currentCategory.id][baker.id]) {
                    updatedTagged[currentCategory.id][baker.id] = [];
                }
                updatedTagged[currentCategory.id][baker.id].push(cookie);
            }
        });
        setTaggedCookies(updatedTagged);

        // Check if all detected cookies are now tagged, and auto-advance if so
        const allTaggedCoords = Object.values(updatedTagged[currentCategory.id] || {}).flat();
        const allCookiesTagged = detectedCookies.every(detected => {
            return allTaggedCoords.some(tagged => {
                const distance = Math.sqrt(
                    Math.pow(tagged.x - detected.x, 2) + 
                    Math.pow(tagged.y - detected.y, 2)
                );
                return distance < 5; // 5% threshold
            });
        });
        
        // If all cookies are tagged and we're in wizard flow, advance to next category
        if (allCookiesTagged && step === 'tagCookies' && currentCategoryIndex < categories.length - 1) {
            // Small delay to let the UI update before advancing
            setTimeout(() => {
                setCurrentCategoryIndex(currentCategoryIndex + 1);
            }, 500);
        }

        // Close baker selection
        setShowBakerSelect(false);
        setSelectedDetectedCookie(null);
        setBakerSelectPosition(null);
    };

    // Close baker selection when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showBakerSelect && imageContainerRef.current && !imageContainerRef.current.contains(e.target as Node)) {
                setShowBakerSelect(false);
                setSelectedDetectedCookie(null);
                setBakerSelectPosition(null);
            }
        };

        if (showBakerSelect) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showBakerSelect]);

    // Manual click-to-add removed - use polygon click-to-assign instead via ImageWithDetections component

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _handleAutoDetect = async () => {
        console.log('[EventSetupWizard] handleAutoDetect called');
        console.log('[EventSetupWizard] currentCategory:', currentCategory);
        console.log('[EventSetupWizard] currentBaker:', currentBaker);
        
        if (!currentCategory || !currentBaker) {
            console.warn('[EventSetupWizard] Missing currentCategory or currentBaker');
            return;
        }

        console.log('[EventSetupWizard] Starting detection for image:', currentCategory.imageUrl);
        setDetecting(true);
        setDetectionError(null);

        try {
            console.log('[EventSetupWizard] Calling detectCookiesGemini');
            const detected = await detectCookiesGemini(currentCategory.imageUrl);
            console.log('[EventSetupWizard] Detection completed. Found', detected.length, 'cookies');
            console.log('[EventSetupWizard] Detected cookies:', detected);

            if (detected.length === 0) {
                console.warn('[EventSetupWizard] No cookies detected');
                setDetectionError('No cookies detected. Try adjusting the image or use manual tagging.');
                setDetecting(false);
                return;
            }

            const newTagged = { ...taggedCookies };
            if (!newTagged[currentCategory.id]) {
                newTagged[currentCategory.id] = {};
            }
            if (!newTagged[currentCategory.id][currentBaker.id]) {
                newTagged[currentCategory.id][currentBaker.id] = [];
            }

            // Get existing cookies for this baker in this category
            const existingCookies = newTagged[currentCategory.id][currentBaker.id] || [];

            // Convert detected cookies to CookieCoordinate format
            // Filter out detections that are too close to existing cookies (within 5%)
            const newCookies: CookieCoordinate[] = [];
            for (let i = 0; i < detected.length; i++) {
                const detectedCookie = detected[i];
                
                // Check if this detection is too close to an existing cookie
                const tooClose = existingCookies.some(existing => {
                    const distance = Math.sqrt(
                        Math.pow(existing.x - detectedCookie.x, 2) + 
                        Math.pow(existing.y - detectedCookie.y, 2)
                    );
                    return distance < 5; // 5% threshold
                });

                if (!tooClose) {
                    newCookies.push({
                        id: uuidv4(),
                        number: 0, // Will be recalculated by sortAndNumberCookies
                        makerName: currentBaker.name,
                        x: detectedCookie.x,
                        y: detectedCookie.y,
                    });
                }
            }

            // Merge with existing cookies
            newTagged[currentCategory.id][currentBaker.id] = [...existingCookies, ...newCookies];
            setTaggedCookies(newTagged);

            if (newCookies.length === 0) {
                setDetectionError('All detected cookies were already tagged. Try manual tagging for any missed cookies.');
            } else {
                setDetectionError(null);
                // Autosave to recalculate numbers
                await autosaveCategory(currentCategory.id);
                
                // Update local state with recalculated numbers
                const updatedCookies = sortAndNumberCookies(currentCategory.id);
                const updatedTagged = { ...taggedCookies };
                updatedTagged[currentCategory.id] = {};
                // Reorganize cookies back by baker
                updatedCookies.forEach(cookie => {
                    const baker = bakers.find(b => b.name === cookie.makerName);
                    if (baker) {
                        if (!updatedTagged[currentCategory.id][baker.id]) {
                            updatedTagged[currentCategory.id][baker.id] = [];
                        }
                        updatedTagged[currentCategory.id][baker.id].push(cookie);
                    }
                });
                setTaggedCookies(updatedTagged);
            }
        } catch (error) {
            console.error('[EventSetupWizard] Cookie detection failed:', error);
            if (error instanceof Error) {
                console.error('[EventSetupWizard] Error name:', error.name);
                console.error('[EventSetupWizard] Error message:', error.message);
                console.error('[EventSetupWizard] Error stack:', error.stack);
                
                // Check if it's a Firebase error
                interface FirebaseError {
                    code?: string;
                    details?: unknown;
                }
                const firebaseError = error as FirebaseError;
                if (firebaseError.code) {
                    console.error('[EventSetupWizard] Firebase error code:', firebaseError.code);
                }
                if (firebaseError.details) {
                    console.error('[EventSetupWizard] Firebase error details:', firebaseError.details);
                }
            } else {
                console.error('[EventSetupWizard] Unknown error type:', typeof error);
                console.error('[EventSetupWizard] Error value:', error);
            }
            
            setDetectionError(
                error instanceof Error 
                    ? `Detection failed: ${error.message}` 
                    : 'Cookie detection failed. Please try manual tagging.'
            );
        } finally {
            console.log('[EventSetupWizard] Detection process finished');
            setDetecting(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _handleRemoveCookie = async () => {
        if (!currentCategory || !currentBaker) return;
        const newTagged = { ...taggedCookies };
        if (newTagged[currentCategory.id] && newTagged[currentCategory.id][currentBaker.id]) {
            // Remove all cookies for this baker in this category
            delete newTagged[currentCategory.id][currentBaker.id];
        }
        setTaggedCookies(newTagged);
        
        // Autosave immediately (will recalculate numbers)
        await autosaveCategory(currentCategory.id);
        
        // Update local state with recalculated numbers
        const updatedCookies = sortAndNumberCookies(currentCategory.id);
        const updatedTagged = { ...taggedCookies };
        updatedTagged[currentCategory.id] = {};
        // Reorganize cookies back by baker
        updatedCookies.forEach(cookie => {
            const baker = bakers.find(b => b.name === cookie.makerName);
            if (baker) {
                if (!updatedTagged[currentCategory.id][baker.id]) {
                    updatedTagged[currentCategory.id][baker.id] = [];
                }
                updatedTagged[currentCategory.id][baker.id].push(cookie);
            }
        });
        setTaggedCookies(updatedTagged);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _handleSkipCategory = () => {
        // Move to next category
        if (currentCategoryIndex < categories.length - 1) {
            setCurrentCategoryIndex(currentCategoryIndex + 1);
        } else {
            // Move to next baker
            handleNextBaker();
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _handleNextCategory = () => {
        if (currentCategoryIndex < categories.length - 1) {
            setCurrentCategoryIndex(currentCategoryIndex + 1);
        } else {
            handleNextBaker();
        }
    };

    const handleNextBaker = () => {
        if (currentBakerIndex < bakers.length - 1) {
            setCurrentBakerIndex(currentBakerIndex + 1);
            setCurrentCategoryIndex(0);
        } else {
            // Done tagging, save and complete
            handleSaveTags();
        }
    };

    // Helper function to sort and number cookies for a category (same logic as display)
    const sortAndNumberCookies = (categoryId: string): CookieCoordinate[] => {
        const categoryTagged = taggedCookies[categoryId] || {};
        const categoryCookies: Array<{ cookie: CookieCoordinate; baker: Baker | undefined }> = [];
        
        // Flatten all cookies from all bakers
        Object.entries(categoryTagged).forEach(([bakerId, cookies]) => {
            const baker = bakers.find(b => b.id === bakerId);
            cookies.forEach(cookie => {
                categoryCookies.push({ cookie, baker });
            });
        });
        
        // Sort cookies: top to bottom (by y), then left to right (by x)
        // Group by rows (cookies with similar y values within 15% are in the same row)
        const sortedCookies = categoryCookies.sort((a, b) => {
            const yDiff = a.cookie.y - b.cookie.y;
            // If y difference is small (within 15%), consider them in the same row, sort by x
            if (Math.abs(yDiff) < 15) {
                return a.cookie.x - b.cookie.x;
            }
            // Otherwise, sort by y (top to bottom)
            return yDiff;
        });
        
        // Assign numbers based on sorted position and update the cookie objects
        sortedCookies.forEach(({ cookie }, index) => {
            cookie.number = index + 1;
        });
        
        // Return the cookies in sorted order
        return sortedCookies.map(({ cookie }) => cookie);
    };

    // Autosave function for a single category
    const autosaveCategory = async (categoryId: string) => {
        try {
            // Use the same sorting and numbering logic as display
            const cookies = sortAndNumberCookies(categoryId);
            await updateCategoryCookies(eventId, categoryId, cookies);
        } catch (err) {
            console.error('Failed to autosave category:', err);
            // Don't show error to user for autosave failures, just log
        }
    };

    const handleSaveTags = async () => {
        setUploading(true);
        setError(null);

        try {
            // Save cookies for each category using the same sorting and numbering logic as display
            for (const category of categories) {
                const cookies = sortAndNumberCookies(category.id);
                await updateCategoryCookies(eventId, category.id, cookies);
            }
            onComplete();
        } catch (err) {
            console.error('Failed to save tags:', err);
            setError(err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE);
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.wizard}>
                <div className={styles.content}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading event data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wizard}>
            <div className={styles.header}>
                <h1>Edit Event: {eventName}</h1>
                <div className={styles.steps}>
                    <div 
                        className={`${styles.step} ${step === 'upload' ? styles.active : step === 'nameCategories' || step === 'addBakers' || step === 'tagCookies' ? styles.completed : ''} ${categories.length > 0 ? styles.clickable : ''}`}
                        onClick={() => categories.length > 0 && setStep('upload')}
                    >
                        <span className={styles.stepNumber}>1</span>
                        <span className={styles.stepLabel}>Upload Images</span>
                    </div>
                    <div 
                        className={`${styles.step} ${step === 'nameCategories' ? styles.active : step === 'addBakers' || step === 'tagCookies' ? styles.completed : ''} ${categories.length > 0 ? styles.clickable : ''}`}
                        onClick={() => categories.length > 0 && setStep('nameCategories')}
                    >
                        <span className={styles.stepNumber}>2</span>
                        <span className={styles.stepLabel}>Name Categories</span>
                    </div>
                    <div 
                        className={`${styles.step} ${step === 'addBakers' ? styles.active : step === 'tagCookies' ? styles.completed : ''} ${categories.length > 0 ? styles.clickable : ''}`}
                        onClick={() => categories.length > 0 && setStep('addBakers')}
                    >
                        <span className={styles.stepNumber}>3</span>
                        <span className={styles.stepLabel}>Add Bakers</span>
                    </div>
                    <div 
                        className={`${styles.step} ${step === 'tagCookies' ? styles.active : ''} ${categories.length > 0 && bakers.length > 0 ? styles.clickable : ''}`}
                        onClick={() => categories.length > 0 && bakers.length > 0 && setStep('tagCookies')}
                    >
                        <span className={styles.stepNumber}>4</span>
                        <span className={styles.stepLabel}>Tag Cookies</span>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                {step === 'upload' && (
                    <div className={styles.stepContent}>
                        <h2>Upload Cookie Images</h2>
                        <p className={styles.instruction}>Upload all cookie images at once (typically ~10 images)</p>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            multiple
                            onChange={handleFileSelect}
                            className={styles.fileInput}
                            disabled={uploading}
                        />

                        {images.length > 0 && (
                            <div className={styles.imageGrid}>
                                {images.map((img, index) => (
                                    <div key={index} className={styles.imageCard}>
                                        <img src={img.preview} alt={`Preview ${index + 1}`} />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className={styles.removeButton}
                                            disabled={uploading}
                                        >
                                            ×
                                        </button>
                                        {img.uploaded && (
                                            <div className={styles.uploadedBadge}>✓ Uploaded</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button onClick={onCancel} className={styles.buttonSecondary} disabled={uploading}>
                                Cancel
                            </button>
                            {categories.length > 0 && (
                                <button 
                                    onClick={() => setStep('nameCategories')} 
                                    className={styles.buttonSecondary}
                                    disabled={uploading}
                                >
                                    Next: Name Categories →
                                </button>
                            )}
                            <button
                                onClick={handleUploadImages}
                                disabled={uploading || images.length === 0}
                                className={styles.buttonPrimary}
                            >
                                {uploading ? 'Uploading...' : categories.length > 0 ? 'Add More Images' : `Upload ${images.length} Image${images.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'nameCategories' && (
                    <div className={styles.stepContent}>
                        <h2>Name Each Category</h2>
                        <p className={styles.instruction}>Give each image a category name (e.g., "Sugar Cookie", "Chocolate Chip")</p>
                        
                        <div className={styles.categoryNameGrid}>
                            {images.map((img, index) => (
                                <div key={index} className={styles.categoryNameCard}>
                                    <img src={img.preview} alt={`Category ${index + 1}`} />
                                    <input
                                        ref={(el) => { categoryInputRefs.current[index] = el; }}
                                        type="text"
                                        placeholder={`Category ${index + 1} name`}
                                        value={img.categoryName || ''}
                                        onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                // Move to next input if available
                                                const nextIndex = index + 1;
                                                if (nextIndex < images.length && categoryInputRefs.current[nextIndex]) {
                                                    categoryInputRefs.current[nextIndex]?.focus();
                                                }
                                            }
                                        }}
                                        className={styles.input}
                                        maxLength={100}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={styles.actions}>
                            <button onClick={() => setStep('upload')} className={styles.buttonSecondary}>
                                ← Back
                            </button>
                            {categories.length > 0 && (
                                <button 
                                    onClick={() => setStep('addBakers')} 
                                    className={styles.buttonSecondary}
                                    disabled={uploading}
                                >
                                    Next: Add Bakers →
                                </button>
                            )}
                            <button
                                onClick={handleCreateCategories}
                                disabled={uploading || images.some(img => !img.categoryName?.trim())}
                                className={styles.buttonPrimary}
                            >
                                {uploading ? 'Creating...' : categories.length > 0 ? 'Add More Categories' : 'Create Categories'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'addBakers' && (
                    <div className={styles.stepContent}>
                        <h2>Add Bakers</h2>
                        <p className={styles.instruction}>List all bakers participating in this event</p>
                        
                        <div className={styles.bakerInput}>
                            <input
                                type="text"
                                placeholder="Baker name"
                                value={newBakerName}
                                onChange={(e) => {
                                    setNewBakerName(e.target.value);
                                    setError(null);
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddBaker();
                                    }
                                }}
                                className={styles.input}
                                maxLength={50}
                            />
                            <button 
                                onClick={handleAddBaker} 
                                onMouseDown={(e) => {
                                    // Prevent keyboard from dismissing on mobile
                                    e.preventDefault();
                                }}
                                className={styles.buttonPrimary}
                            >
                                Add Baker
                            </button>
                        </div>

                        {bakers.length > 0 && (
                            <div className={styles.bakerList}>
                                {bakers.map(baker => (
                                    <div key={baker.id} className={styles.bakerCard}>
                                        <span>{baker.name}</span>
                                        <button
                                            onClick={() => handleRemoveBaker(baker.id)}
                                            className={styles.removeButton}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button onClick={() => setStep('nameCategories')} className={styles.buttonSecondary}>
                                ← Back
                            </button>
                            {categories.length > 0 && bakers.length > 0 && (
                                <button 
                                    onClick={() => setStep('tagCookies')} 
                                    className={styles.buttonSecondary}
                                >
                                    Next: Tag Cookies →
                                </button>
                            )}
                            <button
                                onClick={handleStartTagging}
                                disabled={bakers.length === 0}
                                className={styles.buttonPrimary}
                            >
                                {categories.length > 0 && bakers.length > 0 ? 'Continue Tagging' : 'Start Tagging'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'tagCookies' && currentBaker && currentCategory ? (
                    <div className={styles.stepContent}>
                        <div className={styles.categoryNavigation}>
                            <button
                                onClick={() => {
                                    if (currentCategoryIndex > 0) {
                                        setCurrentCategoryIndex(currentCategoryIndex - 1);
                                        setHasManuallyChangedBaker(false); // Reset flag when manually navigating
                                    }
                                }}
                                disabled={currentCategoryIndex === 0}
                                className={styles.navButton}
                            >
                                ← Previous
                            </button>
                            <div className={styles.categoryTitle}>
                                <h3>{currentCategory?.name || ''}</h3>
                                {currentBaker && (
                                    <div className={styles.progressBar}>
                                        {categories.map((cat, idx) => {
                                            const isComplete = categoryCompletion[cat.id] === true;
                                            return (
                                                <div
                                                    key={cat.id}
                                                    className={`${styles.progressDot} ${idx === currentCategoryIndex ? styles.active : ''} ${isComplete ? styles.tagged : ''}`}
                                                    title={cat.name}
                                                    onClick={() => setCurrentCategoryIndex(idx)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (currentCategoryIndex < categories.length - 1) {
                                        setCurrentCategoryIndex(currentCategoryIndex + 1);
                                        setHasManuallyChangedBaker(false); // Reset flag when manually navigating
                                    }
                                }}
                                disabled={currentCategoryIndex === categories.length - 1}
                                className={styles.navButton}
                            >
                                Next →
                            </button>
                        </div>

                        <div className={styles.taggingWorkspace}>
                            {currentCategory && (
                                <div className={styles.imageContainer} ref={imageContainerRef}>
                                    {/* Show detected cookie polygons (before they're tagged) */}
                                    {loadingDetection && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            zIndex: 20
                                        }}>
                                            Loading detection results...
                                        </div>
                                    )}
                                    {(() => {
                                        // Use detected cookies directly (they already have IDs assigned)
                                        // We show all cookies (both tagged and untagged) so tagged ones are clickable for reassignment
                                        const allCookiesForDisplay: DetectedCookie[] = detectedCookies as DetectedCookie[];
                                        
                                        // Get all tagged cookies for ID-based matching
                                        const allTaggedCookiesForCategory = currentCategory 
                                            ? Object.values(taggedCookies[currentCategory.id] || {}).flat()
                                            : [];
                                        
                                        return (
                                            <ImageWithDetections
                                                imageUrl={currentCategory.imageUrl}
                                                detectedCookies={allCookiesForDisplay}
                                                onCookieClick={(cookie, _, e) => {
                                                    // Check if this cookie is already tagged using ID-based matching
                                                    // Fall back to coordinate-based for migration
                                                    const cookieId = cookie.id || generateDetectedCookieId(currentCategory.imageUrl, cookie);
                                                    const isTagged = allTaggedCookiesForCategory.some(tagged => {
                                                        // First try ID-based matching
                                                        if (tagged.detectedCookieId === cookieId) return true;
                                                        // Fall back to coordinate-based for migration
                                                        if (tagged.detectedCookieId) return false; // Already migrated, skip coordinate match
                                                        const distance = Math.sqrt(
                                                            Math.pow(tagged.x - cookie.x, 2) + 
                                                            Math.pow(tagged.y - cookie.y, 2)
                                                        );
                                                        return distance < 6; // 6% threshold
                                                    });
                                                    
                                                    if (isTagged) {
                                                        // If tagged, show reassignment dropdown
                                                        setSelectedDetectedCookie(cookie);
                                                        setBakerSelectPosition({ x: e.clientX, y: e.clientY });
                                                        setShowBakerSelect(true);
                                                    } else {
                                                        // If untagged, show assignment dropdown
                                                        handlePolygonClick(e, cookie);
                                                    }
                                                }}
                                                className={styles.taggingImage}
                                                borderColor="transparent"
                                            />
                                        );
                                    })()}
                                    {/* Show all tagged cookies for this category */}
                                    {currentCategory && taggedCookies[currentCategory.id] && (() => {
                                        // Get all tagged cookies for this category (flatten arrays)
                                        const categoryCookies: Array<{ cookie: CookieCoordinate; baker: Baker | undefined }> = [];
                                        Object.entries(taggedCookies[currentCategory.id]).forEach(([bakerId, cookies]) => {
                                            const baker = bakers.find(b => b.id === bakerId);
                                            cookies.forEach(cookie => {
                                                categoryCookies.push({ cookie, baker });
                                            });
                                        });
                                        
                                        // Sort cookies: top to bottom (by y), then left to right (by x)
                                        // Group by rows (cookies with similar y values within 15% are in the same row)
                                        const sortedCookies = categoryCookies.sort((a, b) => {
                                            const yDiff = a.cookie.y - b.cookie.y;
                                            // If y difference is small (within 15%), consider them in the same row, sort by x
                                            if (Math.abs(yDiff) < 15) {
                                                return a.cookie.x - b.cookie.x;
                                            }
                                            // Otherwise, sort by y (top to bottom)
                                            return yDiff;
                                        });
                                        
                                        // First pass: calculate bounds for all cookies
                                        const cookiesWithBounds = sortedCookies.map(({ cookie, baker }) => {
                                            // Find the corresponding detected cookie to get polygon bounds
                                            // Match by coordinates (within 5% threshold)
                                            const matchingDetected = detectedCookies.find(d => {
                                                const distance = Math.sqrt(
                                                    Math.pow(d.x - cookie.x, 2) + 
                                                    Math.pow(d.y - cookie.y, 2)
                                                );
                                                return distance < 5;
                                            });
                                            
                                            // Calculate bounds using helper function
                                            const detected: DetectedCookie | null = matchingDetected ? {
                                                x: matchingDetected.x,
                                                y: matchingDetected.y,
                                                width: matchingDetected.width,
                                                height: matchingDetected.height,
                                                polygon: matchingDetected.polygon,
                                                confidence: matchingDetected.confidence,
                                            } : null;
                                            
                                            const bounds = calculateBoundsFromCookie(cookie, detected);
                                            
                                            return { cookie, baker, bounds };
                                        });
                                        
                                        // Calculate smart label positions for all cookies
                                        const labelPositions = calculateSmartLabelPositions(cookiesWithBounds);
                                        
                                        // Second pass: render cookies with smart label positions
                                        return cookiesWithBounds.map(({ cookie, baker, bounds }, index) => {
                                            const handleMarkerClick = (e: React.MouseEvent) => {
                                                e.stopPropagation(); // Prevent triggering image click
                                                if (!currentCategory) return;
                                                
                                                // Find the matching detected cookie to pass to reassignment handler
                                                // Use ID-based matching first, fall back to coordinates for migration
                                                interface DetectedCookieWithId extends DetectedCookie {
                                                    id?: string;
                                                }
                                                let matchingDetected: DetectedCookie | undefined = cookie.detectedCookieId 
                                                    ? detectedCookies.find((d: DetectedCookieWithId) => d.id === cookie.detectedCookieId)
                                                    : undefined;
                                                
                                                // Fall back to coordinate-based matching for migration
                                                if (!matchingDetected) {
                                                    matchingDetected = detectedCookies.find(d => {
                                                        const distance = Math.sqrt(
                                                            Math.pow(d.x - cookie.x, 2) + 
                                                            Math.pow(d.y - cookie.y, 2)
                                                        );
                                                        return distance < 6; // 6% threshold
                                                    });
                                                }
                                                
                                                if (matchingDetected) {
                                                    // Convert to DetectedCookie format
                                                    const detected: DetectedCookie = {
                                                        x: matchingDetected.x,
                                                        y: matchingDetected.y,
                                                        width: matchingDetected.width,
                                                        height: matchingDetected.height,
                                                        polygon: matchingDetected.polygon,
                                                        confidence: matchingDetected.confidence,
                                                    };
                                                    
                                                    // Show baker selection for reassignment
                                                    setSelectedDetectedCookie(detected);
                                                    setBakerSelectPosition({ x: e.clientX, y: e.clientY });
                                                    setShowBakerSelect(true);
                                                }
                                            };
                                            
                                            const labelPos = labelPositions[index];
                                            
                                            return (
                                                <React.Fragment key={cookie.id}>
                                                    {/* Number at top-left */}
                                                    <div
                                                        className={styles.markerNumber}
                                                        style={{ 
                                                            left: `${Math.max(0, bounds.topLeftX)}%`, 
                                                            top: `${Math.max(0, bounds.topLeftY)}%`,
                                                            position: 'absolute',
                                                            zIndex: 11
                                                        }}
                                                        onClick={handleMarkerClick}
                                                    >
                                                        {cookie.number}
                                                    </div>
                                                    {/* Name with smart positioning */}
                                                    {baker && labelPos && (
                                                        <div
                                                            className={styles.markerName}
                                                            style={{
                                                                left: `${Math.max(0, Math.min(100, labelPos.left))}%`,
                                                                top: `${Math.max(0, Math.min(100, labelPos.top))}%`,
                                                                position: 'absolute',
                                                                transform: 'translate(-50%, 0)',
                                                                zIndex: 11
                                                            }}
                                                            onClick={handleMarkerClick}
                                                        >
                                                            {baker.name}
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                    {/* Baker selection dropdown */}
                                    {showBakerSelect && bakerSelectPosition && selectedDetectedCookie && currentCategory && (() => {
                                        // Check if this cookie is already tagged
                                        const allTaggedCoords = Object.values(taggedCookies[currentCategory.id] || {}).flat();
                                        const existingTaggedCookie = allTaggedCoords.find(tagged => {
                                            const distance = Math.sqrt(
                                                Math.pow(tagged.x - selectedDetectedCookie.x, 2) + 
                                                Math.pow(tagged.y - selectedDetectedCookie.y, 2)
                                            );
                                            return distance < 5; // 5% threshold
                                        });
                                        const isTagged = existingTaggedCookie !== undefined;
                                        
                                        // Find which baker it's tagged to
                                        let currentBakerId: string | null = null;
                                        if (isTagged) {
                                            Object.entries(taggedCookies[currentCategory.id] || {}).forEach(([bid, cookies]) => {
                                                if (cookies.some(c => c.id === existingTaggedCookie.id)) {
                                                    currentBakerId = bid;
                                                }
                                            });
                                        }
                                        
                                        return (
                                            <div
                                                style={{
                                                    position: 'fixed',
                                                    left: `${Math.min(bakerSelectPosition.x, window.innerWidth - 200)}px`,
                                                    top: `${Math.min(bakerSelectPosition.y, window.innerHeight - 300)}px`,
                                                    background: 'var(--color-bg-secondary, #1e293b)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '6px',
                                                    padding: '0.5rem',
                                                    zIndex: 1000,
                                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                                                    minWidth: '150px',
                                                    maxWidth: '200px',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div style={{ 
                                                    fontSize: '0.875rem', 
                                                    color: 'var(--color-text-secondary, #cbd5e1)',
                                                    marginBottom: '0.5rem',
                                                    padding: '0.25rem'
                                                }}>
                                                    {isTagged ? 'Reassign baker:' : 'Assign to baker:'}
                                                </div>
                                                {bakers.map(baker => (
                                                    <button
                                                        key={baker.id}
                                                        onClick={() => handleAssignBaker(baker.id)}
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            padding: '0.5rem',
                                                            marginBottom: '0.25rem',
                                                            background: baker.id === currentBakerId ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                            border: baker.id === currentBakerId ? '1px solid rgba(33, 150, 243, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '4px',
                                                            color: baker.id === currentBakerId ? '#90caf9' : 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            textAlign: 'left',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (baker.id !== currentBakerId) {
                                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (baker.id !== currentBakerId) {
                                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                            }
                                                        }}
                                                    >
                                                        {baker.name} {baker.id === currentBakerId ? ' (current)' : ''}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        setShowBakerSelect(false);
                                                        setSelectedDetectedCookie(null);
                                                        setBakerSelectPosition(null);
                                                    }}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        marginTop: '0.5rem',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '4px',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {detectionError && (
                                <div style={{ 
                                    marginTop: '1rem',
                                    padding: '0.75rem', 
                                    background: 'rgba(244, 67, 54, 0.2)', 
                                    border: '1px solid rgba(244, 67, 54, 0.5)', 
                                    borderRadius: '4px',
                                    color: '#ffcdd2',
                                    fontSize: '0.875rem'
                                }}>
                                    {detectionError}
                                </div>
                            )}

                            {currentCategory && Object.keys(taggedCookies[currentCategory.id] || {}).length > 0 && (
                                <button
                                    onClick={handleResetTags}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(220, 38, 38, 0.2)',
                                        border: '1px solid rgba(220, 38, 38, 0.4)',
                                        borderRadius: '4px',
                                        color: '#fca5a5',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
                                    }}
                                >
                                    Reset Tags
                                </button>
                            )}
                        </div>

                        <div className={styles.actions}>
                            {allCookiesTagged ? (
                                <button
                                    onClick={onComplete}
                                    className={styles.buttonPrimary}
                                >
                                    Done
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : step === 'tagCookies' ? (
                    <div className={styles.stepContent}>
                        <div className={styles.error}>
                            {!currentBaker ? 'No bakers found. Please add bakers first.' : !currentCategory ? 'No categories found. Please add categories first.' : 'Loading...'}
                        </div>
                        <div className={styles.actions}>
                            <button onClick={() => setStep('addBakers')} className={styles.buttonSecondary}>
                                ← Back to Add Bakers
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}


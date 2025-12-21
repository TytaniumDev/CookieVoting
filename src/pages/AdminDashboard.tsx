import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, addCategory, getCategories, updateCategoryCookies, updateEventStatus, getVotes, updateCategoryOrder, deleteCategory, updateCategory, isGlobalAdmin, addGlobalAdmin, removeGlobalAdmin, getAllGlobalAdmins, addBaker, removeBaker, getBakers } from '../lib/firestore';
import { uploadImage } from '../lib/storage';
import { type VoteEvent, type Category, type CookieCoordinate } from '../lib/types';
import { AlertModal } from '../components/AlertModal';
import { validateImage, validateCategoryName, validateMakerName, sanitizeInput } from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { exportToCSV, exportToJSON, downloadFile } from '../lib/export';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<VoteEvent | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Admin Management State
    const [showAdminManagement, setShowAdminManagement] = useState(false);
    const [newAdminUserId, setNewAdminUserId] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [globalAdmins, setGlobalAdmins] = useState<string[]>([]);
    
    // Overflow menu state
    const [showOverflowMenu, setShowOverflowMenu] = useState(false);

    // New Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatFile, setNewCatFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    
    // Baker management state
    const [newBakerName, setNewBakerName] = useState('');
    const [savedBakers, setSavedBakers] = useState<string[]>([]);

    // Tagging State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    // Category editing state
    const [editingCategoryName, setEditingCategoryName] = useState<Category | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    
    // Alert modal state
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

    // Check admin access
    useEffect(() => {
        if (!eventId) return;

        const checkAccess = async () => {
            setCheckingAccess(true);
            try {
                // Get current user
                const user = auth.currentUser;
                
                if (!user || !user.email) {
                    // Not signed in, redirect to landing page
                    navigate('/', { replace: true });
                    setIsAdmin(false);
                    setCheckingAccess(false);
                    return;
                }

                setCurrentUserId(user.uid);
                
                // Check if user is an admin
                const admin = await isGlobalAdmin(user.uid);
                setIsAdmin(admin);

                if (!admin) {
                    setError('You do not have admin access. Please contact a site administrator.');
                    setLoading(false);
                    setCheckingAccess(false);
                    return;
                }

                // Load admins list
                const admins = await getAllGlobalAdmins();
                setGlobalAdmins(admins);

                // Load event data
                const eventData = await getEvent(eventId);
                setEvent(eventData);
                
                const catsData = await getCategories(eventId);
                setCategories(catsData);
            } catch (err) {
                console.error("Failed to check admin access", err);
                setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
            } finally {
                setLoading(false);
                setCheckingAccess(false);
            }
        };

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async () => {
            await checkAccess();
        });

        // Also check for local test user changes
        checkAccess();

        return () => unsubscribe();
    }, [eventId, navigate]);

    // Load bakers from Firestore
    useEffect(() => {
        const loadBakers = async () => {
            if (!eventId) return;
            try {
                const bakers = await getBakers(eventId);
                setSavedBakers(bakers.map(b => b.name));
            } catch (err) {
                console.error('Failed to load bakers:', err);
            }
        };
        loadBakers();
    }, [eventId, categories]); // Reload when categories change (in case bakers are added via cookies)

    const handleDeleteCategory = async (category: Category) => {
        if (!eventId) return;
        
        if (!window.confirm(`Are you sure you want to delete "${category.name}"? This will also delete the image and all cookie tags.`)) {
            return;
        }

        try {
            await deleteCategory(eventId, category.id, category.imageUrl);
            setCategories(categories.filter(c => c.id !== category.id));
            setAlertMessage("Category deleted successfully");
            setAlertType('success');
        } catch (err) {
            console.error("Failed to delete category", err);
            setAlertMessage("Failed to delete category. Please try again.");
            setAlertType('error');
        }
    };

    const handleStartEditCategory = (category: Category) => {
        setEditingCategoryName(category);
        setEditCategoryName(category.name);
    };

    const handleSaveCategoryName = async () => {
        if (!eventId || !editingCategoryName) return;

        const validation = validateCategoryName(editCategoryName);
        if (!validation.valid) {
            setError(validation.error || 'Invalid category name');
            return;
        }

        try {
            const sanitizedName = sanitizeInput(editCategoryName);
            await updateCategory(eventId, editingCategoryName.id, { name: sanitizedName });
            setCategories(categories.map(c => 
                c.id === editingCategoryName.id ? { ...c, name: sanitizedName } : c
            ));
            setEditingCategoryName(null);
            setEditCategoryName('');
            setAlertMessage("Category name updated successfully");
            setAlertType('success');
        } catch (err) {
            console.error("Failed to update category name", err);
            setAlertMessage("Failed to update category name. Please try again.");
            setAlertType('error');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // For now, we'll still only handle one file at a time for the preview
            // but allow multiple selection for better UX
            const file = e.target.files[0];
            
            // Validate image
            const validation = validateImage(file);
            if (!validation.valid) {
                setError(validation.error || CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE);
                e.target.value = ''; // Reset file input
                return;
            }
            
            setNewCatFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !newCatFile) return;

        // Validate category name
        const nameValidation = validateCategoryName(newCatName);
        if (!nameValidation.valid) {
            setError(nameValidation.error || 'Invalid category name');
            return;
        }

        // Validate image (double check)
        const imageValidation = validateImage(newCatFile);
        if (!imageValidation.valid) {
            setError(imageValidation.error || CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE);
            return;
        }

        setUploading(true);
        setError(null);
        
        try {
            const sanitizedName = sanitizeInput(newCatName);
            // Store images in shared location so they can be reused across multiple events
            const storagePath = `shared/cookies`;
            const imageUrl = await uploadImage(newCatFile, storagePath);
            const newCategory = await addCategory(eventId, sanitizedName, imageUrl);
            setCategories([...categories, newCategory]);
            setNewCatName('');
            setNewCatFile(null);
            setPreviewUrl(null);
            setAlertMessage(CONSTANTS.SUCCESS_MESSAGES.CATEGORY_ADDED);
            setAlertType('success');
        } catch (err) {
            console.error("Error adding category:", err);
            const errorMessage = err instanceof Error 
                ? err.message 
                : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD;
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

     
    const _handleUpdateCookies = async (_cookies: CookieCoordinate[]) => {
        if (!eventId || !editingCategory) return;

        try {
            await updateCategoryCookies(eventId, editingCategory.id, cookies);
            // Update local state
            setCategories(categories.map(c =>
                c.id === editingCategory.id ? { ...c, cookies } : c
            ));
            setEditingCategory(null);
            setAlertMessage(CONSTANTS.SUCCESS_MESSAGES.COOKIES_SAVED);
            setAlertType('success');
        } catch (err) {
            console.error("Failed to save cookies:", err);
            const errorMessage = err instanceof Error 
                ? err.message 
                : CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE;
            setAlertMessage(errorMessage);
            setAlertType('error');
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        if (!eventId || !event) return;
        
        setExporting(true);
        try {
            const votes = await getVotes(eventId);
            const content = format === 'csv' 
                ? exportToCSV(event, categories, votes)
                : exportToJSON(event, categories, votes);
            
            const extension = format === 'csv' ? 'csv' : 'json';
            const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
            const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
            
            downloadFile(content, filename, mimeType);
        } catch (err) {
            console.error("Failed to export data", err);
            setAlertMessage("Failed to export data. Please try again.");
            setAlertType('error');
        } finally {
            setExporting(false);
        }
    };

     
    const _handleMoveCategory = async (_categoryId: string, _direction: 'up' | 'down') => {
        if (!eventId) return;
        
        const currentIndex = categories.findIndex(c => c.id === categoryId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;
        
        try {
            // Swap orders
            const currentCat = categories[currentIndex];
            const targetCat = categories[newIndex];
            
            await Promise.all([
                updateCategoryOrder(eventId, currentCat.id, targetCat.order ?? newIndex),
                updateCategoryOrder(eventId, targetCat.id, currentCat.order ?? currentIndex)
            ]);
            
            // Update local state
            const newCategories = [...categories];
            [newCategories[currentIndex], newCategories[newIndex]] = [newCategories[newIndex], newCategories[currentIndex]];
            setCategories(newCategories);
        } catch (err) {
            console.error("Failed to reorder category", err);
            setAlertMessage("Failed to reorder category. Please try again.");
            setAlertType('error');
        }
    };

    const handleAddAdmin = async () => {
        if (!newAdminUserId.trim()) return;

        setAddingAdmin(true);
        try {
            const userId = newAdminUserId.trim();
            await addGlobalAdmin(userId);
            // Refresh global admins list
            const admins = await getAllGlobalAdmins();
            setGlobalAdmins(admins);
            setNewAdminUserId('');
            setAlertMessage('Admin added successfully');
            setAlertType('success');
        } catch (err) {
            console.error("Failed to add admin", err);
            setAlertMessage(err instanceof Error ? err.message : "Failed to add admin. Please try again.");
            setAlertType('error');
        } finally {
            setAddingAdmin(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleAddAdminByUserId = async (_userId: string) => {
        try {
            await addGlobalAdmin(userId);
            // Refresh global admins list
            const admins = await getAllGlobalAdmins();
            setGlobalAdmins(admins);
            setAlertMessage('Admin added successfully');
            setAlertType('success');
        } catch (err) {
            console.error("Failed to add admin", err);
            setAlertMessage(err instanceof Error ? err.message : "Failed to add admin. Please try again.");
            setAlertType('error');
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (userId === currentUserId) {
            setAlertMessage('You cannot remove yourself as an admin');
            setAlertType('error');
            return;
        }

        if (!window.confirm('Are you sure you want to remove this admin?')) {
            return;
        }

        try {
            await removeGlobalAdmin(userId);
            // Refresh global admins list
            const admins = await getAllGlobalAdmins();
            setGlobalAdmins(admins);
            setAlertMessage('Admin removed successfully');
            setAlertType('success');
        } catch (err) {
            console.error("Failed to remove admin", err);
            setAlertMessage(err instanceof Error ? err.message : "Failed to remove admin. Please try again.");
            setAlertType('error');
        }
    };

    if (checkingAccess || loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!isAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error || 'You do not have admin access. Please contact a site administrator.'}
                </div>
                <button onClick={() => navigate('/')} className={styles.buttonPrimary} style={{ marginTop: '1rem' }}>
                    Go Home
                </button>
            </div>
        );
    }
    
    if (!event) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}
                </div>
            </div>
        );
    }

    // Extract bakers from categories and Firestore
    const getBakersFromCategories = (): string[] => {
        const bakerSet = new Set<string>();
        // Add saved bakers
        savedBakers.forEach(name => bakerSet.add(name));
        // Also extract from cookies (for backward compatibility)
        categories.forEach(cat => {
            cat.cookies.forEach(cookie => {
                if (cookie.makerName && cookie.makerName !== CONSTANTS.DEFAULT_MAKER_NAME) {
                    bakerSet.add(cookie.makerName);
                }
            });
        });
        return Array.from(bakerSet).sort();
    };

    const bakers = getBakersFromCategories();

    const handleRemoveBaker = async (bakerName: string) => {
        if (!eventId) return;
        
        if (!window.confirm(`Are you sure you want to remove "${bakerName}"? This will remove all their cookies from all categories.`)) {
            return;
        }

        try {
            // Remove baker from Firestore
            await removeBaker(eventId, bakerName);
            
            // Remove all cookies with this baker's name from all categories
            const updatedCategories = categories.map(cat => {
                const updatedCookies = cat.cookies.filter(cookie => cookie.makerName !== bakerName);
                return { ...cat, cookies: updatedCookies };
            });

            // Update all categories in Firestore
            await Promise.all(
                updatedCategories.map(cat => 
                    updateCategoryCookies(eventId, cat.id, cat.cookies)
                )
            );

            // Update local state
            setCategories(updatedCategories);
            setSavedBakers(savedBakers.filter(name => name !== bakerName));
            setAlertMessage(`Baker "${bakerName}" and all their cookies removed successfully`);
            setAlertType('success');
        } catch (err) {
            console.error("Failed to remove baker", err);
            setAlertMessage("Failed to remove baker. Please try again.");
            setAlertType('error');
        }
    };

    const handleAddBaker = async () => {
        if (!eventId || !newBakerName.trim()) return;
        
        const validation = validateMakerName(newBakerName);
        if (!validation.valid) {
            setError(validation.error || 'Invalid baker name');
            return;
        }

        const sanitizedName = sanitizeInput(newBakerName);
        if (bakers.includes(sanitizedName)) {
            setError('Baker already exists');
            return;
        }

        try {
            // Save baker to Firestore immediately
            await addBaker(eventId, sanitizedName);
            setSavedBakers([...savedBakers, sanitizedName]);
            setNewBakerName('');
            setError(null);
        } catch (err) {
            console.error('Failed to add baker:', err);
            setError(err instanceof Error ? err.message : 'Failed to add baker');
        }
    };

    return (
        <div>
            {/* Event management header */}
            <div className={styles.container} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>{event.name}</h1>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #cbd5e1)' }}>
                            Status: <strong style={{ color: 'var(--color-text-primary, #f8fafc)' }}>{event.status === 'voting' ? 'Voting Open' : 'Voting Closed'}</strong>
                        </div>
                    </div>
                    
                    {/* Overflow menu - top right */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                            className={styles.overflowButton}
                            aria-label="More options"
                        >
                            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⋯</span>
                        </button>
                        {showOverflowMenu && (
                            <>
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 998
                                    }}
                                    onClick={() => setShowOverflowMenu(false)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setShowOverflowMenu(false);
                                        } else if (e.key === 'Escape') {
                                            setShowOverflowMenu(false);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Close menu"
                                />
                                <div className={styles.overflowMenu} style={{ right: 0, left: 'auto' }}>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/vote/${event.id}`);
                                            setAlertMessage('Vote link copied to clipboard!');
                                            setAlertType('success');
                                            setShowOverflowMenu(false);
                                        }}
                                        className={styles.menuItem}
                                    >
                                        📋 Copy Vote Link
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/results/${event.id}`);
                                            setAlertMessage('Results link copied to clipboard!');
                                            setAlertType('success');
                                            setShowOverflowMenu(false);
                                        }}
                                        className={styles.menuItem}
                                    >
                                        📋 Copy Results Link
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!eventId) return;
                                            const newStatus = event.status === 'voting' ? 'completed' : 'voting';
                                            try {
                                                await updateEventStatus(eventId, newStatus);
                                                setEvent({ ...event, status: newStatus });
                                            } catch (err) {
                                                console.error("Failed to update status", err);
                                                setAlertMessage("Failed to update event status");
                                                setAlertType('error');
                                            }
                                            setShowOverflowMenu(false);
                                        }}
                                        className={styles.menuItem}
                                    >
                                        {event.status === 'voting' ? 'Close Voting' : 'Reopen Voting'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleExport('csv');
                                            setShowOverflowMenu(false);
                                        }}
                                        disabled={exporting || categories.length === 0}
                                        className={styles.menuItem}
                                    >
                                        {exporting ? 'Exporting...' : 'Export CSV'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleExport('json');
                                            setShowOverflowMenu(false);
                                        }}
                                        disabled={exporting || categories.length === 0}
                                        className={styles.menuItem}
                                    >
                                        {exporting ? 'Exporting...' : 'Export JSON'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAdminManagement(!showAdminManagement);
                                            setShowOverflowMenu(false);
                                        }}
                                        className={styles.menuItem}
                                    >
                                        {showAdminManagement ? 'Hide Admins' : 'Manage Admins'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate(`/admin/${eventId}/wizard`)}
                        className={styles.buttonPrimary}
                        style={{ minWidth: '150px' }}
                    >
                        🪄 Open Wizard
                    </button>
                </div>
                {showAdminManagement && (
                    <div className={styles.sectionCard} style={{ marginTop: '1rem' }}>
                        <h3 style={{ color: 'var(--color-text-primary, #f8fafc)', marginTop: 0 }}>Global Administrators</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #cbd5e1)', marginBottom: '1rem' }}>
                            Global admins have access to manage all events on the site. To add an admin, you need their Firebase User ID.
                            They can find this by signing in and checking the browser console or their profile.
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="admin-user-id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
                                Add Admin by User ID:
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    id="admin-user-id"
                                    type="text"
                                    value={newAdminUserId}
                                    onChange={(e) => setNewAdminUserId(e.target.value)}
                                    placeholder="Enter Firebase User ID"
                                    className={styles.input}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    onClick={handleAddAdmin}
                                    disabled={addingAdmin || !newAdminUserId.trim()}
                                    className={styles.buttonPrimary}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <div>
                            <strong style={{ color: 'var(--color-text-primary, #f8fafc)' }}>Current Global Admins:</strong>
                            {globalAdmins && globalAdmins.length > 0 ? (
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                    {globalAdmins.map((userId) => (
                                        <li key={userId} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <code style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-text-secondary, #cbd5e1)' }}>{userId}</code>
                                            {userId === currentUserId && <span style={{ color: 'var(--color-text-secondary, #cbd5e1)' }}>(You)</span>}
                                            {userId !== currentUserId && (
                                                <button
                                                    onClick={() => handleRemoveAdmin(userId)}
                                                    className={styles.buttonSecondary}
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary, #cbd5e1)' }}>No admins found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Views */}
            <div className={styles.container}>
                {/* Bakers Quick View */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Bakers</h2>
                    <div className={styles.sectionCard}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="baker-name" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                                Add Baker:
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    id="baker-name"
                                    type="text"
                                    value={newBakerName}
                                    onChange={(e) => {
                                        setNewBakerName(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Baker name"
                                    className={styles.input}
                                    style={{ flex: 1 }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddBaker();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleAddBaker}
                                    onMouseDown={(e) => {
                                        // Prevent keyboard from dismissing on mobile
                                        e.preventDefault();
                                    }}
                                    className={styles.buttonPrimary}
                                >
                                    Add
                                </button>
                            </div>
                            {error && (
                                <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    {error}
                                </div>
                            )}
                        </div>
                        {bakers.length > 0 ? (
                            <div>
                                <div style={{ marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {bakers.length} baker{bakers.length !== 1 ? 's' : ''} in this event
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {bakers.map(baker => (
                                        <div
                                            key={baker}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)'
                                            }}
                                        >
                                            <span style={{ color: 'var(--color-text-primary)' }}>{baker}</span>
                                            <button
                                                onClick={() => handleRemoveBaker(baker)}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-primary)',
                                                    transition: 'background 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                }}
                                                aria-label={`Remove ${baker}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                No bakers yet. Add bakers in the wizard or tag cookies to create bakers.
                            </div>
                        )}
                    </div>
                </div>

                {/* Categories Quick View */}
                <div>
                    <h2 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Categories & Images</h2>
                    <div className={styles.sectionCard}>
                        {/* Categories List */}
                        {categories.length > 0 ? (
                            <div>
                                <div style={{ marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                                </div>
                                <div className={styles.grid}>
                                    {categories.map(category => (
                                        <div key={category.id} className={styles.card}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (eventId) {
                                                        navigate(`/admin/${eventId}/wizard?categoryId=${category.id}`);
                                                    }
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    display: 'block'
                                                }}
                                                aria-label={`Tag cookies for ${category.name}`}
                                                title="Click to tag cookies for this category"
                                            >
                                                <img
                                                    src={category.imageUrl}
                                                    alt={category.name}
                                                    className={styles.cardImage}
                                                />
                                            </button>
                                            <div className={styles.cardContent}>
                                                {editingCategoryName?.id === category.id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            value={editCategoryName}
                                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSaveCategoryName();
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingCategoryName(null);
                                                                    setEditCategoryName('');
                                                                }
                                                            }}
                                                            className={styles.input}
                                                            style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold' }}
                                                        />
                                                        <button
                                                            onClick={handleSaveCategoryName}
                                                            className={styles.buttonPrimary}
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingCategoryName(null);
                                                                setEditCategoryName('');
                                                            }}
                                                            className={styles.buttonSecondary}
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        style={{ 
                                                            margin: '0 0 0.5rem 0', 
                                                            color: 'var(--color-text-primary)',
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline',
                                                            textDecorationColor: 'transparent',
                                                            transition: 'text-decoration-color 0.2s',
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            font: 'inherit',
                                                            fontSize: '1.25rem',
                                                            fontWeight: 'bold',
                                                            textAlign: 'left',
                                                            width: '100%'
                                                        }}
                                                        onClick={() => handleStartEditCategory(category)}
                                                        aria-label={`Edit category name: ${category.name}`}
                                                        title="Click to rename"
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.textDecorationColor = 'var(--color-text-primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.textDecorationColor = 'transparent';
                                                        }}
                                                    >
                                                        {category.name}
                                                    </button>
                                                )}
                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                                    {category.cookies.length} cookie{category.cookies.length !== 1 ? 's' : ''} tagged
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category)}
                                                        className={styles.buttonSecondary}
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                                No categories yet. Add categories below or use the wizard to set up your event.
                            </div>
                        )}

                        {/* Add Category Form - moved to bottom */}
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Add Category</h3>
                            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label htmlFor="category-name" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                                        Category Name:
                                    </label>
                                    <input
                                        id="category-name"
                                        type="text"
                                        value={newCatName}
                                        onChange={(e) => {
                                            setNewCatName(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="Category name"
                                        className={styles.input}
                                        disabled={uploading}
                                        maxLength={100}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="category-image" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                                        Image:
                                    </label>
                                    <input
                                        id="category-image"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className={styles.fileInput}
                                        disabled={uploading}
                                        required
                                    />
                                    {previewUrl && (
                                        <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploading || !newCatName.trim() || !newCatFile}
                                    className={styles.buttonPrimary}
                                >
                                    {uploading ? 'Uploading...' : 'Add Category'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            {alertMessage && (
                <AlertModal
                    message={alertMessage}
                    type={alertType}
                    onClose={() => setAlertMessage(null)}
                />
            )}
        </div>
    );
}

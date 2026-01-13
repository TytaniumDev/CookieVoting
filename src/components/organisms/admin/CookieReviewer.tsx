import React, { useState, useEffect, useRef } from 'react';
import { useEventStore } from '@/lib/stores/useEventStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type CropData, type Category } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Rnd } from 'react-rnd';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';

interface CookieReviewerProps {
    eventId: string;
    categoryId: string;
    onBack: () => void;
}

export function CookieReviewer({ eventId, categoryId, onBack }: CookieReviewerProps) {
    const { confirmCrops, loading: globalLoading } = useEventStore();

    const [category, setCategory] = useState<Category | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [crops, setCrops] = useState<(CropData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCropIndex, setSelectedCropIndex] = useState<number | null>(null);

    // For handling normalized <-> pixel conversions
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Canvas/Image refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Update container size on mount and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setContainerSize({ width: clientWidth, height: clientHeight });
            }
        };

        // Initial measurement
        updateSize();

        // Observer for robust resizing
        const observer = new ResizeObserver(updateSize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [imageUrl]);

    // Fetch data
    useEffect(() => {
        if (!eventId || !categoryId) return;

        const fetchData = async () => {
            try {
                const catRef = doc(db, 'events', eventId, 'categories', categoryId);
                const catSnap = await getDoc(catRef);

                if (!catSnap.exists()) {
                    setError('Category not found');
                    return;
                }

                const catData = { id: catSnap.id, ...catSnap.data() } as Category;
                setCategory(catData);

                if (!catData.batchId) {
                    setError('No batch found for this category');
                    return;
                }

                const batchRef = doc(db, 'cookie_batches', catData.batchId);
                const batchSnap = await getDoc(batchRef);

                if (!batchSnap.exists()) {
                    setError('Batch not found');
                    return;
                }

                const batchData = batchSnap.data();
                setImageUrl(catData.imageUrl);

                // Load detected objects
                if (batchData.detectedObjects) {
                    const initialCrops = (batchData.detectedObjects || []).map((obj: any) => {
                        // Convert vertices to box
                        const vs = obj.normalizedVertices || [];
                        const minX = Math.min(...vs.map((v: any) => v.x || 0));
                        const minY = Math.min(...vs.map((v: any) => v.y || 0));
                        const maxX = Math.max(...vs.map((v: any) => v.x || 1));
                        const maxY = Math.max(...vs.map((v: any) => v.y || 1));
                        return {
                            id: uuidv4(),
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY,
                        };
                    });
                    setCrops(initialCrops);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId, categoryId]);

    const handleConfirm = async () => {
        if (!category?.batchId) return;
        try {
            const cropsWithoutIds = crops.map(({ id: _id, ...rest }) => rest);
            await confirmCrops(category.batchId, cropsWithoutIds);
            onBack();
        } catch (e) {
            console.error(e);
            alert('Failed to confirm crops');
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent adding if we clicked on a crop
        if (selectedCropIndex !== null) return;

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const xFn = (e.clientX - rect.left) / rect.width;
        const yFn = (e.clientY - rect.top) / rect.height;

        // Default 15% size
        const newCrop = {
            id: uuidv4(),
            x: Math.max(0, xFn - 0.075),
            y: Math.max(0, yFn - 0.075),
            width: 0.15,
            height: 0.15,
        };
        setCrops([...crops, newCrop]);
        setSelectedCropIndex(crops.length);
    };

    const handleRemoveCrop = (index: number) => {
        const newCrops = [...crops];
        newCrops.splice(index, 1);
        setCrops(newCrops);
        setSelectedCropIndex(null);
    };

    const updateCrop = (index: number, updates: Partial<CropData>) => {
        const newCrops = [...crops];
        newCrops[index] = { ...newCrops[index], ...updates };
        setCrops(newCrops);
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading review interface...</div>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] border rounded-xl overflow-hidden bg-background">
            <header className="bg-card border-b p-4 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">{category?.name} - Review</h3>
                    <p className="text-sm text-muted-foreground">Review and adjust detected cookie boundaries</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={globalLoading}
                    >
                        {globalLoading ? 'Processing...' : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Confirm {crops.length} Cookies
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-hidden flex flex-col items-center justify-center bg-zinc-950 relative">
                {/* Canvas Container */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
                <div
                    className="relative flex shadow-2xl border border-zinc-800 bg-black max-w-full max-h-full"
                    ref={containerRef}
                    onClick={handleImageClick}
                >
                    {imageUrl && (
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Tray"
                            className="block w-auto h-auto max-w-full max-h-[65vh] object-contain select-none cursor-crosshair"
                            onDragStart={(e) => e.preventDefault()}
                        />
                    )}

                    {/* Overlay with Rnd */}
                    {containerSize.width > 0 && crops.map((crop, i) => (
                        <Rnd
                            key={crop.id}
                            size={{
                                width: crop.width * containerSize.width,
                                height: crop.height * containerSize.height,
                            }}
                            position={{
                                x: crop.x * containerSize.width,
                                y: crop.y * containerSize.height,
                            }}
                            onDragStart={(e) => {
                                e.stopPropagation();
                                setSelectedCropIndex(i);
                            }}
                            onDragStop={(e, d) => {
                                updateCrop(i, {
                                    x: d.x / containerSize.width,
                                    y: d.y / containerSize.height,
                                });
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                                updateCrop(i, {
                                    width: parseInt(ref.style.width) / containerSize.width,
                                    height: parseInt(ref.style.height) / containerSize.height,
                                    x: position.x / containerSize.width,
                                    y: position.y / containerSize.height,
                                });
                            }}
                            bounds="parent"
                            className={`border-2 transition-colors ${selectedCropIndex === i
                                ? 'border-amber-400 bg-amber-400/20 z-20'
                                : 'border-emerald-400 bg-emerald-400/10 z-10 hover:border-emerald-300'
                                }`}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCropIndex(i);
                            }}
                        >
                            <span className={`absolute -top-6 left-0 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm select-none ${selectedCropIndex === i ? 'bg-amber-400 text-black' : 'bg-emerald-500 text-white'
                                }`}>
                                #{i + 1}
                            </span>
                        </Rnd>
                    ))}
                </div>

                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm pointer-events-none">
                    Click image to add box • Drag to move
                </div>
            </main>

            {/* Editor Footer */}
            {selectedCropIndex !== null ? (
                <div className="bg-card border-t p-4 flex justify-between items-center animate-in slide-in-from-bottom duration-200">
                    <span className="text-sm font-medium">Selected Box #{selectedCropIndex + 1}</span>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCrop(selectedCropIndex)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Box
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedCropIndex(null)}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-card border-t p-2 text-center text-xs text-muted-foreground">
                    {crops.length} cookies detected
                </div>
            )}
        </div>
    );
};

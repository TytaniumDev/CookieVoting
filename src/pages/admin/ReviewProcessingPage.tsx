import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventStore } from '../../lib/stores/useEventStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { type CropData, type Category } from '../../lib/types';
import { v4 as uuidv4 } from 'uuid';

type CropWithId = CropData & { id: string };
// import Button from '../../components/atoms/Button/Button'; 
// Replaced valid Button usage with standard standard HTML button due to missing component

import { Rnd } from 'react-rnd';

export const ReviewProcessingPage: React.FC = () => {
    const { eventId, categoryId } = useParams<{ eventId: string; categoryId: string }>();
    const navigate = useNavigate();
    const { confirmCrops, loading: globalLoading } = useEventStore();

    const [category, setCategory] = useState<Category | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [crops, setCrops] = useState<CropWithId[]>([]);
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

                // We need the original image URL. 
                // If the cloud function saved 'originalImageRef' (storage path), we need to get the download URL.
                // However, the category usually has the imageUrl (which is the tray image).
                // Let's use the category image for simplicity as it should be the same.
                setImageUrl(catData.imageUrl);

                // Load detected objects
                if (batchData.detectedObjects) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const initialCrops: CropWithId[] = batchData.detectedObjects.map((obj: any) => {
                        // Convert vertices to box
                        const vs = obj.normalizedVertices || [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const minX = Math.min(...vs.map((v: any) => v.x || 0));
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const minY = Math.min(...vs.map((v: any) => v.y || 0));
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const maxX = Math.max(...vs.map((v: any) => v.x || 1));
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            const cropsWithoutIds: CropData[] = crops.map(({ id: _id, ...rest }) => rest);
            await confirmCrops(category.batchId, cropsWithoutIds);
            // Navigate back to assignment page or categories
            navigate(`/admin/${eventId}/categories/${categoryId}/assign`);
        } catch (e) {
            console.error(e);
            alert('Failed to confirm crops');
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent adding if we clicked on a crop (handled by stopPropagation, but just in case)
        if (selectedCropIndex !== null) return;

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const xFn = (e.clientX - rect.left) / rect.width;
        const yFn = (e.clientY - rect.top) / rect.height;

        // Default 15% size
        const newCrop: CropWithId = {
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-bold">Review Detected Cookies</h1>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${globalLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleConfirm}
                        disabled={globalLoading}
                    >
                        {globalLoading ? 'Processing...' : `Confirm ${crops.length} Cookies`}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-hidden flex flex-col items-center justify-center bg-gray-900">
                {/* Canvas Container */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                    className="relative flex shadow-2xl border border-gray-700 bg-black"
                    ref={containerRef}
                    onClick={handleImageClick}
                >
                    {imageUrl && (
                        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Tray"
                            className="block max-w-full max-h-[75vh] w-auto h-auto object-contain select-none cursor-crosshair"
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
                                e.stopPropagation(); // Prevent image click
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
                            className={`border-2 ${selectedCropIndex === i
                                ? 'border-yellow-400 bg-yellow-400/20 z-20'
                                : 'border-green-400 bg-green-400/10 z-10 hover:border-green-300'
                                }`}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCropIndex(i);
                            }}
                        >
                            <span className={`absolute -top-6 left-0 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm select-none ${selectedCropIndex === i ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
                                }`}>
                                #{i + 1}
                            </span>
                        </Rnd>
                    ))}
                </div>

                <p className="mt-4 text-gray-400 text-sm">
                    Click anywhere to add. Drag to move. Drag corners to resize.
                </p>
            </main>

            {/* Editor Footer */}
            {selectedCropIndex !== null ? (
                <div className="bg-gray-800 border-t border-gray-700 p-4 flex flex-wrap justify-center gap-6 sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] text-gray-100">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Actions</span>
                        <div className="flex gap-4">
                            <button
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 transition-colors shadow-lg"
                                onClick={() => handleRemoveCrop(selectedCropIndex)}
                            >
                                Delete Box
                            </button>
                            <button
                                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                                onClick={() => setSelectedCropIndex(null)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-center items-center gap-4 sticky bottom-0 z-50 text-gray-300">
                    <span className="bg-gray-700 px-3 py-1 rounded text-sm">Tip</span>
                    <span className="text-sm">Tap on the image to add a new cookie box. Drag boxes to move/resize.</span>
                </div>
            )}
        </div>
    );
};

/**
 * MobileDrawer Component (Redesigned)
 *
 * Bottom sheet drawer for mobile grid controls.
 * Uses react-modal-sheet for smooth gesture-based interaction.
 * 
 * Redesign Features:
 * - Dark theme matching the app
 * - Stepper controls for rows/columns
 * - Slider for padding
 * - Touch-friendly button sizes
 */
import { Sheet } from 'react-modal-sheet';
import { Stepper, Slider, ActionButton } from '../ControlUi';
import type { GridConfig } from '../../cropUtils';

export interface MobileDrawerProps {
    /** Whether the drawer is open */
    isOpen: boolean;
    /** Called when drawer is closed */
    onClose: () => void;
    /** Current grid configuration */
    config: GridConfig;
    /** Called when any config value changes */
    onChange: (config: GridConfig) => void;
    /** Called when Apply button is clicked */
    onApply: () => void;
    /** Called when Save is clicked */
    onSave: () => void;
    /** Whether saving is in progress */
    isSaving?: boolean;
}

export function MobileDrawer({
    isOpen,
    onClose,
    config,
    onChange,
    onApply,
    onSave,
    isSaving = false,
}: MobileDrawerProps) {
    const handleChange = (key: keyof GridConfig, value: number) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Sheet isOpen={isOpen} onClose={onClose} snapPoints={[0.6, 0.3]} initialSnap={0}>
            <Sheet.Container
                style={{
                    backgroundColor: '#2a2a3a',
                    borderTopLeftRadius: '1rem',
                    borderTopRightRadius: '1rem',
                }}
            >
                <Sheet.Header>
                    <div className="flex flex-col items-center pt-3 pb-4 border-b border-white/10">
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-3" />
                        <span className="text-lg font-semibold text-white/90">
                            Grid Controls
                        </span>
                    </div>
                </Sheet.Header>
                <Sheet.Content>
                    <Sheet.Scroller>
                        <div className="p-6 space-y-6">
                            {/* Grid Layout Section */}
                            <section>
                                <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
                                    Grid Layout
                                </h3>
                                <div className="space-y-4">
                                    <Stepper
                                        id="mobile-rows"
                                        label="Rows"
                                        value={config.rows}
                                        min={1}
                                        max={10}
                                        onChange={(val) => handleChange('rows', val)}
                                    />
                                    <Stepper
                                        id="mobile-cols"
                                        label="Columns"
                                        value={config.cols}
                                        min={1}
                                        max={10}
                                        onChange={(val) => handleChange('cols', val)}
                                    />
                                </div>
                            </section>

                            {/* Spacing Section */}
                            <section>
                                <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
                                    Spacing
                                </h3>
                                <Slider
                                    id="mobile-padding"
                                    label="Padding"
                                    value={config.padding}
                                    min={0}
                                    max={20}
                                    onChange={(val) => handleChange('padding', val)}
                                />
                            </section>

                            {/* Actions */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
                                    Actions
                                </h3>
                                <ActionButton onClick={onApply}>
                                    Apply Grid
                                </ActionButton>
                            </section>

                            {/* Save Button */}
                            <div className="pt-2">
                                <ActionButton
                                    variant="primary"
                                    onClick={onSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Cookies'}
                                </ActionButton>
                            </div>
                        </div>
                    </Sheet.Scroller>
                </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop onTap={onClose} />
        </Sheet>
    );
}

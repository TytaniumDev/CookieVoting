import React, { useEffect, useRef } from 'react';

interface OutsideClickHandlerProps {
    children: React.ReactNode;
    onOutsideClick: () => void;
    className?: string;
}

/**
 * OutsideClickHandler - Triggers a callback when clicking outside the wrapper.
 */
export function OutsideClickHandler({
    children,
    onOutsideClick,
    className,
}: OutsideClickHandlerProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                onOutsideClick();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onOutsideClick]);

    return (
        <div ref={wrapperRef} className={className}>
            {children}
        </div>
    );
}

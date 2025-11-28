import React, { useState, useEffect, useRef } from 'react';

interface ResizableSplitPaneProps {
    top: React.ReactNode;
    bottom: React.ReactNode;
    initialTopHeight?: string | number;
    minTopHeight?: number;
    minBottomHeight?: number;
}

export const ResizableSplitPane: React.FC<ResizableSplitPaneProps> = ({
    top,
    bottom,
    initialTopHeight = '50%',
    minTopHeight = 100,
    minBottomHeight = 100,
}) => {
    const [topHeight, setTopHeight] = useState<string | number>(initialTopHeight);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'row-resize';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newTopHeight = e.clientY - containerRect.top;
        const maxTopHeight = containerRect.height - minBottomHeight;

        if (newTopHeight >= minTopHeight && newTopHeight <= maxTopHeight) {
            setTopHeight(newTopHeight);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
    };

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
            <div style={{ height: topHeight }} className="overflow-hidden flex flex-col">
                {top}
            </div>
            <div
                className="h-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 cursor-row-resize transition-colors z-10 shrink-0"
                onMouseDown={handleMouseDown}
            />
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {bottom}
            </div>
        </div>
    );
};

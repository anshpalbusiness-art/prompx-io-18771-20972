import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
}

/**
 * VirtualList component for rendering large lists efficiently
 * Only renders items that are visible in the viewport + overscan
 */
export const VirtualList = React.memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
  gap = 0,
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return items.length * (itemHeight + gap);
  }, [items.length, itemHeight, gap]);

  // Calculate visible range
  const { start, end, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const visibleCount = Math.ceil(containerHeight / (itemHeight + gap));
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    const offsetY = start * (itemHeight + gap);

    return { start, end, offsetY };
  }, [scrollTop, itemHeight, gap, containerHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(start, end + 1);
  }, [items, start, end]);

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  // Reset scroll when items change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{
        height: containerHeight,
        position: 'relative',
        willChange: 'scroll-position',
      }}
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Rendered items */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={start + index}
              style={{
                height: itemHeight,
                marginBottom: gap,
              }}
            >
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => React.ReactElement;

export default VirtualList;

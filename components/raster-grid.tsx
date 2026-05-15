'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface RasterCell {
  fill: string;
  opacity: number;
}

interface RasterPointerInfo {
  clientX: number;
  clientY: number;
  localX: number;
  localY: number;
  normalizedX: number;
  normalizedY: number;
}

interface RasterGridProps {
  cellSize: number;
  className?: string;
  cellSpacing?: number;
  roundedCells?: boolean;
  onPointerLeave?: () => void;
  onPointerMove?: (info: RasterPointerInfo) => void;
  sampler: (input: {
    height: number;
    normalizedX: number;
    normalizedY: number;
    width: number;
    x: number;
    y: number;
  }) => RasterCell;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export default function RasterGrid({
  cellSize,
  cellSpacing = 0.2,
  className,
  roundedCells = true,
  onPointerLeave,
  onPointerMove,
  sampler,
}: RasterGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const cells = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];

    const columns = Math.max(1, Math.floor(size.width / cellSize));
    const rows = Math.max(1, Math.floor(size.height / cellSize));
    const cellWidth = size.width / columns;
    const cellHeight = size.height / rows;

    const items: Array<RasterCell & {
      height: number;
      rx: number;
      width: number;
      x: number;
      y: number;
    }> = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * cellWidth;
        const y = row * cellHeight;
        const centerX = x + cellWidth / 2;
        const centerY = y + cellHeight / 2;
        const normalizedX = (centerX / size.width) * 2 - 1;
        const normalizedY = 1 - (centerY / size.height) * 2;
        const sample = sampler({
          x: centerX,
          y: centerY,
          width: size.width,
          height: size.height,
          normalizedX,
          normalizedY,
        });

        const insetRatio = clamp(cellSpacing, 0, 0.9) / 2;

        items.push({
          ...sample,
          x: x + cellWidth * insetRatio,
          y: y + cellHeight * insetRatio,
          width: cellWidth * (1 - insetRatio * 2),
          height: cellHeight * (1 - insetRatio * 2),
          rx: roundedCells ? Math.min(cellWidth, cellHeight) * 0.18 : 0,
        });
      }
    }

    return items;
  }, [cellSize, cellSpacing, sampler, size.height, size.width]);

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerLeave={onPointerLeave}
      onPointerMove={(event) => {
        if (!onPointerMove) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const localX = event.clientX - bounds.left;
        const localY = event.clientY - bounds.top;

        onPointerMove({
          clientX: event.clientX,
          clientY: event.clientY,
          localX,
          localY,
          normalizedX: (localX / bounds.width) * 2 - 1,
          normalizedY: 1 - (localY / bounds.height) * 2,
        });
      }}
    >
      <svg className="h-full w-full" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none">
        {cells.map((cell, index) => (
          <rect
            key={index}
            x={cell.x}
            y={cell.y}
            width={cell.width}
            height={cell.height}
            rx={cell.rx}
            fill={cell.fill}
            fillOpacity={cell.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

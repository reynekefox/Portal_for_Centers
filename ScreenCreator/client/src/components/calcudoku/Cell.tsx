import { useMemo } from 'react';
import type { CellData, Operation } from '@/lib/calcudoku/types';

interface CellProps {
    cell: CellData;
    isActive: boolean;
    cageLabel?: { target: number; operation: Operation; isSingle?: boolean } | null;
    borders: { top: boolean; right: boolean; bottom: boolean; left: boolean };
    onSelect: () => void;
}

export default function Cell({ cell, isActive, cageLabel, borders, onSelect }: CellProps) {
    // Thin borders (1px gray) use box-shadow
    const style = useMemo(() => {
        const shadows = [];
        // Thin borders as fallback/underneath
        if (!borders.top) shadows.push('inset 0 1px 0 0 #d1d5db');
        if (!borders.right) shadows.push('inset -1px 0 0 0 #d1d5db');
        if (!borders.bottom) shadows.push('inset 0 -1px 0 0 #d1d5db');
        if (!borders.left) shadows.push('inset 1px 0 0 0 #d1d5db');

        return {
            boxShadow: shadows.join(', ')
        };
    }, [borders]);

    const opSymbol = useMemo(() => {
        if (!cageLabel) return '';
        const op = cageLabel.operation;
        return op === 'none' ? '' : op === '*' ? '×' : op === '/' ? '÷' : op;
    }, [cageLabel]);

    return (
        <div
            className={`relative flex items-center justify-center text-3xl font-bold cursor-pointer select-none transition-colors duration-100 ${isActive ? 'bg-cyan-200' : cageLabel?.isSingle ? 'bg-cyan-100' : 'bg-white'
                } ${cell.isError ? 'text-red-500' : ''}`}
            style={{ boxShadow: style.boxShadow }}
            onClick={onSelect}
        >
            {/* Thick Borders (High Z-Index) */}
            {borders.top && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-black z-20 pointer-events-none" style={{ transform: 'translateY(-50%)', left: '-1.5px', right: '-1.5px' }} />
            )}
            {borders.right && (
                <div className="absolute top-0 right-0 bottom-0 w-[3px] bg-black z-20 pointer-events-none" style={{ transform: 'translateX(50%)', top: '-1.5px', bottom: '-1.5px' }} />
            )}
            {borders.bottom && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black z-20 pointer-events-none" style={{ transform: 'translateY(50%)', left: '-1.5px', right: '-1.5px' }} />
            )}
            {borders.left && (
                <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-black z-20 pointer-events-none" style={{ transform: 'translateX(-50%)', top: '-1.5px', bottom: '-1.5px' }} />
            )}

            {/* Cage Label (Target + Op) */}
            {cageLabel && (
                <span className="absolute top-0.5 left-1 text-2xl font-bold text-black leading-none z-10 pl-1 pt-1">
                    {cageLabel.target}{opSymbol}
                </span>
            )}

            {/* Value */}
            <span className="z-0">{cell.value || ''}</span>
        </div>
    );
}

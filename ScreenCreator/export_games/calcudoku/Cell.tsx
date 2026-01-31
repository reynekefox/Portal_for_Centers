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
    const borderClasses = useMemo(() => {
        const classes = [];

        if (borders.top) classes.push('border-t-2 border-t-black');
        else classes.push('border-t border-t-gray-300');

        if (borders.right) classes.push('border-r-2 border-r-black');
        else classes.push('border-r border-r-gray-300');

        if (borders.bottom) classes.push('border-b-2 border-b-black');
        else classes.push('border-b border-b-gray-300');

        if (borders.left) classes.push('border-l-2 border-l-black');
        else classes.push('border-l border-l-gray-300');

        return classes.join(' ');
    }, [borders]);

    const opSymbol = useMemo(() => {
        if (!cageLabel) return '';
        const op = cageLabel.operation;
        return op === 'none' ? '' : op === '*' ? '×' : op === '/' ? '÷' : op;
    }, [cageLabel]);

    return (
        <div
            className={`relative flex items-center justify-center text-3xl font-bold cursor-pointer select-none transition-colors duration-100 ${borderClasses} ${isActive ? 'bg-blue-200' : cageLabel?.isSingle ? 'bg-blue-100' : 'bg-white'
                } ${cell.isError ? 'text-red-500' : ''}`}
            onClick={onSelect}
        >
            {/* Cage Label (Target + Op) */}
            {cageLabel && (
                <span className="absolute top-0 left-1 text-2xl font-bold text-black leading-none z-10">
                    {cageLabel.target}{opSymbol}
                </span>
            )}

            {/* Value */}
            <span>{cell.value || ''}</span>
        </div>
    );
}

import { useMemo } from 'react';

interface RadialMenuProps {
    size: number; // Max number (e.g. 4 for 4x4)
    onInput: (value: number) => void;
    onClear: () => void;
}

export default function RadialMenu({ size, onInput, onClear }: RadialMenuProps) {
    const buttons = useMemo(() => {
        const btns = [];
        const radius = 60; // px
        const totalItems = size;
        const startAngle = -90; // Start at top

        for (let i = 1; i <= size; i++) {
            const angleDeg = startAngle + ((i - 1) * (360 / totalItems));
            const angleRad = (angleDeg * Math.PI) / 180;

            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            btns.push({
                label: i.toString(),
                value: i,
                x,
                y,
            });
        }
        return btns;
    }, [size]);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative w-0 h-0 pointer-events-auto">
                {/* Center Clear Button (X) */}
                <button
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-100 border-2 border-red-400 text-red-600 font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                >
                    ✕
                </button>

                {/* Radial Number Buttons */}
                {buttons.map((btn) => (
                    <button
                        key={btn.value}
                        className="absolute w-10 h-10 rounded-full bg-white border-2 border-cyan-500 text-cyan-700 font-bold flex items-center justify-center shadow-lg hover:scale-110 hover:bg-cyan-50 transition-all z-10"
                        style={{
                            transform: `translate(calc(-50% + ${btn.x}px), calc(-50% + ${btn.y}px))`,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onInput(btn.value);
                        }}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

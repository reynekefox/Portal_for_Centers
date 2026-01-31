import { useState, useEffect } from 'react';

interface StartCountdownProps {
    onComplete: () => void;
    countdown?: number;
}

export function StartCountdown({ onComplete, countdown = 3 }: StartCountdownProps) {
    const [count, setCount] = useState(countdown);

    useEffect(() => {
        if (count === 0) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, onComplete]);

    if (count === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="text-center">
                <div
                    className="text-9xl font-bold text-white animate-pulse"
                    style={{
                        textShadow: '0 0 40px rgba(255,255,255,0.5)'
                    }}
                >
                    {count}
                </div>
                <p className="text-white text-2xl mt-4 opacity-80">Приготовьтесь!</p>
            </div>
        </div>
    );
}

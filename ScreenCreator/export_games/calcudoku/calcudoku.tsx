import { useState } from 'react';
import GameSetup from '@/components/calcudoku/GameSetup';
import GameBoard from '@/components/calcudoku/GameBoard';
import type { Operation } from '@/lib/calcudoku/types';

type GameState = 'setup' | 'playing';

export default function Calcudoku() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [gameConfig, setGameConfig] = useState<{ size: number; ops: Operation[] }>({ size: 4, ops: ['+', '-'] });

    const handleStart = (config: { size: number; ops: Operation[] }) => {
        setGameConfig(config);
        setGameState('playing');
    };

    const handleBack = () => {
        setGameState('setup');
    };

    return (
        <div className="min-h-screen bg-white">
            {gameState === 'setup' ? (
                <GameSetup onStart={handleStart} />
            ) : (
                <GameBoard
                    size={gameConfig.size}
                    ops={gameConfig.ops}
                    onBack={handleBack}
                />
            )}
        </div>
    );
}

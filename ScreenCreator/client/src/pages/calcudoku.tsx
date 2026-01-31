import { useState, useEffect } from 'react';
import GameSetup from '@/components/calcudoku/GameSetup';
import GameBoard from '@/components/calcudoku/GameBoard';
import type { Operation } from '@/lib/calcudoku/types';
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

type GameState = 'setup' | 'playing';

// Convert operations string to array
const parseOperations = (opsString: string): Operation[] => {
    const map: Record<string, Operation> = { '+': '+', '-': '-', '*': '*', '/': '/' };
    return opsString.split(' ').filter(op => map[op]).map(op => map[op]);
};

// Get initial config from localStorage directly (lockedParams hook is async)
const getInitialConfig = (): { size: number; ops: Operation[]; timeLimit: number } => {
    try {
        const lockedData = localStorage.getItem('lockedExerciseParams');
        if (lockedData) {
            const parsed = JSON.parse(lockedData);
            if (parsed.trainingId === 'calcudoku' && parsed.parameters) {
                const size = Number(parsed.parameters.size) || 4;
                const opsString = (parsed.parameters.operations as string) || '+ -';
                const timeLimit = Number(parsed.parameters.timeLimit) || 60;
                return { size, ops: parseOperations(opsString), timeLimit };
            }
        }
    } catch (e) { /* ignore */ }
    return { size: 4, ops: ['+', '-'] as Operation[], timeLimit: 60 };
};

export default function Calcudoku() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('calcudoku');

    const [gameState, setGameState] = useState<GameState>('setup');
    const [gameConfig, setGameConfig] = useState<{ size: number; ops: Operation[]; timeLimit: number }>(getInitialConfig);

    // Update if lockedParameters change after initial render
    useEffect(() => {
        if (lockedParameters) {
            const size = Number(lockedParameters.size) || 4;
            const opsString = (lockedParameters.operations as string) || '+ -';
            const timeLimit = Number(lockedParameters.timeLimit) || 60;
            setGameConfig({ size, ops: parseOperations(opsString), timeLimit });
        }
    }, [lockedParameters]);

    const handleStart = (config: { size: number; ops: Operation[] }) => {
        setGameConfig({ ...config, timeLimit: gameConfig.timeLimit });
        setGameState('playing');
    };

    const handleBack = () => {
        setGameState('setup');
    };

    return (
        <div className="min-h-screen bg-white">
            {gameState === 'setup' ? (
                <GameSetup
                    onStart={handleStart}
                    isLocked={isLocked}
                    initialSize={gameConfig.size}
                    initialOps={gameConfig.ops}
                    timeLimit={gameConfig.timeLimit}
                    backPath={backPath}
                />
            ) : (
                <GameBoard
                    size={gameConfig.size}
                    ops={gameConfig.ops}
                    onBack={handleBack}
                    isLocked={isLocked}
                    timeLimit={isLocked ? gameConfig.timeLimit : undefined}
                    requiredResult={requiredResult}
                    onComplete={lockedCompleteExercise}
                    hasNextExercise={hasNextExercise}
                    getNextPath={getNextPath}
                />
            )}
        </div>
    );
}

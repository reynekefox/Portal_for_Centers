import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface RequiredResult {
    type: string;
    minValue?: number;
}

interface ExerciseData {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult?: RequiredResult;
}

interface LockedParams {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult?: RequiredResult;
    assignmentId?: number;
    exerciseIndex?: number;
    totalExercises?: number;
    studentId?: number;
    exercises?: ExerciseData[];  // Full list of exercises
    nextExercise?: ExerciseData; // Legacy support
}

export function useLockedParams(expectedTrainingId: string) {
    const [, setLocation] = useLocation();
    const [isLocked, setIsLocked] = useState(false);
    const [requiredResult, setRequiredResult] = useState<RequiredResult | null>(null);
    const [lockedParameters, setLockedParameters] = useState<Record<string, unknown> | null>(null);
    const [assignmentId, setAssignmentId] = useState<number | null>(null);
    const [exerciseIndex, setExerciseIndex] = useState<number>(0);
    const [totalExercises, setTotalExercises] = useState<number>(0);
    const [studentId, setStudentId] = useState<number | null>(null);
    const [nextExercise, setNextExercise] = useState<ExerciseData | null>(null);
    const [exercises, setExercises] = useState<ExerciseData[]>([]);

    useEffect(() => {
        const lockedData = localStorage.getItem('lockedExerciseParams');
        console.log('[useLockedParams] expectedTrainingId:', expectedTrainingId, 'lockedData:', lockedData);
        if (lockedData) {
            try {
                const parsed: LockedParams = JSON.parse(lockedData);
                console.log('[useLockedParams] parsed.trainingId:', parsed.trainingId, 'match:', parsed.trainingId === expectedTrainingId);
                if (parsed.trainingId === expectedTrainingId) {
                    // Only lock if there's a valid assignmentId - prevents stale data issues
                    if (parsed.assignmentId) {
                        setIsLocked(true);
                    }
                    setLockedParameters(parsed.parameters || {});
                    if (parsed.requiredResult) {
                        setRequiredResult(parsed.requiredResult);
                    }
                    if (parsed.assignmentId) {
                        setAssignmentId(parsed.assignmentId);
                    }
                    if (parsed.exerciseIndex !== undefined) {
                        setExerciseIndex(parsed.exerciseIndex);
                    }
                    if (parsed.totalExercises !== undefined) {
                        setTotalExercises(parsed.totalExercises);
                    }
                    if (parsed.studentId) {
                        setStudentId(parsed.studentId);
                    }
                    // Support both new exercises array and legacy nextExercise
                    if (parsed.exercises && parsed.exercises.length > 0) {
                        setExercises(parsed.exercises);
                        // Compute nextExercise from exercises array
                        const nextIdx = (parsed.exerciseIndex ?? 0) + 1;
                        if (nextIdx < parsed.exercises.length) {
                            setNextExercise(parsed.exercises[nextIdx]);
                        }
                    } else if (parsed.nextExercise) {
                        // Legacy support
                        setNextExercise(parsed.nextExercise);
                    }
                    // Don't clear here - let it persist for page refresh
                    // Will be cleared when navigating to next exercise or back
                }
            } catch (e) {
                console.error('Failed to parse locked params:', e);
            }
        }
    }, [expectedTrainingId]);

    // backPath determines where back button should navigate
    // If locked assignment, go to student-dashboard (assignments tab)
    // If student in free training mode, go to trainings tab
    const isStudent = (() => {
        try {
            const authUser = localStorage.getItem('auth_user');
            if (authUser) {
                const parsed = JSON.parse(authUser);
                return parsed.role === 'student';
            }
        } catch {
            // ignore
        }
        return false;
    })();
    // Locked goes to assignments (to see progress), free training goes to trainings tab
    const backPath = isLocked ? '/student-dashboard' : (isStudent ? '/student-dashboard?tab=trainings' : '/');

    // Function to complete exercise and navigate to next
    const completeExercise = useCallback(async (result: Record<string, unknown>, passed: boolean) => {
        if (!isLocked || !assignmentId || studentId === null) {
            // Not in assignment mode
            return;
        }

        // FIRST: Store info for next exercise BEFORE async API call
        // This ensures localStorage is set before navigation happens
        if (passed && nextExercise && exerciseIndex < totalExercises - 1) {
            const nextIdx = exerciseIndex + 1;
            localStorage.setItem('lockedExerciseParams', JSON.stringify({
                trainingId: nextExercise.trainingId,
                parameters: nextExercise.parameters,
                requiredResult: nextExercise.requiredResult,
                assignmentId,
                exerciseIndex: nextIdx,
                totalExercises,
                studentId,
                exercises: exercises // Pass full exercises array
            }));
        } else {
            // Clear if no next exercise or failed
            localStorage.removeItem('lockedExerciseParams');
        }

        // THEN: Submit the result to API (async, can happen after navigation)
        try {
            await fetch(`/api/assignments/${assignmentId}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseIndex,
                    studentId,
                    result,
                    passed
                })
            });
        } catch (e) {
            console.error('Failed to submit exercise result:', e);
        }
    }, [isLocked, assignmentId, exerciseIndex, totalExercises, studentId, nextExercise, exercises]);

    // Clear locked params (when going back to dashboard)
    const clearLockedParams = useCallback(() => {
        localStorage.removeItem('lockedExerciseParams');
    }, []);

    // Get path to navigate after completion
    const getNextPath = useCallback(() => {
        if (!isLocked) return '/';
        if (nextExercise && exerciseIndex < totalExercises - 1) {
            return getTrainingPath(nextExercise.trainingId);
        }
        return '/student-dashboard';
    }, [isLocked, nextExercise, exerciseIndex, totalExercises]);

    return {
        isLocked,
        requiredResult,
        lockedParameters,
        assignmentId,
        studentId,
        backPath,
        exerciseIndex,
        totalExercises,
        hasNextExercise: nextExercise !== null && exerciseIndex < totalExercises - 1,
        completeExercise,
        clearLockedParams,
        getNextPath
    };
}

function getTrainingPath(trainingId: string): string {
    const pathMap: Record<string, string> = {
        'stroop-test': '/stroop-test',
        'schulte-table': '/schulte-table',
        'n-back': '/n-back',
        'correction-test': '/correction-test',
        'reaction-test': '/reaction-test',
        'munsterberg-test': '/munsterberg-test',
        'alphabet-game': '/alphabet-game',
        'calcudoku': '/calcudoku',
        'counting-game': '/counting-game',
        'speed-reading': '/speed-reading',
        'flexibility-test': '/flexibility-test',
        'sequence-test': '/sequence-test',
        'tower-of-hanoi': '/tower-of-hanoi',
        'vocabulary-test': '/vocabulary-test',
        'auditory-test': '/auditory-test',
        'visual-memory-test': '/visual-memory-test',
        'pairs-test': '/pairs-test',
        'fly-test': '/fly-test',
        'anagram-test': '/anagram-test',
        'math-test': '/math-test',
        'magic-forest': '/magic-forest',
        'start-test': '/start-test',
        'attention-test': '/attention-test',
        'animal-sound-test': '/animal-sound-test',
        'anagram-picture-test': '/anagram-picture-test',
        'n-back-picture': '/n-back-picture',
    };
    return pathMap[trainingId] || '/';
}

export function formatRequiredResult(
    requiredResult: RequiredResult | null,
    parameters?: Record<string, unknown>
): string {
    if (!requiredResult) return '';

    switch (requiredResult.type) {
        case 'max_time':
            return `Уложиться в ${requiredResult.minValue} сек`;
        case 'min_score': {
            // For sequence-test, use startLength from parameters
            const startLength = parameters?.startLength;
            if (startLength) {
                return `Запомнить последовательность из ${startLength} элементов`;
            }
            return `Достигнуть уровня ${requiredResult.minValue}`;
        }
        case 'min_accuracy': {
            // Legacy fly-test - show proper description
            const attempts = parameters?.attempts;
            if (attempts) {
                return `Найти муху ${attempts} раз`;
            }
            // Legacy pairs-test - show proper description
            const pairCount = parameters?.pairCount;
            if (pairCount) {
                return `Запомнить ${pairCount} пар`;
            }
            // Legacy visual-memory-test - show proper description
            const itemCount = parameters?.itemCount;
            if (itemCount) {
                return `Запомнить последовательность из ${itemCount} элементов`;
            }
            return `Достигнуть ${requiredResult.minValue}% точности`;
        }
        case 'completion': {
            // For fly-test, show the target attempts
            const attempts = parameters?.attempts;
            if (attempts) {
                return `Найти муху ${attempts} раз`;
            }
            // For pairs-test, show the target pair count
            const pairCount = parameters?.pairCount;
            if (pairCount) {
                return `Запомнить ${pairCount} пар`;
            }
            // For visual-memory-test, show the target item count
            const itemCount = parameters?.itemCount;
            if (itemCount) {
                return `Запомнить последовательность из ${itemCount} элементов`;
            }
            // For sequence-test, show the target length
            const startLength = parameters?.startLength;
            if (startLength) {
                return `Найти числа от 1 до ${startLength}`;
            }
            const timeLimit = parameters?.timeLimit;
            if (timeLimit) {
                const minutes = Math.floor(Number(timeLimit) / 60);
                const seconds = Number(timeLimit) % 60;
                if (minutes > 0 && seconds > 0) {
                    return `Завершить за ${minutes} мин ${seconds} сек`;
                } else if (minutes > 0) {
                    return `Завершить за ${minutes} мин`;
                } else {
                    return `Завершить за ${timeLimit} сек`;
                }
            }
            return 'Завершить упражнение';
        }
        case 'time_only': {
            const duration = parameters?.duration;
            if (duration) {
                // Duration is already in seconds
                const totalSeconds = Math.round(Number(duration));
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                let timeStr = '';
                if (minutes > 0 && seconds > 0) {
                    timeStr = `${minutes} мин ${seconds} сек`;
                } else if (minutes > 0) {
                    timeStr = `${minutes} мин`;
                } else {
                    timeStr = `${totalSeconds} сек`;
                }
                return `Лимит времени: ${timeStr}`;
            }
            return 'Завершить упражнение';
        }
        case 'min_moves': {
            // For tower-of-hanoi, calculate optimal moves from diskCount
            const diskCount = parameters?.diskCount;
            if (diskCount) {
                const optimalMoves = Math.pow(2, Number(diskCount)) - 1;
                return `Завершить за ${optimalMoves} ходов`;
            }
            return 'Завершить головоломку';
        }
        default: {
            // Fallback: if diskCount exists, show moves goal (for Tower of Hanoi with old type)
            const diskCount = parameters?.diskCount;
            if (diskCount) {
                const optimalMoves = Math.pow(2, Number(diskCount)) - 1;
                return `Завершить за ${optimalMoves} ходов`;
            }
            return 'Выполнить упражнение';
        }
    }
}

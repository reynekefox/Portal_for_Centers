import { useState, useEffect, useCallback } from 'react';

/**
 * Lesson configuration passed from the Portal
 */
export interface LessonConfig {
    // Universal game settings
    speed?: number;
    fontSize?: number;
    showClaps?: boolean;
    duration?: number; // in seconds

    // N-Back specific settings
    n?: number;
    intervalMs?: number;
    mode?: string; // "letters" | "shapes" | "standard" | "red-black"

    // Schulte Table settings
    gridSize?: number;
    showHints?: boolean;

    // Correction Test settings
    signCount?: number;

    // Speed Reading settings
    letterCount?: number;

    // Generic settings map (for any additional game config)
    settings?: Record<string, unknown>;

    // Lesson metadata
    lessonMode?: boolean;
    assignmentId?: number;
    exerciseId?: number;
    callbackUrl?: string;
}

/**
 * Parse lesson config from URL parameter
 */
function parseConfigFromUrl(): LessonConfig | null {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const configBase64 = urlParams.get('config');

        if (!configBase64) {
            return null;
        }

        const configJson = decodeURIComponent(atob(configBase64));
        return JSON.parse(configJson) as LessonConfig;
    } catch (err) {
        console.error('[LessonConfig] Failed to parse config from URL:', err);
        return null;
    }
}

/**
 * Send game results to the callback URL
 */
async function sendResults(callbackUrl: string, data: {
    assignment_id: number;
    exercise_id: number;
    result: Record<string, unknown>;
}): Promise<boolean> {
    try {
        const response = await fetch(callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.ok;
    } catch (err) {
        console.error('[LessonConfig] Failed to send results:', err);
        return false;
    }
}

/**
 * Hook to use lesson configuration in game components
 * 
 * @example
 * const { config, isLessonMode, applySettings, completeExercise } = useLessonConfig();
 * 
 * // Apply settings on mount
 * useEffect(() => {
 *   if (config) {
 *     setSpeed(config.speed ?? defaultSpeed);
 *   }
 * }, [config]);
 * 
 * // Call when exercise is completed
 * const handleGameEnd = async (score: number) => {
 *   if (isLessonMode) {
 *     await completeExercise({ score, time: elapsedTime });
 *   }
 * };
 */
export function useLessonConfig() {
    const [config, setConfig] = useState<LessonConfig | null>(null);
    const [isLessonMode, setIsLessonMode] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isTimeUp, setIsTimeUp] = useState(false);

    // Parse config on mount
    useEffect(() => {
        const parsedConfig = parseConfigFromUrl();
        if (parsedConfig) {
            setConfig(parsedConfig);
            setIsLessonMode(parsedConfig.lessonMode === true);

            if (parsedConfig.duration && parsedConfig.duration > 0) {
                setTimeRemaining(parsedConfig.duration);
            }
        }
    }, []);

    // Countdown timer for duration limit
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) {
            if (timeRemaining === 0) {
                setIsTimeUp(true);
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    setIsTimeUp(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Complete exercise and send results
    const completeExercise = useCallback(async (result: Record<string, unknown>) => {
        if (!config?.callbackUrl || !config.assignmentId || !config.exerciseId) {
            console.warn('[LessonConfig] Cannot complete exercise: missing config');
            return false;
        }

        const success = await sendResults(config.callbackUrl, {
            assignment_id: config.assignmentId,
            exercise_id: config.exerciseId,
            result,
        });

        if (success) {
            // Close window after successful submission
            setTimeout(() => {
                window.close();
            }, 1500);
        }

        return success;
    }, [config]);

    // Apply settings helper
    const getInitialSettings = useCallback(<T extends Record<string, unknown>>(defaults: T): T => {
        if (!config) return defaults;

        const result = { ...defaults };

        if (config.speed !== undefined && 'speed' in result) {
            (result as Record<string, unknown>).speed = config.speed;
        }
        if (config.fontSize !== undefined && 'fontSize' in result) {
            (result as Record<string, unknown>).fontSize = config.fontSize;
        }
        if (config.showClaps !== undefined && 'showClaps' in result) {
            (result as Record<string, unknown>).showClaps = config.showClaps;
        }

        return result;
    }, [config]);

    return {
        config,
        isLessonMode,
        timeRemaining,
        isTimeUp,
        completeExercise,
        getInitialSettings,
    };
}

export default useLessonConfig;

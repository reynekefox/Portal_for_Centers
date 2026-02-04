import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
    ArrowLeft, Play, Square, RotateCcw, Settings, HelpCircle, X,
    Timer, ArrowRight, Eye
} from "lucide-react";
import { useLockedParams } from "@/hooks/useLockedParams";

type Phase = 'idle' | 'playing' | 'result';

interface Stimulus {
    position: number;      // 0-8 for 3x3 grid
    color: string;         // hex color
    sound: string;         // letter
    soundFile: string;     // audio filename
    shape: number;         // shape index
}

interface GameStats {
    positionHits: number;
    positionMisses: number;
    positionFalseAlarms: number;
    colorHits: number;
    colorMisses: number;
    colorFalseAlarms: number;
    soundHits: number;
    soundMisses: number;
    soundFalseAlarms: number;
    shapeHits: number;
    shapeMisses: number;
    shapeFalseAlarms: number;
}

const COLORS = [
    '#EF4444', // red
    '#3B82F6', // blue
    '#22C55E', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
];

// Geometric shapes as SVG paths (viewBox 0 0 100 100)
const SHAPES = [
    { name: 'square', path: 'M10,10 L90,10 L90,90 L10,90 Z' },
    { name: 'circle', path: 'M50,5 A45,45 0 1,1 50,95 A45,45 0 1,1 50,5' },
    { name: 'triangle', path: 'M50,5 L95,90 L5,90 Z' },
    { name: 'diamond', path: 'M50,5 L95,50 L50,95 L5,50 Z' },
    { name: 'pentagon', path: 'M50,5 L95,38 L77,90 L23,90 L5,38 Z' },
    { name: 'hexagon', path: 'M25,10 L75,10 L95,50 L75,90 L25,90 L5,50 Z' },
    { name: 'star', path: 'M50,5 L61,35 L95,35 L68,55 L79,90 L50,70 L21,90 L32,55 L5,35 L39,35 Z' },
    { name: 'heart', path: 'M50,88 C20,60 5,40 5,25 A20,20 0 0,1 50,25 A20,20 0 0,1 95,25 C95,40 80,60 50,88 Z' },
    { name: 'cross', path: 'M35,10 L65,10 L65,35 L90,35 L90,65 L65,65 L65,90 L35,90 L35,65 L10,65 L10,35 L35,35 Z' },
    { name: 'arrow', path: 'M50,5 L90,45 L65,45 L65,95 L35,95 L35,45 L10,45 Z' },
    { name: 'oval', path: 'M50,10 A35,40 0 1,1 50,90 A35,40 0 1,1 50,10' },
];

// Letter to filename mapping for audio playback
const LETTERS: { letter: string; file: string }[] = [
    { letter: 'А', file: 'a' },
    { letter: 'Б', file: 'b' },
    { letter: 'В', file: 'v' },
    { letter: 'Г', file: 'g' },
    { letter: 'Д', file: 'd' },
    { letter: 'Е', file: 'e' },
    { letter: 'Ж', file: 'zh' },
    { letter: 'З', file: 'z' },
    { letter: 'И', file: 'i' },
    { letter: 'К', file: 'k' },
    { letter: 'Л', file: 'l' },
    { letter: 'М', file: 'm' },
    { letter: 'Н', file: 'n' },
    { letter: 'О', file: 'o' },
    { letter: 'П', file: 'p' },
    { letter: 'Р', file: 'r' },
    { letter: 'С', file: 's' },
    { letter: 'Т', file: 't' },
    { letter: 'У', file: 'u' },
    { letter: 'Ф', file: 'f' },
    { letter: 'Х', file: 'h' },
    { letter: 'Ц', file: 'ts' },
];

export default function NBackPicture() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('n-back-picture');

    // Settings
    const [n, setN] = useState(2);
    const [intervalMs, setIntervalMs] = useState(2500);
    const [duration, setDuration] = useState(120);

    // Mode toggles
    const [positionEnabled, setPositionEnabled] = useState(true);
    const [colorEnabled, setColorEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [shapeEnabled, setShapeEnabled] = useState(false);

    // Game state
    const [phase, setPhase] = useState<Phase>('idle');
    const [sequence, setSequence] = useState<Stimulus[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
    const [timeLeft, setTimeLeft] = useState(120);
    const [stats, setStats] = useState<GameStats>({
        positionHits: 0, positionMisses: 0, positionFalseAlarms: 0,
        colorHits: 0, colorMisses: 0, colorFalseAlarms: 0,
        soundHits: 0, soundMisses: 0, soundFalseAlarms: 0,
        shapeHits: 0, shapeMisses: 0, shapeFalseAlarms: 0,
    });

    // Track button presses per stimulus
    const [responded, setResponded] = useState({
        position: false, color: false, sound: false, shape: false
    });

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.n !== undefined) setN(Number(lockedParameters.n));
            if (lockedParameters.intervalMs !== undefined) setIntervalMs(Number(lockedParameters.intervalMs));
            if (lockedParameters.duration !== undefined) setDuration(Number(lockedParameters.duration));
            if (lockedParameters.positionEnabled !== undefined) setPositionEnabled(lockedParameters.positionEnabled === 'true' || lockedParameters.positionEnabled === true);
            if (lockedParameters.colorEnabled !== undefined) setColorEnabled(lockedParameters.colorEnabled === 'true' || lockedParameters.colorEnabled === true);
            if (lockedParameters.soundEnabled !== undefined) setSoundEnabled(lockedParameters.soundEnabled === 'true' || lockedParameters.soundEnabled === true);
        }
    }, [isLocked, lockedParameters]);

    // Play letter audio from pre-recorded files
    const playLetterAudio = (letterFile: string) => {
        if (!soundEnabled) return;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        audioRef.current = new Audio(`/audio/letters/${letterFile}.mp3`);
        audioRef.current.play().catch(console.error);
    };

    // Generate next stimulus
    const generateStimulus = useCallback((): Stimulus => {
        const shouldMatchPosition = positionEnabled && Math.random() < 0.3 && sequence.length >= n;
        const shouldMatchColor = colorEnabled && Math.random() < 0.3 && sequence.length >= n;
        const shouldMatchSound = soundEnabled && Math.random() < 0.3 && sequence.length >= n;
        const shouldMatchShape = shapeEnabled && Math.random() < 0.3 && sequence.length >= n;

        // Use fixed values when mode is disabled
        let position = positionEnabled ? Math.floor(Math.random() * 9) : 4; // center
        let color = colorEnabled ? COLORS[Math.floor(Math.random() * COLORS.length)] : '#3B82F6'; // blue
        let soundItem = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        let sound = soundItem.letter;
        let soundFile = soundItem.file;
        let shape = shapeEnabled ? Math.floor(Math.random() * SHAPES.length) : 0; // square

        if (sequence.length >= n) {
            const nBack = sequence[sequence.length - n];

            if (positionEnabled) {
                if (shouldMatchPosition) {
                    position = nBack.position;
                } else if (position === nBack.position) {
                    position = (position + 1) % 9;
                }
            }
        }

        // Prevent position from repeating on consecutive moves (only if enabled)
        if (positionEnabled && sequence.length > 0) {
            const lastStimulus = sequence[sequence.length - 1];
            if (position === lastStimulus.position) {
                // Pick a different position
                const availablePositions = Array.from({ length: 9 }, (_, i) => i).filter(p => p !== lastStimulus.position);
                position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            }
        }

        if (sequence.length >= n) {
            const nBack = sequence[sequence.length - n];

            if (colorEnabled) {
                if (shouldMatchColor) {
                    color = nBack.color;
                } else if (color === nBack.color) {
                    const otherColors = COLORS.filter(c => c !== nBack.color);
                    color = otherColors[Math.floor(Math.random() * otherColors.length)];
                }
            }

            if (shouldMatchSound) {
                sound = nBack.sound;
                soundFile = LETTERS.find(l => l.letter === sound)?.file || soundFile;
            } else if (sound === nBack.sound) {
                const otherSounds = LETTERS.filter(l => l.letter !== nBack.sound);
                const picked = otherSounds[Math.floor(Math.random() * otherSounds.length)];
                sound = picked.letter;
                soundFile = picked.file;
            }

            // Shape matching (only if enabled)
            if (shapeEnabled) {
                if (shouldMatchShape) {
                    shape = nBack.shape;
                } else if (shape === nBack.shape) {
                    const otherShapes = Array.from({ length: SHAPES.length }, (_, i) => i).filter(s => s !== nBack.shape);
                    shape = otherShapes[Math.floor(Math.random() * otherShapes.length)];
                }
            }
        }

        return { position, color, sound, soundFile, shape };
    }, [n, sequence, positionEnabled, colorEnabled, soundEnabled, shapeEnabled]);

    // Check misses for previous stimulus
    const checkMisses = useCallback(() => {
        if (currentIndex < n) return;

        const current = sequence[currentIndex];
        const nBack = sequence[currentIndex - n];

        if (positionEnabled && !responded.position && current.position === nBack.position) {
            setStats(prev => ({ ...prev, positionMisses: prev.positionMisses + 1 }));
        }
        if (colorEnabled && !responded.color && current.color === nBack.color) {
            setStats(prev => ({ ...prev, colorMisses: prev.colorMisses + 1 }));
        }
        if (soundEnabled && !responded.sound && current.sound === nBack.sound) {
            setStats(prev => ({ ...prev, soundMisses: prev.soundMisses + 1 }));
        }
        if (shapeEnabled && !responded.shape && current.shape === nBack.shape) {
            setStats(prev => ({ ...prev, shapeMisses: prev.shapeMisses + 1 }));
        }
    }, [currentIndex, n, sequence, responded, positionEnabled, colorEnabled, soundEnabled, shapeEnabled]);

    // Handle button clicks
    const handleClick = (mode: 'position' | 'color' | 'sound' | 'shape') => {
        if (phase !== 'playing' || currentIndex < n || responded[mode]) return;

        setResponded(prev => ({ ...prev, [mode]: true }));

        const current = sequence[currentIndex];
        const nBack = sequence[currentIndex - n];
        let isMatch = false;

        switch (mode) {
            case 'position':
                isMatch = current.position === nBack.position;
                if (isMatch) {
                    setStats(prev => ({ ...prev, positionHits: prev.positionHits + 1 }));
                } else {
                    setStats(prev => ({ ...prev, positionFalseAlarms: prev.positionFalseAlarms + 1 }));
                }
                break;
            case 'color':
                isMatch = current.color === nBack.color;
                if (isMatch) {
                    setStats(prev => ({ ...prev, colorHits: prev.colorHits + 1 }));
                } else {
                    setStats(prev => ({ ...prev, colorFalseAlarms: prev.colorFalseAlarms + 1 }));
                }
                break;
            case 'sound':
                isMatch = current.sound === nBack.sound;
                if (isMatch) {
                    setStats(prev => ({ ...prev, soundHits: prev.soundHits + 1 }));
                } else {
                    setStats(prev => ({ ...prev, soundFalseAlarms: prev.soundFalseAlarms + 1 }));
                }
                break;
            case 'shape':
                isMatch = current.shape === nBack.shape;
                if (isMatch) {
                    setStats(prev => ({ ...prev, shapeHits: prev.shapeHits + 1 }));
                } else {
                    setStats(prev => ({ ...prev, shapeFalseAlarms: prev.shapeFalseAlarms + 1 }));
                }
                break;
        }
    };

    // Start game
    const startGame = () => {
        setSequence([]);
        setCurrentIndex(-1);
        setCurrentStimulus(null);
        setTimeLeft(duration);
        setStats({
            positionHits: 0, positionMisses: 0, positionFalseAlarms: 0,
            colorHits: 0, colorMisses: 0, colorFalseAlarms: 0,
            soundHits: 0, soundMisses: 0, soundFalseAlarms: 0,
            shapeHits: 0, shapeMisses: 0, shapeFalseAlarms: 0,
        });
        setResponded({ position: false, color: false, sound: false, shape: false });
        setPhase('playing');
    };

    // Stop game
    const stopGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        setPhase('idle');
        setCurrentStimulus(null);
    };

    // Finish game
    const finishGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        setPhase('result');
    }, []);

    // Timer countdown
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [phase]);

    // Auto-finish when time runs out
    useEffect(() => {
        if (phase === 'playing' && timeLeft === 0) {
            finishGame();
        }
    }, [phase, timeLeft, finishGame]);

    // Game loop
    useEffect(() => {
        if (phase !== 'playing') return;

        const step = () => {
            checkMisses();

            const newStimulus = generateStimulus();
            setSequence(prev => [...prev, newStimulus]);
            setCurrentStimulus(newStimulus);
            setCurrentIndex(prev => prev + 1);
            setResponded({ position: false, color: false, sound: false, shape: false });

            if (soundEnabled && newStimulus.soundFile) {
                playLetterAudio(newStimulus.soundFile);
            }
        };

        // Initial step
        if (currentIndex === -1) {
            step();
        }

        gameLoopRef.current = setInterval(step, intervalMs);

        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [phase, intervalMs, generateStimulus, currentIndex, checkMisses, soundEnabled]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (phase !== 'playing') return;
            switch (e.code) {
                case 'KeyA': handleClick('position'); break;
                case 'KeyS': handleClick('color'); break;
                case 'KeyL': handleClick('sound'); break;
                case 'KeyD': handleClick('shape'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, handleClick]);

    // Calculate accuracy
    const getAccuracy = () => {
        let totalHits = 0, totalEvents = 0;
        if (positionEnabled) {
            totalHits += stats.positionHits;
            totalEvents += stats.positionHits + stats.positionMisses + stats.positionFalseAlarms;
        }
        if (colorEnabled) {
            totalHits += stats.colorHits;
            totalEvents += stats.colorHits + stats.colorMisses + stats.colorFalseAlarms;
        }
        if (soundEnabled) {
            totalHits += stats.soundHits;
            totalEvents += stats.soundHits + stats.soundMisses + stats.soundFalseAlarms;
        }
        if (shapeEnabled) {
            totalHits += stats.shapeHits;
            totalEvents += stats.shapeHits + stats.shapeMisses + stats.shapeFalseAlarms;
        }
        return totalEvents > 0 ? Math.round((totalHits / totalEvents) * 100) : 0;
    };

    const accuracy = getAccuracy();
    const requiredAccuracy = requiredResult?.minValue || 70;
    const passed = accuracy >= requiredAccuracy;

    // Count enabled modes
    const enabledModes = [positionEnabled, colorEnabled, soundEnabled, shapeEnabled].filter(Boolean).length;
    const modeLabel = enabledModes === 1 ? 'Single' : enabledModes === 2 ? 'Dual' : enabledModes === 3 ? 'Triple' : enabledModes === 4 ? 'Quad' : 'N';

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle component - standard slider style
    const Toggle = ({ enabled, onToggle, label, disabled = false }: { enabled: boolean; onToggle: () => void; label: string; disabled?: boolean }) => (
        <div
            className={`flex items-center justify-between w-full py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={disabled ? undefined : onToggle}
        >
            <span className="text-gray-700">{label}</span>
            <div className={`relative w-12 h-7 rounded-full transition-all ${enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={backPath}>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">N-back 2</h1>
                        {phase === 'playing' && (
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                                {modeLabel} {n}-back
                            </span>
                        )}
                    </div>
                    <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                        <HelpCircle size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar - Settings */}
                <div className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
                    {/* Start/Stop Button */}
                    <button
                        onClick={phase === 'playing' ? stopGame : startGame}
                        disabled={enabledModes === 0}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase === 'playing'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : enabledModes === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                    >
                        {phase === 'playing' ? <Square size={18} /> : <Play size={18} />}
                        {phase === 'playing' ? 'Остановить' : 'Начать'}
                    </button>

                    {/* Timer during game */}
                    {phase === 'playing' && (
                        <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3">
                            <Timer size={20} className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-600'} />
                            <span className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-800'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}

                    {/* Settings */}
                    {!isLocked && phase === 'idle' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* N Level */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Уровень N</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setN(Math.max(1, n - 1))}
                                        disabled={n <= 1}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800">{n}</span>
                                    <button
                                        onClick={() => setN(Math.min(5, n + 1))}
                                        disabled={n >= 5}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Speed */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Скорость (сек)</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setIntervalMs(Math.max(1000, intervalMs - 500))}
                                        disabled={intervalMs <= 1000}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800">{(intervalMs / 1000).toFixed(1)}</span>
                                    <button
                                        onClick={() => setIntervalMs(Math.min(5000, intervalMs + 500))}
                                        disabled={intervalMs >= 5000}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Mode Toggles */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-500 block mb-2">Режимы</label>
                                <Toggle enabled={positionEnabled} onToggle={() => setPositionEnabled(!positionEnabled)} label="Позиция (A)" />
                                <Toggle enabled={colorEnabled} onToggle={() => setColorEnabled(!colorEnabled)} label="Цвет (S)" />
                                <Toggle enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} label="Звук (L)" />
                                <Toggle enabled={shapeEnabled} onToggle={() => setShapeEnabled(!shapeEnabled)} label="Фигура (D)" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="text-center">
                            <div className="text-6xl mb-4">🧠</div>
                            <div className="text-xl text-gray-500">
                                {enabledModes === 0 ? 'Включите хотя бы один режим' : `${modeLabel} ${n}-back`}
                            </div>
                            <div className="text-gray-400 mt-2">
                                Нажмите "Начать"
                            </div>
                        </div>
                    )}

                    {/* Playing State */}
                    {phase === 'playing' && currentStimulus && (
                        <div className="flex flex-col items-center gap-6">
                            {/* 3x3 Grid */}
                            <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-24 h-24 rounded-lg flex items-center justify-center transition-all ${i === currentStimulus.position ? '' : 'bg-gray-100'
                                            }`}
                                        style={i === currentStimulus.position ? { backgroundColor: colorEnabled ? currentStimulus.color : '#3B82F6' } : {}}
                                    >
                                        {i === currentStimulus.position && shapeEnabled && (
                                            <svg viewBox="0 0 100 100" className="w-16 h-16">
                                                <path d={SHAPES[currentStimulus.shape].path} fill="white" />
                                            </svg>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Response Buttons */}
                            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                                {positionEnabled && (
                                    <button
                                        onClick={() => handleClick('position')}
                                        disabled={currentIndex < n || responded.position}
                                        className={`py-4 px-2 rounded-xl font-bold text-sm transition-all ${responded.position
                                            ? 'bg-gray-300 text-gray-500'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95'
                                            }`}
                                    >
                                        ПОЗИЦИЯ
                                        <div className="text-xs opacity-70">(A)</div>
                                    </button>
                                )}
                                {colorEnabled && (
                                    <button
                                        onClick={() => handleClick('color')}
                                        disabled={currentIndex < n || responded.color}
                                        className={`py-4 px-2 rounded-xl font-bold text-sm transition-all ${responded.color
                                            ? 'bg-gray-300 text-gray-500'
                                            : 'bg-purple-500 hover:bg-purple-600 text-white active:scale-95'
                                            }`}
                                    >
                                        ЦВЕТ
                                        <div className="text-xs opacity-70">(S)</div>
                                    </button>
                                )}
                                {soundEnabled && (
                                    <button
                                        onClick={() => handleClick('sound')}
                                        disabled={currentIndex < n || responded.sound}
                                        className={`py-4 px-2 rounded-xl font-bold text-sm transition-all ${responded.sound
                                            ? 'bg-gray-300 text-gray-500'
                                            : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                                            }`}
                                    >
                                        ЗВУК
                                        <div className="text-xs opacity-70">(L)</div>
                                    </button>
                                )}
                                {shapeEnabled && (
                                    <button
                                        onClick={() => handleClick('shape')}
                                        disabled={currentIndex < n || responded.shape}
                                        className={`py-4 px-2 rounded-xl font-bold text-sm transition-all ${responded.shape
                                            ? 'bg-gray-300 text-gray-500'
                                            : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
                                            }`}
                                    >
                                        ФИГУРА
                                        <div className="text-xs opacity-70">(D)</div>
                                    </button>
                                )}
                            </div>

                            {/* Hint */}
                            <div className="text-gray-400 text-sm">
                                Нажмите кнопку, если совпадает с {n} шагов назад
                            </div>
                        </div>
                    )}

                    {/* Result State */}
                    {phase === 'result' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-5xl mb-2">
                                {passed ? '🎉' : '💪'}
                            </div>
                            <div className="text-3xl font-bold text-gray-800">
                                Точность: {accuracy}%
                            </div>
                            <div className="text-gray-500">
                                Требуется: {requiredAccuracy}%
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Ещё раз
                                </button>
                                {isLocked && passed && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => lockedCompleteExercise({ accuracy }, true)}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
                                        >
                                            {hasNextExercise ? 'К следующему →' : 'Готово ✓'}
                                            <ArrowRight size={18} />
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Stats */}
                {(phase === 'playing' || phase === 'result') && (
                    <div className="w-64 bg-white border-l border-gray-200 p-4">
                        <div className="font-medium text-gray-700 mb-4">Статистика</div>

                        <div className="space-y-3">
                            {positionEnabled && (
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <div className="text-blue-600 text-sm font-medium mb-1">Позиция</div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">✓ {stats.positionHits}</span>
                                        <span className="text-red-500">✗ {stats.positionFalseAlarms}</span>
                                        <span className="text-orange-500">○ {stats.positionMisses}</span>
                                    </div>
                                </div>
                            )}
                            {colorEnabled && (
                                <div className="p-3 bg-purple-50 rounded-xl">
                                    <div className="text-purple-600 text-sm font-medium mb-1">Цвет</div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">✓ {stats.colorHits}</span>
                                        <span className="text-red-500">✗ {stats.colorFalseAlarms}</span>
                                        <span className="text-orange-500">○ {stats.colorMisses}</span>
                                    </div>
                                </div>
                            )}

                            {soundEnabled && (
                                <div className="p-3 bg-orange-50 rounded-xl">
                                    <div className="text-orange-600 text-sm font-medium mb-1">Звук</div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">✓ {stats.soundHits}</span>
                                        <span className="text-red-500">✗ {stats.soundFalseAlarms}</span>
                                        <span className="text-orange-500">○ {stats.soundMisses}</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-indigo-50 rounded-xl">
                                <div className="text-indigo-600 text-sm font-medium mb-1">Общая точность</div>
                                <div className="text-2xl font-bold text-indigo-600">{accuracy}%</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Инструкция</h2>
                            <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-gray-600">
                            <p><strong>Цель:</strong> Тренировка рабочей памяти.</p>
                            <p><strong>Как играть:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Наблюдайте за стимулами на экране</li>
                                <li>Если позиция/цвет/звук совпадает с тем, что было N шагов назад — нажмите соответствующую кнопку</li>
                                <li>Используйте клавиши A, S, L для быстрого ответа</li>
                            </ul>
                            <p><strong>Режимы:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Позиция (A)</strong> — где появился квадрат</li>
                                <li><strong>Цвет (S)</strong> — какого цвета квадрат</li>
                                <li><strong>Звук (L)</strong> — какая буква прозвучала</li>
                            </ul>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
                            >
                                Понятно
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

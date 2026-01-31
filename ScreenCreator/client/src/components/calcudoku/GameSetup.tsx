import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, HelpCircle, X } from 'lucide-react';
import type { Operation } from '@/lib/calcudoku/types';

interface GameSetupProps {
    onStart: (config: { size: number; ops: Operation[] }) => void;
    isLocked?: boolean;
    initialSize?: number;
    initialOps?: Operation[];
    timeLimit?: number; // in seconds
    backPath?: string;
}

const sizeOptions = [3, 4, 5, 6, 7, 8, 9];

const opPresets = [
    { label: '+', ops: ['+'] as Operation[], class: 'bg-white border border-gray-200 text-gray-700' },
    { label: '+ -', ops: ['+', '-'] as Operation[], class: 'bg-white border border-gray-200 text-gray-700' },
    { label: '× ÷', ops: ['*', '/'] as Operation[], class: 'bg-white border border-gray-200 text-gray-700' },
    { label: '+ − × ÷', ops: ['+', '-', '*', '/'] as Operation[], class: 'bg-white border border-gray-200 text-gray-700 text-lg' },
];

// Find matching preset label from ops array
const findPresetLabel = (ops: Operation[]): string => {
    const sorted = [...ops].sort().join('');
    for (const preset of opPresets) {
        if ([...preset.ops].sort().join('') === sorted) return preset.label;
    }
    return '+ -';
};

// Format time in seconds to MM:SS
const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function GameSetup({ onStart, isLocked = false, initialSize = 4, initialOps = ['+', '-'], timeLimit = 60, backPath = '/' }: GameSetupProps) {
    const [selectedSize, setSelectedSize] = useState(initialSize);
    const [selectedOpPreset, setSelectedOpPreset] = useState(findPresetLabel(initialOps));
    const [showInstructions, setShowInstructions] = useState(false);

    const startGame = () => {
        const preset = opPresets.find(p => p.label === selectedOpPreset);
        onStart({
            size: selectedSize,
            ops: preset ? preset.ops : ['+']
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 font-sans relative">
            {/* Back Button */}
            <div className="absolute top-4 left-4">
                <Link href={backPath || '/'}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                </Link>
            </div>

            {/* Help Button */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setShowInstructions(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    title="Как играть"
                >
                    <HelpCircle size={48} className="text-gray-600" />
                </button>
            </div>

            <h1 className="text-4xl font-extrabold text-gray-800 mb-8 uppercase tracking-tight">Калькудоку</h1>

            {/* Settings - Hidden when locked */}
            {!isLocked ? (
                <>
                    {/* Step 1: Size */}
                    <h2 className="text-gray-400 font-semibold mb-4 text-sm tracking-wide">ШАГ 1: РАЗМЕР ПОЛЯ</h2>

                    <div className="relative w-64 h-64 mb-12">
                        {/* Central Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-white rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-gray-400 text-[10px] font-bold">ВЫБРАНО</span>
                                <span className="text-4xl font-bold text-gray-500">{selectedSize}x{selectedSize}</span>
                            </div>
                        </div>

                        {/* Radial Size Buttons */}
                        <div className="absolute inset-0">
                            {sizeOptions.map((s, i) => {
                                const angleDeg = i * (360 / sizeOptions.length) - 90;
                                const angleRad = (angleDeg * Math.PI) / 180;
                                const x = Math.cos(angleRad) * 100;
                                const y = Math.sin(angleRad) * 100;

                                return (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSize(s)}
                                        className={`absolute w-16 h-16 rounded-full flex items-center justify-center font-bold shadow-md transition-transform hover:scale-110 border-2 border-blue-500 ${selectedSize === s ? 'bg-blue-500 text-white ring-4 ring-blue-200 scale-110' : 'bg-white text-blue-700'
                                            }`}
                                        style={{
                                            top: `calc(50% + ${y}px - 32px)`,
                                            left: `calc(50% + ${x}px - 32px)`
                                        }}
                                    >
                                        {s}x{s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Operations */}
                    <h2 className="text-gray-400 font-semibold mb-4 text-sm tracking-wide mt-8">ШАГ 2: ОПЕРАЦИИ</h2>
                    <div className="grid grid-cols-4 gap-3 w-full max-w-sm mb-8">
                        {opPresets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => setSelectedOpPreset(preset.label)}
                                className={`aspect-square flex flex-col items-center justify-center font-bold rounded-lg shadow-sm transition-all hover:bg-gray-50 active:scale-95 ${preset.class
                                    } ${selectedOpPreset === preset.label ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-700' : ''}`}
                            >
                                {preset.label === '+ − × ÷' ? (
                                    <div className="grid grid-cols-2 gap-1 leading-none text-2xl">
                                        <span>+</span><span>−</span>
                                        <span>×</span><span>÷</span>
                                    </div>
                                ) : (
                                    <span className={preset.label.length > 5 ? 'text-lg' : 'text-2xl'}>{preset.label}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                /* Locked: Show goal banner centered */
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                        <p className="text-sm opacity-90">Цель упражнения:</p>
                        <p className="text-xl font-bold">Решить головоломку {selectedSize}×{selectedSize}</p>
                        <p className="text-sm opacity-90 mt-2">Время: {formatTime(timeLimit)} ({timeLimit} сек)</p>
                    </div>
                    <div className="mt-4 text-gray-500">Нажмите "Начать игру"</div>
                </div>
            )}

            {/* Start */}
            <button
                onClick={startGame}
                className="w-full max-w-sm py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-full shadow-lg transition-transform hover:scale-105"
            >
                НАЧАТЬ ИГРУ
            </button>

            {/* Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Как играть в Калькудоку</h2>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 text-gray-700">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">1. Какие цифры использовать?</h3>
                                <p>Так как поле размером 4x4, ты используешь только цифры 1, 2, 3, 4. (Если поле будет 6x6, то цифры от 1 до 6).</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">2. Главное правило (как в Судоку)</h3>
                                <p className="mb-2">В каждой строке (горизонтально) и в каждом столбце (вертикально) цифры не должны повторяться.</p>
                                <p className="text-green-600">✅ Правильно: 1, 2, 3, 4</p>
                                <p className="text-red-600">❌ Ошибка: 1, 2, 2, 4 (две двойки нельзя!)</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">3. Математические блоки (жирные рамки)</h3>
                                <p className="mb-3">Поле разбито на зоны. В углу зоны стоит число и знак. Цифры внутри зоны должны дать это число, если применить к ним действие.</p>

                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="font-semibold">Просто цифра (без знака):</p>
                                        <p className="text-gray-600">Подарок! Просто впиши эту цифру в клетку.</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">➕ Сложение (например, «7+»):</p>
                                        <p className="text-gray-600">Сумма цифр должна быть равна 7. Пример: 3 и 4.</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">✖️ Умножение (например, «12×»):</p>
                                        <p className="text-gray-600">Произведение цифр должно быть равно 12. Пример: 3 и 4 (3 × 4 = 12).</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">➖ Вычитание (например, «1-»):</p>
                                        <p className="text-gray-600">Разница между цифрами равна 1. Порядок не важен. Пример: 2 и 3 (3 - 2 = 1).</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">➗ Деление (например, «2÷»):</p>
                                        <p className="text-gray-600">Результат деления большего на меньшее равен 2. Пример: 2 и 4 (4 / 2 = 2).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <p className="font-bold text-blue-800">💡 Совет для победы:</p>
                                <p className="text-blue-700">Начинай с одиночных клеток, где ответ известен сразу. А для сложных блоков (типа «2÷») смотри на соседние клетки: если в строке уже есть цифра 4, значит, в блоке «2÷» пару (2, 4) использовать уже нельзя, остается только (1, 2).</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 p-4">
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-all"
                            >
                                Понятно!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

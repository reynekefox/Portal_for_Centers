import { Link } from 'wouter';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { formatRequiredResult } from '@/hooks/useLockedParams';

interface RequiredResult {
    type: string;
    minValue?: number;
}

interface RequiredResultBannerProps {
    requiredResult: RequiredResult | null;
    parameters?: Record<string, unknown>;
    isCompleted?: boolean;
    isSuccess?: boolean;
    completionTime?: string;
    actualValue?: number;
    isLocked?: boolean;
    hasNextExercise?: boolean;
    onComplete?: () => void;
    nextPath?: string;
}

export function RequiredResultBanner({
    requiredResult,
    parameters,
    isCompleted = false,
    isSuccess = false,
    completionTime,
    actualValue,
    isLocked = false,
    hasNextExercise = false,
    onComplete,
    nextPath = '/student-dashboard'
}: RequiredResultBannerProps) {
    if (!requiredResult) return null;

    // After successful completion - show success banner with next button
    if (isCompleted && isSuccess && isLocked) {
        return (
            <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8" />
                            <div className="text-center">
                                <p className="text-lg font-bold">Поздравляем! 🎉</p>
                                {completionTime && (
                                    <p className="text-2xl font-mono font-bold">{completionTime}</p>
                                )}
                                {actualValue !== undefined && requiredResult.minValue && (
                                    <p className="text-sm opacity-90">
                                        ✓ {getSuccessMessage(requiredResult, actualValue)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Link href={nextPath}>
                            <button
                                onClick={onComplete}
                                className="mt-2 px-6 py-3 bg-white text-green-600 font-bold rounded-full inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:bg-green-50"
                            >
                                {hasNextExercise ? 'К следующему упражнению' : 'Завершить занятие'}
                                <ArrowRight size={20} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Before completion - show goal banner
    return (
        <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <p className="text-sm opacity-90">Цель упражнения:</p>
                        <p className="text-lg font-bold">{formatRequiredResult(requiredResult, parameters)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getSuccessMessage(requiredResult: RequiredResult, actualValue: number): string {
    switch (requiredResult.type) {
        case 'max_time':
            return `Вы уложились в ${actualValue} сек (цель: ${requiredResult.minValue} сек)`;
        case 'min_accuracy':
            return `Точность: ${actualValue}% (цель: ${requiredResult.minValue}%)`;
        case 'min_score':
            return `Результат: ${actualValue} (цель: ${requiredResult.minValue})`;
        default:
            return 'Упражнение выполнено!';
    }
}

import { Link } from "wouter";
import { ArrowRight, CheckCircle } from "lucide-react";

interface ExerciseSuccessBannerProps {
    isLocked: boolean;
    isCompleted: boolean;
    isSuccess: boolean; // Did user meet the required result?
    completionTime?: string; // e.g. "00:05"
    requiredResult?: { type: string; minValue?: number } | null;
    actualValue?: number; // The value user achieved (time in seconds, accuracy %, etc.)
}

/**
 * Displays success message and "Next Exercise" button when:
 * - Exercise is from assignment (isLocked)
 * - Exercise is completed
 * - User met the required result (isSuccess)
 */
export function ExerciseSuccessBanner({
    isLocked,
    isCompleted,
    isSuccess,
    completionTime,
    requiredResult,
    actualValue,
}: ExerciseSuccessBannerProps) {
    // Only show when exercise is completed
    if (!isCompleted) return null;

    // Check if user met the goal
    const metGoal = checkGoalMet(requiredResult, actualValue);

    return (
        <div className={`p-6 rounded-lg border-2 text-center ${metGoal ? 'bg-green-100 border-green-500' : 'bg-orange-100 border-orange-400'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className={`w-6 h-6 ${metGoal ? 'text-green-600' : 'text-orange-500'}`} />
                <p className={`text-xl font-bold ${metGoal ? 'text-green-700' : 'text-orange-600'}`}>
                    {metGoal ? 'Поздравляем! 🎉' : 'Упражнение завершено'}
                </p>
            </div>

            {completionTime && (
                <p className={`font-mono text-lg ${metGoal ? 'text-green-600' : 'text-orange-500'}`}>
                    {completionTime}
                </p>
            )}

            {/* Show result comparison */}
            {requiredResult && actualValue !== undefined && (
                <p className={`text-sm mt-2 ${metGoal ? 'text-green-600' : 'text-orange-500'}`}>
                    {getResultMessage(requiredResult, actualValue, metGoal)}
                </p>
            )}

            {/* Next Exercise Button - only for assignment mode */}
            {isLocked && metGoal && (
                <Link href="/student-dashboard">
                    <button className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-xl">
                        К следующему заданию
                        <ArrowRight size={20} />
                    </button>
                </Link>
            )}

            {/* Back to dashboard if failed goal */}
            {isLocked && !metGoal && (
                <div className="mt-4 flex gap-3 justify-center">
                    <Link href="/student-dashboard">
                        <button className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-full transition-all">
                            Назад к занятиям
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}

function checkGoalMet(requiredResult: { type: string; minValue?: number } | null | undefined, actualValue: number | undefined): boolean {
    if (!requiredResult || actualValue === undefined) return true; // No goal = success

    switch (requiredResult.type) {
        case 'max_time':
            return actualValue <= (requiredResult.minValue || Infinity);
        case 'min_accuracy':
        case 'min_score':
            return actualValue >= (requiredResult.minValue || 0);
        case 'completion':
        case 'time_only':
            return true; // Just completing is success
        default:
            return true;
    }
}

function getResultMessage(requiredResult: { type: string; minValue?: number }, actualValue: number, metGoal: boolean): string {
    switch (requiredResult.type) {
        case 'max_time':
            return metGoal
                ? `✓ Вы уложились в ${actualValue} сек (цель: ${requiredResult.minValue} сек)`
                : `✗ Время: ${actualValue} сек (нужно было: ${requiredResult.minValue} сек)`;
        case 'min_accuracy':
            return metGoal
                ? `✓ Точность: ${actualValue}% (цель: ${requiredResult.minValue}%)`
                : `✗ Точность: ${actualValue}% (нужно было: ${requiredResult.minValue}%)`;
        case 'min_score':
            return metGoal
                ? `✓ Результат: ${actualValue} (цель: ${requiredResult.minValue})`
                : `✗ Результат: ${actualValue} (нужно было: ${requiredResult.minValue})`;
        default:
            return '';
    }
}

import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, authApi } from "@/lib/auth-store";
import { formatRequiredResult } from "@/hooks/useLockedParams";
import { ArrowLeft, LogOut, BookOpen, Calendar, Play, CheckCircle, Circle, Lock, BarChart2, Clock, XCircle, TrendingUp, Award } from "lucide-react";

interface Training {
    id: string;
    name: string;
    path: string;
}

interface Exercise {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult: { type: string; minValue?: number };
}

interface Assignment {
    id: number;
    schoolId: number;
    studentId: number;
    title: string;
    scheduledDate: string;
    exercises: Exercise[];
    status: 'pending' | 'in_progress' | 'completed';
}

interface ExerciseResult {
    exerciseIndex: number;
    passed: boolean;
}

type TabType = 'trainings' | 'assignments' | 'statistics';

export default function StudentDashboard() {
    const [, setLocation] = useLocation();
    const { user, logout, isStudent, isLoading: authLoading } = useAuth();

    // Check for ?tab=trainings in URL
    const getInitialTab = (): TabType => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'trainings') return 'trainings';
        return 'assignments';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [assignmentResults, setAssignmentResults] = useState<Record<number, ExerciseResult[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Active assignment execution
    const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (!isStudent()) {
            setLocation('/login');
            return;
        }
        loadData();
    }, [authLoading]);

    const loadData = async () => {
        if (!user?.id) return;
        setIsLoading(true);

        const [trainingsData, assignmentsData] = await Promise.all([
            authApi.getTrainings(),
            authApi.getAssignments({ studentId: user.id })
        ]);

        // Filter trainings by student's allowed games
        const allowedGames = user.allowedGames || [];
        setTrainings(trainingsData.filter((t: Training) => allowedGames.includes(t.id)));
        setAssignments(assignmentsData);

        // Load results for each assignment
        const results: Record<number, ExerciseResult[]> = {};
        for (const assignment of assignmentsData) {
            const res = await authApi.getAssignmentResults(assignment.id);
            results[assignment.id] = res;
        }
        setAssignmentResults(results);

        setIsLoading(false);
    };

    const handleLogout = () => {
        logout();
        setLocation('/');
    };

    const startAssignment = (assignment: Assignment) => {
        const results = assignmentResults[assignment.id] || [];
        // Find first exercise index that doesn't have ANY passed result
        let nextIndex = 0;
        for (let i = 0; i < assignment.exercises.length; i++) {
            // Check if ANY result for this exercise has passed=true
            const hasPassed = results.some(r => r.exerciseIndex === i && r.passed);
            if (!hasPassed) {
                nextIndex = i;
                break;
            }
            // All exercises completed
            if (i === assignment.exercises.length - 1) {
                nextIndex = assignment.exercises.length;
            }
        }
        setActiveAssignment(assignment);
        setCurrentExerciseIndex(nextIndex);
    };

    const getTrainingName = (trainingId: string) => {
        const training = trainings.find(t => t.id === trainingId);
        return training?.name || trainingId;
    };

    const getTrainingPath = (trainingId: string) => {
        const training = trainings.find(t => t.id === trainingId);
        return training?.path || '/';
    };

    const todayAssignments = assignments.filter(a =>
        a.scheduledDate === new Date().toISOString().split('T')[0] && a.status !== 'completed'
    );

    const tabs: { id: TabType; label: string; icon: typeof BookOpen }[] = [
        { id: 'assignments', label: 'Мои занятия', icon: Calendar },
        { id: 'trainings', label: 'Тренировки', icon: BookOpen },
        { id: 'statistics', label: 'Статистика', icon: BarChart2 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                                <ArrowLeft size={24} className="text-gray-600" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Личный кабинет</h1>
                            <p className="text-sm text-gray-500">{user?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <LogOut size={18} />
                        Выйти
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Today's Alert */}
                {todayAssignments.length > 0 && !activeAssignment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <h3 className="font-bold text-blue-800 mb-2">📅 Сегодняшние занятия</h3>
                        <p className="text-blue-600 text-sm">
                            У вас {todayAssignments.length} {todayAssignments.length === 1 ? 'занятие' : 'занятия'} на сегодня
                        </p>
                    </div>
                )}

                {/* Active Assignment Execution */}
                {activeAssignment && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{activeAssignment.title}</h2>
                                <p className="text-gray-500 text-sm">Упражнение {currentExerciseIndex + 1} из {activeAssignment.exercises.length}</p>
                            </div>
                            <button
                                onClick={() => setActiveAssignment(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Progress Bar with Exercise Names */}
                        <div className="mb-6 overflow-x-auto">
                            <div className="flex gap-2 flex-wrap">
                                {activeAssignment.exercises.map((ex, i) => {
                                    const results = assignmentResults[activeAssignment.id] || [];
                                    // Check if ANY result for this exercise has passed
                                    const isPassed = results.some(r => r.exerciseIndex === i && r.passed);
                                    const isCurrent = i === currentExerciseIndex;
                                    const isPending = i > currentExerciseIndex;

                                    return (
                                        <div
                                            key={i}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${isPassed
                                                ? 'bg-green-100 text-green-700 border border-green-300'
                                                : isCurrent
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                }`}
                                            title={getTrainingName(ex.trainingId)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {isPassed && <CheckCircle size={12} />}
                                                {isCurrent && <Play size={12} />}
                                                {isPending && <Lock size={12} />}
                                                <span className="max-w-[80px] truncate">{getTrainingName(ex.trainingId)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Current Exercise */}
                        {currentExerciseIndex < activeAssignment.exercises.length ? (
                            <div className="text-center">
                                <div className="bg-blue-50 rounded-xl p-8 mb-4">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        {getTrainingName(activeAssignment.exercises[currentExerciseIndex].trainingId)}
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        {formatRequiredResult(
                                            activeAssignment.exercises[currentExerciseIndex].requiredResult,
                                            activeAssignment.exercises[currentExerciseIndex].parameters
                                        )}
                                    </p>
                                    <button
                                        onClick={() => {
                                            const exercise = activeAssignment.exercises[currentExerciseIndex];
                                            // Save locked parameters with ALL exercises for proper chain navigation
                                            localStorage.setItem('lockedExerciseParams', JSON.stringify({
                                                trainingId: exercise.trainingId,
                                                parameters: exercise.parameters,
                                                requiredResult: exercise.requiredResult,
                                                assignmentId: activeAssignment.id,
                                                exerciseIndex: currentExerciseIndex,
                                                totalExercises: activeAssignment.exercises.length,
                                                studentId: user?.id,
                                                exercises: activeAssignment.exercises.map(ex => ({
                                                    trainingId: ex.trainingId,
                                                    parameters: ex.parameters,
                                                    requiredResult: ex.requiredResult
                                                }))
                                            }));
                                            setLocation(getTrainingPath(exercise.trainingId));
                                        }}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-medium transition-all"
                                    >
                                        <Play size={20} className="inline mr-2" />
                                        Начать
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Занятие завершено!</h3>
                                <p className="text-gray-500">Отличная работа!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                {
                    !activeAssignment && (
                        <>
                            <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            {isLoading ? (
                                <div className="text-gray-500 text-center py-12">Загрузка...</div>
                            ) : (
                                <>
                                    {/* Assignments Tab */}
                                    {activeTab === 'assignments' && (
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Мои занятия</h2>
                                            {assignments.length === 0 ? (
                                                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                                    <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500">Нет назначенных занятий</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {assignments.map((assignment) => {
                                                        const results = assignmentResults[assignment.id] || [];
                                                        // Count unique exerciseIndex values that have at least one passed result
                                                        const passedIndices = new Set(
                                                            results.filter(r => r.passed).map(r => r.exerciseIndex)
                                                        );
                                                        const completed = passedIndices.size;
                                                        const isToday = assignment.scheduledDate === new Date().toISOString().split('T')[0];

                                                        return (
                                                            <div
                                                                key={assignment.id}
                                                                className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${isToday ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-bold text-gray-800">{assignment.title}</h3>
                                                                            {isToday && (
                                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                                    Сегодня
                                                                                </span>
                                                                            )}
                                                                            {assignment.status === 'completed' && (
                                                                                <CheckCircle size={16} className="text-green-500" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-500">
                                                                            {assignment.scheduledDate}
                                                                            {' · '}
                                                                            {completed}/{assignment.exercises.length} упражнений
                                                                        </p>
                                                                        <p className="text-xs text-gray-400 mt-1 max-w-[80%]">
                                                                            {assignment.exercises.map((ex, i) => (
                                                                                <span key={i}>
                                                                                    {getTrainingName(ex.trainingId)}
                                                                                    {i < assignment.exercises.length - 1 && ' • '}
                                                                                </span>
                                                                            ))}
                                                                        </p>

                                                                        {/* Exercise Progress */}
                                                                        <div className="flex gap-1 mt-2">
                                                                            {assignment.exercises.map((ex, i) => {
                                                                                // Check if ANY result for this exercise has passed
                                                                                const hasPassed = results.some(r => r.exerciseIndex === i && r.passed);
                                                                                return (
                                                                                    <div
                                                                                        key={i}
                                                                                        className="flex items-center gap-1"
                                                                                        title={getTrainingName(ex.trainingId)}
                                                                                    >
                                                                                        {hasPassed ? (
                                                                                            <CheckCircle size={16} className="text-green-500" />
                                                                                        ) : i === completed ? (
                                                                                            <Circle size={16} className="text-blue-500" />
                                                                                        ) : (
                                                                                            <Lock size={16} className="text-gray-300" />
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>

                                                                    {assignment.status !== 'completed' && (
                                                                        <button
                                                                            onClick={() => startAssignment(assignment)}
                                                                            disabled={!isToday}
                                                                            className={`px-4 py-2 rounded-lg transition-all ${isToday
                                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                                            title={!isToday ? 'Доступно только в день занятия' : undefined}
                                                                        >
                                                                            {completed > 0 ? 'Продолжить' : 'Начать'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Trainings Tab */}
                                    {activeTab === 'trainings' && (
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Свободные тренировки</h2>
                                            {trainings.length === 0 ? (
                                                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                                    <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500">Нет доступных тренировок</p>
                                                    <p className="text-sm text-gray-400 mt-2">Школа ещё не назначила вам тренинги</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {trainings.map((training) => (
                                                        <div
                                                            key={training.id}
                                                            onClick={() => {
                                                                // Clear any stale locked params before entering free training mode
                                                                localStorage.removeItem('lockedExerciseParams');
                                                                setLocation(training.path);
                                                            }}
                                                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
                                                        >
                                                            <Play size={24} className="text-blue-600 mb-3" />
                                                            <h3 className="font-bold text-gray-800">{training.name}</h3>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Statistics Tab */}
                                    {activeTab === 'statistics' && (() => {
                                        // Calculate statistics
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);

                                        const completedAssignments = assignments.filter(a => a.status === 'completed').length;
                                        const missedAssignments = assignments.filter(a => {
                                            const scheduled = new Date(a.scheduledDate);
                                            scheduled.setHours(0, 0, 0, 0);
                                            return scheduled < today && a.status !== 'completed';
                                        });
                                        const upcomingAssignments = assignments.filter(a => {
                                            const scheduled = new Date(a.scheduledDate);
                                            scheduled.setHours(0, 0, 0, 0);
                                            return scheduled >= today && a.status !== 'completed';
                                        });

                                        const totalExercises = assignments.reduce((sum, a) => sum + (a.exercises?.length || 0), 0);
                                        const completedExercises = Object.entries(assignmentResults).reduce((sum, [assignmentId, results]) => {
                                            const passedIndices = new Set(results.filter(r => r.passed).map(r => r.exerciseIndex));
                                            return sum + passedIndices.size;
                                        }, 0);
                                        const missedExercises = missedAssignments.reduce((sum, a) => {
                                            const results = assignmentResults[a.id] || [];
                                            const passedIndices = new Set(results.filter(r => r.passed).map(r => r.exerciseIndex));
                                            return sum + (a.exercises?.length || 0) - passedIndices.size;
                                        }, 0);

                                        const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

                                        // Training breakdown
                                        const trainingBreakdown = trainings.map(training => {
                                            let total = 0;
                                            let completed = 0;
                                            assignments.forEach(assignment => {
                                                const exercisesForTraining = assignment.exercises?.filter(e => e.trainingId === training.id) || [];
                                                total += exercisesForTraining.length;
                                                const results = assignmentResults[assignment.id] || [];
                                                exercisesForTraining.forEach((_, idx) => {
                                                    const originalIdx = assignment.exercises?.findIndex(e => e === exercisesForTraining[idx]) || 0;
                                                    if (results.some(r => r.exerciseIndex === originalIdx && r.passed)) {
                                                        completed++;
                                                    }
                                                });
                                            });
                                            return { training, total, completed };
                                        }).filter(t => t.total > 0).sort((a, b) => b.total - a.total);

                                        return (
                                            <div className="space-y-6">
                                                <h2 className="text-2xl font-bold text-gray-800">Моя статистика</h2>

                                                {/* Summary Cards */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                                        <div className="flex items-center gap-2 text-green-700 mb-1">
                                                            <CheckCircle size={18} />
                                                            <span className="text-sm font-medium">Выполнено</span>
                                                        </div>
                                                        <p className="text-3xl font-bold text-green-800">{completedAssignments}</p>
                                                        <p className="text-xs text-green-600">занятий</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                                        <div className="flex items-center gap-2 text-red-700 mb-1">
                                                            <XCircle size={18} />
                                                            <span className="text-sm font-medium">Пропущено</span>
                                                        </div>
                                                        <p className="text-3xl font-bold text-red-800">{missedAssignments.length}</p>
                                                        <p className="text-xs text-red-600">занятий</p>
                                                    </div>
                                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                                                            <Clock size={18} />
                                                            <span className="text-sm font-medium">Впереди</span>
                                                        </div>
                                                        <p className="text-3xl font-bold text-blue-800">{upcomingAssignments.length}</p>
                                                        <p className="text-xs text-blue-600">занятий</p>
                                                    </div>
                                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                                        <div className="flex items-center gap-2 text-purple-700 mb-1">
                                                            <Award size={18} />
                                                            <span className="text-sm font-medium">Всего</span>
                                                        </div>
                                                        <p className="text-3xl font-bold text-purple-800">{assignments.length}</p>
                                                        <p className="text-xs text-purple-600">занятий</p>
                                                    </div>
                                                </div>

                                                {/* Overall Progress */}
                                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <TrendingUp size={20} className="text-blue-600" />
                                                        Общий прогресс
                                                    </h3>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden flex">
                                                            <div
                                                                className="bg-green-500 h-4 transition-all"
                                                                style={{ width: `${completionRate}%` }}
                                                            />
                                                            {missedExercises > 0 && totalExercises > 0 && (
                                                                <div
                                                                    className="bg-red-400 h-4 transition-all"
                                                                    style={{ width: `${(missedExercises / totalExercises) * 100}%` }}
                                                                />
                                                            )}
                                                        </div>
                                                        <span className="text-2xl font-bold text-gray-800">{completionRate}%</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {completedExercises} из {totalExercises} упражнений выполнено
                                                        {missedExercises > 0 && <span className="text-red-600"> ({missedExercises} пропущено)</span>}
                                                    </p>
                                                </div>

                                                {/* Exercise Breakdown */}
                                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                                    <h3 className="font-bold text-gray-800 mb-4">Упражнения</h3>
                                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                                            <p className="text-2xl font-bold text-green-700">{completedExercises}</p>
                                                            <p className="text-xs text-green-600">Выполнено</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                                            <p className="text-2xl font-bold text-red-700">{missedExercises}</p>
                                                            <p className="text-xs text-red-600">Пропущено</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-2xl font-bold text-gray-700">{totalExercises - completedExercises - missedExercises}</p>
                                                            <p className="text-xs text-gray-600">Впереди</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Training Progress */}
                                                {trainingBreakdown.length > 0 && (
                                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                                        <h3 className="font-bold text-gray-800 mb-4">Прогресс по тренингам</h3>
                                                        <div className="space-y-4">
                                                            {trainingBreakdown.map(({ training, total, completed }) => (
                                                                <div key={training.id}>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-gray-700 font-medium">{training.name}</span>
                                                                        <span className="text-sm text-gray-500">{completed} / {total}</span>
                                                                    </div>
                                                                    <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                                        <div
                                                                            className="bg-blue-500 h-2.5 transition-all rounded-full"
                                                                            style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Missed Assignments Warning */}
                                                {missedAssignments.length > 0 && (
                                                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                                        <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                                            <XCircle size={18} />
                                                            Пропущенные занятия
                                                        </h3>
                                                        <div className="space-y-2">
                                                            {missedAssignments.slice(0, 5).map(assignment => (
                                                                <div key={assignment.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                                                                    <div>
                                                                        <p className="font-medium text-gray-800">{assignment.title}</p>
                                                                        <p className="text-sm text-red-600">
                                                                            {new Date(assignment.scheduledDate).toLocaleDateString('ru-RU', {
                                                                                day: 'numeric',
                                                                                month: 'long'
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-sm text-gray-500">{assignment.exercises?.length || 0} упр.</span>
                                                                </div>
                                                            ))}
                                                            {missedAssignments.length > 5 && (
                                                                <p className="text-sm text-red-600 text-center">
                                                                    И ещё {missedAssignments.length - 5} пропущенных занятий
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {assignments.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <BarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p>Нет данных для статистики</p>
                                                        <p className="text-sm">Пока нет назначенных занятий</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </>
                    )
                }
            </main >
        </div >
    );
}

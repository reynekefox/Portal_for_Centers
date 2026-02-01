import { useState } from "react";
import { ArrowLeft, Save, Edit2, Calendar, X, User, BookOpen, BarChart2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Exercise {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult: { type: string; minValue?: number };
}

interface Assignment {
    id: number;
    studentId: number;
    title: string;
    scheduledDate: string;
    status: 'pending' | 'in_progress' | 'completed';
    exercises: Exercise[];
}

interface StudentData {
    id: number;
    first_name: string;
    last_name: string;
    login: string;
    password: string;
    allowed_games: string[];
    notes?: string;
}

interface Training {
    id: string;
    name: string;
}

type TabType = 'data' | 'trainings' | 'statistics';

interface StudentEditorProps {
    student: StudentData;
    assignments: Assignment[];
    trainings: Training[];
    isSaving: boolean;
    onClose: () => void;
    onSaveStudent: (student: StudentData) => void;
    onEditAssignment: (assignment: Assignment) => void;
    onDeleteAssignment: (assignmentId: number) => void;
    onToggleGame: (gameId: string) => void;
    onNotesChange: (notes: string) => void;
}

export function StudentEditor({
    student,
    assignments,
    trainings,
    isSaving,
    onClose,
    onSaveStudent,
    onEditAssignment,
    onDeleteAssignment,
    onToggleGame,
    onNotesChange
}: StudentEditorProps) {
    const [activeTab, setActiveTab] = useState<TabType>('data');
    const studentAssignments = assignments;

    // Statistics calculations
    const completedAssignments = studentAssignments.filter(a => a.status === 'completed').length;
    const pendingAssignments = studentAssignments.filter(a => a.status === 'pending').length;
    const inProgressAssignments = studentAssignments.filter(a => a.status === 'in_progress').length;
    const totalExercises = studentAssignments.reduce((sum, a) => sum + (a.exercises?.length || 0), 0);
    const completionRate = studentAssignments.length > 0
        ? Math.round((completedAssignments / studentAssignments.length) * 100)
        : 0;

    // Group assignments by training
    const trainingStats = trainings.map(training => {
        const exercisesWithTraining = studentAssignments.flatMap(a =>
            (a.exercises || []).filter(e => e.trainingId === training.id)
        );
        return {
            training,
            count: exercisesWithTraining.length
        };
    }).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count);

    const tabs = [
        { id: 'data' as TabType, label: 'Данные ученика', icon: User },
        { id: 'trainings' as TabType, label: 'Тренинги', icon: BookOpen },
        { id: 'statistics' as TabType, label: 'Статистика', icon: BarChart2 }
    ];

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {student.first_name} {student.last_name}
                    </h1>
                </div>
                <button
                    onClick={() => onSaveStudent(student)}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-all flex items-center gap-2"
                >
                    <Save size={18} />
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column - Tabs */}
                <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 px-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Data Tab */}
                        {activeTab === 'data' && (
                            <div className="max-w-lg mx-auto space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                                    <input
                                        type="text"
                                        value={student.first_name}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
                                    <input
                                        type="text"
                                        value={student.last_name}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Логин</label>
                                    <input
                                        type="text"
                                        value={student.login}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                                    <input
                                        type="text"
                                        value={student.password}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Заметки</label>
                                    <textarea
                                        value={student.notes || ''}
                                        onChange={(e) => onNotesChange(e.target.value)}
                                        placeholder="Заметки об ученике..."
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Trainings Tab */}
                        {activeTab === 'trainings' && (
                            <div className="max-w-lg mx-auto">
                                <p className="text-sm text-gray-500 mb-4">
                                    Выбрано: {student.allowed_games?.length || 0} из {trainings.length} тренингов
                                </p>
                                <div className="grid gap-2">
                                    {trainings.map((training) => (
                                        <label
                                            key={training.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(student.allowed_games || []).includes(training.id)}
                                                onChange={() => onToggleGame(training.id)}
                                                className="w-5 h-5 text-blue-600 rounded"
                                            />
                                            <span className="text-gray-800">{training.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === 'statistics' && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                        <div className="flex items-center gap-2 text-green-700 mb-1">
                                            <CheckCircle size={18} />
                                            <span className="text-sm font-medium">Выполнено</span>
                                        </div>
                                        <p className="text-3xl font-bold text-green-800">{completedAssignments}</p>
                                        <p className="text-sm text-green-600">занятий</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                        <div className="flex items-center gap-2 text-yellow-700 mb-1">
                                            <Clock size={18} />
                                            <span className="text-sm font-medium">В процессе</span>
                                        </div>
                                        <p className="text-3xl font-bold text-yellow-800">{inProgressAssignments}</p>
                                        <p className="text-sm text-yellow-600">занятий</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 text-gray-700 mb-1">
                                            <AlertCircle size={18} />
                                            <span className="text-sm font-medium">Ожидает</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-800">{pendingAssignments}</p>
                                        <p className="text-sm text-gray-600">занятий</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                                            <BarChart2 size={18} />
                                            <span className="text-sm font-medium">Всего упражнений</span>
                                        </div>
                                        <p className="text-3xl font-bold text-blue-800">{totalExercises}</p>
                                        <p className="text-sm text-blue-600">назначено</p>
                                    </div>
                                </div>

                                {/* Completion Rate */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <h3 className="font-bold text-gray-800 mb-3">Процент выполнения</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                                            <div
                                                className="bg-green-500 h-4 rounded-full transition-all"
                                                style={{ width: `${completionRate}%` }}
                                            />
                                        </div>
                                        <span className="text-2xl font-bold text-gray-800">{completionRate}%</span>
                                    </div>
                                </div>

                                {/* Training Stats */}
                                {trainingStats.length > 0 && (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <h3 className="font-bold text-gray-800 mb-3">Упражнения по тренингам</h3>
                                        <div className="space-y-2">
                                            {trainingStats.map(({ training, count }) => (
                                                <div key={training.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                                    <span className="text-gray-700">{training.name}</span>
                                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                        {count} упр.
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No Data Message */}
                                {studentAssignments.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <BarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p>Нет данных для статистики</p>
                                        <p className="text-sm">Назначьте занятия ученику</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Assignments */}
                <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Занятия ({studentAssignments.length})
                    </h2>

                    {studentAssignments.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Нет назначенных занятий</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {studentAssignments.map((assignment) => (
                                <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-800">{assignment.title}</h3>
                                                {assignment.status === 'completed' && (
                                                    <CheckCircle size={16} className="text-green-500" />
                                                )}
                                                {assignment.status === 'in_progress' && (
                                                    <Clock size={16} className="text-yellow-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(assignment.scheduledDate).toLocaleDateString('ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {assignment.exercises?.length || 0} упражнений
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEditAssignment(assignment)}
                                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-all flex items-center gap-1"
                                            >
                                                <Edit2 size={14} />
                                                Редактировать
                                            </button>
                                            <button
                                                onClick={() => onDeleteAssignment(assignment.id)}
                                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-all flex items-center gap-1"
                                            >
                                                <X size={14} />
                                                Отменить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

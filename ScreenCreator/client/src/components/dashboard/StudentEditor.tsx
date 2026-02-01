import { ArrowLeft, Save, Trash2, Edit2, Calendar, X } from "lucide-react";

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
}

interface Training {
    id: string;
    name: string;
}

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
    onToggleGame
}: StudentEditorProps) {
    const studentAssignments = assignments.filter(a => true); // Will filter by student

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
                        Редактирование: {student.first_name} {student.last_name}
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
                {/* Left Column - Student Info */}
                <div className="w-1/2 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                    <div className="max-w-lg mx-auto space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Данные ученика</h2>

                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                            <input
                                type="text"
                                value={student.first_name}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
                            <input
                                type="text"
                                value={student.last_name}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                            />
                        </div>

                        {/* Login */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Логин</label>
                            <input
                                type="text"
                                value={student.login}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-mono"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                            <input
                                type="text"
                                value={student.password}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-mono"
                            />
                        </div>

                        {/* Allowed Trainings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Доступные тренинги ({student.allowed_games?.length || 0})
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                                {trainings.map((training) => (
                                    <label key={training.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={(student.allowed_games || []).includes(training.id)}
                                            onChange={() => onToggleGame(training.id)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{training.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
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
                                            <h3 className="font-bold text-gray-800">{assignment.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(assignment.scheduledDate).toLocaleDateString('ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {assignment.exercises?.length || 0} упражнений
                                                {assignment.status === 'completed' && (
                                                    <span className="ml-2 text-green-600">✓ Выполнено</span>
                                                )}
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

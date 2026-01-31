import { Plus, Calendar, Pencil, Trash2 } from "lucide-react";

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

interface AssignmentsTabProps {
    assignments: Assignment[];
    canCreate: boolean;
    getStudentName: (studentId: number) => string;
    onCreateAssignment: () => void;
    onEditAssignment: (assignment: Assignment) => void;
    onDeleteAssignment: (assignmentId: number) => void;
}

export function AssignmentsTab({
    assignments,
    canCreate,
    getStudentName,
    onCreateAssignment,
    onEditAssignment,
    onDeleteAssignment
}: AssignmentsTabProps) {
    const getStatusLabel = (status: Assignment['status']) => {
        switch (status) {
            case 'completed': return 'Завершено';
            case 'in_progress': return 'В процессе';
            default: return 'Ожидает';
        }
    };

    const getStatusColor = (status: Assignment['status']) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'in_progress': return 'text-yellow-600';
            default: return 'text-gray-500';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Занятия</h2>
                <div className="flex gap-3">
                    <button
                        onClick={onCreateAssignment}
                        disabled={!canCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-all"
                    >
                        <Plus size={18} />
                        Создать занятие
                    </button>
                </div>
            </div>

            {assignments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Нет созданных занятий</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800">{assignment.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        Ученик: {getStudentName(assignment.studentId)}
                                        {' · '}
                                        Дата: {assignment.scheduledDate}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Упражнений: {assignment.exercises.length}
                                        {' · '}
                                        Статус: <span className={getStatusColor(assignment.status)}>
                                            {getStatusLabel(assignment.status)}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEditAssignment(assignment)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <Pencil size={16} />
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => onDeleteAssignment(assignment.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

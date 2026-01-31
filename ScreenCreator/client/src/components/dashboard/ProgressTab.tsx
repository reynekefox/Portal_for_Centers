import { BarChart2 } from "lucide-react";

interface StudentData {
    id: number;
    first_name: string;
    last_name: string;
}

interface Assignment {
    id: number;
    studentId: number;
    status: 'pending' | 'in_progress' | 'completed';
}

interface ProgressTabProps {
    students: StudentData[];
    assignments: Assignment[];
}

export function ProgressTab({ students, assignments }: ProgressTabProps) {
    if (students.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Прогресс учеников</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <BarChart2 size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Нет учеников для отслеживания</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Прогресс учеников</h2>
            <div className="grid gap-4">
                {students.map((student) => {
                    const studentAssignments = assignments.filter(a => a.studentId === student.id);
                    const completed = studentAssignments.filter(a => a.status === 'completed').length;
                    const inProgress = studentAssignments.filter(a => a.status === 'in_progress').length;

                    return (
                        <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-bold text-gray-800 mb-3">{student.first_name} {student.last_name}</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-gray-800">{studentAssignments.length}</div>
                                    <div className="text-xs text-gray-500">Всего занятий</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-green-600">{completed}</div>
                                    <div className="text-xs text-gray-500">Завершено</div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-yellow-600">{inProgress}</div>
                                    <div className="text-xs text-gray-500">В процессе</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

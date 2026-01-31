import { Plus, Users, Trash2 } from "lucide-react";

interface StudentData {
    id: number;
    first_name: string;
    last_name: string;
    login: string;
    password: string;
    allowed_games: string[];
}

interface StudentsTabProps {
    students: StudentData[];
    onAddStudent: () => void;
    onEditStudent: (student: StudentData) => void;
    onDeleteStudent: (studentId: number) => void;
}

export function StudentsTab({
    students,
    onAddStudent,
    onEditStudent,
    onDeleteStudent
}: StudentsTabProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ученики</h2>
                <button
                    onClick={onAddStudent}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                    <Plus size={18} />
                    Добавить ученика
                </button>
            </div>

            {students.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Нет добавленных учеников</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {students.map((student) => (
                        <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800">{student.first_name} {student.last_name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Логин: <span className="font-mono bg-gray-100 px-1 rounded">{student.login}</span>
                                        {' · '}
                                        Пароль: <span className="font-mono bg-gray-100 px-1 rounded">{student.password}</span>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Тренингов: {(student.allowed_games || []).length}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEditStudent(student)}
                                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-all"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => onDeleteStudent(student.id)}
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

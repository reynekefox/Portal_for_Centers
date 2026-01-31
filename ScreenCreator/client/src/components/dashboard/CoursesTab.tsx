import { Plus, Folder, Trash2 } from "lucide-react";

interface SavedCourse {
    id: number;
    name: string;
    days?: unknown[];
}

interface CoursesTabProps {
    savedCourses: SavedCourse[];
    onCreateCourse: () => void;
    onEditCourse: (course: SavedCourse) => void;
    onDeleteCourse: (courseId: number) => void;
}

export function CoursesTab({
    savedCourses,
    onCreateCourse,
    onEditCourse,
    onDeleteCourse
}: CoursesTabProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Курсы</h2>
                <button
                    onClick={onCreateCourse}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                >
                    <Plus size={18} />
                    Создать курс
                </button>
            </div>

            {savedCourses.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Folder size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Нет сохранённых курсов</p>
                    <p className="text-gray-400 text-sm mt-2">Создайте курс и сохраните его</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {savedCourses.map((course) => (
                        <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800">{course.name}</h3>
                                    <p className="text-sm text-gray-500">{course.days?.length || 0} дней</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEditCourse(course)}
                                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-all"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => onDeleteCourse(course.id)}
                                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
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

import { ArrowLeft, Check, Plus, Calendar, Trash2, GripVertical, Save, Folder, ChevronDown } from "lucide-react";
import { authApi } from "@/lib/auth-store";

interface Exercise {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult: { type: string; minValue?: number };
}

interface CourseDay {
    date: string | null;
    daysOffset: number | null;
    exercises: Exercise[];
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
}

interface Template {
    id: number;
    name: string;
    exercises: Exercise[];
}

interface SavedCourse {
    id: number;
    name: string;
    days: CourseDay[];
}

interface CourseData {
    courseName: string;
    studentId: number;
    days: CourseDay[];
    addMode: 'date' | 'interval';
    nextDate: string;
    intervalDays: number;
    templateId: number | null;
}

interface CourseBuilderProps {
    courseData: CourseData;
    students: Student[];
    templates: Template[];
    savedCourses: SavedCourse[];
    isSaving: boolean;
    showSavedCourses: boolean;
    userId: number | undefined;
    onCourseDataChange: (data: CourseData | ((prev: CourseData) => CourseData)) => void;
    onClose: () => void;
    onCreateCourse: () => void;
    onAddDay: () => void;
    onRemoveDay: (index: number) => void;
    onShowSavedCoursesChange: (show: boolean) => void;
    onSavedCoursesChange: (courses: SavedCourse[] | ((prev: SavedCourse[]) => SavedCourse[])) => void;
    onShowOverwriteConfirm: (course: SavedCourse) => void;
}

export function CourseBuilder({
    courseData,
    students,
    templates,
    savedCourses,
    isSaving,
    showSavedCourses,
    userId,
    onCourseDataChange,
    onClose,
    onCreateCourse,
    onAddDay,
    onRemoveDay,
    onShowSavedCoursesChange,
    onSavedCoursesChange,
    onShowOverwriteConfirm
}: CourseBuilderProps) {
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
                    <h1 className="text-2xl font-bold text-gray-800">Создать курс</h1>
                </div>
                <button
                    onClick={onCreateCourse}
                    disabled={courseData.days.length === 0 || isSaving || courseData.studentId === 0}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-all flex items-center gap-2"
                >
                    <Check size={18} />
                    {isSaving ? 'Создание...' : `Создать курс (${courseData.days.length} дней)`}
                </button>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column - Course Settings */}
                <div className="w-1/2 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Course Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Название курса</label>
                            <input
                                type="text"
                                value={courseData.courseName}
                                onChange={(e) => onCourseDataChange(prev => ({ ...prev, courseName: e.target.value }))}
                                placeholder="Введите название курса"
                                className={`w-full px-4 py-3 rounded-xl border ${!courseData.courseName.trim() ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'} outline-none`}
                            />
                            {!courseData.courseName.trim() && (
                                <p className="text-red-500 text-sm mt-1">Введите название</p>
                            )}
                        </div>

                        {/* Student Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ученик</label>
                            <select
                                value={courseData.studentId}
                                onChange={(e) => onCourseDataChange(prev => ({ ...prev, studentId: parseInt(e.target.value) }))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                            >
                                <option value={0}>Без ученика</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                ))}
                            </select>

                            {/* Start Course Button */}
                            <button
                                onClick={onCreateCourse}
                                disabled={courseData.days.length === 0 || isSaving || courseData.studentId === 0}
                                className="w-full mt-3 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Создание...' : `Начать курс (${courseData.days.length} дней)`}
                            </button>
                        </div>

                        {/* Add Day Section */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                            <label className="block text-lg font-bold text-gray-800">Добавить день</label>

                            {/* Mode Selection */}
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={courseData.addMode === 'date'}
                                        onChange={() => onCourseDataChange(prev => ({ ...prev, addMode: 'date' }))}
                                        className="w-5 h-5 text-green-600"
                                    />
                                    <span className="text-lg">По дате</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={courseData.addMode === 'interval'}
                                        onChange={() => onCourseDataChange(prev => ({ ...prev, addMode: 'interval' }))}
                                        className="w-5 h-5 text-green-600"
                                    />
                                    <span className="text-lg">Через N дней</span>
                                </label>
                            </div>

                            {/* Date or Interval Input */}
                            <div className="flex gap-3">
                                {courseData.addMode === 'date' ? (
                                    <input
                                        type="date"
                                        value={courseData.nextDate}
                                        onChange={(e) => onCourseDataChange(prev => ({ ...prev, nextDate: e.target.value }))}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none text-lg"
                                    />
                                ) : (
                                    <div className="flex-1 flex items-center gap-3">
                                        <span className="text-gray-600 text-lg">Через</span>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => onCourseDataChange(prev => ({ ...prev, intervalDays: Math.max(0, prev.intervalDays - 1) }))}
                                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-l-xl flex items-center justify-center text-gray-600 font-bold text-xl transition-all"
                                            >
                                                −
                                            </button>
                                            <div className="w-14 h-10 bg-white border-y border-gray-200 flex items-center justify-center text-lg font-medium">
                                                {courseData.intervalDays}
                                            </div>
                                            <button
                                                onClick={() => onCourseDataChange(prev => ({ ...prev, intervalDays: Math.min(30, prev.intervalDays + 1) }))}
                                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-r-xl flex items-center justify-center text-gray-600 font-bold text-xl transition-all"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="text-gray-600 text-lg">дней</span>
                                    </div>
                                )}
                                <button
                                    onClick={onAddDay}
                                    disabled={!courseData.templateId}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 text-lg font-medium"
                                >
                                    <Plus size={20} />
                                    Добавить день
                                </button>
                            </div>

                            {/* Template Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Шаблон</label>
                                <select
                                    value={courseData.templateId || ''}
                                    onChange={(e) => onCourseDataChange(prev => ({ ...prev, templateId: e.target.value ? parseInt(e.target.value) : null }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none bg-white"
                                >
                                    {templates.length === 0 ? (
                                        <option value="">Нет шаблонов</option>
                                    ) : (
                                        <>
                                            <option value="">Выберите шаблон</option>
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.exercises.length} упр.)</option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Save Current Course Button */}
                        <button
                            onClick={async () => {
                                if (courseData.days.length > 0 && courseData.courseName.trim() && userId) {
                                    const trimmedName = courseData.courseName.trim();
                                    const existingCourse = savedCourses.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());

                                    if (existingCourse) {
                                        onShowOverwriteConfirm(existingCourse);
                                    } else {
                                        const result = await authApi.createCourseTemplate({
                                            schoolId: userId,
                                            name: trimmedName,
                                            days: courseData.days
                                        });
                                        onSavedCoursesChange(prev => [result, ...prev]);
                                    }
                                }
                            }}
                            disabled={courseData.days.length === 0 || !courseData.courseName.trim()}
                            className="w-full mb-4 py-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Сохранить курс
                        </button>

                        {/* Saved Courses Section */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <button
                                onClick={() => onShowSavedCoursesChange(!showSavedCourses)}
                                className="w-full flex items-center justify-between text-lg font-bold text-gray-800"
                            >
                                <span className="flex items-center gap-2">
                                    <Folder size={20} />
                                    Сохранённые курсы ({savedCourses.length})
                                </span>
                                <ChevronDown size={20} className={`transition-transform ${showSavedCourses ? 'rotate-180' : ''}`} />
                            </button>

                            {showSavedCourses && (
                                <div className="mt-4 space-y-2">
                                    {savedCourses.length === 0 ? (
                                        <p className="text-gray-500 text-center py-3">Нет сохранённых курсов</p>
                                    ) : (
                                        savedCourses.map((course) => (
                                            <div key={course.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200">
                                                <div>
                                                    <p className="font-medium text-gray-800">{course.name}</p>
                                                    <p className="text-sm text-gray-500">{course.days?.length || 0} дней</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            onCourseDataChange(prev => ({ ...prev, days: course.days || [], courseName: course.name }));
                                                        }}
                                                        className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-all"
                                                    >
                                                        Загрузить
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await authApi.deleteCourseTemplate(course.id);
                                                            onSavedCoursesChange(prev => prev.filter(c => c.id !== course.id));
                                                        }}
                                                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Days List */}
                <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        Дни курса ({courseData.days.length})
                    </h3>

                    {courseData.days.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-400">
                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-xl mb-2">Нет дней</p>
                            <p>Добавьте дни курса слева</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courseData.days.map((day, i) => (
                                <div
                                    key={i}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('courseDayIndex', i.toString())}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const fromIndex = parseInt(e.dataTransfer.getData('courseDayIndex'));
                                        if (fromIndex !== i) {
                                            onCourseDataChange(prev => {
                                                const newDays = [...prev.days];
                                                const [movedDay] = newDays.splice(fromIndex, 1);
                                                newDays.splice(i, 0, movedDay);
                                                return { ...prev, days: newDays };
                                            });
                                        }
                                    }}
                                    className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <GripVertical size={20} className="text-gray-400 cursor-grab" />
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <span className="text-green-700 font-bold text-lg">{i + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">
                                                {day.date
                                                    ? new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
                                                    : `через ${day.daysOffset} дней`
                                                }
                                            </p>
                                            <p className="text-gray-500">
                                                {day.exercises.length} упражнений
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                // TODO: Open day editor
                                            }}
                                            className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition-all"
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => onRemoveDay(i)}
                                            className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
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

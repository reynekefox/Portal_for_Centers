import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, authApi } from "@/lib/auth-store";
import { ArrowLeft, Plus, Pencil, Trash2, LogOut, Users, Check, BookOpen, Calendar, BarChart2, AlertTriangle, Play, X, GripVertical, ChevronDown, ChevronUp, Folder, Save } from "lucide-react";
import { ProgressTab } from "@/components/dashboard/ProgressTab";
import { TrainingsTab } from "@/components/dashboard/TrainingsTab";
import { StudentsTab } from "@/components/dashboard/StudentsTab";
import { CoursesTab } from "@/components/dashboard/CoursesTab";
import { AssignmentsTab } from "@/components/dashboard/AssignmentsTab";
import { ConfirmDeleteModal } from "@/components/dashboard/ConfirmDeleteModal";
import { StudentFormModal } from "@/components/dashboard/StudentFormModal";
import { CourseBuilder } from "@/components/dashboard/CourseBuilder";

interface Training {
    id: string;
    name: string;
    path: string;
}

interface StudentData {
    id: number;
    first_name: string;
    last_name: string;
    login: string;
    password: string;
    allowed_games: string[];
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

import { TRAINING_CONFIG, TrainingParam, TrainingConfig } from "@/lib/training-config";

interface CourseDay {
    date: string | null;
    daysOffset: number | null; // null for date mode, number for interval mode
    exercises: Exercise[];
}
interface Template {
    id: number;
    schoolId: number;
    name: string;
    exercises: Exercise[];
    createdAt: string;
}

type TabType = 'trainings' | 'students' | 'assignments' | 'courses' | 'progress';

export default function SchoolDashboard() {
    const [, setLocation] = useLocation();
    const { user, logout, isSchool, isLoading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('students');
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [allowedTrainings, setAllowedTrainings] = useState<string[]>([]);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Templates state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [exercisesExpanded, setExercisesExpanded] = useState(true);

    // Student form state
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
    const [studentFormData, setStudentFormData] = useState({
        first_name: '', last_name: '', login: '', password: '', allowed_games: [] as string[]
    });
    const [isSaving, setIsSaving] = useState(false);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'student' | 'assignment'; id: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Assignment form state
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
    const [assignmentFormData, setAssignmentFormData] = useState(() => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return {
            studentId: 0,
            title: dateStr,
            scheduledDate: today.toISOString().split('T')[0],
            exercises: [] as Exercise[]
        };
    });

    // Exercise builder
    const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
    const [currentExercise, setCurrentExercise] = useState<Exercise>({
        trainingId: '',
        parameters: {},
        requiredResult: { type: 'completion' }
    });

    // Course builder state
    const [showCourseBuilder, setShowCourseBuilder] = useState(false);
    const [courseData, setCourseData] = useState<{
        studentId: number;
        days: CourseDay[];
        templateId: number | null;
        addMode: 'date' | 'interval';
        intervalDays: number;
        nextDate: string;
        courseName: string;
    }>({
        studentId: 0,
        days: [],
        templateId: null,
        addMode: 'date',
        intervalDays: 2,
        nextDate: new Date().toISOString().split('T')[0],
        courseName: ''
    });
    const [savedCourses, setSavedCourses] = useState<Array<{ id: number; name: string; days: CourseDay[] }>>([]);
    const [showSavedCourses, setShowSavedCourses] = useState(true);
    const [overwriteConfirm, setOverwriteConfirm] = useState<{ show: boolean; existingCourse: { id: number; name: string } | null }>({ show: false, existingCourse: null });

    useEffect(() => {
        if (authLoading) return;
        if (!isSchool()) {
            setLocation('/login');
            return;
        }
        loadData();
    }, [authLoading]);

    const loadData = async () => {
        if (!user?.id) return;
        setIsLoading(true);

        const [trainingsData, studentsData, assignmentsData, templatesData, coursesData] = await Promise.all([
            authApi.getTrainings(),
            authApi.getStudents(user.id),
            authApi.getAssignments({ schoolId: user.id }),
            authApi.getTemplates(user.id),
            authApi.getCourseTemplates(user.id)
        ]);

        // Get school's allowed trainings from user data
        const schoolData = user.allowedTrainings || [];
        setAllowedTrainings(schoolData);
        setTrainings(trainingsData.filter((t: Training) => schoolData.includes(t.id)));
        setStudents(studentsData);
        setAssignments(assignmentsData);
        setTemplates(templatesData);
        setSavedCourses(coursesData);
        setIsLoading(false);
    };

    // Student handlers
    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSaving(true);

        try {
            if (editingStudentId) {
                await authApi.updateStudent(editingStudentId, studentFormData);
            } else {
                await authApi.addStudent({ school_id: user.id, ...studentFormData });
            }
            setShowStudentForm(false);
            setEditingStudentId(null);
            setStudentFormData({ first_name: '', last_name: '', login: '', password: '', allowed_games: [] });
            await loadData();
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditStudent = (student: StudentData) => {
        setEditingStudentId(student.id);
        setStudentFormData({
            first_name: student.first_name,
            last_name: student.last_name,
            login: student.login,
            password: student.password,
            allowed_games: student.allowed_games || []
        });
        setShowStudentForm(true);
    };

    const toggleStudentGame = (gameId: string) => {
        setStudentFormData(prev => ({
            ...prev,
            allowed_games: prev.allowed_games.includes(gameId)
                ? prev.allowed_games.filter(g => g !== gameId)
                : [...prev.allowed_games, gameId]
        }));
    };

    const toggleSelectAllStudentGames = () => {
        if (studentFormData.allowed_games.length === trainings.length) {
            setStudentFormData(prev => ({ ...prev, allowed_games: [] }));
        } else {
            setStudentFormData(prev => ({ ...prev, allowed_games: trainings.map(t => t.id) }));
        }
    };

    // Template handlers
    const saveAsTemplate = async () => {
        if (!user?.id || !templateName.trim() || assignmentFormData.exercises.length === 0) return;
        try {
            await authApi.createTemplate({
                schoolId: user.id,
                name: templateName.trim(),
                exercises: assignmentFormData.exercises
            });
            const templatesData = await authApi.getTemplates(user.id);
            setTemplates(templatesData);
            setTemplateName('');
            setShowTemplates(false);
        } catch (e) {
            console.error('Failed to save template:', e);
        }
    };

    const loadTemplate = (template: Template) => {
        setAssignmentFormData(prev => ({
            ...prev,
            exercises: template.exercises
        }));
        setShowTemplates(false);
    };

    const deleteTemplate = async (templateId: number) => {
        if (!user?.id) return;
        try {
            await authApi.deleteTemplate(templateId);
            setTemplates(templates.filter(t => t.id !== templateId));
        } catch (e) {
            console.error('Failed to delete template:', e);
        }
    };

    const updateTemplate = async (templateId: number) => {
        if (!user?.id || assignmentFormData.exercises.length === 0) return;
        try {
            await authApi.updateTemplate(templateId, { exercises: assignmentFormData.exercises });
            const templatesData = await authApi.getTemplates(user.id);
            setTemplates(templatesData);
            setShowTemplates(false);
        } catch (e) {
            console.error('Failed to update template:', e);
        }
    };

    // Assignment handlers
    const handleAssignmentSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!user?.id) return;
        setIsSaving(true);

        try {
            if (editingAssignmentId) {
                await authApi.updateAssignment(editingAssignmentId, {
                    title: assignmentFormData.title,
                    scheduledDate: assignmentFormData.scheduledDate,
                    exercises: assignmentFormData.exercises
                });
            } else {
                await authApi.createAssignment({
                    schoolId: user.id,
                    studentId: assignmentFormData.studentId,
                    title: assignmentFormData.title,
                    scheduledDate: assignmentFormData.scheduledDate,
                    exercises: assignmentFormData.exercises
                });
            }
            setShowAssignmentForm(false);
            setEditingAssignmentId(null);
            setAssignmentFormData({
                studentId: students[0]?.id || 0,
                title: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                scheduledDate: new Date().toISOString().split('T')[0],
                exercises: []
            });
            await loadData();
        } finally {
            setIsSaving(false);
        }
    };

    // Course builder functions
    const addCourseDay = () => {
        // Get exercises from template if selected
        const template = templates.find(t => t.id === courseData.templateId);
        const exercises = template ? [...template.exercises] : [];

        if (courseData.addMode === 'date') {
            setCourseData(prev => ({
                ...prev,
                days: [...prev.days, { date: courseData.nextDate, daysOffset: null, exercises }],
                nextDate: new Date(new Date(courseData.nextDate).getTime() + 86400000).toISOString().split('T')[0]
            }));
        } else {
            setCourseData(prev => ({
                ...prev,
                days: [...prev.days, { date: null, daysOffset: courseData.intervalDays, exercises }]
            }));
        }
    };

    const removeCourseDay = (index: number) => {
        setCourseData(prev => ({
            ...prev,
            days: prev.days.filter((_, i) => i !== index)
        }));
    };

    const handleCreateCourse = async () => {
        if (!user?.id || courseData.days.length === 0) return;
        setIsSaving(true);

        try {
            // Calculate actual dates for interval-based days
            let currentDate = new Date();
            for (const day of courseData.days) {
                let assignmentDate: string;
                if (day.date) {
                    assignmentDate = day.date;
                    currentDate = new Date(day.date);
                } else if (day.daysOffset !== null) {
                    currentDate.setDate(currentDate.getDate() + day.daysOffset);
                    assignmentDate = currentDate.toISOString().split('T')[0];
                } else {
                    continue; // Skip invalid entries
                }

                await authApi.createAssignment({
                    schoolId: user.id,
                    studentId: courseData.studentId,
                    title: new Date(assignmentDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    scheduledDate: assignmentDate,
                    exercises: day.exercises
                });
            }
            setCourseData({
                studentId: 0,
                days: [],
                templateId: null,
                addMode: 'date',
                intervalDays: 2,
                nextDate: new Date().toISOString().split('T')[0],
                courseName: ''
            });
            await loadData();
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditAssignment = (assignment: Assignment) => {
        setEditingAssignmentId(assignment.id);
        setAssignmentFormData({
            studentId: assignment.studentId,
            title: assignment.title,
            scheduledDate: assignment.scheduledDate,
            exercises: assignment.exercises
        });
        setShowAssignmentForm(true);
    };

    const addExerciseToAssignment = async () => {
        if (!currentExercise.trainingId) return;

        let newExercises: Exercise[];
        if (editingExerciseIndex !== null) {
            // Update existing exercise
            newExercises = assignmentFormData.exercises.map((ex, i) =>
                i === editingExerciseIndex ? { ...currentExercise } : ex
            );
            setEditingExerciseIndex(null);
        } else {
            // Add new exercise
            newExercises = [...assignmentFormData.exercises, { ...currentExercise }];
        }

        setAssignmentFormData(prev => ({ ...prev, exercises: newExercises }));
        setCurrentExercise({ trainingId: '', parameters: {}, requiredResult: { type: 'completion' } });
        setShowExerciseBuilder(false);

        // Auto-save if editing existing assignment
        if (editingAssignmentId) {
            try {
                await authApi.updateAssignment(editingAssignmentId, {
                    title: assignmentFormData.title,
                    scheduledDate: assignmentFormData.scheduledDate,
                    exercises: newExercises
                });
                await loadData();
            } catch (error) {
                console.error('Failed to auto-save exercise changes:', error);
            }
        }
    };

    const removeExercise = async (index: number) => {
        const newExercises = assignmentFormData.exercises.filter((_, i) => i !== index);
        setAssignmentFormData(prev => ({ ...prev, exercises: newExercises }));

        // Auto-save if editing existing assignment
        if (editingAssignmentId) {
            try {
                await authApi.updateAssignment(editingAssignmentId, {
                    title: assignmentFormData.title,
                    scheduledDate: assignmentFormData.scheduledDate,
                    exercises: newExercises
                });
                await loadData();
            } catch (error) {
                console.error('Failed to auto-save exercise removal:', error);
            }
        }
    };

    const moveExercise = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= assignmentFormData.exercises.length) return;
        setAssignmentFormData(prev => {
            const exercises = [...prev.exercises];
            const [moved] = exercises.splice(fromIndex, 1);
            exercises.splice(toIndex, 0, moved);
            return { ...prev, exercises };
        });
    };

    const editExercise = (index: number) => {
        const ex = assignmentFormData.exercises[index];
        setCurrentExercise({ ...ex });
        setEditingExerciseIndex(index);
        setShowExerciseBuilder(true);
    };

    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
    const [draggedExercise, setDraggedExercise] = useState<number | null>(null);

    const handleExerciseDragStart = (index: number) => setDraggedExercise(index);
    const handleExerciseDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedExercise !== null && draggedExercise !== index) {
            moveExercise(draggedExercise, index);
            setDraggedExercise(index);
        }
    };
    const handleExerciseDragEnd = async () => {
        setDraggedExercise(null);

        // Auto-save reorder if editing existing assignment
        if (editingAssignmentId) {
            try {
                await authApi.updateAssignment(editingAssignmentId, {
                    title: assignmentFormData.title,
                    scheduledDate: assignmentFormData.scheduledDate,
                    exercises: assignmentFormData.exercises
                });
                await loadData();
            } catch (error) {
                console.error('Failed to auto-save exercise reorder:', error);
            }
        }
    };

    // Delete handler
    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setIsDeleting(true);
        try {
            if (deleteConfirm.type === 'student') {
                await authApi.deleteStudent(deleteConfirm.id);
            } else {
                await authApi.deleteAssignment(deleteConfirm.id);
            }
            await loadData();
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const handleLogout = () => {
        logout();
        setLocation('/');
    };

    const getStudentName = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        return student ? `${student.first_name} ${student.last_name}` : 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ð¹';
    };

    const getTrainingName = (trainingId: string) => {
        const training = trainings.find(t => t.id === trainingId);
        return training?.name || trainingId;
    };

    const tabs: { id: TabType; label: string; icon: typeof Users }[] = [
        { id: 'students', label: 'Ð£Ñ‡ÐµÐ½Ð¸ÐºÐ¸', icon: Users },
        { id: 'trainings', label: 'Ð¢Ñ€ÐµÐ½Ð¸Ð½Ð³Ð¸', icon: BookOpen },
        { id: 'assignments', label: 'Ð—Ð°Ð½ÑÑ‚Ð¸Ñ', icon: Calendar },
        { id: 'courses', label: 'ÐšÑƒÑ€ÑÑ‹', icon: Folder },
        { id: 'progress', label: 'ÐŸÑ€Ð¾Ð³Ñ€ÐµÑÑ', icon: BarChart2 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                                <ArrowLeft size={24} className="text-gray-600" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Ð›Ð¸Ñ‡Ð½Ñ‹Ð¹ ÐºÐ°Ð±Ð¸Ð½ÐµÑ‚ ÑˆÐºÐ¾Ð»Ñ‹</h1>
                            <p className="text-sm text-gray-500">{user?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <LogOut size={18} />
                        Ð’Ñ‹Ð¹Ñ‚Ð¸
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Tabs */}
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
                    <div className="text-gray-500 text-center py-12">Ð—Ð°Ð³Ñ€ÑƒÐ·ÐºÐ°...</div>
                ) : (
                    <>
                        {/* Students Tab */}
                        {activeTab === 'students' && (
                            <StudentsTab
                                students={students}
                                onAddStudent={() => {
                                    setShowStudentForm(true);
                                    setEditingStudentId(null);
                                    setStudentFormData({ first_name: '', last_name: '', login: '', password: '', allowed_games: trainings.map(t => t.id) });
                                }}
                                onEditStudent={handleEditStudent}
                                onDeleteStudent={(id) => setDeleteConfirm({ type: 'student', id })}
                            />
                        )}

                        {/* Trainings Tab */}
                        {activeTab === 'trainings' && (
                            <TrainingsTab trainings={trainings} />
                        )}

                        {/* Assignments Tab */}
                        {activeTab === 'assignments' && (
                            <AssignmentsTab
                                assignments={assignments}
                                canCreate={students.length > 0 && trainings.length > 0}
                                getStudentName={getStudentName}
                                onCreateAssignment={() => {
                                    setShowAssignmentForm(true);
                                    setEditingAssignmentId(null);
                                    setAssignmentFormData({
                                        studentId: 0,
                                        title: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                                        scheduledDate: new Date().toISOString().split('T')[0],
                                        exercises: []
                                    });
                                }}
                                onEditAssignment={handleEditAssignment}
                                onDeleteAssignment={(id) => setDeleteConfirm({ type: 'assignment', id })}
                            />
                        )}

                        {/* Courses Tab */}
                        {activeTab === 'courses' && (
                            <CoursesTab
                                savedCourses={savedCourses}
                                onCreateCourse={() => {
                                    setShowCourseBuilder(true);
                                    setCourseData({
                                        studentId: 0,
                                        days: [],
                                        templateId: null,
                                        addMode: 'interval',
                                        intervalDays: 2,
                                        nextDate: new Date().toISOString().split('T')[0],
                                        courseName: ''
                                    });
                                }}
                                onEditCourse={(course) => {
                                    setCourseData(prev => ({ ...prev, days: (course.days || []) as CourseDay[], courseName: course.name }));
                                    setShowCourseBuilder(true);
                                }}
                                onDeleteCourse={async (id) => {
                                    await authApi.deleteCourseTemplate(id);
                                    setSavedCourses(prev => prev.filter(c => c.id !== id));
                                }}
                            />
                        )}

                        {/* Progress Tab */}
                        {activeTab === 'progress' && (
                            <ProgressTab students={students} assignments={assignments} />
                        )}
                    </>
                )}
            </main>

            {/* Student Form Modal */}
            {showStudentForm && (
                <StudentFormModal
                    isEditing={!!editingStudentId}
                    formData={studentFormData}
                    trainings={trainings}
                    isSaving={isSaving}
                    onFormDataChange={setStudentFormData}
                    onSubmit={handleStudentSubmit}
                    onClose={() => { setShowStudentForm(false); setEditingStudentId(null); }}
                    onToggleGame={toggleStudentGame}
                    onToggleSelectAll={toggleSelectAllStudentGames}
                />
            )}

            {/* Course Builder - Full Screen */}
            {showCourseBuilder && (
                <CourseBuilder
                    courseData={courseData}
                    students={students}
                    templates={templates}
                    savedCourses={savedCourses}
                    isSaving={isSaving}
                    showSavedCourses={showSavedCourses}
                    userId={user?.id}
                    onCourseDataChange={setCourseData}
                    onClose={() => setShowCourseBuilder(false)}
                    onCreateCourse={handleCreateCourse}
                    onAddDay={addCourseDay}
                    onRemoveDay={removeCourseDay}
                    onShowSavedCoursesChange={setShowSavedCourses}
                    onSavedCoursesChange={setSavedCourses}
                    onShowOverwriteConfirm={(course) => setOverwriteConfirm({ show: true, existingCourse: course })}
                />
            )}

            {/* Assignment Builder - Full Screen */}
            {showAssignmentForm && (
                <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => { setShowAssignmentForm(false); setEditingAssignmentId(null); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <ArrowLeft size={24} className="text-gray-600" />
                            </button>
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingAssignmentId ? 'Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð·Ð°Ð½ÑÑ‚Ð¸Ðµ' : 'Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð·Ð°Ð½ÑÑ‚Ð¸Ðµ'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Templates dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition-all"
                                >
                                    ðŸ“‹ Ð¨Ð°Ð±Ð»Ð¾Ð½Ñ‹
                                </button>
                                {showTemplates && (
                                    <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                        <div className="p-4 border-b border-gray-100">
                                            <h4 className="font-bold text-gray-800 mb-2">Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ ÐºÐ°Ðº ÑˆÐ°Ð±Ð»Ð¾Ð½</h4>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={templateName}
                                                    onChange={(e) => setTemplateName(e.target.value)}
                                                    placeholder="ÐÐ°Ð·Ð²Ð°Ð½Ð¸Ðµ ÑˆÐ°Ð±Ð»Ð¾Ð½Ð°"
                                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                                <button
                                                    onClick={saveAsTemplate}
                                                    disabled={!templateName.trim() || assignmentFormData.exercises.length === 0}
                                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium"
                                                >
                                                    ðŸ’¾
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {templates.length === 0 ? (
                                                <p className="text-gray-400 text-center py-4 text-sm">ÐÐµÑ‚ ÑÐ¾Ñ…Ñ€Ð°Ð½Ñ‘Ð½Ð½Ñ‹Ñ… ÑˆÐ°Ð±Ð»Ð¾Ð½Ð¾Ð²</p>
                                            ) : (
                                                templates.map((t) => (
                                                    <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                                        <button
                                                            onClick={() => loadTemplate(t)}
                                                            className="flex-1 text-left"
                                                        >
                                                            <span className="font-medium text-gray-800">{t.name}</span>
                                                            <span className="text-xs text-gray-400 ml-2">({t.exercises.length} ÑƒÐ¿Ñ€.)</span>
                                                        </button>
                                                        <button
                                                            onClick={() => updateTemplate(t.id)}
                                                            disabled={assignmentFormData.exercises.length === 0}
                                                            className="p-1 hover:bg-blue-100 rounded text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="ÐŸÐµÑ€ÐµÐ·Ð°Ð¿Ð¸ÑÐ°Ñ‚ÑŒ Ñ‚ÐµÐºÑƒÑ‰Ð¸Ð¼Ð¸ ÑƒÐ¿Ñ€Ð°Ð¶Ð½ÐµÐ½Ð¸ÑÐ¼Ð¸"
                                                        >
                                                            â¬†ï¸
                                                        </button>
                                                        <button
                                                            onClick={() => deleteTemplate(t.id)}
                                                            className="p-1 hover:bg-red-100 rounded text-red-500"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleAssignmentSubmit}
                                disabled={isSaving || assignmentFormData.exercises.length === 0 || !assignmentFormData.title}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-all"
                            >
                                {isSaving ? 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ðµ...' : 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ Ð·Ð°Ð½ÑÑ‚Ð¸Ðµ'}
                            </button>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Column - Form & Exercise List */}
                        <div className="w-1/2 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                            <div className="max-w-2xl mx-auto space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ÐÐ°Ð·Ð²Ð°Ð½Ð¸Ðµ Ð·Ð°Ð½ÑÑ‚Ð¸Ñ</label>
                                    <input
                                        type="text"
                                        value={assignmentFormData.title}
                                        onChange={(e) => setAssignmentFormData({ ...assignmentFormData, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-lg"
                                        placeholder="Ð—Ð°Ð½ÑÑ‚Ð¸Ðµ Ð½Ð° Ð²Ð½Ð¸Ð¼Ð°Ð½Ð¸Ðµ"
                                    />
                                </div>

                                {/* Date & Student */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ð”Ð°Ñ‚Ð°</label>
                                        <input
                                            type="date"
                                            value={assignmentFormData.scheduledDate}
                                            onChange={(e) => setAssignmentFormData({ ...assignmentFormData, scheduledDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-lg"
                                            style={{ fontSize: '18px' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ð£Ñ‡ÐµÐ½Ð¸Ðº</label>
                                        <select
                                            value={assignmentFormData.studentId}
                                            onChange={(e) => setAssignmentFormData({ ...assignmentFormData, studentId: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                                        >
                                            <option value={0}>Ð‘ÐµÐ· ÑƒÑ‡ÐµÐ½Ð¸ÐºÐ°</option>
                                            {students.map((s) => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Exercises List */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setExercisesExpanded(!exercisesExpanded)}
                                        className="flex items-center justify-between w-full text-left mb-3 group"
                                    >
                                        <span className="text-xl font-bold text-gray-800">
                                            Ð£Ð¿Ñ€Ð°Ð¶Ð½ÐµÐ½Ð¸Ñ ({assignmentFormData.exercises.length})
                                        </span>
                                        {assignmentFormData.exercises.length > 0 && (
                                            exercisesExpanded
                                                ? <ChevronUp size={24} className="text-gray-500 group-hover:text-gray-700" />
                                                : <ChevronDown size={24} className="text-gray-500 group-hover:text-gray-700" />
                                        )}
                                    </button>
                                    {assignmentFormData.exercises.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
                                            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                                            <p>Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ‚Ñ€ÐµÐ½Ð¸Ð½Ð³Ð¸ ÑÐ¿Ñ€Ð°Ð²Ð°</p>
                                            <p className="text-sm">Ð´Ð»Ñ Ð´Ð¾Ð±Ð°Ð²Ð»ÐµÐ½Ð¸Ñ Ð² Ð·Ð°Ð½ÑÑ‚Ð¸Ðµ</p>
                                        </div>
                                    ) : exercisesExpanded ? (
                                        <div className="space-y-2">
                                            {assignmentFormData.exercises.map((ex, i) => (
                                                <div
                                                    key={i}
                                                    draggable
                                                    onDragStart={() => handleExerciseDragStart(i)}
                                                    onDragOver={(e) => handleExerciseDragOver(e, i)}
                                                    onDragEnd={handleExerciseDragEnd}
                                                    className={`flex items-center gap-3 bg-gray-50 rounded-xl p-4 cursor-move transition-all ${draggedExercise === i ? 'opacity-50 scale-95' : 'hover:bg-gray-100'}`}
                                                >
                                                    <div className="text-gray-400 hover:text-gray-600">
                                                        <GripVertical size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-800">{i + 1}. {getTrainingName(ex.trainingId)}</span>
                                                            <span className="text-sm text-gray-500">
                                                                ({ex.requiredResult.type === 'completion' || ex.requiredResult.type === 'time_only' || ex.requiredResult.type === 'min_moves'
                                                                    ? 'âœ“'
                                                                    : `â‰¥${ex.requiredResult.minValue}${ex.requiredResult.type === 'max_time' ? ' ÑÐµÐº' : '%'}`})
                                                            </span>
                                                        </div>
                                                        {Object.keys(ex.parameters).length > 0 && (
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                {Object.entries(ex.parameters).map(([key, val]) => {
                                                                    const config = TRAINING_CONFIG[ex.trainingId as keyof typeof TRAINING_CONFIG];
                                                                    const param = config?.params?.find((p: { key: string }) => p.key === key);
                                                                    // Fallback labels for legacy keys
                                                                    const legacyLabels: Record<string, string> = {
                                                                        exerciseDuration: 'Ð’Ñ€ÐµÐ¼Ñ (ÑÐµÐº)',
                                                                        duration: 'Ð’Ñ€ÐµÐ¼Ñ (ÑÐµÐº)',
                                                                        wordCount: 'ÐšÐ¾Ð»-Ð²Ð¾ ÑÐ»Ð¾Ð²',
                                                                        diskCount: 'Ð”Ð¸ÑÐºÐ¾Ð²',
                                                                        gridSize: 'Ð Ð°Ð·Ð¼ÐµÑ€ Ð¿Ð¾Ð»Ñ',
                                                                        rounds: 'Ð Ð°ÑƒÐ½Ð´Ð¾Ð²',
                                                                        speed: 'Ð¡ÐºÐ¾Ñ€Ð¾ÑÑ‚ÑŒ',
                                                                        fontSize: 'Ð Ð°Ð·Ð¼ÐµÑ€ ÑˆÑ€Ð¸Ñ„Ñ‚Ð°'
                                                                    };
                                                                    const label = param?.label || legacyLabels[key] || key;
                                                                    return `${label}: ${val}`;
                                                                }).join(' â€¢ ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => editExercise(i)}
                                                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all"
                                                    >
                                                        <Pencil size={18} className="text-blue-600" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExercise(i)}
                                                        className="p-2 hover:bg-red-100 rounded-lg transition-all"
                                                    >
                                                        <X size={18} className="text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Available Trainings */}
                        <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ðµ Ñ‚Ñ€ÐµÐ½Ð¸Ð½Ð³Ð¸</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {trainings.map((training) => (
                                    <button
                                        key={training.id}
                                        onClick={() => {
                                            const config = TRAINING_CONFIG[training.id];
                                            const defaultParams: Record<string, unknown> = {};
                                            if (config) {
                                                config.params.forEach(p => { defaultParams[p.key] = p.default; });
                                            }
                                            const criteria = config?.successCriteria;
                                            setCurrentExercise({
                                                trainingId: training.id,
                                                parameters: defaultParams,
                                                requiredResult: {
                                                    type: criteria?.type || 'completion',
                                                    minValue: criteria?.default
                                                }
                                            });
                                            setShowExerciseBuilder(true);
                                        }}
                                        className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Play size={24} className="text-blue-600" />
                                            <Plus size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-lg">{training.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {TRAINING_CONFIG[training.id]?.successCriteria?.label || 'ÐÐ°Ð¶Ð¼Ð¸Ñ‚Ðµ Ð´Ð»Ñ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Exercise Builder Modal */}
            {showExerciseBuilder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingExerciseIndex !== null ? 'Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ ÑƒÐ¿Ñ€Ð°Ð¶Ð½ÐµÐ½Ð¸Ðµ' : 'Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ ÑƒÐ¿Ñ€Ð°Ð¶Ð½ÐµÐ½Ð¸Ðµ'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ð¢Ñ€ÐµÐ½Ð¸Ð½Ð³</label>
                                <select
                                    value={currentExercise.trainingId}
                                    onChange={(e) => {
                                        const trainingId = e.target.value;
                                        const config = TRAINING_CONFIG[trainingId];
                                        const defaultParams: Record<string, unknown> = {};
                                        if (config) {
                                            config.params.forEach(p => { defaultParams[p.key] = p.default; });
                                        }
                                        // Auto-set success criteria based on training type
                                        const criteria = config?.successCriteria;
                                        setCurrentExercise({
                                            ...currentExercise,
                                            trainingId,
                                            parameters: defaultParams,
                                            requiredResult: {
                                                type: criteria?.type || 'completion',
                                                minValue: criteria?.default
                                            }
                                        });
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ‚Ñ€ÐµÐ½Ð¸Ð½Ð³</option>
                                    {trainings.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Training-specific parameters */}
                            {currentExercise.trainingId && TRAINING_CONFIG[currentExercise.trainingId] && (
                                <div className="border-t border-gray-200 pt-4">
                                    {TRAINING_CONFIG[currentExercise.trainingId].params.map((param) => (
                                        <div key={param.key} className="mb-3">
                                            <label className="block text-sm text-gray-600 mb-1">{param.label}</label>
                                            {param.type === 'number' ? (
                                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = (currentExercise.parameters[param.key] as number) ?? param.default;
                                                            const step = param.step || 1;
                                                            const newVal = Math.max(param.min ?? 0, current - step);
                                                            setCurrentExercise({
                                                                ...currentExercise,
                                                                parameters: { ...currentExercise.parameters, [param.key]: newVal }
                                                            });
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                    >âˆ’</button>
                                                    <div className="flex items-center gap-1 min-w-[4rem] justify-center">
                                                        <span className="font-bold text-xl text-gray-800">
                                                            {(currentExercise.parameters[param.key] as number) ?? param.default}
                                                        </span>
                                                        {param.unit && <span className="text-gray-500 text-sm">{param.unit}</span>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = (currentExercise.parameters[param.key] as number) ?? param.default;
                                                            const step = param.step || 1;
                                                            const newVal = Math.min(param.max ?? 999, current + step);
                                                            setCurrentExercise({
                                                                ...currentExercise,
                                                                parameters: { ...currentExercise.parameters, [param.key]: newVal }
                                                            });
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                    >+</button>
                                                </div>
                                            ) : param.type === 'toggle' ? (
                                                <div className="flex items-center justify-end -mt-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentExercise({
                                                            ...currentExercise,
                                                            parameters: { ...currentExercise.parameters, [param.key]: !(currentExercise.parameters[param.key] as boolean) }
                                                        })}
                                                        className={`w-12 h-6 rounded-full transition-all ${(currentExercise.parameters[param.key] as boolean) ? 'bg-blue-500' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${(currentExercise.parameters[param.key] as boolean) ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                                    {param.options?.map((opt) => (
                                                        <button
                                                            key={String(opt.value)}
                                                            type="button"
                                                            onClick={() => setCurrentExercise({
                                                                ...currentExercise,
                                                                parameters: { ...currentExercise.parameters, [param.key]: isNaN(Number(opt.value)) ? opt.value : Number(opt.value) }
                                                            })}
                                                            className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${(currentExercise.parameters[param.key] ?? param.default) === opt.value
                                                                ? 'bg-white shadow text-blue-600'
                                                                : 'text-gray-500 hover:text-gray-700'
                                                                }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Success criteria - auto from config */}
                            {currentExercise.trainingId && TRAINING_CONFIG[currentExercise.trainingId] && (
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">ÐšÑ€Ð¸Ñ‚ÐµÑ€Ð¸Ð¹ ÑƒÑÐ¿ÐµÑ…Ð°</label>
                                    {(() => {
                                        const criteria = TRAINING_CONFIG[currentExercise.trainingId].successCriteria;
                                        if (criteria.type === 'time_only' || criteria.type === 'completion' || criteria.type === 'min_moves') {
                                            // For min_moves, show auto-calculated value
                                            const label = criteria.type === 'min_moves' && currentExercise.parameters.diskCount
                                                ? `Ð—Ð°Ð²ÐµÑ€ÑˆÐ¸Ñ‚ÑŒ Ð·Ð° ${Math.pow(2, Number(currentExercise.parameters.diskCount)) - 1} Ñ…Ð¾Ð´Ð¾Ð²`
                                                : criteria.label;
                                            return (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                                                    âœ“ {label}
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = currentExercise.requiredResult.minValue ?? criteria.default ?? 0;
                                                        const step = criteria.step ?? (criteria.type === 'max_time' ? 10 : 5);
                                                        const newVal = Math.max(criteria.min ?? 0, current - step);
                                                        setCurrentExercise({
                                                            ...currentExercise,
                                                            requiredResult: { ...currentExercise.requiredResult, minValue: newVal }
                                                        });
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                >âˆ’</button>
                                                <div className="flex items-center gap-1 min-w-[4rem] justify-center">
                                                    <span className="font-bold text-xl text-gray-800">
                                                        {currentExercise.requiredResult.minValue ?? criteria.default}
                                                    </span>
                                                    {criteria.unit && <span className="text-gray-500 text-sm">{criteria.unit}</span>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = currentExercise.requiredResult.minValue ?? criteria.default ?? 0;
                                                        const step = criteria.step ?? (criteria.type === 'max_time' ? 10 : 5);
                                                        const newVal = Math.min(criteria.max ?? 999, current + step);
                                                        setCurrentExercise({
                                                            ...currentExercise,
                                                            requiredResult: { ...currentExercise.requiredResult, minValue: newVal }
                                                        });
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                >+</button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowExerciseBuilder(false);
                                        setEditingExerciseIndex(null);
                                        setCurrentExercise({ trainingId: '', parameters: {}, requiredResult: { type: 'completion' } });
                                    }}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    ÐžÑ‚Ð¼ÐµÐ½Ð°
                                </button>
                                <button
                                    type="button"
                                    onClick={addExerciseToAssignment}
                                    disabled={!currentExercise.trainingId}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all"
                                >
                                    {editingExerciseIndex !== null ? 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ' : 'Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">
                            {deleteConfirm.type === 'student' ? 'Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ ÑƒÑ‡ÐµÐ½Ð¸ÐºÐ°?' : 'Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð·Ð°Ð½ÑÑ‚Ð¸Ðµ?'}
                        </h3>
                        <p className="text-gray-500 mb-6">Ð­Ñ‚Ð¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ Ð½ÐµÐ»ÑŒÐ·Ñ Ð¾Ñ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                                className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                ÐžÑ‚Ð¼ÐµÐ½Ð°
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-all"
                            >
                                {isDeleting ? 'Ð£Ð´Ð°Ð»ÐµÐ½Ð¸Ðµ...' : 'Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overwrite Course Confirmation Modal */}
            {overwriteConfirm.show && overwriteConfirm.existingCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">ÐŸÐµÑ€ÐµÐ·Ð°Ð¿Ð¸ÑÐ°Ñ‚ÑŒ ÐºÑƒÑ€Ñ?</h3>
                        <p className="text-gray-500 mb-6">
                            ÐšÑƒÑ€Ñ "{overwriteConfirm.existingCourse.name}" ÑƒÐ¶Ðµ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚. ÐŸÐµÑ€ÐµÐ·Ð°Ð¿Ð¸ÑÐ°Ñ‚ÑŒ ÐµÐ³Ð¾?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOverwriteConfirm({ show: false, existingCourse: null })}
                                className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                ÐžÑ‚Ð¼ÐµÐ½Ð°
                            </button>
                            <button
                                onClick={async () => {
                                    if (overwriteConfirm.existingCourse && user?.id) {
                                        await authApi.updateCourseTemplate(overwriteConfirm.existingCourse.id, {
                                            name: courseData.courseName.trim(),
                                            days: courseData.days
                                        });
                                        setSavedCourses(prev => prev.map(c =>
                                            c.id === overwriteConfirm.existingCourse!.id
                                                ? { ...c, name: courseData.courseName.trim(), days: courseData.days }
                                                : c
                                        ));
                                        setOverwriteConfirm({ show: false, existingCourse: null });
                                    }
                                }}
                                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all"
                            >
                                ÐŸÐµÑ€ÐµÐ·Ð°Ð¿Ð¸ÑÐ°Ñ‚ÑŒ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, authApi } from "@/lib/auth-store";
import { ArrowLeft, LogOut, Users, BookOpen, Calendar, BarChart2, Folder } from "lucide-react";
import { ProgressTab } from "@/components/dashboard/ProgressTab";
import { TrainingsTab } from "@/components/dashboard/TrainingsTab";
import { StudentsTab } from "@/components/dashboard/StudentsTab";
import { CoursesTab } from "@/components/dashboard/CoursesTab";
import { AssignmentsTab } from "@/components/dashboard/AssignmentsTab";
import { ConfirmDeleteModal } from "@/components/dashboard/ConfirmDeleteModal";
import { StudentFormModal } from "@/components/dashboard/StudentFormModal";
import { OverwriteCourseModal } from "@/components/dashboard/OverwriteCourseModal";
import { CourseBuilder } from "@/components/dashboard/CourseBuilder";
import { AssignmentBuilder } from "@/components/dashboard/AssignmentBuilder";
import { StudentEditor } from "@/components/dashboard/StudentEditor";

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
    notes?: string;
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
    const [templateName, setTemplateName] = useState('');

    // Student form state
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
    const [studentFormData, setStudentFormData] = useState({
        first_name: '', last_name: '', login: '', password: '', allowed_games: [] as string[]
    });
    const [isSaving, setIsSaving] = useState(false);

    // Student editor state
    const [showStudentEditor, setShowStudentEditor] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
    const [studentActivityLog, setStudentActivityLog] = useState<Array<{
        id: number;
        assignmentId: number;
        assignmentTitle: string;
        exerciseIndex: number;
        trainingId: string;
        trainingName: string;
        parameters: Record<string, unknown>;
        result: Record<string, unknown>;
        passed: boolean;
        completedAt: string;
    }>>([]);

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

    const handleEditStudent = async (student: StudentData) => {
        setEditingStudent(student);
        setShowStudentEditor(true);

        // Load student activity log
        try {
            const studentAssignments = assignments.filter(a => a.studentId === student.id);
            const logEntries: typeof studentActivityLog = [];

            for (const assignment of studentAssignments) {
                const results = await authApi.getAssignmentResults(assignment.id);
                if (results && Array.isArray(results)) {
                    for (const res of results) {
                        const exercise = assignment.exercises?.[res.exerciseIndex];
                        const training = trainings.find(t => t.id === exercise?.trainingId);
                        logEntries.push({
                            id: res.id || Date.now() + Math.random(),
                            assignmentId: assignment.id,
                            assignmentTitle: assignment.title,
                            exerciseIndex: res.exerciseIndex,
                            trainingId: exercise?.trainingId || '',
                            trainingName: training?.name || 'Неизвестный тренинг',
                            parameters: exercise?.parameters || {},
                            result: res.result || {},
                            passed: res.passed,
                            completedAt: res.createdAt || new Date().toISOString()
                        });
                    }
                }
            }

            // Sort by date, newest first
            logEntries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            setStudentActivityLog(logEntries);
        } catch (e) {
            console.error('Failed to load activity log:', e);
            setStudentActivityLog([]);
        }
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
        } catch (e) {
            console.error('Failed to save template:', e);
        }
    };

    const loadTemplate = (template: Template) => {
        setAssignmentFormData(prev => ({
            ...prev,
            exercises: template.exercises
        }));
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
        { id: 'students', label: 'Ученики', icon: Users },
        { id: 'trainings', label: 'Тренинги', icon: BookOpen },
        { id: 'assignments', label: 'Занятия', icon: Calendar },
        { id: 'courses', label: 'Курсы', icon: Folder },
        { id: 'progress', label: 'Прогресс', icon: BarChart2 },
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
                            <h1 className="text-xl font-bold text-gray-800">Личный кабинет школы</h1>
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
                    <div className="text-gray-500 text-center py-12">Загрузка...</div>
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
                <AssignmentBuilder
                    assignmentFormData={assignmentFormData}
                    students={students}
                    trainings={trainings}
                    templates={templates}
                    editingAssignmentId={editingAssignmentId}
                    isSaving={isSaving}
                    onAssignmentFormDataChange={setAssignmentFormData}
                    onClose={() => {
                        setShowAssignmentForm(false);
                        setEditingAssignmentId(null);
                        // Return to StudentEditor if we came from there
                        if (editingStudent) {
                            setShowStudentEditor(true);
                        }
                    }}
                    onSubmit={handleAssignmentSubmit}
                    onSaveAsTemplate={saveAsTemplate}
                    onLoadTemplate={loadTemplate}
                    onUpdateTemplate={updateTemplate}
                    onDeleteTemplate={deleteTemplate}
                    templateName={templateName}
                    onTemplateNameChange={setTemplateName}
                    getTrainingName={getTrainingName}
                />
            )}

            {/* Student Editor - Full Screen */}
            {showStudentEditor && editingStudent && (
                <StudentEditor
                    student={editingStudent}
                    assignments={assignments.filter(a => a.studentId === editingStudent.id)}
                    trainings={trainings}
                    isSaving={isSaving}
                    activityLog={studentActivityLog}
                    onClose={() => { setShowStudentEditor(false); setEditingStudent(null); setStudentActivityLog([]); }}
                    onSaveStudent={async (student) => {
                        setIsSaving(true);
                        try {
                            await authApi.updateStudent(student.id, {
                                first_name: student.first_name,
                                last_name: student.last_name,
                                login: student.login,
                                password: student.password,
                                allowed_games: student.allowed_games,
                                notes: student.notes
                            });
                            await loadData();
                            setShowStudentEditor(false);
                            setEditingStudent(null);
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    onEditAssignment={(assignment) => {
                        setShowStudentEditor(false);
                        // Keep editingStudent to return later
                        setEditingAssignmentId(assignment.id);
                        setAssignmentFormData({
                            studentId: assignment.studentId,
                            title: assignment.title,
                            scheduledDate: assignment.scheduledDate,
                            exercises: assignment.exercises || []
                        });
                        setShowAssignmentForm(true);
                    }}
                    onDeleteAssignment={async (assignmentId) => {
                        await authApi.deleteAssignment(assignmentId);
                        await loadData();
                        setEditingStudent(prev => prev ? { ...prev } : null);
                    }}
                    onToggleGame={(gameId) => {
                        setEditingStudent(prev => {
                            if (!prev) return null;
                            const games = prev.allowed_games || [];
                            return {
                                ...prev,
                                allowed_games: games.includes(gameId)
                                    ? games.filter(g => g !== gameId)
                                    : [...games, gameId]
                            };
                        });
                    }}
                    onNotesChange={(notes) => {
                        setEditingStudent(prev => prev ? { ...prev, notes } : null);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmDeleteModal
                    type={deleteConfirm.type}
                    isDeleting={isDeleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}

            {/* Overwrite Course Confirmation Modal */}
            {overwriteConfirm.show && overwriteConfirm.existingCourse && (
                <OverwriteCourseModal
                    courseName={overwriteConfirm.existingCourse.name}
                    onConfirm={async () => {
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
                    onCancel={() => setOverwriteConfirm({ show: false, existingCourse: null })}
                />
            )}
        </div>
    );
}

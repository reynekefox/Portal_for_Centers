import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, authApi } from "@/lib/auth-store";
import { ArrowLeft, Plus, Pencil, Trash2, LogOut, School, AlertTriangle, Settings, Check, Key, ChevronDown, ChevronUp, Users, BookOpen, Target, TrendingUp, Clock, Award, RefreshCw } from "lucide-react";

interface Training {
    id: string;
    name: string;
    path: string;
}

interface SchoolData {
    id: number;
    title: string;
    login: string;
    password: string;
    allowedTrainings: string[];
}

interface SchoolStatistics {
    studentsCount: number;
    assignmentsTotal: number;
    assignmentsCompleted: number;
    assignmentsInProgress: number;
    assignmentsPending: number;
    exercisesTotal: number;
    exercisesPassed: number;
    exercisesFailed: number;
    successRate: number;
    lastActivity: string;
    createdAt: string;
    topTrainings: { id: string; name: string; count: number }[];
    studentActivity: { id: number; name: string; completedExercises: number; totalAssignments: number; completedAssignments: number }[];
}

export default function SuperAdmin() {
    const [, setLocation] = useLocation();
    const { logout, isAdmin, isLoading: authLoading } = useAuth();

    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ title: '', login: '', password: '', allowedTrainings: [] as string[] });
    const [isSaving, setIsSaving] = useState(false);

    // Training selector modal
    const [showTrainingSelector, setShowTrainingSelector] = useState<number | null>(null);
    const [selectedTrainings, setSelectedTrainings] = useState<string[]>([]);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Expanded school statistics
    const [expandedSchool, setExpandedSchool] = useState<number | null>(null);
    const [schoolStats, setSchoolStats] = useState<Record<number, SchoolStatistics>>({});
    const [loadingStats, setLoadingStats] = useState<number | null>(null);

    // Sync trainings state
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ schools: number; students: number } | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin()) {
            setLocation('/login');
            return;
        }
        loadData();
    }, [authLoading]);

    const loadData = async () => {
        setIsLoading(true);
        const [schoolsData, trainingsData] = await Promise.all([
            authApi.getSchools(),
            authApi.getTrainings()
        ]);
        setSchools(schoolsData);
        setTrainings(trainingsData);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingId) {
                await authApi.updateSchool(editingId, formData);
            } else {
                await authApi.addSchool(formData);
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({ title: '', login: '', password: '', allowedTrainings: [] });
            await loadData();
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (school: SchoolData) => {
        setEditingId(school.id);
        setFormData({
            title: school.title,
            login: school.login,
            password: school.password,
            allowedTrainings: school.allowedTrainings || []
        });
        setShowForm(true);
    };

    const handleOpenTrainingSelector = (school: SchoolData) => {
        setShowTrainingSelector(school.id);
        setSelectedTrainings(school.allowedTrainings || []);
    };

    const handleSaveTrainings = async () => {
        if (!showTrainingSelector) return;
        await authApi.updateSchool(showTrainingSelector, { allowedTrainings: selectedTrainings });
        setShowTrainingSelector(null);
        await loadData();
    };

    const toggleTraining = (trainingId: string) => {
        setSelectedTrainings(prev =>
            prev.includes(trainingId)
                ? prev.filter(t => t !== trainingId)
                : [...prev, trainingId]
        );
    };

    const toggleSelectAllTrainings = () => {
        if (selectedTrainings.length === trainings.length) {
            setSelectedTrainings([]);
        } else {
            setSelectedTrainings(trainings.map(t => t.id));
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setIsDeleting(true);
        try {
            await authApi.deleteSchool(deleteConfirm);
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

    const toggleSchoolExpand = async (schoolId: number) => {
        if (expandedSchool === schoolId) {
            setExpandedSchool(null);
            return;
        }

        setExpandedSchool(schoolId);

        // Load statistics if not cached
        if (!schoolStats[schoolId]) {
            setLoadingStats(schoolId);
            const stats = await authApi.getSchoolStatistics(schoolId);
            if (stats) {
                setSchoolStats(prev => ({ ...prev, [schoolId]: stats }));
            }
            setLoadingStats(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError('Пароли не совпадают');
            return;
        }

        if (passwordForm.new.length < 4) {
            setPasswordError('Новый пароль должен быть минимум 4 символа');
            return;
        }

        setIsChangingPassword(true);
        try {
            const result = await authApi.changeAdminPassword(passwordForm.current, passwordForm.new);
            if (result.success) {
                setShowPasswordModal(false);
                setPasswordForm({ current: '', new: '', confirm: '' });
            } else {
                setPasswordError(result.error || 'Ошибка при смене пароля');
            }
        } catch {
            setPasswordError('Ошибка соединения с сервером');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSyncTrainings = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const response = await fetch('/api/sync-trainings', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setSyncResult({ schools: data.schoolsUpdated, students: data.studentsUpdated });
                await loadData();
                // Hide result after 3 seconds
                setTimeout(() => setSyncResult(null), 3000);
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setIsSyncing(false);
        }
    };

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
                        <h1 className="text-xl font-bold text-gray-800">Панель администратора</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {syncResult && (
                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                ✓ Обновлено: {syncResult.schools} школ, {syncResult.students} учеников
                            </span>
                        )}
                        <button
                            onClick={handleSyncTrainings}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50"
                            title="Дать всем школам и ученикам доступ ко всем тренингам"
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Синхронизация...' : 'Синхронизировать доступ'}
                        </button>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            title="Сменить пароль"
                        >
                            <Key size={18} />
                            Сменить пароль
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <LogOut size={18} />
                            Выйти
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Add School Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Школы</h2>
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', login: '', password: '', allowedTrainings: trainings.map(t => t.id) }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                        <Plus size={18} />
                        Добавить школу
                    </button>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold mb-4">{editingId ? 'Редактировать школу' : 'Добавить школу'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                                        <input
                                            type="text"
                                            value={formData.login}
                                            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                                        <input
                                            type="text"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); setEditingId(null); }}
                                        className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-all"
                                    >
                                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Training Selector Modal */}
                {showTrainingSelector !== null && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
                            <h3 className="text-xl font-bold mb-4">Доступные тренинги</h3>
                            <p className="text-gray-500 text-sm mb-4">Выберите тренинги, которые будут доступны этой школе</p>
                            <label
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all mb-3 ${selectedTrainings.length === trainings.length
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedTrainings.length === trainings.length
                                    ? 'bg-indigo-600'
                                    : 'border-2 border-gray-300'
                                    }`}>
                                    {selectedTrainings.length === trainings.length && (
                                        <Check size={14} className="text-white" />
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedTrainings.length === trainings.length}
                                    onChange={toggleSelectAllTrainings}
                                    className="hidden"
                                />
                                <span className="font-medium">Выбрать всё</span>
                            </label>
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                {trainings.map((training) => (
                                    <label
                                        key={training.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedTrainings.includes(training.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedTrainings.includes(training.id)
                                            ? 'bg-indigo-600'
                                            : 'border-2 border-gray-300'
                                            }`}>
                                            {selectedTrainings.includes(training.id) && (
                                                <Check size={14} className="text-white" />
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedTrainings.includes(training.id)}
                                            onChange={() => toggleTraining(training.id)}
                                            className="hidden"
                                        />
                                        <span className="font-medium">{training.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="text-sm text-gray-500 mb-4">
                                Выбрано: {selectedTrainings.length} из {trainings.length}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowTrainingSelector(null)}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSaveTrainings}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm !== null && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Удалить школу?</h3>
                            <p className="text-gray-500 mb-6">Все ученики и занятия этой школы также будут удалены.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-all"
                                >
                                    {isDeleting ? 'Удаление...' : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Key size={24} className="text-blue-600" />
                                Сменить пароль
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                                    <input
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                                    <input
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                {passwordError && (
                                    <p className="text-red-500 text-sm">{passwordError}</p>
                                )}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordForm({ current: '', new: '', confirm: '' }); }}
                                    disabled={isChangingPassword}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-all"
                                >
                                    {isChangingPassword ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Schools List */}
                {isLoading ? (
                    <div className="text-gray-500 text-center py-12">Загрузка...</div>
                ) : schools.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <School size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Нет добавленных школ</p>
                        <p className="text-sm text-gray-400 mt-2">Нажмите "Добавить школу" чтобы создать первую</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {schools.map((school) => {
                            const stats = schoolStats[school.id];
                            const isExpanded = expandedSchool === school.id;
                            const isLoadingThisStats = loadingStats === school.id;

                            return (
                                <div key={school.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                                    {/* Header - clickable */}
                                    <div
                                        className="p-4 cursor-pointer flex items-center justify-between"
                                        onClick={() => toggleSchoolExpand(school.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-800">{school.title || '(Без названия)'}</h3>
                                                {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Логин: <span className="font-mono bg-gray-100 px-1 rounded">{school.login}</span>
                                                {' · '}
                                                Пароль: <span className="font-mono bg-gray-100 px-1 rounded">{school.password}</span>
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Тренингов: {(school.allowedTrainings || []).length}
                                            </p>
                                        </div>
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleOpenTrainingSelector(school)}
                                                className="p-2 hover:bg-purple-50 rounded-lg transition-all"
                                                title="Настроить тренинги"
                                            >
                                                <Settings size={18} className="text-purple-600" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(school)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                                                title="Редактировать"
                                            >
                                                <Pencil size={18} className="text-gray-600" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(school.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-all"
                                                title="Удалить"
                                            >
                                                <Trash2 size={18} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Statistics */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                                            {isLoadingThisStats ? (
                                                <div className="text-center py-4 text-gray-500">Загрузка статистики...</div>
                                            ) : stats ? (
                                                <div className="space-y-4">
                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                                                <Users size={16} />
                                                                <span className="text-xs font-medium">Учеников</span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-gray-800">{stats.studentsCount}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                                                                <BookOpen size={16} />
                                                                <span className="text-xs font-medium">Заданий</span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-gray-800">{stats.assignmentsTotal}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {stats.assignmentsCompleted} готово · {stats.assignmentsInProgress} в работе
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                                                <Target size={16} />
                                                                <span className="text-xs font-medium">Упражнений</span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-gray-800">{stats.exercisesTotal}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {stats.exercisesPassed} успешно · {stats.exercisesFailed} неуспешно
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                                                <TrendingUp size={16} />
                                                                <span className="text-xs font-medium">Успешность</span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-gray-800">{stats.successRate}%</div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                                <div
                                                                    className="bg-gradient-to-r from-orange-400 to-green-500 h-1.5 rounded-full"
                                                                    style={{ width: `${stats.successRate}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Activity Info */}
                                                    <div className="flex gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            <span>Последняя активность: {formatDate(stats.lastActivity)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Top Trainings */}
                                                    {stats.topTrainings.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                                <Award size={14} className="text-yellow-500" />
                                                                Популярные тренинги
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {stats.topTrainings.map((t, i) => (
                                                                    <span
                                                                        key={t.id}
                                                                        className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs"
                                                                    >
                                                                        <span className="text-gray-400">{i + 1}.</span> {t.name} <span className="text-gray-400">({t.count})</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Student Activity */}
                                                    {stats.studentActivity.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                                <Users size={14} className="text-blue-500" />
                                                                Активность учеников
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {stats.studentActivity.slice(0, 5).map((s) => (
                                                                    <div
                                                                        key={s.id}
                                                                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200"
                                                                    >
                                                                        <span className="text-sm font-medium text-gray-700">{s.name}</span>
                                                                        <div className="flex gap-3 text-xs text-gray-500">
                                                                            <span>{s.completedExercises} упр.</span>
                                                                            <span>{s.completedAssignments}/{s.totalAssignments} заданий</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">Не удалось загрузить статистику</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

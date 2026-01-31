import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, authApi } from "@/lib/auth-store";
import { ArrowLeft, Plus, Pencil, Trash2, LogOut, School, AlertTriangle, Settings, Check } from "lucide-react";

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
                {/* Add School Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Школы</h2>
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', login: '', password: '', allowedTrainings: trainings.map(t => t.id) }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
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
                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all"
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
                                    ? 'bg-blue-600'
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
                                            ? 'bg-blue-600'
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
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
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
                        {schools.map((school) => (
                            <div key={school.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{school.title || '(Без названия)'}</h3>
                                        <p className="text-sm text-gray-500">
                                            Логин: <span className="font-mono bg-gray-100 px-1 rounded">{school.login}</span>
                                            {' · '}
                                            Пароль: <span className="font-mono bg-gray-100 px-1 rounded">{school.password}</span>
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Тренингов: {(school.allowedTrainings || []).length}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
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
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

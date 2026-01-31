import { Check } from "lucide-react";

interface Training {
    id: string;
    name: string;
}

interface StudentFormData {
    first_name: string;
    last_name: string;
    login: string;
    password: string;
    allowed_games: string[];
}

interface StudentFormModalProps {
    isEditing: boolean;
    formData: StudentFormData;
    trainings: Training[];
    isSaving: boolean;
    onFormDataChange: (data: StudentFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onToggleGame: (gameId: string) => void;
    onToggleSelectAll: () => void;
}

export function StudentFormModal({
    isEditing,
    formData,
    trainings,
    isSaving,
    onFormDataChange,
    onSubmit,
    onClose,
    onToggleGame,
    onToggleSelectAll
}: StudentFormModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">
                    {isEditing ? 'Редактировать ученика' : 'Добавить ученика'}
                </h3>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => onFormDataChange({ ...formData, first_name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => onFormDataChange({ ...formData, last_name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                            <input
                                type="text"
                                value={formData.login}
                                onChange={(e) => onFormDataChange({ ...formData, login: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                            <input
                                type="text"
                                value={formData.password}
                                onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Games Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Доступные тренинги</label>
                            <button
                                type="button"
                                onClick={onToggleSelectAll}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {formData.allowed_games.length === trainings.length ? 'Снять все' : 'Выбрать все'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                            {trainings.map((training) => (
                                <label
                                    key={training.id}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${formData.allowed_games.includes(training.id)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.allowed_games.includes(training.id)
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {formData.allowed_games.includes(training.id) && (
                                            <Check size={14} className="text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.allowed_games.includes(training.id)}
                                        onChange={() => onToggleGame(training.id)}
                                        className="hidden"
                                    />
                                    <span className="text-sm">{training.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
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
    );
}

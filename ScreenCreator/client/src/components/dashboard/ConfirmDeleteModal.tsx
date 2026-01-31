import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
    type: 'student' | 'assignment';
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDeleteModal({
    type,
    isDeleting,
    onConfirm,
    onCancel
}: ConfirmDeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                    {type === 'student' ? 'Удалить ученика?' : 'Удалить занятие?'}
                </h3>
                <p className="text-gray-500 mb-6">Это действие нельзя отменить.</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-all"
                    >
                        {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                </div>
            </div>
        </div>
    );
}

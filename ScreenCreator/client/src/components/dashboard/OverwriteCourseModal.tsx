import { AlertTriangle } from "lucide-react";

interface OverwriteCourseModalProps {
    courseName: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

export function OverwriteCourseModal({
    courseName,
    onConfirm,
    onCancel
}: OverwriteCourseModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Перезаписать курс?</h3>
                <p className="text-gray-500 mb-6">
                    Курс "{courseName}" уже существует. Перезаписать его?
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all"
                    >
                        Перезаписать
                    </button>
                </div>
            </div>
        </div>
    );
}

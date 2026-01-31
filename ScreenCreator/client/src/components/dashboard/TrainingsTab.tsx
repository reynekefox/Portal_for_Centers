import { Link } from "wouter";
import { BookOpen, Play } from "lucide-react";

interface Training {
    id: string;
    name: string;
    path: string;
}

interface TrainingsTabProps {
    trainings: Training[];
}

export function TrainingsTab({ trainings }: TrainingsTabProps) {
    if (trainings.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Доступные тренинги</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Нет доступных тренингов</p>
                    <p className="text-sm text-gray-400 mt-2">Администратор ещё не назначил тренинги вашей школе</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Доступные тренинги</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trainings.map((training) => (
                    <Link key={training.id} href={training.path}>
                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
                            <Play size={24} className="text-blue-600 mb-3" />
                            <h3 className="font-bold text-gray-800">{training.name}</h3>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

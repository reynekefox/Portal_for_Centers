import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-store";
import { ArrowLeft, LogIn, User, School, Shield } from "lucide-react";
import { Link } from "wouter";

type LoginMode = 'select' | 'admin' | 'school';

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { login } = useAuth();

    const [mode, setMode] = useState<LoginMode>('select');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'admin') {
                const success = await login('admin', username, password);
                if (success) {
                    setLocation('/super-admin');
                } else {
                    setError('Неверный логин или пароль');
                }
            } else if (mode === 'school') {
                // Try school login first
                let success = await login('school', username, password);
                if (success) {
                    setLocation('/school-dashboard');
                    return;
                }

                // Try student login
                success = await login('student', username, password);
                if (success) {
                    setLocation('/student-dashboard');
                    return;
                }

                setError('Неверный логин или пароль');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (mode === 'select') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="absolute top-6 left-6">
                    <Link href="/">
                        <button className="p-2 hover:bg-white/50 rounded-full transition-all">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                </div>

                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogIn size={40} className="text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Вход в систему</h1>
                        <p className="text-gray-500 mt-2">Выберите тип входа</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('school')}
                            className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border-2 border-transparent hover:border-blue-300"
                        >
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <User size={24} className="text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-800">Школа или Ученик</div>
                                <div className="text-sm text-gray-500">Для школ и учеников</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('admin')}
                            className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border-2 border-transparent hover:border-gray-300"
                        >
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-800">Администратор</div>
                                <div className="text-sm text-gray-500">Управление платформой</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
            <div className="absolute top-6 left-6">
                <button
                    onClick={() => { setMode('select'); setError(''); setUsername(''); setPassword(''); }}
                    className="p-2 hover:bg-white/50 rounded-full transition-all"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${mode === 'admin' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                        {mode === 'admin' ? (
                            <Shield size={40} className="text-gray-600" />
                        ) : (
                            <School size={40} className="text-blue-600" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {mode === 'admin' ? 'Вход для администратора' : 'Вход для школы / ученика'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="Введите логин"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="Введите пароль"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all"
                    >
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                {mode === 'school' && (
                    <p className="text-center mt-6 text-sm text-gray-500">
                        Используйте логин и пароль, полученные от администратора
                    </p>
                )}
            </div>
        </div>
    );
}

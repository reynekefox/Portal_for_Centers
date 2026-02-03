import { Link, useLocation } from "wouter";
import { LogIn, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user, logout, isStudent, isSchool, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Header - Login/User Info */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {user ? (
          <>
            {/* User info */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
              <User size={18} className="text-gray-600" />
              <span className="font-medium text-gray-700">{user.name || user.login}</span>
              {user.role === 'student' && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Ученик</span>
              )}
              {user.role === 'school' && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Школа</span>
              )}
              {user.role === 'admin' && (
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Админ</span>
              )}
            </div>

            {/* Dashboard link for school/admin */}
            {(isSchool() || isAdmin()) && (
              <Link href={isAdmin() ? "/super-admin" : "/school-dashboard"}>
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all" title="Панель управления">
                  <Settings size={20} className="text-gray-600" />
                </button>
              </Link>
            )}

            {/* Dashboard link for students */}
            {isStudent() && (
              <Link href="/student-dashboard">
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium text-sm transition-all">
                  Мои занятия
                </button>
              </Link>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 bg-gray-100 hover:bg-red-100 rounded-full transition-all"
              title="Выйти"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </>
        ) : (
          <Link href="/login">
            <button className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-full font-bold shadow-md hover:bg-blue-600 transition-all">
              <LogIn size={18} />
              Вход
            </button>
          </Link>
        )}
      </div>

      {/* Background Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <img
          src="/logo.png"
          alt=""
          className="w-[600px] h-auto"
        />
      </div>

      {/* Game Buttons */}
      <div className="z-10 flex flex-col items-center space-y-4">
        {/* First row - 3 buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/stroop-test">
            <button className="px-12 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Тест Струпа
            </button>
          </Link>
          <Link href="/schulte-table">
            <button className="px-12 py-3 bg-blue-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Таблица Шульте
            </button>
          </Link>
          <Link href="/munsterberg-test">
            <button className="px-10 py-3 bg-blue-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Тест Мюнстенберга
            </button>
          </Link>
        </div>

        {/* Second row - 2 buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/alphabet-game">
            <button className="px-12 py-3 bg-indigo-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[180px]">
              Алфавит
            </button>
          </Link>
          <Link href="/n-back">
            <button className="px-12 py-3 bg-blue-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[180px]">
              N-back
            </button>
          </Link>
        </div>

        {/* Third row - 4 buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/correction-test">
            <button className="px-10 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Корректурная проба
            </button>
          </Link>
          <Link href="/calcudoku">
            <button className="px-12 py-3 bg-blue-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[180px]">
              Калькудоку
            </button>
          </Link>
          <Link href="/counting-game">
            <button className="px-12 py-3 bg-indigo-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[180px]">
              Считалка
            </button>
          </Link>
          <Link href="/magic-forest">
            <button className="px-12 py-3 bg-green-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[180px]">
              Волшебный лес
            </button>
          </Link>
        </div>

        {/* Fourth row - Speed Reading */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/speed-reading">
            <button className="px-10 py-3 bg-purple-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Турбочтение
            </button>
          </Link>
        </div>

        {/* Fifth row - New Games (3 buttons) */}
        <div className="flex gap-3 flex-wrap justify-center mt-4">
          <Link href="/start-test">
            <button className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Start-контроль
            </button>
          </Link>
          <Link href="/attention-test">
            <button className="px-8 py-3 bg-orange-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Тест на внимание
            </button>
          </Link>
          <Link href="/reaction-test">
            <button className="px-8 py-3 bg-red-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Тест реакции
            </button>
          </Link>
        </div>

        {/* Sixth row - New Games (3 buttons) */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/flexibility-test">
            <button className="px-8 py-3 bg-teal-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Когнитивная гибкость
            </button>
          </Link>
          <Link href="/sequence-test">
            <button className="px-8 py-3 bg-cyan-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Последовательность
            </button>
          </Link>
        </div>

        {/* Seventh row - New Games (3 buttons) */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/tower-of-hanoi">
            <button className="px-8 py-3 bg-amber-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Ханойская башня
            </button>
          </Link>
          <Link href="/vocabulary-test">
            <button className="px-8 py-3 bg-amber-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Словарный запас
            </button>
          </Link>
          <Link href="/auditory-test">
            <button className="px-8 py-3 bg-pink-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Понимание на слух
            </button>
          </Link>
          <Link href="/animal-sound-test">
            <button className="px-8 py-3 bg-pink-600 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Звуки животных
            </button>
          </Link>
        </div>

        {/* Eighth row - Visual Memory, Pairs & Fly */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/visual-memory-test">
            <button className="px-8 py-3 bg-violet-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Цепочки
            </button>
          </Link>
          <Link href="/pairs-test">
            <button className="px-8 py-3 bg-fuchsia-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Пары
            </button>
          </Link>
          <Link href="/fly-test">
            <button className="px-8 py-3 bg-lime-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Муха
            </button>
          </Link>
          <Link href="/anagram-test">
            <button className="px-8 py-3 bg-emerald-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Анаграммы
            </button>
          </Link>
          <Link href="/math-test">
            <button className="px-8 py-3 bg-rose-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Математика
            </button>
          </Link>
          <Link href="/fast-numbers">
            <button className="px-8 py-3 bg-sky-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Быстрые цифры
            </button>
          </Link>
          <Link href="/fast-syllables">
            <button className="px-8 py-3 bg-violet-500 text-white rounded-full font-bold shadow-md hover:opacity-90 transition-all text-lg min-w-[200px]">
              Быстрые слоги
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

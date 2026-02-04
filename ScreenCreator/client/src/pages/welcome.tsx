import { Link, useLocation } from "wouter";
import { LogIn, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user, logout, isStudent, isSchool, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Games organized in alternating rows of 5 and 4
  const rows = [
    // Row 1 - 5 items
    [
      { path: "/stroop-test", name: "Тест Струпа", color: "indigo-600" },
      { path: "/schulte-table", name: "Таблица Шульте", color: "blue-500" },
      { path: "/munsterberg-test", name: "Тест Мюнстенберга", color: "indigo-600" },
      { path: "/alphabet-game", name: "Алфавит", color: "indigo-500" },
      { path: "/n-back", name: "N-back", color: "blue-500" },
    ],
    // Row 2 - 4 items
    [
      { path: "/correction-test", name: "Корректурная проба", color: "indigo-600" },
      { path: "/calcudoku", name: "Калькудоку", color: "blue-500" },
      { path: "/counting-game", name: "Считалка", color: "indigo-500" },
      { path: "/magic-forest", name: "Волшебный лес", color: "blue-600" },
    ],
    // Row 3 - 5 items
    [
      { path: "/speed-reading", name: "Турбочтение", color: "indigo-600" },
      { path: "/start-test", name: "Start-контроль", color: "blue-500" },
      { path: "/attention-test", name: "Тест на внимание", color: "indigo-600" },
      { path: "/reaction-test", name: "Тест реакции", color: "blue-600" },
      { path: "/flexibility-test", name: "Когнитивная гибкость", color: "indigo-500" },
    ],
    // Row 4 - 4 items
    [
      { path: "/sequence-test", name: "Последовательность", color: "blue-500" },
      { path: "/tower-of-hanoi", name: "Ханойская башня", color: "indigo-600" },
      { path: "/vocabulary-test", name: "Словарный запас", color: "blue-500" },
      { path: "/auditory-test", name: "Понимание на слух", color: "indigo-500" },
    ],
    // Row 5 - 5 items
    [
      { path: "/animal-sound-test", name: "Звуки животных", color: "blue-600" },
      { path: "/visual-memory-test", name: "Цепочки", color: "indigo-600" },
      { path: "/pairs-test", name: "Пары", color: "blue-500" },
      { path: "/fly-test", name: "Муха", color: "indigo-500" },
      { path: "/anagram-test", name: "Анаграммы", color: "blue-600" },
    ],
    // Row 6 - 5 items
    [
      { path: "/math-test", name: "Математика", color: "indigo-600" },
      { path: "/fast-numbers", name: "Быстрые цифры", color: "blue-500" },
      { path: "/fast-syllables", name: "Быстрые слоги", color: "indigo-500" },
      { path: "/syllable-picture", name: "Слоги и картинки", color: "blue-600" },
      { path: "/memory-cards", name: "Парные карточки", color: "indigo-600" },
    ],
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      "indigo-600": "bg-indigo-600 hover:bg-indigo-700",
      "indigo-500": "bg-indigo-500 hover:bg-indigo-600",
      "blue-600": "bg-blue-600 hover:bg-blue-700",
      "blue-500": "bg-blue-500 hover:bg-blue-600",
    };
    return colorMap[color] || "bg-indigo-600 hover:bg-indigo-700";
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
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm transition-all">
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
            <button className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:bg-indigo-700 transition-all">
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

      {/* Game Buttons - Alternating rows of 5 and 4 */}
      <div className="z-10 flex flex-col items-center space-y-3">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3 justify-center flex-wrap">
            {row.map((game) => (
              <Link key={game.path} href={game.path}>
                <button
                  className={`px-6 py-3 ${getColorClasses(game.color)} text-white rounded-full font-bold shadow-md transition-all whitespace-nowrap text-lg`}
                >
                  {game.name}
                </button>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

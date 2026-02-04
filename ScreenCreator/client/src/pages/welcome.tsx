import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, User, Settings } from "lucide-react";
import { useAuth, authApi } from "@/lib/auth-store";

interface Training {
  id: string;
  name: string;
  path: string;
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user, logout, isStudent, isSchool, isAdmin } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    try {
      const data = await authApi.getTrainings();
      setTrainings(data);
    } catch (e) {
      console.error('Failed to load trainings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Alternating colors for visual variety
  const getColorClasses = (index: number) => {
    const colors = [
      "bg-indigo-600 hover:bg-indigo-700",
      "bg-blue-500 hover:bg-blue-600",
      "bg-indigo-500 hover:bg-indigo-600",
      "bg-blue-600 hover:bg-blue-700",
    ];
    return colors[index % colors.length];
  };

  // Split trainings into rows of 5 and 4 alternating
  const createRows = (items: Training[]) => {
    const rows: Training[][] = [];
    let i = 0;
    let rowSize = 5;
    while (i < items.length) {
      rows.push(items.slice(i, i + rowSize));
      i += rowSize;
      rowSize = rowSize === 5 ? 4 : 5; // alternate between 5 and 4
    }
    return rows;
  };

  const rows = createRows(trainings);

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
        {isLoading ? (
          <div className="text-gray-400">Загрузка...</div>
        ) : (
          rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-3 justify-center flex-wrap">
              {row.map((training, gameIndex) => (
                <Link key={training.id} href={training.path}>
                  <button
                    className={`px-6 py-3 ${getColorClasses(rowIndex * 5 + gameIndex)} text-white rounded-full font-bold shadow-md transition-all whitespace-nowrap text-lg`}
                  >
                    {training.name}
                  </button>
                </Link>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

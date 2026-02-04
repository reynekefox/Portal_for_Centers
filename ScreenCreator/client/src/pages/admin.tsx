import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, ShieldAlert, Bluetooth, Cpu, Settings, X, FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import ChatLogsViewer from "@/components/ChatLogsViewer";

function StatsSection() {
  const { data: stats } = useQuery<any[]>({ 
    queryKey: ["/api/stats"] 
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Общие визиты</CardTitle>
          <Eye className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {stats?.reduce((acc, curr) => acc + curr.count, 0) || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Всего просмотров страниц
          </p>
        </CardContent>
      </Card>
      {stats?.map((stat) => (
        <Card key={stat.path}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium truncate text-gray-600">{stat.path}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-800">{stat.count}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("systemPrompt") || "";
    });
    const [tempPrompt, setTempPrompt] = useState(systemPrompt);

    const [showChatPromptModal, setShowChatPromptModal] = useState(false);
    const [chatSystemPrompt, setChatSystemPrompt] = useState(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("chatSystemPrompt") || "";
    });
    const [tempChatPrompt, setTempChatPrompt] = useState(chatSystemPrompt);

    const [showCodeModal, setShowCodeModal] = useState(false);
    const [code, setCode] = useState("");
    const [showPromptsMenu, setShowPromptsMenu] = useState(false);
    const [showChatLogs, setShowChatLogs] = useState(false);

    const handleSavePrompt = () => {
        localStorage.setItem("systemPrompt", tempPrompt);
        setSystemPrompt(tempPrompt);
        setShowPromptModal(false);
        setShowPromptsMenu(true);
    };

    const handleOpenPromptModal = () => {
        setTempPrompt(systemPrompt);
        setShowPromptModal(true);
        setShowPromptsMenu(false);
    };

    const handleSaveChatPrompt = () => {
        localStorage.setItem("chatSystemPrompt", tempChatPrompt);
        setChatSystemPrompt(tempChatPrompt);
        setShowChatPromptModal(false);
        setShowPromptsMenu(true);
    };

    const handleOpenChatPromptModal = () => {
        setTempChatPrompt(chatSystemPrompt);
        setShowChatPromptModal(true);
        setShowPromptsMenu(false);
    };

    const handleCodeSubmit = () => {
        if (code === "1152") {
            setIsAuthenticated(true);
            setShowPromptsMenu(true);
            setShowCodeModal(false);
            setCode("");
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "1152") {
            setIsAuthenticated(true);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-[350px] shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            Вход в админ-панель
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Пароль</label>
                                <Input
                                    type="password"
                                    placeholder="Введите код (1152)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded-lg transition-colors">
                                Войти
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/">
                        <button className="p-2 hover:bg-gray-200 rounded-full transition-all bg-white shadow-sm border">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                    <h1 className="text-3xl font-bold text-blue-900">Панель управления</h1>
                </div>

                <div className="mb-12">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Статистика посещений
                  </h2>
                  <StatsSection />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button
                        onClick={() => {
                            sessionStorage.removeItem("current_profile_id");
                            sessionStorage.removeItem("adhd_answers");
                            sessionStorage.removeItem("adhd_comments");
                            sessionStorage.removeItem("report_generating");
                            sessionStorage.removeItem("report_ready");
                            sessionStorage.removeItem("generated_report");
                            localStorage.removeItem("profile_form");
                            window.location.href = "/create-profile";
                        }}
                        className="p-6 bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-2 group"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Settings size={24} />
                        </div>
                        <span className="text-xl font-bold text-gray-800">Создать профиль</span>
                        <span className="text-sm text-gray-500">Начать новое ADHD обследование</span>
                    </button>

                    <Link href="/select-profile">
                        <button className="w-full p-6 bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-2 group">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <span className="text-xl font-bold text-gray-800">Выбор профиля</span>
                            <span className="text-sm text-gray-500">Просмотр существующих анкет</span>
                        </button>
                    </Link>

                    <Link href="/experiments">
                        <button className="w-full p-6 bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-2 group">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                <Cpu size={24} />
                            </div>
                            <span className="text-xl font-bold text-gray-800">Эксперименты</span>
                            <span className="text-sm text-gray-500">Когнитивные тесты и игры</span>
                        </button>
                    </Link>
                </div>

                <div className="mt-12 flex justify-center">
                   <button 
                     onClick={() => setShowPromptsMenu(true)}
                     className="px-8 py-3 bg-blue-900 text-white rounded-full font-bold hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2"
                   >
                     <Settings size={20} />
                     Настройки системы (1152)
                   </button>
                </div>
            </div>

            <div className="fixed bottom-8 right-8 w-32 h-32 opacity-10 pointer-events-none">
                <img src="/logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                    <circle
                        cx="350"
                        cy="350"
                        r="50"
                        fill="transparent"
                        className="pointer-events-auto cursor-default"
                        onClick={() => setShowCodeModal(true)}
                    />
                </svg>
            </div>

            {showPromptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-cyan-200 bg-cyan-50">
                            <h2 className="text-2xl font-bold text-cyan-900">Системный промпт для ИИ</h2>
                            <button onClick={() => { setShowPromptModal(false); setShowPromptsMenu(true); }} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-700">Введите инструкцию для отчетов:</p>
                            <textarea
                                value={tempPrompt}
                                onChange={(e) => setTempPrompt(e.target.value)}
                                className="w-full h-48 px-4 py-3 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <div className="border-t border-cyan-200 p-6 flex gap-3">
                            <button onClick={() => { setShowPromptModal(false); setShowPromptsMenu(true); }} className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-all">Отмена</button>
                            <button onClick={handleSavePrompt} className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}

            {showChatPromptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-cyan-200 bg-cyan-50">
                            <h2 className="text-2xl font-bold text-cyan-900">Системный промпт для чата</h2>
                            <button onClick={() => { setShowChatPromptModal(false); setShowPromptsMenu(true); }} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-700">Введите инструкции для чата:</p>
                            <textarea
                                value={tempChatPrompt}
                                onChange={(e) => setTempChatPrompt(e.target.value)}
                                className="w-full h-48 px-4 py-3 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <div className="border-t border-cyan-200 p-6 flex gap-3">
                            <button onClick={() => { setShowChatPromptModal(false); setShowPromptsMenu(true); }} className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-all">Отмена</button>
                            <button onClick={handleSaveChatPrompt} className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}

            {showCodeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-cyan-200 bg-cyan-50">
                            <h2 className="text-2xl font-bold text-cyan-900">Введите код</h2>
                            <button onClick={() => { setShowCodeModal(false); setCode(""); }} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleCodeSubmit()}
                                placeholder="Введите код"
                                className="w-full px-4 py-3 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                        <div className="border-t border-cyan-200 p-6 flex gap-3">
                            <button onClick={() => { setShowCodeModal(false); setCode(""); }} className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-all">Отмена</button>
                            <button onClick={handleCodeSubmit} className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all">Ввод</button>
                        </div>
                    </div>
                </div>
            )}

            {showPromptsMenu && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-cyan-200 bg-cyan-50">
                            <h2 className="text-2xl font-bold text-cyan-900">Настройки</h2>
                            <button onClick={() => setShowPromptsMenu(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            <button onClick={() => { handleOpenPromptModal(); setShowPromptsMenu(false); }} className="w-full py-3 bg-blue-500 text-white rounded-full text-base font-medium shadow-md hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"><Settings size={18} />Системный промпт</button>
                            <button onClick={() => { handleOpenChatPromptModal(); setShowPromptsMenu(false); }} className="w-full py-3 bg-blue-500 text-white rounded-full text-base font-medium shadow-md hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"><Settings size={18} />СП для чата</button>
                            <button onClick={() => { setShowChatLogs(true); setShowPromptsMenu(false); }} className="w-full py-3 bg-blue-500 text-white rounded-full text-base font-medium shadow-md hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"><FileText size={18} />Логи</button>
                        </div>
                    </div>
                </div>
            )}

            {showChatLogs && (
                <ChatLogsViewer isOpen={showChatLogs} onClose={() => { setShowChatLogs(false); setShowPromptsMenu(true); }} />
            )}
        </div>
    );
}

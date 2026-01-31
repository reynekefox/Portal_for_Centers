import { X } from "lucide-react";
import type { ChatLog } from "@shared/schema";
import { useEffect, useState } from "react";

interface ChatLogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatLogsViewer({ isOpen, onClose }: ChatLogsViewerProps) {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error loading chat logs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const groupedLogs = logs.reduce((acc, log) => {
    const key = `${log.profileId}-${log.profileName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {} as Record<string, ChatLog[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📋 Логи всех чатов</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Загрузка логов...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Нет логов чатов</p>
            </div>
          ) : (
            Object.entries(groupedLogs).map(([profileKey, profileLogs]) => (
              <div key={profileKey} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  👤 {profileLogs[0].profileName}
                </h3>
                <div className="space-y-3">
                  {profileLogs.map((log, idx) => (
                    <div key={idx} className={`p-3 rounded ${
                      log.messageType === "specialist" 
                        ? "bg-purple-100 border-l-4 border-purple-500"
                        : log.sender === "user"
                        ? "bg-blue-100 border-l-4 border-blue-500"
                        : "bg-gray-100 border-l-4 border-gray-400"
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {log.messageType === "specialist" 
                            ? "💬 Специалист"
                            : log.sender === "user"
                            ? "👤 Пользователь"
                            : "🤖 ИИ"
                          }
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(log.createdAt || new Date()).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{log.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

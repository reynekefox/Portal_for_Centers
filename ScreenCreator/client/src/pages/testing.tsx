import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, X, Settings, FileText } from "lucide-react";
import ChatLogsViewer from "@/components/ChatLogsViewer";

const LOGS_PASSWORD = "1152";

export default function Testing() {
  const [activeTestingTab, setActiveTestingTab] = useState<1 | 2 | 3>(1);
  const [testingTimerActive, setTestingTimerActive] = useState(false);
  const [stageCountdown, setStageCountdown] = useState(180);
  const [stage1Passed, setStage1Passed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("eeg_stage1_passed") === "true";
  });
  const [stage2Passed, setStage2Passed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("eeg_stage2_passed") === "true";
  });
  const [stage3Passed, setStage3Passed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("eeg_stage3_passed") === "true";
  });
  const [reportReady, setReportReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("eeg_report_ready") === "true";
  });
  const [gameActive, setGameActive] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameErrors, setGameErrors] = useState(0);
  const [currentShape, setCurrentShape] = useState<{ type: string; color: string } | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameCountdown, setGameCountdown] = useState(300);
  const [, setLocation] = useLocation();

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [code, setCode] = useState("");
  const [showPromptsMenu, setShowPromptsMenu] = useState(false);
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
  const [showChatLogs, setShowChatLogs] = useState(false);

  const nonSquareShapes = ["круг", "треугольник"];
  const colors = ["blue", "green", "purple", "yellow"];

  // Stage countdown effect
  useEffect(() => {
    if (!testingTimerActive) return;

    const countdownInterval = setInterval(() => {
      setStageCountdown(prev => {
        if (prev <= 1) {
          setTestingTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [testingTimerActive]);

  // Game countdown effect
  useEffect(() => {
    if (!gameActive) return;

    const countdownInterval = setInterval(() => {
      setGameCountdown(prev => {
        if (prev <= 1) {
          setGameActive(false);
          setGameFinished(true);
          setCurrentShape(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [gameActive]);

  // Game effect - display shapes every 2 seconds
  useEffect(() => {
    if (!gameActive) return;

    const gameInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setCurrentShape({ type: "квадрат", color: "red" });
      } else {
        const randomShape = nonSquareShapes[Math.floor(Math.random() * nonSquareShapes.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setCurrentShape({ type: randomShape, color: randomColor });
      }
    }, 2000);

    return () => clearInterval(gameInterval);
  }, [gameActive]);

  // Spacebar key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && gameActive) {
        e.preventDefault();
        if (currentShape?.color === "red" && currentShape?.type === "квадрат") {
          setGameScore(prev => prev + 1);
        } else if (currentShape) {
          setGameErrors(prev => prev + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, currentShape]);

  // Save all EEG states to sessionStorage
  // Load stages from DB on mount
  useEffect(() => {
    const profileId = sessionStorage.getItem("eeg_from_profile_id");
    if (profileId) {
      fetch(`/api/profiles/${profileId}`)
        .then(res => res.json())
        .then(data => {
          if (data.completedStages) {
            setStage1Passed(data.completedStages.stage1);
            setStage2Passed(data.completedStages.stage2);
            setStage3Passed(data.completedStages.stage3);
          }
        })
        .catch(err => console.error("Failed to load stages:", err));
    }
  }, []);

  // Save stages to DB when they change
  useEffect(() => {
    const profileId = sessionStorage.getItem("eeg_from_profile_id");
    if (profileId) {
      fetch(`/api/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedStages: {
            stage1: stage1Passed,
            stage2: stage2Passed,
            stage3: stage3Passed,
          },
        }),
      }).catch(err => console.error("Failed to save stages:", err));
    }

    // Keep sessionStorage for fallback/local state
    sessionStorage.setItem("eeg_stage1_passed", String(stage1Passed));
    sessionStorage.setItem("eeg_stage2_passed", String(stage2Passed));
    sessionStorage.setItem("eeg_stage3_passed", String(stage3Passed));
    sessionStorage.setItem("eeg_report_ready", String(reportReady));
  }, [stage1Passed, stage2Passed, stage3Passed, reportReady]);

  const handleClose = () => {
    const fromSource = sessionStorage.getItem("eeg_from_source");
    const profileId = sessionStorage.getItem("eeg_from_profile_id");

    if (fromSource === "profile" && profileId) {
      setLocation(`/profile/${profileId}`);
    } else {
      setLocation("/create-profile");
    }
  };

  const handleCodeSubmit = () => {
    if (code === "1152") {
      setShowPromptsMenu(true);
      setShowCodeModal(false);
      setCode("");
    }
  };

  const handleSavePrompt = () => {
    localStorage.setItem("systemPrompt", tempPrompt);
    setSystemPrompt(tempPrompt);
    setShowPromptModal(false);
  };

  const handleOpenPromptModal = () => {
    setTempPrompt(systemPrompt);
    setShowPromptModal(true);
  };

  const handleSaveChatPrompt = () => {
    localStorage.setItem("chatSystemPrompt", tempChatPrompt);
    setChatSystemPrompt(tempChatPrompt);
    setShowChatPromptModal(false);
  };

  const handleOpenChatPromptModal = () => {
    setTempChatPrompt(chatSystemPrompt);
    setShowChatPromptModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-gray-100 transition-all font-medium"
            data-testid="button-back-testing"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Назад</span>
          </button>
          <h1 className="text-2xl font-bold text-white">Стартовое тестирование СДВГ</h1>
        </div>
        <button
          onClick={() => setShowCodeModal(true)}
          className="w-16 h-16 rounded-full bg-rose-400 text-white flex items-center justify-center text-4xl"
          title="Непрерывное тестирование"
          data-testid="button-infinite-mode"
        >
          ∞
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-6 py-6 border-b border-blue-200 bg-white sticky top-20 z-10 justify-between items-center">
        <div className="flex gap-3">
          {[
            { id: 1, label: "Этап 1", passed: stage1Passed },
            { id: 2, label: "Этап 2", passed: stage2Passed },
            { id: 3, label: "Этап 3", passed: stage3Passed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTestingTab(tab.id as 1 | 2 | 3)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${tab.passed
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : activeTestingTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 border border-cyan-200 hover:border-blue-500"
                }`}
              data-testid={`tab-testing-${tab.id}`}
            >
              {tab.label} {tab.passed && "✓"}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (stage1Passed && stage2Passed && stage3Passed && !reportReady) {
              setReportReady(true);
            }
          }}
          className={`px-8 py-3 rounded-full font-medium transition-all ${stage1Passed && stage2Passed && stage3Passed
              ? reportReady
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-yellow-400 text-white hover:bg-yellow-500"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          disabled={!(stage1Passed && stage2Passed && stage3Passed)}
          data-testid="button-report"
        >
          {stage1Passed && stage2Passed && stage3Passed
            ? reportReady
              ? "Отчет готов"
              : "Отчет формируется"
            : "Отчет"}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {activeTestingTab === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Этап 1: Фон (Открытые глаза)</h3>
              <div className="text-blue-800 mb-4 space-y-2">
                <p><strong>Время:</strong> 3 минуты</p>
                <p><strong>Задача:</strong> Ребенок сидит спокойно, смотрит в одну точку перед собой. Старается не моргать часто и не двигаться. Мыслей нет, просто «холостой ход».</p>
                <p><strong>Что смотрим:</strong> Базовый уровень возбуждения коры.</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-blue-600">
                {String(Math.floor(stageCountdown / 60)).padStart(2, '0')}:{String(stageCountdown % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTestingTimerActive(true)}
                disabled={testingTimerActive}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 disabled:bg-gray-400 transition-all"
                data-testid="button-start-stage-1"
              >
                Старт
              </button>
              <button
                onClick={() => setTestingTimerActive(false)}
                className="flex-1 px-6 py-3 bg-red-400 text-white rounded-full font-medium hover:bg-red-500 transition-all"
                data-testid="button-stop-stage-1"
              >
                Стоп
              </button>
              <button
                onClick={() => {
                  setTestingTimerActive(false);
                  setStageCountdown(180);
                }}
                className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-all"
                data-testid="button-reset-stage-1"
              >
                Сброс
              </button>
              <button
                onClick={() => setStage1Passed(true)}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-all"
                data-testid="button-complete-stage-1"
              >
                Условно пройдено
              </button>
            </div>
          </div>
        )}

        {activeTestingTab === 2 && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-2">Этап 2: Релаксация (Закрытые глаза)</h3>
              <div className="text-purple-800 mb-4 space-y-2">
                <p><strong>Время:</strong> 3 минуты</p>
                <p><strong>Задача:</strong> Ребенок закрывает глаза и расслабляется, но не засыпает. Сидит неподвижно.</p>
                <p><strong>Что смотрим:</strong> Реакцию активации Альфа-ритма.</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-blue-600">
                {String(Math.floor(stageCountdown / 60)).padStart(2, '0')}:{String(stageCountdown % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTestingTimerActive(true)}
                disabled={testingTimerActive}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 disabled:bg-gray-400 transition-all"
                data-testid="button-start-stage-2"
              >
                Старт
              </button>
              <button
                onClick={() => setTestingTimerActive(false)}
                className="flex-1 px-6 py-3 bg-red-400 text-white rounded-full font-medium hover:bg-red-500 transition-all"
                data-testid="button-stop-stage-2"
              >
                Стоп
              </button>
              <button
                onClick={() => {
                  setTestingTimerActive(false);
                  setStageCountdown(180);
                }}
                className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-all"
                data-testid="button-reset-stage-2"
              >
                Сброс
              </button>
              <button
                onClick={() => setStage2Passed(true)}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-all"
                data-testid="button-complete-stage-2"
              >
                Условно пройдено
              </button>
            </div>
          </div>
        )}

        {activeTestingTab === 3 && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-2">Этап 3: Нагрузка (Когнитивный тест)</h3>
              <div className="text-green-800 mb-4 space-y-2">
                <p><strong>Время:</strong> 5 минут</p>
                <p><strong>Задача:</strong> Ребенок выполняет монотонную задачу на внимание. Игра в которой нужно нажимать на кнопку, только если видишь красный квадрат.</p>
                <p><strong>Что смотрим:</strong> Изменение TBR.</p>
              </div>
            </div>

            {!gameActive && !gameFinished && (
              <>
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {String(Math.floor(gameCountdown / 60)).padStart(2, '0')}:{String(gameCountdown % 60).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setGameActive(true);
                      setGameScore(0);
                      setGameErrors(0);
                      setGameCountdown(300);
                    }}
                    disabled={gameActive}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 disabled:bg-gray-400 transition-all"
                    data-testid="button-start-game"
                  >
                    Старт
                  </button>
                  <button
                    onClick={() => {
                      setGameActive(false);
                      setCurrentShape(null);
                    }}
                    className="flex-1 px-6 py-3 bg-red-400 text-white rounded-full font-medium hover:bg-red-500 transition-all"
                    data-testid="button-stop-game"
                  >
                    Стоп
                  </button>
                  <button
                    onClick={() => {
                      setGameActive(false);
                      setGameScore(0);
                      setGameErrors(0);
                      setGameCountdown(300);
                      setCurrentShape(null);
                      setGameFinished(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-all"
                    data-testid="button-reset-game"
                  >
                    Сброс
                  </button>
                  <button
                    onClick={() => setStage3Passed(true)}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-all"
                    data-testid="button-complete-stage-3-prep"
                  >
                    Условно пройдено
                  </button>
                </div>
              </>
            )}

            {gameActive && (
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {String(Math.floor(gameCountdown / 60)).padStart(2, '0')}:{String(gameCountdown % 60).padStart(2, '0')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                    <p className="text-green-700 text-sm font-medium">Правильно</p>
                    <p className="text-3xl font-bold text-green-600">{gameScore}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <p className="text-red-700 text-sm font-medium">Ошибки</p>
                    <p className="text-3xl font-bold text-red-600">{gameErrors}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                  <p className="text-blue-800 font-medium">Нажимайте ПРОБЕЛ на красном квадрате</p>
                </div>

                <div className="bg-gray-800 p-8 rounded-lg flex items-center justify-center min-h-96">
                  {currentShape && (
                    <div
                      data-testid="game-shape"
                      className={`transition-all ${currentShape.color === "red" ? "animate-pulse" : ""}`}
                    >
                      {currentShape.type === "квадрат" && (
                        <div
                          className="w-32 h-32 rounded-lg border-4 border-gray-600"
                          style={{ backgroundColor: currentShape.color, opacity: 0.9 }}
                        />
                      )}
                      {currentShape.type === "круг" && (
                        <div
                          className="w-32 h-32 rounded-full border-4 border-gray-600"
                          style={{ backgroundColor: currentShape.color, opacity: 0.9 }}
                        />
                      )}
                      {currentShape.type === "треугольник" && (
                        <div
                          style={{
                            borderLeft: "2rem solid transparent",
                            borderRight: "2rem solid transparent",
                            borderBottom: `3rem solid ${currentShape.color}`,
                          }}
                        />
                      )}
                    </div>
                  )}
                  {!currentShape && (
                    <div className="text-gray-400 text-center">
                      <p className="text-xl">Ждите фигуры...</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setGameActive(false);
                      setCurrentShape(null);
                    }}
                    className="flex-1 px-6 py-3 bg-red-400 text-white rounded-full font-medium hover:bg-red-500 transition-all"
                    data-testid="button-stop-game-active"
                  >
                    Стоп
                  </button>
                  <button
                    onClick={() => {
                      setGameActive(false);
                      setGameFinished(true);
                    }}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
                    data-testid="button-finish-game"
                  >
                    Завершить
                  </button>
                </div>
              </div>
            )}

            {gameFinished && (
              <div className="space-y-4">
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
                  <h3 className="text-lg font-bold text-green-900 mb-4">Результаты теста</h3>
                  <div className="space-y-3 text-green-800">
                    <p><strong>Правильные нажатия:</strong> <span className="text-2xl font-bold text-green-600">{gameScore}</span></p>
                    <p><strong>Ошибки:</strong> <span className="text-2xl font-bold text-red-600">{gameErrors}</span></p>
                    <p><strong>Статус:</strong> Тест завершен успешно</p>
                  </div>
                </div>

                <button
                  onClick={() => setStage3Passed(true)}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-all"
                  data-testid="button-complete-stage-3"
                >
                  Условно пройдено
                </button>
                <button
                  onClick={() => {
                    setGameActive(false);
                    setGameFinished(false);
                    setGameScore(0);
                    setGameErrors(0);
                    setGameCountdown(300);
                    setCurrentShape(null);
                  }}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
                  data-testid="button-restart-game"
                >
                  Начать заново
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-cyan-300 p-6 bg-blue-50 max-w-3xl mx-auto w-full">
        <button
          onClick={handleClose}
          className="w-full px-6 py-3 bg-gray-300 text-gray-800 rounded-full font-medium hover:bg-gray-400 transition-all"
          data-testid="button-close-testing"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

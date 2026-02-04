import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X, MessageCircle, Send, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import ChatDialog from "@/components/ChatDialog";
import SpecialistChatDialog from "@/components/SpecialistChatDialog";
import logo from "@assets/image_1764465705489.png";
import eegGraph from "@assets/image_1764487229398.png";

const sections = [
  {
    title: "1. Трудности с вниманием и обучением",
    items: [
      { key: "attention_1", text: "Постоянно отвлекается на посторонние шумы или движения." },
      { key: "attention_2", text: "С трудом сидит за уроками, часто встает или ерзает." },
      { key: "attention_3", text: "Допускает много ошибок «по невнимательности» в контрольных и домашних работах." },
      { key: "attention_4", text: "Не может сосредоточиться на объяснениях учителя или родителей." },
      { key: "attention_5", text: "Часто теряет вещи (учебники, ручки, форму)." },
      { key: "attention_6", text: "Требует постоянного контроля при выполнении заданий." },
      { key: "attention_7", text: "Кажется «витающим в облаках», медленно реагирует на обращения." },
    ]
  },
  {
    title: "2. Гиперактивность и импульсивность",
    items: [
      { key: "hyperactivity_1", text: "Постоянно находится в движении (бегает, прыгает, карабкается), даже когда это неуместно." },
      { key: "hyperactivity_2", text: "Чрезмерно разговорчив, не может дождаться своей очереди в разговоре." },
      { key: "hyperactivity_3", text: "Импульсивно выкрикивает ответы, не дослушав вопрос." },
      { key: "hyperactivity_4", text: "Трудно контролирует эмоции, быстро «взрывается»." },
      { key: "hyperactivity_5", text: "Часто конфликтует со сверстниками из-за неконтролируемых реакций." },
      { key: "hyperactivity_6", text: "Сложно следовать правилам в играх." },
    ]
  },
  {
    title: "3. Эмоциональное состояние и мотивация",
    items: [
      { key: "emotional_1", text: "Быстро расстраивается и сдается при малейших неудачах." },
      { key: "emotional_2", text: "Снижена мотивация к учебе и новым занятиям, быстро теряет интерес." },
      { key: "emotional_3", text: "Часто проявляет упрямство и негативизм." },
      { key: "emotional_4", text: "Повышенная тревожность или частые беспричинные страхи." },
      { key: "emotional_5", text: "Наблюдается апатия, вялость, нежелание активно проводить время." },
    ]
  },
  {
    title: "4. Регуляция и сон",
    items: [
      { key: "regulation_1", text: "Испытывает трудности с засыпанием (не может «выключить» мозг)." },
      { key: "regulation_2", text: "Сон поверхностный, часто просыпается ночью." },
      { key: "regulation_3", text: "Утром трудно просыпается, чувствует себя неотдохнувшим." },
      { key: "regulation_4", text: "Наблюдаются тики, навязчивые движения или мышечные зажимы (скрежет зубами)." },
      { key: "regulation_5", text: "Сложно переключаться с активного занятия на спокойное." },
    ]
  }
];

const cleanReportContent = (content: string): string => {
  // Remove all prefixes, headers, and formatting
  let cleaned = content
    // Remove intro texts (English and Russian)
    .replace(/^Here is an analysis of the patient profile and ADHD questionnaire responses[\s\S]*?for parents\/guardians:\s*\n+/m, '')
    .replace(/^Вот анализ[\s\S]*?опекунов:\s*\n+/m, '')
    // Remove profile headers
    .replace(/^\*\*Patient Profile & ADHD Questionnaire Analysis:[\s\S]*?\*\*\s*\n+/m, '')
    // Remove all markdown-style headers
    .replace(/^\*\*\d+\.\s+[^\*]*?\*\*\s*\n+/gm, '')
    // Remove other markdown headers
    .replace(/^#+\s+.*?\n+/gm, '')
    // Remove dividers and ellipsis
    .replace(/^---+\s*\n+/gm, '')
    .replace(/^\.\.\.\s*\n+/gm, '')
    // Remove empty lines at start
    .replace(/^\s*\n+/, '')
    .trim();
  return cleaned;
};

const renderFormattedReport = (content: string) => {
  const lines = content.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmedLine = line.trim();

    // Skip empty lines and separator lines
    if (!trimmedLine || trimmedLine.match(/^\|[\s:|-]+\|$/)) {
      return null;
    }

    // Check if it's a table line
    if (trimmedLine.startsWith("|")) {
      const cells = trimmedLine.split("|").filter((cell) => cell.trim());

      if (cells.length > 0) {
        // Check if it's a markdown separator line (contains only dashes and colons)
        if (cells.every((cell) => cell.trim().match(/^[:|-]+$/))) {
          return null;
        }

        return (
          <div
            key={lineIdx}
            className="flex gap-2 mb-2 border-b border-cyan-200 pb-2"
          >
            {cells.map((cell, idx) => {
              const cellContent = cell.trim();
              const boldParts = [];
              let lastIndex = 0;
              const regex = /\*\*([^*]+)\*\*/g;
              let match;

              while ((match = regex.exec(cellContent)) !== null) {
                if (match.index > lastIndex) {
                  boldParts.push(cellContent.substring(lastIndex, match.index));
                }
                boldParts.push(
                  <strong key={`bold-${lineIdx}-${idx}-${match.index}`} className="font-bold">
                    {match[1]}
                  </strong>
                );
                lastIndex = match.index + match[0].length;
              }

              if (lastIndex < cellContent.length) {
                boldParts.push(cellContent.substring(lastIndex));
              }

              return (
                <div key={idx} className="flex-1 text-xs">
                  {boldParts.length > 0 ? boldParts : cellContent}
                </div>
              );
            })}
          </div>
        );
      }
    }

    // Remove markdown headers (# ## ###) and list markers (* )
    let displayText = trimmedLine.replace(/^#+\s*/, "").replace(/^\*\s+/, "");

    // Parse inline markdown (** for bold) in regular text
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*([^*]+)\*\*/g;
    let match;

    while ((match = regex.exec(displayText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(displayText.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${lineIdx}-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < displayText.length) {
      parts.push(displayText.substring(lastIndex));
    }

    if (parts.length === 0) {
      return (
        <div key={lineIdx} className="mb-2">
          {displayText}
        </div>
      );
    }

    return (
      <div key={lineIdx} className="mb-2">
        {parts}
      </div>
    );
  });
};

export default function ProfileView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [reportDialog, setReportDialog] = useState(false);
  const [reportFetched, setReportFetched] = useState(false);
  const [reportCreated, setReportCreated] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showSpecialistChat, setShowSpecialistChat] = useState(false);
  const [showEEG, setShowEEG] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [eegReportReady, setEegReportReady] = useState(false);
  const [specialistMessage, setSpecialistMessage] = useState("");
  const [specialistMessages, setSpecialistMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${id}`);
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
  });

  // Check if EEG testing is completed
  useEffect(() => {
    if (profile) {
      const stage1Passed = sessionStorage.getItem("eeg_stage1_passed") === "true";
      const stage2Passed = sessionStorage.getItem("eeg_stage2_passed") === "true";
      const stage3Passed = sessionStorage.getItem("eeg_stage3_passed") === "true";
      setEegReportReady(stage1Passed && stage2Passed && stage3Passed);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-xl">
          <div className="mb-4 inline-block p-3 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Профиль не найден</h2>
          <p className="text-sm text-gray-600 mb-6">Выбранный профиль не существует или был удален.</p>
          <button
            onClick={() => setLocation("/select-profile")}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
          >
            Вернуться к профилям
          </button>
        </div>
      </div>
    );
  }

  const genderLabel = profile.gender === "male" ? "Мужской" : "Женский";
  const profileTypeLabel = profile.profileType === "child" ? "Ребенок" : "Взрослый";
  const complaintLabel = profile.complaint === "adhd" ? "СДВГ" : profile.complaint === "other" ? "Иное" : "Не указано";

  const handleGetReport = async () => {
    try {
      setReportGenerating(true);
      setReportFetched(true);

      // Get the actual text descriptions for checked items
      const answers = profile.checklist as Record<string, boolean> || {};
      const checkedItems = Object.entries(answers)
        .filter(([, value]) => value)
        .map(([key]) => {
          for (const section of sections) {
            const item = section.items.find(i => i.key === key);
            if (item) return item.text;
          }
          return key;
        });

      let reportPrompt = `ВАЖНО: Ответь ТОЛЬКО на русском языке. Не используй английский язык.

Тип пациента: ${profile.profileType === "child" ? "Ребенок" : "Взрослый"}
Имя: ${profile.name} ${profile.surname || ""}
Пол: ${profile.gender === "male" ? "Мужской" : "Женский"}
Дата рождения: ${profile.dateOfBirth || "не указана"}

Отмеченные пункты в анкете СДВГ:
${checkedItems.map(text => `- ${text}`).join("\n")}

Комментарии к анкете: ${profile.questionnaireComments || "нет"}
Дополнительные заметки: ${profile.additionalNotes || "нет"}

Проведи анализ на русском языке:
1. Краткую оценку на основе ответов
2. Ключевые наблюдения о возможных признаках СДВГ
3. Рекомендации для следующих шагов
4. Области для дальнейшей оценки`;

      // Add system prompt if it exists
      const systemPrompt = typeof window !== "undefined" ? (localStorage.getItem("systemPrompt") || "") : "";
      if (systemPrompt) {
        reportPrompt = `${systemPrompt}\n\n${reportPrompt}`;
      }

      console.log("Calling /api/analyze endpoint...");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: reportPrompt }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        setErrorMessage("Ошибка при получении отчета: " + (errorData.error || response.statusText));
        setErrorDialog(true);
        setReportFetched(false);
        setReportGenerating(false);
        return;
      }

      const data = await response.json();
      console.log("Analysis received successfully:", data.analysis?.substring?.(0, 100));
      setReportContent(data.analysis);
      setReportCreated(true);
      setReportGenerating(false);

      // Save report to database
      try {
        await fetch(`/api/profiles/${profile.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiAnalysis: data.analysis }),
        });
      } catch (error) {
        console.error("Error saving report to database:", error);
      }

      queryClient.invalidateQueries({ queryKey: ["profile", id] });
      setReportDialog(true);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Ошибка при получении отчета");
      setErrorDialog(true);
      setReportFetched(false);
      setReportGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      {/* Back Button */}
      <button
        onClick={() => setLocation("/select-profile")}
        className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-all"
      >
        <ArrowLeft size={20} />
        Вернуться к профилям
      </button>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain p-4"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {profile.name} {profile.surname}
              </h1>
              <p className="text-lg text-gray-600 mb-4">{profileTypeLabel}</p>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium text-sm">
                  {genderLabel}
                </span>
                {profile.complaint && (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium text-sm">
                    {complaintLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Personal Information */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-cyan-200">
              Личные данные
            </h2>
            <div className="space-y-4">
              {profile.dateOfBirth && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Дата рождения</p>
                  <p className="text-gray-800">{profile.dateOfBirth}</p>
                </div>
              )}
              {profile.parentName && profile.profileType === "child" && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Имя родителя</p>
                  <p className="text-gray-800">{profile.parentName}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Телефон</p>
                  <p className="text-gray-800">{profile.phone}</p>
                </div>
              )}
              {profile.telegramId && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Telegram ID</p>
                  <p className="text-gray-800">{profile.telegramId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-cyan-200">
              Информация о жалобах
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Причина визита</p>
                <p className="text-gray-800">{complaintLabel}</p>
              </div>
              {profile.additionalNotes && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Дополнительные заметки</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{profile.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ADHD Questionnaire Results (if applicable) */}
        {profile.complaint === "adhd" && (
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-cyan-200">
              Результаты анкеты СДВГ
            </h2>

            {/* Checked Items */}
            {profile.checklist && Object.keys(profile.checklist).length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium mb-3">Отмеченные пункты ({Object.values(profile.checklist as Record<string, boolean>).filter(Boolean).length})</p>
                <div className="space-y-3">
                  {sections.map((section) => {
                    const checkedInSection = section.items.filter(item => (profile.checklist as Record<string, boolean>)[item.key]);
                    if (checkedInSection.length === 0) return null;

                    return (
                      <div key={section.title}>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-2">{section.title}</p>
                        <div className="space-y-2 ml-4">
                          {checkedInSection.map((item) => (
                            <div key={item.key} className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700 text-sm leading-relaxed">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments */}
            {profile.questionnaireComments && (
              <div>
                <p className="text-sm text-gray-500 font-medium mb-3">Комментарии к анкете</p>
                <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{profile.questionnaireComments}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis and Chat */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowChatDialog(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-medium hover:bg-purple-600 transition-all flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Диалог с ИИ
            </button>

            <button
              onClick={() => {
                if (profile.aiAnalysis) {
                  setReportDialog(true);
                } else if (profile.checklist && Object.keys(profile.checklist as Record<string, boolean>).length > 0) {
                  handleGetReport();
                } else {
                  // Navigate to questionnaire for existing profile
                  sessionStorage.setItem("current_profile_id", id!);
                  sessionStorage.setItem("questionnaire_source", "profile_view");
                  setLocation("/adhd-questionnaire");
                }
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${profile.aiAnalysis
                ? "bg-green-500 text-white hover:bg-green-600"
                : reportGenerating || reportFetched
                  ? "bg-yellow-400 text-white hover:bg-yellow-500"
                  : profile.checklist && Object.keys(profile.checklist as Record<string, boolean>).length > 0
                    ? "bg-blue-500 text-white hover:bg-indigo-600"
                    : "bg-purple-500 text-white hover:bg-purple-600"
                }`}
              data-testid="button-questionnaire-status"
            >
              {profile.aiAnalysis
                ? "Открыть отчет"
                : reportGenerating || reportFetched
                  ? "Формируется отчет"
                  : profile.checklist && Object.keys(profile.checklist as Record<string, boolean>).length > 0
                    ? "Получить отчет"
                    : "Заполнить анкету"}
            </button>

            {profile.complaint === "adhd" && (
              <button
                onClick={() => {
                  if (eegReportReady) {
                    sessionStorage.setItem("eeg_view_completed", "true");
                  } else {
                    sessionStorage.removeItem("eeg_view_completed");
                  }
                  sessionStorage.setItem("eeg_from_source", "profile");
                  if (id) {
                    sessionStorage.setItem("eeg_from_profile_id", id);
                  }
                  setLocation("/testing");
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${eegReportReady
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
              >
                <Zap size={16} />
                {eegReportReady ? "ЭЭГ-тестирование выполнено" : "ЭЭГ-тестирование"}
              </button>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {reportDialog && profile.aiAnalysis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-cyan-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Отчет</h2>
                <button
                  onClick={() => setReportDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 text-gray-700 text-sm leading-relaxed">
                {renderFormattedReport(cleanReportContent(profile.aiAnalysis))}
              </div>
              <div className="border-t border-cyan-200 p-6">
                <button
                  onClick={() => setReportDialog(false)}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-gray-100 rounded-3xl p-6 text-center">
          <p className="text-xs text-gray-600">
            ID профиля: <span className="font-mono text-gray-700">{profile.id}</span>
          </p>
          {profile.createdAt && (
            <p className="text-xs text-gray-600 mt-2">
              Создано: {new Date(profile.createdAt).toLocaleString("ru-RU")}
            </p>
          )}
        </div>
      </div>

      {/* Chat Dialog */}
      <ChatDialog
        profile={profile}
        isOpen={showChatDialog}
        onClose={() => setShowChatDialog(false)}
      />

      {/* Questionnaire Modal - Shows AI Report */}
      {
        showQuestionnaireModal && profile.complaint === "adhd" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-cyan-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Отчет анализа</h2>
                <button
                  onClick={() => setShowQuestionnaireModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 text-gray-700 text-sm leading-relaxed">
                {profile.aiAnalysis ? renderFormattedReport(cleanReportContent(profile.aiAnalysis)) : (
                  <p className="text-gray-600 text-center py-8">Отчет еще не сформирован</p>
                )}
              </div>
              <div className="border-t border-cyan-200 p-6">
                <button
                  onClick={() => setShowQuestionnaireModal(false)}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Specialist Chat Dialog */}
      <SpecialistChatDialog
        profile={profile}
        isOpen={showSpecialistChat}
        onClose={() => setShowSpecialistChat(false)}
      />

      {/* EEG Examination Dialog */}
      {
        showEEG && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-3xl w-[95vw] h-[95vh] flex flex-col shadow-2xl">
              <div className="bg-white border-b border-cyan-200 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">ЭЭГ-обследование</h2>
                <button
                  onClick={() => setShowEEG(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-blue-50 to-white text-xs">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">📑 Заключение по итогам первичной диагностики</h3>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white p-2 rounded border-l-4 border-blue-500"><p className="text-xs text-gray-600">Пациент</p><p className="font-semibold">Ребенок (возраст 6–12 лет)</p></div>
                    <div className="bg-white p-2 rounded border-l-4 border-blue-500"><p className="text-xs text-gray-600">Дата</p><p className="font-semibold">28.11.2025</p></div>
                    <div className="bg-white p-2 rounded border-l-4 border-purple-500"><p className="text-xs text-gray-600">Сессия</p><p className="font-semibold">Оценочная (30 минут)</p></div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <h4 className="font-bold text-gray-900 mb-2">1. Нейрофизиологический профиль (Что мы увидели)</h4>
                  <p className="text-gray-800 mb-2">Во время диагностики мы зафиксировали следующие показатели:</p>

                  <div className="space-y-2">
                    <div className="bg-red-50 p-2.5 rounded border-l-4 border-red-500">
                      <p className="font-bold text-red-700">TBR (Коэффициент Тета/Бета) = 0.52</p>
                      <p className="text-gray-700 mt-1">Норма: 1.5 – 2.5</p>
                      <p className="text-gray-700 mt-1"><strong>Вывод:</strong> Показатель экстремально низкий. Это говорит о том, что у ребенка нет дефицита активности мозга (как при вялости или мечтательности). Напротив, его кора головного мозга находится в состоянии гиперактивации (перевозбуждения).</p>
                    </div>

                    <div className="bg-green-50 p-2.5 rounded border-l-4 border-green-500">
                      <p className="font-bold text-green-700">Индекс Внимания = 75% (Высокий)</p>
                      <p className="text-gray-700 mt-1">Ребенок способен удерживать фокус длительное время. Жалобы на "невнимательность", скорее всего, связаны не с тем, что он не может сосредоточиться, а с тем, что его внимание неустойчиво из-за внутренней тревоги или отвлекаемости на свои же мысли/импульсы.</p>
                    </div>

                    <div className="bg-yellow-50 p-2.5 rounded border-l-4 border-yellow-500">
                      <p className="font-bold text-yellow-700">Индекс Медитации = 46% (Низкий)</p>
                      <p className="text-gray-700 mt-1">Это ключевая находка. Ребенку крайне сложно расслабиться. Его мозг работает в режиме «бей или беги», даже когда нужно сидеть спокойно.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                  <h4 className="font-bold text-gray-900 mb-2">2. Рабочая гипотеза</h4>
                  <p className="text-gray-800 mb-2">Мы имеем дело не с «Дефицитом внимания» в чистом виде, а с синдромом высокой тревожности и гиперактивности, которые маскируются под СДВГ.</p>
                  <p className="text-gray-800">Ребенок тратит колоссальное количество энергии на то, чтобы просто «быть внимательным» (высокое Внимание), но делает это через напряжение (низкая Медитация). Это приводит к быстрой истощаемости, истерикам и поведенческим срывам.</p>
                </div>

                <div className="bg-indigo-50 p-3 rounded border-l-4 border-indigo-500">
                  <h4 className="font-bold text-gray-900 mb-2">3. Рекомендованный план тренинга (Курс 30 занятий)</h4>
                  <p className="text-gray-800 mb-2">Поскольку мозг и так "разогнан" (низкий TBR), нам категорически не рекомендуется начинать с классической стимуляции внимания (разгона Беты). Это может усилить тревогу и тики.</p>
                  <p className="text-gray-800 mb-2"><strong>Наша цель:</strong> Научить мозг торможению, расслаблению и спокойной концентрации.</p>
                  <p className="text-gray-800 mb-3">Мы назначаем курс из 30 сессий, с акцентом на успокоение и саморегуляцию.</p>

                  <div className="space-y-2">
                    <div className="bg-blue-50 p-2.5 rounded">
                      <p className="font-bold">1. БАЗА: Самоконтроль</p>
                      <p className="text-gray-700"><strong>Протокол №5: Широкополосный тренинг (15 сеансов)</strong></p>
                      <p className="text-gray-700 mt-1"><strong>Задача для ребенка:</strong> «Научись выключать шум». Мы учим нервную систему снижать общее электрическое напряжение. Это уберет импульсивность и суетливость.</p>
                    </div>

                    <div className="bg-green-50 p-2.5 rounded">
                      <p className="font-bold">2. НАВЫК: Релаксация</p>
                      <p className="text-gray-700"><strong>Протокол №2: Alpha-тренинг (10 сеансов)</strong></p>
                      <p className="text-gray-700 mt-1"><strong>Задача для ребенка:</strong> «Научись выдыхать». Учим мозг состоянию "покоя с открытыми глазами". Это поднимет провальный Индекс Медитации и улучшит сон.</p>
                    </div>

                    <div className="bg-amber-50 p-2.5 rounded">
                      <p className="font-bold">3. ЗАКРЕПЛЕНИЕ: Мотивация</p>
                      <p className="text-gray-700"><strong>Протокол №4: FAA (Асимметрия) (5 сеансов)</strong></p>
                      <p className="text-gray-700 mt-1"><strong>Задача для ребенка:</strong> «Включи радость». Легкая стимуляция позитивного настроя в конце курса, чтобы закрепить результат и повысить уверенность в себе.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <h4 className="font-bold text-gray-900 mb-2">4. Почему именно так?</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="font-bold text-gray-900">Почему не TBR (Внимание)?</p>
                      <p className="text-gray-800">У ребенка TBR и так 0.52 (очень низкий). Если мы будем тренировать протокол №1 (понижать Тету/повышать Бету), мы рискуем «перегреть» и без того активный мозг, что может привести к нарушению сна или головным болям. Мы вернемся к этому протоколу только если TBR начнет расти (нормализовываться) на фоне расслабления.</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Почему 50% курса — это Широкополосный тренинг?</p>
                      <p className="text-gray-800">Это самый безопасный и эффективный протокол для детей с типом "Перевозбуждение". Он работает напрямую с причиной проблемы — избыточной активностью нейронов.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded border-2 border-green-300">
                  <h4 className="font-bold text-green-900 mb-2">🎯 Ожидаемый результат</h4>
                  <p className="text-gray-800">К 10-15 занятию мы ожидаем, что Индекс Медитации вырастет с 46% до 60%+, ребенок станет спокойнее, улучшится сон, а "глупые ошибки" в школе уйдут за счет снижения суетливости.</p>
                </div>

                <div className="border-t border-cyan-200 pt-4 mt-4">
                  <img
                    src={eegGraph}
                    alt="ЭЭГ График"
                    className="w-full rounded-lg border border-cyan-200"
                  />
                </div>
              </div>

              <div className="border-t border-cyan-200 p-4">
                <button
                  onClick={() => setShowEEG(false)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}

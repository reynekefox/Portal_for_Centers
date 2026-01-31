import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, X, Settings, FileText } from "lucide-react";
import ChatLogsViewer from "@/components/ChatLogsViewer";

const LOGS_PASSWORD = "1152";

import { ADHD_SECTIONS, ADHD_CHECKLIST_ITEMS } from "@/lib/constants";
import { updateProfile } from "@/lib/api";

export default function ADHDQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [questionnaireComments, setQuestionnaireComments] = useState("");
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

  const sections = ADHD_SECTIONS;

  const handleCheckboxChange = (key: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    const currentProfileId = sessionStorage.getItem("current_profile_id");
    const source = sessionStorage.getItem("questionnaire_source");

    // Always save to DB if we have a profile ID
    if (currentProfileId) {
      try {
        await updateProfile(currentProfileId, {
          checklist: answers,
          questionnaireComments: questionnaireComments
        });
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }

    if (currentProfileId && source !== "create_profile") {
      // Return to Profile View
      sessionStorage.removeItem("current_profile_id");
      sessionStorage.removeItem("questionnaire_source");
      setLocation(`/profile/${currentProfileId}`);
    } else {
      // Return to Create Profile (or default flow)
      sessionStorage.setItem("adhd_answers", JSON.stringify(answers));
      sessionStorage.setItem("adhd_comments", questionnaireComments);
      sessionStorage.setItem("trigger_analysis", "true");
      sessionStorage.setItem("report_generating", "true");

      sessionStorage.removeItem("questionnaire_source");
      // Do NOT remove current_profile_id if it exists, as create-profile needs it to reload data

      setLocation("/create-profile");
    }
  };

  const handleClose = () => {
    const currentProfileId = sessionStorage.getItem("current_profile_id");
    const source = sessionStorage.getItem("questionnaire_source");

    if (currentProfileId && source !== "create_profile") {
      sessionStorage.removeItem("current_profile_id");
      sessionStorage.removeItem("questionnaire_source");
      setLocation(`/profile/${currentProfileId}`);
    } else {
      sessionStorage.removeItem("questionnaire_source");
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
      <div className="sticky top-0 bg-white border-b border-cyan-200 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all"
            data-testid="button-back-questionnaire"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Назад</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Анкета СДВГ</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{section.title}</h2>
            <div className="space-y-3 ml-4">
              {section.items.map((item) => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={answers[item.key] || false}
                    onChange={() => handleCheckboxChange(item.key)}
                    className="mt-1 w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    data-testid={`checkbox-${item.key}`}
                  />
                  <span className="text-sm text-gray-700">{item.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Comments Section */}
        <div className="pt-4 border-t border-cyan-200">
          <label className="block text-lg font-bold text-gray-800 mb-3">Дополнительные комментарии</label>
          <textarea
            value={questionnaireComments}
            onChange={(e) => setQuestionnaireComments(e.target.value)}
            placeholder="Введите дополнительные комментарии..."
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            data-testid="textarea-comments"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-cyan-200 p-6 flex gap-3 max-w-3xl mx-auto w-full">
        <button
          onClick={handleClose}
          className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-full font-medium hover:bg-gray-400 transition-all"
          data-testid="button-close-questionnaire"
        >
          Закрыть
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-all"
          data-testid="button-save-questionnaire"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}

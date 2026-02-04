import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Zap, Send, ArrowLeft, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import ChatDialog from "@/components/ChatDialog";
import SpecialistChatDialog from "@/components/SpecialistChatDialog";
import ProfileDebugDialog from "@/components/ProfileDebugDialog";
import ProfileForm, { ProfileFormData } from "@/components/create-profile/ProfileForm";
import AIReportDialog from "@/components/create-profile/AIReportDialog";
import { createProfile, updateProfile, startAnalysis, getProfile } from "@/lib/api";
import { ADHD_CHECKLIST_ITEMS, ADHD_SECTIONS } from "@/lib/constants";

export default function CreateProfile() {
  const [, setLocation] = useLocation();

  // Form State
  const [formData, setFormData] = useState<ProfileFormData>({
    profileType: "child",
    childGender: "male",
    adultGender: "male",
    name: "",
    surname: "",
    dateOfBirth: "",
    parentName: "",
    telegramId: "",
    phone: "",
    complaint: "",
    additionalNotes: "",
  });

  // Questionnaire State
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [questionnaireComments, setQuestionnaireComments] = useState("");

  // Report State
  const [reportFetched, setReportFetched] = useState(false);
  const [reportCreated, setReportCreated] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [eegReportReady, setEegReportReady] = useState(false);

  // Analysis Trigger State
  const [shouldTriggerAnalysis, setShouldTriggerAnalysis] = useState(false);

  // UI State
  const [successProfileId, setSuccessProfileId] = useState("");
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAIReportDialog, setShowAIReportDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showSpecialistChat, setShowSpecialistChat] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);

  // Update form data helper
  const updateFormData = (data: Partial<ProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Initialize Profile
  useEffect(() => {
    const initProfile = async () => {
      if (successProfileId) return;

      const savedId = sessionStorage.getItem("current_profile_id");

      if (savedId) {
        try {
          const profileData = await getProfile(savedId);

          // Restore form data
          setFormData(prev => ({
            ...prev,
            profileType: profileData.profileType as "child" | "adult",
            childGender: profileData.profileType === "child" ? (profileData.gender as "male" | "female") : "male",
            adultGender: profileData.profileType === "adult" ? (profileData.gender as "male" | "female") : "male",
            name: profileData.name || "",
            surname: profileData.surname || "",
            dateOfBirth: profileData.dateOfBirth || "",
            parentName: profileData.parentName || "",
            telegramId: profileData.telegramId || "",
            phone: profileData.phone || "",
            complaint: profileData.complaint || "",
            additionalNotes: profileData.additionalNotes || "",
          }));

          setSuccessProfileId(savedId);

          if (profileData.aiAnalysis) {
            setReportContent(profileData.aiAnalysis);
            setReportCreated(true);
            setReportGenerating(false);
          }

          if (profileData.checklist) setAnswers(profileData.checklist as Record<string, boolean>);
          if (profileData.checklist) setAnswers(profileData.checklist as Record<string, boolean>);
          if (profileData.questionnaireComments) setQuestionnaireComments(profileData.questionnaireComments);

          if (profileData.completedStages &&
            profileData.completedStages.stage1 &&
            profileData.completedStages.stage2 &&
            profileData.completedStages.stage3) {
            setEegReportReady(true);
          }
        } catch (e) {
          console.warn("Saved profile ID is invalid, clearing:", savedId, e);
          sessionStorage.removeItem("current_profile_id");
        }
      } else {
        // Create initial empty profile
        try {
          const data = await createProfile({
            profileType: formData.profileType,
            gender: formData.profileType === "child" ? formData.childGender : formData.adultGender,
          });
          setSuccessProfileId(data.id);
          sessionStorage.setItem("current_profile_id", data.id);
        } catch (error) {
          console.error("Failed to create initial profile:", error);
        }
      }
    };

    initProfile();
  }, []);

  // Restore from LocalStorage (Questionnaire return flow)
  useEffect(() => {
    const savedAnswers = sessionStorage.getItem("adhd_answers");
    const savedProfile = localStorage.getItem("profile_form");

    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (savedAnswers) {
        setFormData(parsed);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("profile_form", JSON.stringify(formData));
  }, [formData]);

  // Trigger Analysis when ready
  useEffect(() => {
    if (shouldTriggerAnalysis && formData.name && successProfileId) {
      handleGetReport();
      setShouldTriggerAnalysis(false);
    }
  }, [shouldTriggerAnalysis, formData, successProfileId]);

  // Restore Questionnaire Data
  useEffect(() => {
    const savedAnswers = sessionStorage.getItem("adhd_answers");
    if (savedAnswers) {
      const savedComments = sessionStorage.getItem("adhd_comments");
      const savedComplaint = sessionStorage.getItem("adhd_complaint");
      const generatedReport = sessionStorage.getItem("generated_report");
      const reportReady = sessionStorage.getItem("report_ready");
      const reportGeneratingStored = sessionStorage.getItem("report_generating");
      const triggerAnalysis = sessionStorage.getItem("trigger_analysis");

      setAnswers(JSON.parse(savedAnswers));
      // Do NOT remove adhd_answers here immediately, or at least ensure state is set first.
      // Better to keep it until we are sure we don't need it, or rely on the state.
      // Actually, we should clear it to avoid re-reading old data, but only after setting state.
      sessionStorage.removeItem("adhd_answers");

      if (savedComplaint) updateFormData({ complaint: savedComplaint });
      if (savedComments) setQuestionnaireComments(savedComments);

      // Auto-save answers to DB
      if (successProfileId) {
        updateProfile(successProfileId, {
          checklist: JSON.parse(savedAnswers),
          questionnaireComments: savedComments || ""
        }).catch(err => console.error("Auto-save failed:", err));
      }

      if (generatedReport && reportReady === "true") {
        setReportContent(generatedReport);
        setReportCreated(true);
        setReportGenerating(false);
        setShowAIReportDialog(true);
        sessionStorage.removeItem("generated_report");
        sessionStorage.removeItem("report_ready");
      } else if (triggerAnalysis === "true") {
        sessionStorage.removeItem("trigger_analysis");
        setReportGenerating(true);
        setShouldTriggerAnalysis(true);
      } else if (reportGeneratingStored === "true") {
        setReportGenerating(true);
        setReportFetched(true);
      }
    }
  }, [location, successProfileId]); // Add location and successProfileId as dependency

  // Polling for Analysis Status
  useEffect(() => {
    if (!reportGenerating || !successProfileId) return;

    let attempts = 0;
    const maxAttempts = 30; // 60 seconds (2s interval * 30)

    const checkStatus = async () => {
      try {
        attempts++;
        if (attempts > maxAttempts) {
          setReportGenerating(false);
          setErrorMessage("Время ожидания истекло. Попробуйте снова.");
          setErrorDialog(true);
          return true; // Stop polling
        }

        const profile = await getProfile(successProfileId);
        if (profile.analysisStatus === "completed" && profile.aiAnalysis) {
          setReportContent(profile.aiAnalysis);
          setReportCreated(true);
          setReportGenerating(false);
          setShowAIReportDialog(true);
          return true; // Stop polling
        } else if (profile.analysisStatus === "failed") {
          setReportGenerating(false);
          setErrorMessage("Не удалось сгенерировать отчет. Пожалуйста, попробуйте снова.");
          setErrorDialog(true);
          return true; // Stop polling
        }
        return false; // Continue polling
      } catch (e) {
        console.error("Polling error:", e);
        return false;
      }
    };

    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [reportGenerating, successProfileId]);


  const handleGetReport = async () => {
    if (!formData.name) {
      setErrorMessage("Имя обязательно!");
      setErrorDialog(true);
      return;
    }

    setReportFetched(true);

    const profileData = {
      ...formData,
      gender: formData.profileType === "child" ? formData.childGender : formData.adultGender,
      checklist: formData.complaint === "adhd" ? answers : {},
      questionnaireComments: formData.complaint === "adhd" ? questionnaireComments : undefined,
    };

    try {
      let profileId = successProfileId;
      if (profileId) {
        await updateProfile(profileId, profileData);
      } else {
        const newProfile = await createProfile(profileData);
        profileId = newProfile.id;
        setSuccessProfileId(profileId);
        sessionStorage.setItem("current_profile_id", profileId);
      }

      // Generate Prompt
      const checkedItemsText = Object.entries(answers)
        .filter(([, value]) => value)
        .map(([key]) => ADHD_CHECKLIST_ITEMS[key] || key);

      let reportPrompt = `ВАЖНО: Ответь ТОЛЬКО на русском языке. Не используй английский язык.

Тип пациента: ${formData.profileType === "child" ? "Ребенок" : "Взрослый"}
Имя: ${formData.name} ${formData.surname}
Пол: ${formData.profileType === "child" ? formData.childGender : formData.adultGender}
Дата рождения: ${formData.dateOfBirth}

Отмеченные пункты в анкете СДВГ:
${checkedItemsText.map(text => `- ${text}`).join("\n")}

Комментарии к анкете: ${questionnaireComments}
Дополнительные заметки: ${formData.additionalNotes}

Проведи анализ на русском языке:
1. Краткую оценку на основе ответов
2. Ключевые наблюдения о возможных признаках СДВГ
3. Рекомендации для следующих шагов
4. Области для дальнейшей оценки`;

      const systemPrompt = typeof window !== "undefined" ? (localStorage.getItem("systemPrompt") || "") : "";
      if (systemPrompt) {
        reportPrompt = `${systemPrompt}\n\n${reportPrompt}`;
      }

      await startAnalysis(profileId, reportPrompt);
      setReportGenerating(true);

    } catch (error: any) {
      setErrorMessage(error.message || "Ошибка при создании профиля");
      setErrorDialog(true);
      setReportFetched(false);
    }
  };

  const handleSaveAndNavigateToEEG = async () => {
    if (!formData.name) {
      setErrorMessage("Имя обязательно!");
      setErrorDialog(true);
      return;
    }

    try {
      const profileData = {
        ...formData,
        gender: formData.profileType === "child" ? formData.childGender : formData.adultGender,
        checklist: answers,
        questionnaireComments,
      };

      if (successProfileId) {
        await updateProfile(successProfileId, profileData);
        sessionStorage.setItem("eeg_from_profile_id", successProfileId);
      } else {
        const newProfile = await createProfile(profileData);
        setSuccessProfileId(newProfile.id);
        sessionStorage.setItem("current_profile_id", newProfile.id);
        sessionStorage.setItem("eeg_from_profile_id", newProfile.id);
      }

      sessionStorage.setItem("eeg_from_source", "create-profile");
      setLocation("/testing");
    } catch (error: any) {
      setErrorMessage(error.message || "Ошибка при сохранении");
      setErrorDialog(true);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      setErrorMessage("Имя обязательно!");
      setErrorDialog(true);
      return;
    }

    try {
      const profileData = {
        ...formData,
        gender: formData.profileType === "child" ? formData.childGender : formData.adultGender,
        checklist: answers,
        questionnaireComments,
      };

      if (successProfileId) {
        await updateProfile(successProfileId, profileData);
      } else {
        const newProfile = await createProfile(profileData);
        setSuccessProfileId(newProfile.id);
        sessionStorage.setItem("current_profile_id", newProfile.id);
      }

    } catch (error: any) {
      setErrorMessage(error.message || "Ошибка при сохранении");
      setErrorDialog(true);
    }
  };

  // Construct profile object for ChatDialog
  const chatProfile = {
    id: successProfileId,
    name: formData.name,
    surname: formData.surname,
    profileType: formData.profileType,
    gender: formData.profileType === "child" ? formData.childGender : formData.adultGender,
    dateOfBirth: formData.dateOfBirth,
    parentName: formData.parentName,
    telegramId: formData.telegramId,
    phone: formData.phone,
    complaint: formData.complaint,
    additionalNotes: formData.additionalNotes,
    aiAnalysis: reportContent,
  } as any;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-20 bg-white border-r border-cyan-200 flex flex-col items-center py-8 gap-8">
        {reportGenerating ? (
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 cursor-not-allowed">
            <ArrowLeft size={20} />
          </div>
        ) : (
          <Link href="/">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-all cursor-pointer">
              <ArrowLeft size={20} />
            </div>
          </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Создание профиля</h1>
          <p className="text-gray-500 mb-8">Заполните данные пациента для начала работы</p>

          <ProfileForm formData={formData} setFormData={updateFormData} />

          {/* Full Width Textareas and Dropdown */}
          <div className="space-y-4 flex-1">
            <select
              value={formData.complaint}
              onChange={(e) => updateFormData({ complaint: e.target.value })}
              disabled={reportGenerating}
              className={`w-full px-6 py-3 bg-blue-300 text-white rounded-2xl text-sm focus:outline-none transition-all ${reportGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Жалобы/причина визита</option>
              <option value="adhd">СДВГ</option>
              <option value="other">Иное</option>
            </select>

            {formData.complaint === "adhd" && (
              <>
                <button
                  onClick={async () => {
                    if (reportCreated) {
                      setShowAIReportDialog(true);
                    } else {
                      // Auto-save before navigating
                      if (!formData.name) {
                        setErrorMessage("Имя обязательно!");
                        setErrorDialog(true);
                        return;
                      }

                      try {
                        const profileData = {
                          ...formData,
                          gender: formData.profileType === "child" ? formData.childGender : formData.adultGender,
                          checklist: answers,
                          questionnaireComments,
                        };

                        if (successProfileId) {
                          await updateProfile(successProfileId, profileData);
                        } else {
                          const newProfile = await createProfile(profileData);
                          setSuccessProfileId(newProfile.id);
                          sessionStorage.setItem("current_profile_id", newProfile.id);
                        }

                        sessionStorage.setItem("adhd_complaint", formData.complaint);
                        sessionStorage.setItem("questionnaire_source", "create_profile");
                        setLocation("/adhd-questionnaire");
                      } catch (error: any) {
                        setErrorMessage(error.message || "Ошибка при сохранении");
                        setErrorDialog(true);
                      }
                    }
                  }}
                  disabled={(formData.complaint !== "adhd" && !reportCreated) || reportGenerating}
                  className={`w-full py-3 px-6 rounded-2xl text-sm font-medium transition-all ${reportCreated
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : reportGenerating
                      ? "bg-yellow-400 text-white hover:bg-yellow-500"
                      : Object.values(answers).some(v => v)
                        ? "bg-yellow-400 text-white hover:bg-yellow-500"
                        : formData.complaint === "adhd"
                          ? "bg-blue-500 text-white hover:bg-indigo-600"
                          : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                >
                  {reportCreated
                    ? "Отчет сформирован"
                    : reportGenerating
                      ? "Формируется отчет"
                      : Object.values(answers).some(v => v)
                        ? "Анкета заполнена"
                        : "Анкета не заполнена"}
                </button>
                <button
                  onClick={handleSaveAndNavigateToEEG}
                  disabled={formData.complaint !== "adhd" || reportGenerating}
                  className={`w-full py-3 px-6 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${formData.complaint !== "adhd" || reportGenerating
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : eegReportReady
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                >
                  <Zap size={16} />
                  {eegReportReady ? "ЭЭГ-тестирование выполнено" : "ЭЭГ-тестирование"}
                </button>


              </>
            )}

            {/* Get Report Button - Shows when form with checklist is filled */}
            {Object.values(answers).some(v => v) && !reportCreated && !reportGenerating && (
              <button
                onClick={handleGetReport}
                disabled={reportGenerating}
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-2xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-blue-200 animate-in fade-in slide-in-from-bottom-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Сформировать отчет ИИ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Logo and Buttons */}
      <div className="w-80 bg-blue-50 flex flex-col items-center justify-between p-8 border-l border-cyan-200">
        {/* Logo */}
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4 mt-8">
          <div className="w-64 h-44">
            <img
              src="/logo.png"
              alt="Центр развития мозга"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 mb-8">
          <button
            onClick={() => setShowDebugDialog(true)}
            disabled={reportGenerating}
            className={`w-full py-3 px-6 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all ${reportGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            База (Debug)
          </button>
          <button
            onClick={handleSave}
            disabled={reportGenerating}
            className={`w-full py-3 px-6 bg-blue-700 text-white rounded-full text-sm font-medium hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 ${reportGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Сохранить
          </button>
          {reportGenerating ? (
            <button disabled className="w-full py-3 px-6 bg-indigo-600 text-white rounded-full text-sm font-medium opacity-50 cursor-not-allowed shadow-lg shadow-blue-200">
              Назад
            </button>
          ) : (
            <Link href="/">
              <button className="w-full py-3 px-6 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-blue-200">
                Назад
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AIReportDialog
        isOpen={showAIReportDialog}
        onClose={() => setShowAIReportDialog(false)}
        onClear={async () => {
          setReportContent("");
          setReportCreated(false);
          setShowAIReportDialog(false);

          // Clear local questionnaire state
          setAnswers({});
          setQuestionnaireComments("");

          // Clear session storage related to questionnaire
          sessionStorage.removeItem("adhd_answers");
          sessionStorage.removeItem("adhd_comments");
          sessionStorage.removeItem("adhd_complaint");

          // Update profile in DB if it exists
          if (successProfileId) {
            try {
              await updateProfile(successProfileId, {
                checklist: {},
                questionnaireComments: "",
                aiAnalysis: null // Also clear the analysis in DB
              });
            } catch (error) {
              console.error("Failed to clear profile data:", error);
            }
          }
        }}
        reportContent={reportContent}
      />



      <ChatDialog
        isOpen={showChatDialog}
        onClose={() => setShowChatDialog(false)}
        profile={chatProfile}
        currentFormData={formData}
      />

      <SpecialistChatDialog
        isOpen={showSpecialistChat}
        onClose={() => setShowSpecialistChat(false)}
        profile={chatProfile}
      />

      <ProfileDebugDialog
        isOpen={showDebugDialog}
        onClose={() => setShowDebugDialog(false)}
        profileId={successProfileId}
      />

      {/* Error Modal */}
      {errorDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-2xl">
            <div className="text-center">
              <div className="mb-4 inline-block p-3 bg-red-100 rounded-full">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Ошибка</h2>
              <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setErrorDialog(false)}
                className="w-full px-8 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-indigo-600 transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

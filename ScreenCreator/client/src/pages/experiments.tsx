import { Link } from "wouter";
import { ArrowLeft, MessageCircle, Send, Zap, X, Search, Play, FileText } from "lucide-react";
import { useState } from "react";
import ChatDialog from "@/components/ChatDialog";
import SpecialistChatDialog from "@/components/SpecialistChatDialog";
import eegGraph from "@assets/image_1764487229398.png";

export default function Experiments() {
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showSpecialistChat, setShowSpecialistChat] = useState(false);
  const [showEEG, setShowEEG] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white p-4 relative">
      {/* Header - Back Button + Title */}
      <div className="absolute top-4 left-4 flex items-center gap-4">
        <Link href="/">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Эксперименты</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto space-y-8">
        {/* Buttons */}
        <div className="flex flex-col w-full space-y-3">
          <button
            onClick={() => setShowChatDialog(true)}
            className="w-full py-4 bg-gray-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            Чат с ИИ
          </button>
          <button
            onClick={() => setShowSpecialistChat(true)}
            className="w-full py-4 bg-blue-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Чат со специалистом
          </button>
          <button
            onClick={() => setShowEEG(true)}
            className="w-full py-4 bg-gray-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            ЭЭГ-обследование
          </button>
          <Link href="/stroop-test" className="w-full">
            <button
              className="w-full py-4 bg-blue-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-blue-700 transition-all"
              data-testid="button-stroop-test"
            >
              Тест Струпа
            </button>
          </Link>
          <Link href="/schulte-table" className="w-full">
            <button
              className="w-full py-4 bg-orange-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-orange-600 transition-all"
              data-testid="button-schulte-table"
            >
              Таблица Шульте
            </button>
          </Link>
          <Link href="/munsterberg-test" className="w-full">
            <button
              className="w-full py-4 bg-teal-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
            >
              <Search size={20} />
              Тест Мюнстенберга
            </button>
          </Link>
          <Link href="/correction-test" className="w-full">
            <button
              className="w-full py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Корректурная проба (Бурдона)
            </button>
          </Link>

          <Link href="/n-back" className="w-full">
            <button
              className="w-full py-4 bg-purple-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              N-Back
            </button>
          </Link>
          <Link href="/alphabet-game" className="w-full">
            <button
              className="w-full py-4 bg-yellow-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Алфавит
            </button>
          </Link>
          <Link href="/magic-forest" className="w-full">
            <button
              className="w-full py-4 bg-emerald-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Волшебный лес
            </button>
          </Link>
          <Link href="/calcudoku" className="w-full">
            <button
              className="w-full py-4 bg-pink-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-pink-700 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Калькудоку
            </button>
          </Link>
          <Link href="/speed-reading" className="w-full">
            <button
              className="w-full py-4 bg-lime-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-lime-600 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Слова
            </button>
          </Link>
          <Link href="/visual-memory-test" className="w-full">
            <button
              className="w-full py-4 bg-cyan-600 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-cyan-700 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Зрительная Память
            </button>
          </Link>
        </div>
      </div>

      {/* Chat Dialog */}
      {showChatDialog && (
        <ChatDialog
          isOpen={showChatDialog}
          onClose={() => setShowChatDialog(false)}
          profile={{
            id: "temp",
            name: "Гость",
            surname: "",
            profileType: "child",
            gender: "male",
            dateOfBirth: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            phone: "",
            parentName: null,
            telegramId: null,
            complaint: null,
            additionalNotes: null,
            checklist: {},
            questionnaireComments: null,
            aiAnalysis: null,
            analysisStatus: "none",
            completedStages: { stage1: false, stage2: false, stage3: false },
          }}
        />
      )}

      {/* Specialist Chat Dialog */}
      {showSpecialistChat && (
        <SpecialistChatDialog
          isOpen={showSpecialistChat}
          onClose={() => setShowSpecialistChat(false)}
          profile={{
            id: "temp",
            name: "Гость",
            surname: "",
            profileType: "child",
            gender: "male",
            dateOfBirth: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            phone: "",
            parentName: null,
            telegramId: null,
            complaint: null,
            additionalNotes: null,
            checklist: {},
            questionnaireComments: null,
            aiAnalysis: null,
            analysisStatus: "none",
            completedStages: { stage1: false, stage2: false, stage3: false },
          }}
        />
      )}

      {/* EEG Examination Dialog */}
      {showEEG && (
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
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative circles */}
      <div className="absolute bottom-0 right-0 opacity-20 pointer-events-none w-96 h-96">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <circle cx="300" cy="300" r="150" fill="#4a90a4" />
          <circle cx="200" cy="350" r="120" fill="#7ba8c0" />
          <circle cx="350" cy="200" r="100" fill="#a9d6e5" />
        </svg>
      </div>
    </div>
  );
}

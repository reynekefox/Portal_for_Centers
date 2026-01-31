import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import type { Profile } from "@shared/schema";
import specialistPhoto from "@assets/image_1764489229232.png";

interface SpecialistChatDialogProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

const SPECIALIST_STORAGE_KEY = "specialist_chat_messages";

export default function SpecialistChatDialog({ profile, isOpen, onClose }: SpecialistChatDialogProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const savedMessages = localStorage.getItem(SPECIALIST_STORAGE_KEY);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (error) {
          console.error("Error loading specialist messages:", error);
        }
      }
    }
  }, [isOpen]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(SPECIALIST_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          message: userMessage,
          isSpecialist: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setMessages((prev) => [...prev, { role: "specialist", content: data.reply }]);
          
          // Log user message
          try {
            const userLogRes = await fetch("/api/chat-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profileId: profile.id,
                profileName: `${profile.name} ${profile.surname}`,
                messageType: "specialist",
                sender: "user",
                content: userMessage,
              }),
            });
            if (!userLogRes.ok) console.error("Failed to log specialist user message:", userLogRes.status);
          } catch (err) {
            console.error("Error logging specialist user message:", err);
          }
          
          // Log specialist reply
          try {
            const specialistLogRes = await fetch("/api/chat-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profileId: profile.id,
                profileName: `${profile.name} ${profile.surname}`,
                messageType: "specialist",
                sender: "specialist",
                content: data.reply,
              }),
            });
            if (!specialistLogRes.ok) console.error("Failed to log specialist reply:", specialistLogRes.status);
          } catch (err) {
            console.error("Error logging specialist reply:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full h-[70vh] flex flex-col shadow-2xl">
        {/* Header with Specialist Info */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <img 
                src={specialistPhoto} 
                alt="Невролог Татьяна Борисовна" 
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 mx-auto mb-2"
                data-testid="img-specialist-photo"
              />
              <p className="text-sm font-semibold text-gray-800">Невролог</p>
              <p className="text-sm font-bold text-gray-900" data-testid="text-specialist-name">Татьяна Борисовна</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Чат со специалистом</h2>
              <p className="text-sm text-gray-500">{profile.name} {profile.surname}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-close-specialist-chat"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-center">
                Начните диалог со специалистом.<br />
                <span className="text-sm">Невролог ответит на ваши вопросы о развитии и тренингах.</span>
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white max-w-md"
                      : "bg-blue-100 text-gray-800 max-w-xl"
                  }`}
                  data-testid={`message-${msg.role}`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите ваш вопрос..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              data-testid="input-specialist-message"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-all disabled:bg-gray-400"
              data-testid="button-send-specialist-message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

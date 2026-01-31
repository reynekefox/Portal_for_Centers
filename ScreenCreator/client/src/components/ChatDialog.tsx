import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import type { Profile, ChatMessage } from "@shared/schema";

interface ChatDialogProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  currentFormData?: any;
}

const formatMessage = (text: string) => {
  // Replace **text** with strong tag (but not single * for list items)
  const withBold = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Split by double newlines to create paragraphs
  const paragraphs = withBold.split("\n\n");

  return paragraphs.map(paragraph => {
    const lines = paragraph.split("\n");
    let result: any[] = [];
    let inList = false;
    let listItems: string[] = [];

    lines.forEach(line => {
      // Check if line starts with a single * (list item)
      if (line.trim().startsWith("* ")) {
        inList = true;
        const itemText = line.trim().substring(2); // Remove "* "
        listItems.push(itemText);
      } else {
        // If we were in a list and now we're not, close the list
        if (inList && listItems.length > 0) {
          result.push(
            <ul key={`list-${result.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-sm" dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        // Add the regular line if it's not empty
        if (line.trim()) {
          result.push(
            <div key={`line-${result.length}`} dangerouslySetInnerHTML={{ __html: line }} />
          );
        }
      }
    });

    // Close list if it was still open
    if (inList && listItems.length > 0) {
      result.push(
        <ul key={`list-${result.length}`} className="list-disc list-inside my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
    }

    return result;
  });
};

export default function ChatDialog({ profile, isOpen, onClose, currentFormData }: ChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on open
  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setInitialLoading(true);
      if (!profile?.id) {
        console.error("Cannot load messages: profile.id is undefined", profile);
        setInitialLoading(false);
        return;
      }
      const url = `/api/chat/${profile.id}`;
      console.log("Loading messages from:", url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log("Messages loaded:", data);
        setMessages(data);
      } else {
        console.error("Failed to load messages. Status:", response.status);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    if (!profile?.id) {
      console.error("Cannot send message: profile.id is undefined", profile);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistic update: Add user message immediately
    const tempMessageId = Date.now().toString();
    const optimisticMessage: ChatMessage = {
      id: tempMessageId,
      profileId: profile.id,
      role: "user",
      content: userMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const chatSystemPrompt = typeof window !== "undefined" ? (localStorage.getItem("chatSystemPrompt") || "") : "";
      const payload = {
        profileId: profile.id,
        message: userMessage,
        chatSystemPrompt,
        currentFormData, // Pass current form data for context
      };
      console.log("Sending chat message with payload:", { profileId: payload.profileId, messageLength: payload.message.length, hasFormData: !!currentFormData });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Chat response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Chat response data:", data);
        // Replace all messages with server state to ensure consistency and get AI response
        setMessages(data.messages || data || []);

        // Log the user message
        try {
          const logRes = await fetch("/api/chat-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: profile.id,
              profileName: `${profile.name} ${profile.surname}`,
              messageType: "ai",
              sender: "user",
              content: userMessage,
            }),
          });
          if (!logRes.ok) console.error("Failed to log user message:", logRes.status);
        } catch (err) {
          console.error("Error logging user message:", err);
        }

        // Log the assistant's response
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          try {
            const logRes = await fetch("/api/chat-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profileId: profile.id,
                profileName: `${profile.name} ${profile.surname}`,
                messageType: "ai",
                sender: "assistant",
                content: lastMessage.content,
              }),
            });
            if (!logRes.ok) console.error("Failed to log assistant message:", logRes.status);
          } catch (err) {
            console.error("Error logging assistant message:", err);
          }
        }
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => msg.id !== tempMessageId));
        console.error("Failed to send message");
        if (response.status === 404) {
          alert("Профиль не найден. Пожалуйста, обновите страницу.");
        } else {
          alert("Не удалось отправить сообщение");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessageId));
      alert("Ошибка при отправке сообщения");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Диалог с ИИ</h2>
            <p className="text-sm text-gray-500">{profile.name} {profile.surname}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {initialLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Загрузка сообщений...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-center">
                Начните диалог с ИИ.<br />Ассистент имеет доступ ко всей информации профиля.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl ${msg.role === "user"
                    ? "bg-blue-500 text-white max-w-md"
                    : "bg-gray-200 text-gray-800 max-w-xl"
                    }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="text-sm space-y-2">
                      {formatMessage(msg.content).map((para, idx) => (
                        <div key={idx}>
                          {typeof para === "string" ? (
                            <p dangerouslySetInnerHTML={{ __html: para }} />
                          ) : (
                            para
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
              placeholder="Напишите ваше сообщение..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              data-testid="input-chat-message"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-all disabled:bg-gray-400"
              data-testid="button-send-chat"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

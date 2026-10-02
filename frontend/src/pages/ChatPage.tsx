import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { queryChat } from "../utils/api";
import { Send, Bot, User, Loader2, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
  steps?: string[];
  sources?: any[];
  confidence?: number;
}

const QUICK = [
  "How do I admit a patient?",
  "What is the discharge workflow?",
  "Infection control procedures",
  "Code Blue emergency protocol",
  "PPE guidelines for ICU",
  "Medication administration steps",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm MedSOP AI. Ask me anything about hospital SOPs — admission, discharge, infection control, emergency protocols, and more." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const q = (location.state as any)?.query;
    if (q) { setInput(q); setTimeout(() => sendMessage(q), 100); }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await queryChat(q);
      const { answer, steps, sources, confidence } = res.data;
      setMessages(prev => [...prev, { role: "ai", text: answer, steps, sources, confidence }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I couldn't connect to the AI service. Please ensure the backend is running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
      {/* Chat */}
      <div className="col-span-3 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">MedSOP AI Assistant</p>
            <p className="text-xs text-teal-500">● RAG-powered · Real-time SOP retrieval</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "ai" ? "bg-teal-100" : "bg-slate-800"}`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 text-teal-600" /> : <User className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? "bg-teal-500 text-white rounded-tr-sm" : "bg-gray-50 border border-gray-200 text-gray-700 rounded-tl-sm"}`}>
                  {msg.steps ? (
                    <div>
                      <p className="font-semibold mb-2">{msg.text || "Here are the step-by-step instructions:"}</p>
                      <ol className="space-y-2">
                        {msg.steps.map((step, si) => (
                          <li key={si} className="flex gap-2">
                            <span className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{si+1}</span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : msg.text}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((s: any, si: number) => (
                      <span key={si} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md font-medium">{s.sop_title}</span>
                    ))}
                    {msg.confidence && <span className="text-xs text-green-600 font-semibold">✓ {msg.confidence}% confidence</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal-600" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about any SOP procedure..." disabled={loading}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-gray-50 disabled:opacity-60" />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-700">Quick Queries</div>
          {QUICK.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:text-teal-600 hover:bg-teal-50 border-b border-gray-50 last:border-0 transition-colors">
              <ChevronRight className="w-3 h-3 flex-shrink-0" />{q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

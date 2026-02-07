import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Heart, ArrowLeft, Send, Globe, Loader2, Sparkles, RotateCcw, Trash2 } from "lucide-react";

const LANGUAGES = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia",
  "Assamese", "Urdu", "Sanskrit", "Sindhi"
];

const AIChat = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: `Namaste ${user?.name || ""}! I'm your CareLens AI health assistant. I can help you with:\n\n• Symptom analysis & health guidance\n• Understanding your BP readings\n• Finding nearby hospitals\n• Emergency first aid tips\n• General health advice\n\nHow can I help you today? You can ask me in any of the 15 Indian languages!`,
      timestamp: new Date().toISOString()
    }]);
  }, [user]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    
    const userMsg = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await axios.post(`${API}/chat/message`, {
        message: userMsg.content,
        language,
        session_id: sessionId
      }, { headers });

      if (!sessionId) setSessionId(res.data.session_id);
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        error: true
      }]);
    }
    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, language, sessionId, token]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([{
      role: "assistant",
      content: `Starting a new conversation! How can I help you today?`,
      timestamp: new Date().toISOString()
    }]);
  };

  const quickPrompts = [
    "I have a headache and mild fever",
    "What does BP 140/90 mean?",
    "First aid for burns",
    "How to prevent diabetes?"
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F0F4F3]" data-testid="ai-chat-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 flex-shrink-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors" data-testid="chat-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#00C853] to-[#2962FF] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold font-['Outfit'] text-gray-900">CareLens AI</h1>
                <p className="text-[10px] text-gray-500">Health Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Picker */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="flex items-center gap-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#2962FF] px-3 py-1.5 text-xs font-semibold transition-colors"
                data-testid="language-picker-btn"
              >
                <Globe className="w-3.5 h-3.5" />
                {language}
              </button>
              {showLangPicker && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-48 max-h-60 overflow-y-auto z-50" data-testid="language-dropdown">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        language === lang ? "bg-[#00C853] text-white font-semibold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                      data-testid={`lang-option-${lang}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={startNewChat} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors" data-testid="new-chat-btn">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" data-testid="chat-messages">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} chat-bubble-enter`} data-testid={`chat-message-${i}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#00C853] text-white rounded-br-md"
                  : msg.error
                    ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-md"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {sending && (
            <div className="flex justify-start chat-bubble-enter">
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">CareLens is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts (show only when few messages) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setInput(prompt); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="rounded-full bg-white border border-gray-200 hover:border-[#00C853] hover:bg-emerald-50 px-4 py-2 text-sm text-gray-600 transition-colors"
                data-testid={`quick-prompt-${i}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0" data-testid="chat-input-area">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask CareLens AI in ${language}...`}
              rows={1}
              className="w-full rounded-2xl border border-gray-200 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 pr-12 resize-none outline-none bg-gray-50 focus:bg-white transition-colors text-sm"
              style={{ maxHeight: "120px" }}
              data-testid="chat-input"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full bg-[#00C853] hover:bg-[#009624] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:hover:shadow-lg flex-shrink-0"
            data-testid="chat-send-btn"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

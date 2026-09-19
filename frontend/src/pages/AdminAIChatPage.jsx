import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX, Languages, Trash2, Sparkles } from "lucide-react";
import {
  CHAT_LANGUAGES,
  applySpeechVoice,
  getChatCopy,
  getSpeechLocale,
} from "../utils/aiChatI18n";

function AdminAIChatPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const copy = getChatCopy("admin", selectedLanguage);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: copy.welcome,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (soundEnabled) {
        speakText(data.response, selectedLanguage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: copy.connectError, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: copy.welcome,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowSuggestions(true);
  }, [selectedLanguage]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLocale(selectedLanguage);
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        setInput(event.results[0][0].transcript);
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    if (synthesisRef.current) {
      synthesisRef.current.getVoices();
      synthesisRef.current.onvoiceschanged = () => {
        synthesisRef.current.getVoices();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [selectedLanguage]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text, lang) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    applySpeechVoice(utterance, lang);
    utterance.rate = 1;
    utterance.pitch = 1;
    synthesisRef.current.speak(utterance);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled && synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: copy.welcome,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowSuggestions(true);
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
        <p className="text-slate-600">{copy.subtitle}</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Languages className="text-slate-600" size={20} />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {CHAT_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            title={copy.clear}
          >
            <Trash2 size={16} />
            <span>{copy.clear}</span>
          </button>
        </div>

        {showSuggestions && messages.length === 1 && (
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-emerald-600" size={16} />
              <span className="text-sm font-medium text-slate-700">{copy.suggestionsLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {copy.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" ? "bg-blue-600" : "bg-emerald-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="text-white" size={16} />
                ) : (
                  <Bot className="text-white" size={16} />
                )}
              </div>
              <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.timestamp && (
                  <span className="text-xs text-slate-400 mt-1">{formatTimestamp(message.timestamp)}</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="text-white" size={16} />
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-sm text-slate-500">{copy.typing}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={copy.placeholder}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isListening
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={toggleSound}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                soundEnabled
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              <span>{copy.send}</span>
            </button>
          </div>
          {isListening && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {copy.listening}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAIChatPage;

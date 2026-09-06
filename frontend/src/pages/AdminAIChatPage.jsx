import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

function AdminAIChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your Dairy Management Assistant. I can help you with system usage, report interpretation, business decisions, and dairy management best practices."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

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
          language: "en",
        }),
      });

      const data = await response.json();
      const assistantMessage = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Speak the response if sound is enabled
      if (soundEnabled) {
        speakText(data.response, "en-US");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }
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

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

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

  const speakText = (text, lang = 'en-US') => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled && synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Dairy Management AI Assistant</h1>
        <p className="text-slate-600">Get help with system usage, reports, and business decisions</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
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
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="text-white" size={16} />
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here or use voice input..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isListening 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={toggleSound}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                soundEnabled 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              <span>Send</span>
            </button>
          </div>
          {isListening && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Listening... (Speak in English)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAIChatPage;

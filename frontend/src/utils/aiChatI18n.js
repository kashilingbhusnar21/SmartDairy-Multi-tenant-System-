export const CHAT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
];

const SPEECH_LOCALES = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export function getSpeechLocale(lang) {
  return SPEECH_LOCALES[lang] || SPEECH_LOCALES.en;
}

export function applySpeechVoice(utterance, lang) {
  const locale = getSpeechLocale(lang);
  utterance.lang = locale;
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const prefix = locale.split("-")[0].toLowerCase();
  const preferred =
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ||
    (prefix === "mr"
      ? voices.find((voice) => voice.lang.toLowerCase().startsWith("hi"))
      : null);
  if (preferred) {
    utterance.voice = preferred;
  }
}

const adminCopy = {
  en: {
    title: "Dairy Management AI Assistant",
    subtitle: "Get help with system usage, reports, and business decisions",
    welcome:
      "Hello! I'm your Dairy Management Assistant. I can help you with system usage, report interpretation, business decisions, and dairy management best practices.",
    suggestionsLabel: "Quick suggestions:",
    suggestions: [
      "How do I analyze milk collection reports?",
      "What are the best pricing strategies?",
      "How can I improve dairy operations?",
      "Explain the financial dashboard",
    ],
    placeholder: "Type your question here or use voice input... (English)",
    send: "Send",
    clear: "Clear",
    typing: "AI is typing...",
    listening: "Listening... Speak in English",
    connectError: "Sorry, I'm having trouble connecting. Please try again.",
  },
  hi: {
    title: "डेयरी प्रबंधन AI सहायक",
    subtitle: "सिस्टम उपयोग, रिपोर्ट और व्यावसायिक निर्णयों में मदद लें",
    welcome:
      "नमस्ते! मैं आपका डेयरी प्रबंधन सहायक हूँ। सिस्टम उपयोग, रिपोर्ट समझने, व्यावसायिक निर्णयों और डेयरी संचालन में मदद कर सकता हूँ।",
    suggestionsLabel: "त्वरित सुझाव:",
    suggestions: [
      "दूध संग्रह रिपोर्ट कैसे विश्लेषण करूँ?",
      "सबसे अच्छी मूल्य निर्धारण रणनीतियाँ क्या हैं?",
      "डेयरी संचालन कैसे बेहतर करूँ?",
      "वित्तीय डैशबोर्ड समझाएँ",
    ],
    placeholder: "अपना प्रश्न यहाँ लिखें या आवाज़ का उपयोग करें... (हिंदी)",
    send: "भेजें",
    clear: "साफ़ करें",
    typing: "AI लिख रहा है...",
    listening: "सुन रहा हूँ... हिंदी में बोलें",
    connectError: "क्षमा करें, कनेक्शन में समस्या है। कृपया पुनः प्रयास करें।",
  },
  mr: {
    title: "डेअरी व्यवस्थापन AI सहाय्यक",
    subtitle: "सिस्टम वापर, अहवाल आणि व्यावसायिक निर्णयांसाठी मदत घ्या",
    welcome:
      "नमस्कार! मी तुमचा डेअरी व्यवस्थापन सहाय्यक आहे. सिस्टम वापर, अहवाल समजून घेणे, व्यावसायिक निर्णय आणि डेअरी व्यवस्थापनात मदत करू शकतो.",
    suggestionsLabel: "त्वरित सूचना:",
    suggestions: [
      "दूध संकलन अहवाल कसे तपासावे?",
      "उत्तम किंमत धोरणे कोणती आहेत?",
      "डेअरी कामकाज कसे सुधारावे?",
      "आर्थिक डॅशबोर्ड समजावून सांगा",
    ],
    placeholder: "तुमचा प्रश्न येथे लिहा किंवा आवाज वापरा... (मराठी)",
    send: "पाठवा",
    clear: "साफ करा",
    typing: "AI लिहित आहे...",
    listening: "ऐकत आहे... मराठीत बोला",
    connectError: "माफ करा, कनेक्शनमध्ये अडचण आहे. कृपया पुन्हा प्रयत्न करा.",
  },
};

const farmerCopy = {
  en: {
    title: "Dairy AI Assistant",
    subtitle: "Ask about cow health and milk production",
    welcome:
      "Hello! I am your dairy assistant. Ask me about cow health, milk production, nutrition, or any dairy farming question.",
    suggestionsLabel: "Quick suggestions:",
    suggestions: [
      "Tips for cow health",
      "Ways to increase milk production",
      "Cattle feed information",
      "Disease prevention",
    ],
    placeholder: "Type your question here or speak... (English)",
    send: "Send",
    clear: "Clear",
    typing: "AI is typing...",
    listening: "Listening... Speak in English",
    connectError: "Sorry, I'm having trouble connecting. Please try again.",
  },
  hi: {
    title: "डेयरी AI सहायक",
    subtitle: "गायों के स्वास्थ्य और दूध उत्पादन के बारे में पूछें",
    welcome:
      "नमस्ते! मैं आपका डेयरी सहायक हूँ। गायों के स्वास्थ्य, दूध उत्पादन, पोषण या किसी भी डेयरी संबंधित प्रश्न के बारे में पूछें।",
    suggestionsLabel: "त्वरित सुझाव:",
    suggestions: [
      "गाय के स्वास्थ्य के लिए टिप्स",
      "दूध उत्पादन बढ़ाने के तरीके",
      "पशु आहार की जानकारी",
      "बीमारी की रोकथाम",
    ],
    placeholder: "अपना प्रश्न यहाँ टाइप करें या बोलें... (हिंदी)",
    send: "भेजें",
    clear: "साफ़ करें",
    typing: "AI लिख रहा है...",
    listening: "सुन रहा हूँ... हिंदी में बोलें",
    connectError: "क्षमा करें, कनेक्शन में समस्या है। कृपया पुनः प्रयास करें।",
  },
  mr: {
    title: "डेअरी AI सहाय्यक",
    subtitle: "गायींचे आरोग्य आणि दूध उत्पादनाबद्दल विचारा",
    welcome:
      "नमस्कार! मी तुमचा डेअरी सहाय्यक आहे. गायींचे आरोग्य, दूध उत्पादन, आहार किंवा कोणताही डेअरी प्रश्न विचारा.",
    suggestionsLabel: "त्वरित सूचना:",
    suggestions: [
      "गायींच्या आरोग्यासाठी टिप्स",
      "दूध उत्पादन वाढवण्याचे मार्ग",
      "पशुखाद्याची माहिती",
      "रोग प्रतिबंध",
    ],
    placeholder: "तुमचा प्रश्न येथे टाइप करा किंवा बोला... (मराठी)",
    send: "पाठवा",
    clear: "साफ करा",
    typing: "AI लिहित आहे...",
    listening: "ऐकत आहे... मराठीत बोला",
    connectError: "माफ करा, कनेक्शनमध्ये अडचण आहे. कृपया पुन्हा प्रयत्न करा.",
  },
};

export function getChatCopy(role, lang) {
  const pack = role === "farmer" ? farmerCopy : adminCopy;
  return pack[lang] || pack.en;
}

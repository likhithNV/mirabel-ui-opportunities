import React, { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff } from "lucide-react";

const SpeechTextarea = ({
  placeholder,
  value,
  onChange,
  rows = 4,
  className = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.warn("Speech recognition not supported");
      return null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onChange(value + (value ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  // Handle microphone click
  const handleMicrophoneClick = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition();
    }

    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="relative">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full bg-white border border-gray-300 rounded-md pr-10 resize-none ${className}`}
      />
      <button
        type="button"
        onClick={handleMicrophoneClick}
        className={`absolute right-3 top-3 p-1 rounded-full transition-all duration-200 ${
          isListening
            ? "bg-red-100 hover:bg-red-200 animate-pulse"
            : "hover:bg-gray-100"
        }`}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="h-5 w-5 text-red-600" />
        ) : (
          <Mic className="h-5 w-5 text-blue-500" />
        )}
      </button>
      {isListening && (
        <div className="absolute right-12 top-3 text-xs text-red-600 font-medium">
          Recording...
        </div>
      )}
    </div>
  );
};

export default SpeechTextarea;

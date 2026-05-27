import { useState, useEffect, useRef } from "react";

export default function MicButton({
  onTranscript,
  onSpeakingChange
}) {

  const [listening, setListening] =
    useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.lang = "en-US";

    recognition.onresult = (e) => {

      const transcript =
        e.results[0][0].transcript;

      onTranscript?.(transcript);
    };

    recognition.onstart = () => {

      setListening(true);

      onSpeakingChange?.(true);
    };

    recognition.onend = () => {

      setListening(false);

      onSpeakingChange?.(false);
    };

    recognition.onerror = () => {

      setListening(false);

      onSpeakingChange?.(false);
    };

    recognitionRef.current =
      recognition;

  }, []);

  const toggle = () => {

    if (!recognitionRef.current)
      return;

    if (listening) {

      recognitionRef.current.stop();

    } else {

      recognitionRef.current.start();
    }
  };

  return (

    <button
      className="action-btn"
      onClick={toggle}
      title="Mic"

      style={{

        border: listening
          ? "1px solid #ff2222"
          : undefined,

        boxShadow: listening
          ? "0 0 20px rgba(255,0,0,0.45)"
          : undefined,

        background: listening
          ? "rgba(80,0,0,0.55)"
          : undefined,
      }}
    >

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >

        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>

        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>

        <line x1="12" y1="19" x2="12" y2="23"/>

        <line x1="8" y1="23" x2="16" y2="23"/>

      </svg>

    </button>
  );
}
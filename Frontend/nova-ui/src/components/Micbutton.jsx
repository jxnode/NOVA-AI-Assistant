import { useEffect, useRef, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export default function Micbutton({
  onTranscript,
  onSpeakingChange,
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");

  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [wakeStatus, setWakeStatus] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const busyRef = useRef(false);

  const recognitionRef = useRef(null);
  const wakeEnabledRef = useRef(false);
  const waitingForCommandRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onSpeakingChangeRef = useRef(onSpeakingChange);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onSpeakingChangeRef.current = onSpeakingChange;
  }, [onTranscript, onSpeakingChange]);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Preserve the existing microphone recording cleanup.
  useEffect(() => {
    return () => {
      wakeEnabledRef.current = false;

      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;

        try {
          recognitionRef.current.stop();
        } catch {
          // Recognition may already be stopped.
        }
      }

      try {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        // Recorder may already be stopped.
      }

      stopTracks();
    };
  }, []);

  // Optional browser-based NOVA wake-word detection.
  useEffect(() => {
    if (!wakeEnabled) {
      wakeEnabledRef.current = false;
      waitingForCommandRef.current = false;
      return undefined;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    // Support is checked in toggleWake(); this is only a safety guard.
    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;
    wakeEnabledRef.current = true;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    let restartTimer = null;

    recognition.onstart = () => {
      setWakeStatus('Listening for "NOVA"...');
    };

    recognition.onresult = (event) => {
      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        if (!event.results[i].isFinal) continue;

        const phrase = event.results[i][0].transcript.trim();

        if (!phrase) continue;

        // Do not send voice commands while recording or transcribing.
        if (busyRef.current) continue;

        // The next recognized phrase after "NOVA" is the command.
        if (waitingForCommandRef.current) {
          waitingForCommandRef.current = false;

          setWakeStatus(`Command recognized: ${phrase}`);
          onTranscriptRef.current?.(phrase);
          continue;
        }

        const match = /\b(?:hey\s+)?nova\b/i.exec(phrase);

        if (!match) continue;

        // Handle "NOVA, tell me a joke" in one phrase.
        const command = phrase
          .slice(match.index + match[0].length)
          .replace(/^[\s,.:!?-]+/, "")
          .trim();

        if (command) {
          setWakeStatus(`Command recognized: ${command}`);
          onTranscriptRef.current?.(command);
        } else {
          waitingForCommandRef.current = true;
          setWakeStatus("NOVA activated. Say your command...");
        }
      }
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        wakeEnabledRef.current = false;
        setWakeEnabled(false);
        setWakeStatus(
          "Microphone permission denied. Check browser settings."
        );
      } else if (
        event.error !== "no-speech" &&
        event.error !== "aborted"
      ) {
        setWakeStatus(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (!wakeEnabledRef.current) return;

      // Give the browser a moment before restarting recognition.
      restartTimer = window.setTimeout(() => {
        if (!wakeEnabledRef.current) return;

        try {
          recognition.start();
        } catch {
          // The browser may already be restarting.
        }
      }, 300);
    };

    let startFailTimer = null;

    try {
      recognition.start();
    } catch {
      wakeEnabledRef.current = false;

      // Report the failure from a callback, not synchronously inside the effect.
      startFailTimer = window.setTimeout(() => {
        setWakeEnabled(false);
        setWakeStatus("Could not start wake-word recognition.");
      }, 0);
    }

    return () => {
      wakeEnabledRef.current = false;
      waitingForCommandRef.current = false;

      if (restartTimer !== null) {
        window.clearTimeout(restartTimer);
      }

      if (startFailTimer !== null) {
        window.clearTimeout(startFailTimer);
      }

      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onstart = null;

      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [wakeEnabled]);

  // Clear the previous wake-word message whenever the user flips the switch.
  // (Doing this in the click handler rather than in the effect above also keeps
  // permission / unsupported-browser messages visible instead of wiping them.)
  const toggleWake = () => {
    setWakeStatus("");

    if (
      !wakeEnabled &&
      !(window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      setWakeStatus(
        "Wake-word recognition is unsupported here. Try Chrome or Edge."
      );
      return;
    }

    setWakeEnabled((enabled) => !enabled);
  };

  // Existing MediaRecorder + FastAPI transcription implementation.
  const startRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setStatus("Audio recording is not supported in this browser.");
      return;
    }

    try {
      setStatus("Requesting microphone...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const preferredType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setStatus("Recording failed. Check your microphone and try again.");
        setRecording(false);
        busyRef.current = false;
        onSpeakingChangeRef.current?.(false);
        stopTracks();
      };

      recorder.onstop = async () => {
        setRecording(false);
        setProcessing(true);
        onSpeakingChangeRef.current?.(true);
        setStatus("Transcribing your speech...");

        try {
          const audioBlob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          if (!audioBlob.size) {
            throw new Error("No audio was recorded. Try again.");
          }

          const extension = audioBlob.type.includes("mp4")
            ? "mp4"
            : audioBlob.type.includes("ogg")
              ? "ogg"
              : "webm";

          const formData = new FormData();
          formData.append("file", audioBlob, `recording.${extension}`);

          const response = await fetch(`${API_URL}/transcribe/`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.detail ||
                `Transcription failed (HTTP ${response.status}).`
            );
          }

          const transcript = data.text?.trim();

          if (!transcript) {
            setStatus("No speech detected. Try recording again.");
            return;
          }

          setStatus(`Recognized: ${transcript}`);
          onTranscriptRef.current?.(transcript);
        } catch (error) {
          console.error("NOVA transcription error:", error);
          setStatus(error.message || "Could not transcribe the recording.");
        } finally {
          setProcessing(false);
          busyRef.current = false;
          onSpeakingChangeRef.current?.(false);
          stopTracks();
        }
      };

      busyRef.current = true;
      recorder.start();

      setRecording(true);
      setStatus("Recording... click the mic again to finish.");
      onSpeakingChangeRef.current?.(true);
    } catch (error) {
      console.error("NOVA microphone error:", error);

      const message =
        error.name === "NotAllowedError"
          ? "Microphone permission denied. Allow access in browser settings."
          : error.name === "NotFoundError"
            ? "No microphone found. Connect a microphone and try again."
            : error.message || "Could not start microphone recording.";

      setStatus(message);
      setRecording(false);
      busyRef.current = false;
      onSpeakingChangeRef.current?.(false);
      stopTracks();
    }
  };

  const toggleRecording = () => {
    if (processing || busyRef.current) {
      if (
        recording &&
        recorderRef.current?.state === "recording"
      ) {
        setStatus("Finishing recording...");
        recorderRef.current.stop();
      }
      return;
    }

    if (
      recording &&
      recorderRef.current?.state === "recording"
    ) {
      setStatus("Finishing recording...");
      recorderRef.current.stop();
      return;
    }

    void startRecording();
  };

  // Layout note: .mic-control uses display: contents (see index.css), so the
  // mic button sits in the same row as the camera and keyboard buttons and the
  // wake-word panel wraps onto its own centred row underneath them.
  return (
    <div className="mic-control">
      <button
        type="button"
        className="action-btn"
        onClick={toggleRecording}
        disabled={processing}
        title={
          processing
            ? "Transcribing speech"
            : recording
              ? "Stop recording"
              : "Start recording"
        }
        aria-label={
          processing
            ? "Transcribing speech"
            : recording
              ? "Stop recording"
              : "Start recording"
        }
        aria-pressed={recording}
        style={{
          border: recording ? "1px solid #ff2222" : undefined,
          boxShadow: recording
            ? "0 0 20px rgba(255,0,0,0.45)"
            : undefined,
          background: recording
            ? "rgba(80,0,0,0.55)"
            : undefined,
          opacity: processing ? 0.65 : 1,
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
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      <div className="wake-panel">
        <button
          type="button"
          className={`wake-toggle${wakeEnabled ? " is-active" : ""}`}
          onClick={toggleWake}
          aria-pressed={wakeEnabled}
          aria-label="NOVA wake word listening"
          title={
            wakeEnabled
              ? "Pause browser wake-word listening"
              : "Start browser wake-word listening"
          }
        >
          <span className="wake-dot" aria-hidden="true" />
          <span className="wake-label">Wake Word</span>
          <span className="wake-state">
            {wakeEnabled ? "Active" : "Paused"}
          </span>
          <span className="wake-track" aria-hidden="true">
            <span className="wake-thumb" />
          </span>
        </button>

        {wakeStatus && (
          <span
            className="wake-message"
            role="status"
            aria-live="polite"
          >
            {wakeStatus}
          </span>
        )}

        {status && (
          <span
            className={`wake-message${recording ? " recording" : ""}`}
            role="status"
            aria-live="polite"
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
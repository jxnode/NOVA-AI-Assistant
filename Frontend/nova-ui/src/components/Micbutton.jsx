
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

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        // Recorder may already be stopped.
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
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
        onSpeakingChange?.(false);
        stopTracks();
      };

      recorder.onstop = async () => {
        setRecording(false);
        setProcessing(true);
        onSpeakingChange?.(true);
        setStatus("Transcribing your speech...");

        try {
          const audioBlob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          if (!audioBlob.size) {
            throw new Error("No audio was recorded. Try speaking again.");
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
              data.detail || `Transcription failed (HTTP ${response.status}).`
            );
          }

          const transcript = data.text?.trim();

          if (!transcript) {
            setStatus("No speech detected. Try recording again.");
            return;
          }

          setStatus(`Recognized: ${transcript}`);
          onTranscript?.(transcript);
        } catch (error) {
          console.error("NOVA transcription error:", error);
          setStatus(error.message || "Could not transcribe the recording.");
        } finally {
          setProcessing(false);
          busyRef.current = false;
          onSpeakingChange?.(false);
          stopTracks();
        }
      };

      busyRef.current = true;
      recorder.start();
      setRecording(true);
      setStatus("Recording... click the mic again to finish.");
      onSpeakingChange?.(true);
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
      onSpeakingChange?.(false);
      stopTracks();
    }
  };

  const toggleRecording = () => {
    if (processing || busyRef.current) {
      if (recording && recorderRef.current?.state === "recording") {
        setStatus("Finishing recording...");
        recorderRef.current.stop();
      }
      return;
    }

    if (recording && recorderRef.current?.state === "recording") {
      setStatus("Finishing recording...");
      recorderRef.current.stop();
      return;
    }

    void startRecording();
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
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

      {status && (
        <span
          role="status"
          aria-live="polite"
          style={{
            marginTop: 8,
            maxWidth: 240,
            fontSize: 11,
            lineHeight: 1.5,
            textAlign: "center",
            overflowWrap: "anywhere",
            color: recording ? "#ff7777" : "inherit",
          }}
        >
          {status}
        </span>
      )}
    </div>
  );
}


import "./index.css";
import { useState, useEffect, useRef } from "react";
import AIOrb from "./components/AIOrb";
import MessageBubble, { TypingIndicator } from "./components/MessageBubble";
import MicButton from "./components/Micbutton.jsx";
import { speak, stopSpeaking } from "./utils/speak";

// Local development uses localhost.
// For deployment, set VITE_API_URL to your deployed backend URL.
const API_URL = (
 import.meta.env.VITE_API_URL || "https://nova-ai-assistant-backend-o1rp.onrender.com"
).replace(/\/$/, "");
function useTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function useUptime() {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function App() {
  const startupGreetingDone = useRef(false);
  const startupGreetingPending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let retryHandler = null;

    const playStartupGreeting = async () => {
      if (startupGreetingDone.current || startupGreetingPending.current) {
        return;
      }

      startupGreetingPending.current = true;

      const played = await speak(
        "Welcome back, boss. N.O.V.A systems online. How can I assist you today?"
      );

      startupGreetingPending.current = false;

      if (cancelled) return;

      if (played) {
        startupGreetingDone.current = true;

        if (retryHandler) {
          window.removeEventListener("pointerdown", retryHandler);
          window.removeEventListener("keydown", retryHandler);
        }
      }
    };

    const retryGreeting = () => {
      if (!startupGreetingDone.current) {
        void playStartupGreeting();
      }
    };

    retryHandler = retryGreeting;

    const timer = window.setTimeout(() => {
      void playStartupGreeting();
    }, 800);

    window.addEventListener("pointerdown", retryHandler);
    window.addEventListener("keydown", retryHandler);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", retryHandler);
      window.removeEventListener("keydown", retryHandler);
    };
  }, []);
  const now = useTime();
  const uptime = useUptime();

  const [messages, setMessages] = useState([
    {
      sender: "nova",
      text: "Hello. N.O.V.A systems online. How can I assist you today?",
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [active, setActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const msgEnd = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  const [stats, setStats] = useState({
    cpu: 0,
    ram_used_gb: 0,
    ram_percent: 0,
    disk_used_gb: 0,
    disk_total_gb: 0,
    disk_percent: 0,
  });

  // Fetch system statistics from the backend.
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // The backend may be unavailable during startup.
      }
    };

    fetchStats();
    const timer = setInterval(fetchStats, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    const stopWords = [
      "stop",
      "wait",
      "cancel",
      "pause",
      "shut up",
      "enough",
      "quiet",
      "silence",
    ];

    if (stopWords.some((word) => text.toLowerCase().includes(word))) {
      abortRef.current?.abort();
      requestIdRef.current += 1;
      stopSpeaking();
      setIsTyping(false);
      setActive(false);
      setInput("");

      setMessages((current) => [
        ...current,
        { sender: "user", text, time: getTime() },
        {
          sender: "nova",
          text: "Understood. Standing by.",
          time: getTime(),
        },
      ]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;

    stopSpeaking();
    setIsTyping(true);
    setActive(true);
    setMessages((current) => [
      ...current,
      { sender: "user", text, time: getTime() },
    ]);
    setInput("");

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      if (thisRequestId !== requestIdRef.current) return;

      if (!response.body) {
        throw new Error("The backend returned an empty response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";

      setIsTyping(false);
      setMessages((current) => [
        ...current,
        { sender: "nova", text: "", time: getTime() },
      ]);

      while (true) {
        if (thisRequestId !== requestIdRef.current) {
          await reader.cancel();
          return;
        }

        const { done, value } = await reader.read();

        if (thisRequestId !== requestIdRef.current) {
          await reader.cancel();
          return;
        }

        if (done) break;

        fullReply += decoder.decode(value, { stream: true });

        setMessages((current) => {
          const updated = [...current];
          const lastIndex = updated.length - 1;

          updated[lastIndex] = {
            ...updated[lastIndex],
            text: fullReply,
          };

          return updated;
        });

        msgEnd.current?.scrollIntoView({ behavior: "smooth" });
      }

      fullReply += decoder.decode();

      if (thisRequestId === requestIdRef.current && fullReply) {
        speak(fullReply);
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      if (err.name === "AbortError") return;

      const error = "Connection error. Check whether the NOVA backend is online.";
      setMessages((current) => [
        ...current,
        { sender: "nova", text: error, time: getTime() },
      ]);
      speak(error);
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setActive(false);
        setIsTyping(false);
      }
    }
  };

  const clearMessages = () => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    stopSpeaking();
    setIsTyping(false);
    setActive(false);

    setMessages([
      {
        sender: "nova",
        text: "Conversation cleared. How can I assist you?",
        time: getTime(),
      },
    ]);
  };

  const extractChat = () => {
    const text = messages
      .map(
        (message) =>
          `[${message.time}] ${message.sender.toUpperCase()}: ${message.text}`
      )
      .join("\n");

    navigator.clipboard.writeText(text).catch(console.error);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      const video = document.getElementById("nova-camera");

      if (video) {
        video.srcObject = stream;
        video.style.display = "block";
        await video.play();

        const label = document.getElementById("camera-off-label");
        if (label) label.style.display = "none";
      }
    } catch (err) {
      console.error("Could not start camera:", err);
    }
  };

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const cpuBarClass =
    stats.cpu > 80 ? "stat-bar warn" : "stat-bar";
  const ramBarClass =
    stats.ram_percent > 80 ? "stat-bar warn" : "stat-bar";
  const diskBarClass =
    stats.disk_percent > 80 ? "stat-bar warn" : "stat-bar";

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="logo">N.O.V.A</span>
          <div className="online-badge">
            <span className="online-dot" />
            Online
          </div>
        </div>

        <div className="topbar-center">
          <span className="topbar-time">{timeStr}</span>
          <span className="topbar-divider">|</span>
          <span className="topbar-date">{dateStr}</span>
        </div>

        <div className="topbar-right">
          <span className="temp-badge">🌡 25.3°C</span>
          <span className="city-badge">Chennai, IN</span>
          <div className="settings-btn">⚙</div>
        </div>
      </div>

      {/* BODY */}
      <div className="body">
        {/* LEFT SIDEBAR */}
        <div className="sidebar">
          {/* System Stats */}
          <div className="widget">
            <div className="widget-header">
              <span className="widget-title">⚡ System Stats</span>
              <span className="widget-refresh">●</span>
            </div>

            <div className="stat-row">
              <span>CPU Usage</span>
              <span className="stat-val">{stats.cpu}%</span>
            </div>
            <div className="stat-bar-track">
              <div
                className={cpuBarClass}
                style={{ width: `${stats.cpu}%` }}
              />
            </div>

            <div className="stat-row">
              <span>RAM Usage</span>
              <span className="stat-val">{stats.ram_used_gb} GB</span>
            </div>
            <div className="stat-bar-track">
              <div
                className={ramBarClass}
                style={{ width: `${stats.ram_percent}%` }}
              />
            </div>

            <div className="stat-row">
              <span>Disk Usage</span>
              <span className="stat-val">{stats.disk_used_gb} GB</span>
            </div>
            <div className="stat-bar-track">
              <div
                className={diskBarClass}
                style={{ width: `${stats.disk_percent}%` }}
              />
            </div>

            <div className="stat-grid">
              <div className="stat-cell">
                <div className="sc-label">CPU</div>
                <div className="sc-val">{stats.cpu}%</div>
              </div>
              <div className="stat-cell">
                <div className="sc-label">MEMORY</div>
                <div className="sc-val">{stats.ram_percent}%</div>
              </div>
              <div className="stat-cell">
                <div className="sc-label">DISK</div>
                <div className="sc-val">{stats.disk_used_gb}G</div>
              </div>
            </div>
          </div>

          {/* Weather */}
          <div className="widget">
            <div className="widget-header">
              <span className="widget-title">☁ Weather</span>
              <span className="widget-refresh">↻</span>
            </div>

            <div className="weather-top">
              <div>
                <div className="weather-temp">25.3°C</div>
                <div className="weather-loc">Chennai, IN</div>
                <div className="weather-cond">overcast clouds</div>
              </div>
              <div className="weather-icon">☁️</div>
            </div>

            <div className="weather-grid">
              <div className="wg-item">
                <span className="wg-label">HUMIDITY</span>
                <span className="wg-val">94%</span>
              </div>
              <div className="wg-item">
                <span className="wg-label">WIND</span>
                <span className="wg-val">5.8 m/s</span>
              </div>
              <div className="wg-item">
                <span className="wg-label">FEELS LIKE</span>
                <span className="wg-val">26.3°C</span>
              </div>
            </div>
          </div>

          {/* Camera */}
          <div className="widget">
            <div className="widget-header">
              <span className="widget-title">📷 Camera</span>
              <div style={{ display: "flex", gap: 10 }}>
                <span className="widget-refresh">📸</span>
                <span
                  className="widget-refresh"
                  style={{ color: "#ff4444" }}
                  onClick={startCamera}
                >
                  ⏻
                </span>
              </div>
            </div>

            <div className="camera-feed">
              <div className="camera-corner tl" />
              <div className="camera-corner tr" />
              <div className="camera-corner bl" />
              <div className="camera-corner br" />

              <video
                id="nova-camera"
                autoPlay
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "4px",
                  display: "none",
                }}
              />

              <span className="camera-off" id="camera-off-label">
                Camera Off
              </span>
            </div>

            <div className="camera-label">
              Camera is inactive. Click ⏻ to start.
            </div>
          </div>

          {/* Uptime */}
          <div className="widget uptime-widget">
            <div className="uptime-row">
              <span className="widget-title">ℹ System Uptime</span>
              <span className="uptime-val">{uptime}</span>
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="center">
          <AIOrb active={active} />
          <div className="nova-name">N.O.V.A</div>

          <div className="nova-status">
            <span className="status-dot-green" />
            {active ? "Processing..." : "Listening for wake word..."}
          </div>

          <div className="action-btns">
            <button
              className="action-btn"
              title="Camera"
              onClick={startCamera}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </button>

            <MicButton
              onTranscript={(text) => sendMessage(text)}
              onSpeakingChange={(val) => setActive(val)}
            />

            <button
              className="action-btn"
              title="Keyboard"
              onClick={() => document.querySelector(".chat-input")?.focus()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
              </svg>
            </button>
          </div>
        </div>

        {/* CHAT PANEL */}
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span className="chat-panel-title">Conversation</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="chat-btn" onClick={clearMessages}>
                🗑 Clear
              </button>
              <button className="chat-btn" onClick={extractChat}>
                ↓ Extract
              </button>
            </div>
          </div>

          <div className="messages">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                sender={msg.sender}
                text={msg.text}
                time={msg.time}
              />
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={msgEnd} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button className="send-btn" onClick={() => sendMessage()}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

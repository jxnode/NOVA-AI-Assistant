# N.O.V.A — Neural Operative Virtual Assistant
### Version 1.0 — *"First Light"*

> *"An advanced AI assistant interface inspired by J.A.R.V.I.S from Iron Man — built from scratch with a real AI brain, voice interaction, and a full cyberpunk dashboard."*

---

## 🔴 Live Preview

![N.O.V.A Dashboard](./preview.png)

---

## 🧠 What is N.O.V.A?

**N.O.V.A** is a personal AI assistant desktop interface built with React and FastAPI. It features real-time system monitoring, an AI-powered chat backend, voice input via the browser's Speech Recognition API, and voice output powered by ElevenLabs — giving it that signature deep AI voice feel.

Think Iron Man's J.A.R.V.I.S — but yours.

---

## ✨ Features — V1

| Feature | Status |
|---|---|
| 🔴 Cyberpunk Red & Black UI | ✅ Live |
| 🧠 AI Chat via Groq (Llama 3.3 70B) | ✅ Live |
| 🎤 Voice Input (Speech Recognition) | ✅ Live |
| 🔊 Voice Output (ElevenLabs — Adam) | ✅ Live |
| 📊 Live System Stats (CPU, RAM, Disk) | ✅ Live |
| ☁ Weather Widget | ✅ Live |
| 📷 Camera Feed | ✅ Live |
| ⏱ Live Clock & System Uptime | ✅ Live |
| 💬 Conversation Panel with timestamps | ✅ Live |
| 🌀 Animated AI Orb with glow effects | ✅ Live |

---

## 🏗 Tech Stack

### Frontend
- **React** (Vite) — UI framework
- **CSS** — Custom cyberpunk styling, no UI library
- **Web Speech API** — Browser-native voice input
- **ElevenLabs API** — AI voice output (Adam voice)
- **Axios** — HTTP requests to backend

### Backend
- **FastAPI** — Python web framework
- **Groq API** — LLM inference (Llama 3.3 70B)
- **psutil** — System stats (CPU, RAM, Disk)
- **python-dotenv** — Environment variable management
- **Uvicorn** — ASGI server

---

## 📁 Project Structure

```
Nova Workspace/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routes/
│   │   │   └── chat.py          # /chat endpoint
│   │   └── services/
│   │       └── chat_service.py  # Groq AI logic
│   ├── .env                     # API keys (never commit!)
│   └── requirements.txt
│
└── Frontend/nova-ui/
    └── src/
        ├── App.jsx              # Main layout & logic
        ├── index.css            # All styles
        ├── utils/
        │   └── speak.js         # ElevenLabs voice output
        └── components/
            ├── AIOrb.jsx        # Animated orb
            ├── MessageBubble.jsx # Chat bubbles
            ├── MicButton.jsx    # Voice input button
            ├── TypingText.jsx   # Typing animation
            └── EnergyLines.jsx  # Background effects
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key — [console.groq.com](https://console.groq.com)
- ElevenLabs API key — [elevenlabs.io](https://elevenlabs.io)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/nova-assistant.git
cd nova-assistant
```

### 2. Backend Setup
```bash
cd backend
pip install fastapi uvicorn groq psutil python-dotenv
```

Create `.env` file:
```
GROQ_API_KEY=your_groq_key_here
```

Start backend:
```bash
python -m uvicorn app.main:app
```

### 3. Frontend Setup
```bash
cd Frontend/nova-ui
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/stats` | Live system stats |
| POST | `/chat` | Send message, get AI response |

---

## 🗺 Roadmap — V2 Ideas

- [ ] Wake word detection ("Hey NOVA")
- [ ] Memory — NOVA remembers past conversations
- [ ] Real-time weather API integration
- [ ] Plugin system — open apps, search web
- [ ] Mobile responsive version
- [ ] Multiple AI personalities

---

## 👨‍💻 Built By

**Johnson** — Built from scratch, step by step.  
Inspired by J.A.R.V.I.S from Iron Man.

---

## 📄 License

MIT License — free to use, modify, and build on.

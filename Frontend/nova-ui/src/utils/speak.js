
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://nova-ai-assistant-backend-o1rp.onrender.com";

let currentAudio = null;
let currentAudioUrl = null;

export async function speak(text) {
  try {
    stopSpeaking();

    const response = await fetch(`${API_BASE_URL}/voice/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error("NOVA voice error:", response.status);
      return false;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    currentAudio = audio;
    currentAudioUrl = audioUrl;

    const cleanup = () => {
      URL.revokeObjectURL(audioUrl);

      if (currentAudio === audio) {
        currentAudio = null;
        currentAudioUrl = null;
      }
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    await audio.play();
    return true;
  } catch (error) {
    console.error("NOVA voice playback failed:", error);
    stopSpeaking();
    return false;
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

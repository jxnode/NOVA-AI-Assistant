
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://nova-ai-assistant-backend-o1rp.onrender.com"
).replace(/\/$/, "");

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
      const errorText = await response.text();
      console.error("NOVA voice error:", response.status, errorText);
      return false;
    }

    const audioBlob = await response.blob();

    if (!audioBlob.size) {
      throw new Error("The voice API returned an empty audio file.");
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    currentAudio = audio;
    currentAudioUrl = audioUrl;

    const cleanup = () => {
      if (currentAudio === audio) {
        currentAudio = null;
        currentAudioUrl = null;
      }

      URL.revokeObjectURL(audioUrl);
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", () => {
      console.error("NOVA audio playback error:", audio.error);
      cleanup();
    }, { once: true });

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
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}
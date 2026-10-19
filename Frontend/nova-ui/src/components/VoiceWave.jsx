
const heights = [
  24, 38, 52, 31, 45,
  28, 56, 35, 48, 26,
  42, 54, 32, 46, 22,
  50, 36, 44, 29, 40,
];

function VoiceWave({ active }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "20px",
        height: "60px",
      }}
    >
      {heights.map((height, i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: active ? `${height}px` : "18px",
            background:
              "linear-gradient(to top, #2563eb, #60a5fa)",
            borderRadius: "10px",
            boxShadow: "0px 0px 12px rgba(96,165,250,0.8)",
            transition: "height 0.2s",
            animation: `voiceBounce ${0.6 + i * 0.05}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default VoiceWave;

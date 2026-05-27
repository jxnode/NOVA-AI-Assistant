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

      {[...Array(20)].map((_, i) => (

        <div
          key={i}
          style={{
            width: "6px",

            height:
              active
                ? `${20 + Math.random() * 50}px`
                : "18px",

            background:
              "linear-gradient(to top, #2563eb, #60a5fa)",

            borderRadius: "10px",

            boxShadow:
              "0px 0px 12px rgba(96,165,250,0.8)",

            transition: "0.2s",

            animation:
              `voiceBounce ${0.6 + i * 0.05}s infinite alternate`,
          }}
        />

      ))}

    </div>
  );
}

export default VoiceWave;
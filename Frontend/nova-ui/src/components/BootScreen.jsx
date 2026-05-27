import { useEffect, useState } from "react";

function BootScreen({ onComplete }) {

  const lines = [
    "INITIALIZING NOVA CORE...",
    "CONNECTING NEURAL SYSTEMS...",
    "VOICE ENGINE ONLINE...",
    "QUANTUM LINK ESTABLISHED...",
    "SYSTEM READY."
  ];

  const [visibleLines, setVisibleLines] = useState([]);

  useEffect(() => {

    let index = 0;

    const interval = setInterval(() => {

      setVisibleLines((prev) => [
        ...prev,
        lines[index]
      ]);

      index++;

      if (index >= lines.length) {

        clearInterval(interval);

        setTimeout(() => {
          onComplete();
        }, 1200);
      }

    }, 900);

    return () => clearInterval(interval);

  }, []);

  return (

    <div
      style={{
        height: "100vh",
        width: "100%",

        background:
          "radial-gradient(circle at center, #020617, #000814)",

        display: "flex",

        justifyContent: "center",
        alignItems: "center",

        flexDirection: "column",

        color: "#60a5fa",

        fontFamily:
          "'Share Tech Mono', monospace",
      }}
    >

      <div
        style={{
          width: "700px",

          padding: "40px",

          borderRadius: "20px",

          background:
            "rgba(15,23,42,0.3)",

          border:
            "1px solid rgba(96,165,250,0.2)",

          boxShadow:
            "0px 0px 40px rgba(59,130,246,0.15)",
        }}
      >

        <h1
          style={{
            marginBottom: "40px",

            fontSize: "42px",

            letterSpacing: "8px",

            color: "white",

            textAlign: "center",
          }}
        >
          NOVA
        </h1>

        {visibleLines.map((line, index) => (

          <p
            key={index}
            style={{
              marginBottom: "20px",

              fontSize: "18px",

              letterSpacing: "2px",

              animation:
                "fadeIn 0.5s ease",
            }}
          >
            {">"} {line}
          </p>

        ))}

      </div>

    </div>
  );
}

export default BootScreen;
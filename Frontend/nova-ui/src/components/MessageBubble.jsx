
import TypingText from "./TypingText";

const bubbleCSS = `
  @keyframes bubbleIn {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes novaScan {
    0% { left: -100%; }
    100% { left: 200%; }
  }

  .bubble-nova {
    animation: bubbleIn 0.4s ease forwards;
    position: relative;
    overflow: hidden;
    width: 92%;
    padding: 14px 18px;
    border-radius: 4px 18px 18px 18px;
    background: linear-gradient(135deg, rgba(60,5,5,0.95), rgba(35,3,3,0.9));
    border: 1px solid rgba(180,30,30,0.25);
    backdrop-filter: blur(20px);
    color: rgba(255,220,220,0.9);
    font-size: 14px;
    line-height: 1.7;
    font-family: 'Share Tech Mono', monospace;
    box-shadow: 0 0 20px rgba(150,0,0,0.12), 0 4px 24px rgba(0,0,0,0.5);
  }

  .bubble-nova::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(180,30,30,0.7), rgba(255,80,80,0.3), transparent);
  }

  .bubble-nova::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(180,0,0,0.06), transparent);
    animation: novaScan 4s ease-in-out infinite;
  }

  .bubble-nova-label {
    font-size: 9px;
    letter-spacing: 3px;
    color: #cc3333;
    margin-bottom: 6px;
    opacity: 0.9;
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
  }

  .bubble-nova-footer {
    margin-top: 8px;
    font-size: 9px;
    color: rgba(255,100,100,0.35);
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 1px;
  }

  .bubble-user {
    animation: bubbleIn 0.3s ease forwards;
    position: relative;
    width: 88%;
    padding: 14px 18px;
    border-radius: 18px 4px 18px 18px;
    background: linear-gradient(135deg, rgba(40,0,0,0.35), rgba(25,0,0,0.25));
    border: 1px solid rgba(150,30,30,0.2);
    backdrop-filter: blur(20px);
    color: rgba(255,255,255,0.85);
    font-size: 14px;
    line-height: 1.7;
    font-family: 'Share Tech Mono', monospace;
    box-shadow: 0 0 12px rgba(120,0,0,0.1), 0 4px 16px rgba(0,0,0,0.3);
    text-align: right;
  }

  .bubble-user::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(150,30,30,0.3), rgba(180,50,50,0.5));
  }

  .bubble-user-footer {
    margin-top: 8px;
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 1px;
    text-align: right;
  }

  @keyframes typingDot {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(-5px); opacity: 1; }
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 14px 18px;
    width: 80px;
    border-radius: 4px 18px 18px 18px;
    background: linear-gradient(135deg, rgba(60,5,5,0.95), rgba(35,3,3,0.9));
    border: 1px solid rgba(180,30,30,0.25);
    backdrop-filter: blur(20px);
    box-shadow: 0 0 20px rgba(150,0,0,0.12);
    animation: bubbleIn 0.3s ease forwards;
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #cc3333;
    box-shadow: 0 0 6px rgba(200,0,0,0.6);
  }

  .typing-dot:nth-child(1) { animation: typingDot 1s 0s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation: typingDot 1s 0.2s ease-in-out infinite; }
  .typing-dot:nth-child(3) { animation: typingDot 1s 0.4s ease-in-out infinite; }
`;

function TypingIndicator() {
  return (
    <>
      <style>{bubbleCSS}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: "16px",
          padding: "0 4px",
        }}
      >
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </>
  );
}

function MessageBubble({ sender, text, time, isTyping }) {
  const isNova = sender === "nova";

  if (isTyping) return <TypingIndicator />;

  return (
    <>
      <style>{bubbleCSS}</style>
      <div
        style={{
          display: "flex",
          justifyContent: isNova ? "flex-start" : "flex-end",
          marginBottom: "16px",
          padding: "0 4px",
        }}
      >
        {isNova ? (
          <div className="bubble-nova">
            <div className="bubble-nova-label">NOVA</div>
            <TypingText text={text} />
            <div className="bubble-nova-footer">{time}</div>
          </div>
        ) : (
          <div className="bubble-user">
            {text}
            <div className="bubble-user-footer">{time}</div>
          </div>
        )}
      </div>
    </>
  );
}

export default MessageBubble;
export { TypingIndicator };

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

function ChatBox({ chat, loading }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(15,23,42,0.65)",
backdropFilter: "blur(18px)",
border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      {chat.map((msg, index) => (
        <MessageBubble
          key={index}
          sender={msg.sender}
          text={msg.text}
        />
      ))}

      {loading && <TypingIndicator />}
    </div>
  );
}

export default ChatBox;
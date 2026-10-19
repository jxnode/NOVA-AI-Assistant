
function Sidebar() {
  return (
    <div
      style={{
        width: "260px",
        background: "rgba(2,6,23,0.75)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid #1e293b",
        boxShadow: "0px 0px 30px rgba(0,0,0,0.4)",
        padding: "20px",
        color: "white",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>NOVA</h2>

      <div
        style={{
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        Future Memory System
      </div>
    </div>
  );
}

export default Sidebar;

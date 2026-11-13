export default function HistoryLoading() {
  return (
    <div style={{ minHeight: "80dvh", padding: "24px 16px 40px" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ width: "140px", height: "28px", borderRadius: "10px", background: "var(--bg-subtle)", marginBottom: "24px" }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="glass-card"
            style={{ height: "86px", marginBottom: "12px", borderRadius: "18px" }}
          />
        ))}
      </div>
    </div>
  );
}

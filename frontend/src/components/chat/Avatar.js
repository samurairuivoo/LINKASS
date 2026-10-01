export function Avatar({ user, size = 36, className = "" }) {
  const name = user?.name || "?";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#19a9ff", "#22c55e", "#38bdf8", "#f59e0b", "#a78bfa", "#f43f5e"];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-heading font-semibold text-[#0a1228] ${className}`}
      style={{ width: size, height: size, background: user?.picture ? "transparent" : colors[idx], fontSize: size * 0.4 }}
    >
      {user?.picture ? (
        <img src={user.picture} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </div>
  );
}

export function PresenceDot({ online, size = 12, ring = "#101a38" }) {
  return (
    <span
      className={online ? "online-ping" : ""}
      style={{
        width: size, height: size, borderRadius: "50%", display: "inline-block",
        background: online ? "#22c55e" : "#64748b",
        boxShadow: `0 0 0 2.5px ${ring}`,
      }}
    />
  );
}

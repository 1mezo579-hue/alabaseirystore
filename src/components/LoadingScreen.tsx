export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#07080f" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "#6366f1", borderRightColor: "#8b5cf6" }}
        />
        <p className="text-sm font-bold" style={{ color: "#475569" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}


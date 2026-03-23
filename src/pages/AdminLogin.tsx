import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateAdmin, setAdminAuthenticated } from "@/components/AdminRoute";
import { Crown, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate a small delay for UX
    await new Promise((r) => setTimeout(r, 600));

    if (validateAdmin(username.trim(), password)) {
      setAdminAuthenticated(username.trim(), password);
      navigate("/admin", { replace: true });
    } else {
      setError("Credenciais inválidas");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "hsl(228 22% 4%)" }}
    >
      {/* Background effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #fbbf2408 0%, transparent 60%)",
        }}
      />

      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-slide-up relative"
        style={{
          background: "hsl(228 22% 7%)",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 8px 64px hsl(230 25% 2% / 0.8)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #fbbf2460, #ff6b3560, transparent)",
          }}
        />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <img
              src={kontentsuLogo}
              alt="Kontentsu"
              className="h-8 object-contain"
              style={{
                filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.5))",
              }}
            />
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: "#fbbf2412",
                border: "1px solid #fbbf2430",
              }}
            >
              <Crown className="w-4 h-4" style={{ color: "#fbbf24" }} />
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{
                  color: "#fbbf24",
                  fontFamily: "var(--font-sub)",
                }}
              >
                Admin Panel
              </span>
            </div>
            <p
              className="text-[11px] text-center"
              style={{
                color: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-sub)",
              }}
            >
              Acesso restrito — apenas administradores
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                className="text-[9px] font-black uppercase tracking-widest block"
                style={{
                  color: "hsl(var(--muted-foreground))",
                  fontFamily: "var(--font-sub)",
                }}
              >
                Usuário
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all"
                  style={{
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#fbbf2450";
                    e.currentTarget.style.boxShadow = "0 0 16px #fbbf2415";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--border))";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-[9px] font-black uppercase tracking-widest block"
                style={{
                  color: "hsl(var(--muted-foreground))",
                  fontFamily: "var(--font-sub)",
                }}
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all"
                  style={{
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#fbbf2450";
                    e.currentTarget.style.boxShadow = "0 0 16px #fbbf2415";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--border))";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl animate-fade-in"
                style={{
                  background: "hsl(var(--destructive) / 0.08)",
                  border: "1px solid hsl(var(--destructive) / 0.3)",
                }}
              >
                <AlertCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: "hsl(var(--destructive))" }}
                />
                <span
                  className="text-[11px] font-bold"
                  style={{ color: "hsl(var(--destructive))" }}
                >
                  {error}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all"
              style={{
                fontFamily: "var(--font-sub)",
                background: loading
                  ? "#fbbf2408"
                  : "linear-gradient(135deg, #fbbf2420, #ff6b3520)",
                border: "1px solid #fbbf2440",
                color: "#fbbf24",
                boxShadow: loading ? undefined : "0 0 20px #fbbf2415",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "#fbbf2430",
                    borderTopColor: "#fbbf24",
                  }}
                />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

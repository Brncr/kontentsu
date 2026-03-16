import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

const Login = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background glow effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, hsl(155 100% 50% / 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 100%, hsl(270 90% 65% / 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 35% at 80% 70%, hsl(192 100% 55% / 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Animated scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none opacity-20"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.8), transparent)",
          animation: "scan-line 4s linear infinite",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "var(--gradient-surface)",
          border: "1px solid hsl(var(--border))",
          boxShadow:
            "0 4px 80px hsl(230 25% 2% / 0.8), 0 0 0 1px hsl(var(--primary) / 0.06)",
        }}
      >
        {/* Top neon line */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 30%, hsl(var(--accent)) 70%, transparent 100%)",
          }}
        />

        <div className="px-8 py-12 sm:px-12 sm:py-16 flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <img
              src={kontentsuLogo}
              alt="Kontentsu"
              className="h-10 sm:h-12 object-contain"
              style={{
                filter:
                  "drop-shadow(0 0 16px hsl(var(--primary) / 0.6)) drop-shadow(0 0 40px hsl(var(--primary) / 0.2))",
              }}
            />
            <p
              className="text-[10px] mt-1 tracking-[0.2em] uppercase text-center"
              style={{
                color: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-sub)",
              }}
            >
              Roteiros e Conteúdos do seu nicho com 4 cliques!
            </p>
          </div>

          {/* Divider */}
          <div
            className="w-full h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)",
            }}
          />

          {/* Welcome text */}
          <div
            className="text-center animate-fade-in"
            style={{ animationDelay: "0.15s", opacity: 0 }}
          >
            <p
              className="text-sm font-semibold"
              style={{
                color: "hsl(var(--foreground))",
                fontFamily: "var(--font-sub)",
              }}
            >
              Bem-vindo de volta
            </p>
            <p
              className="text-[11px] mt-1"
              style={{
                color: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-body)",
              }}
            >
              Faça login para acessar seus scripts
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="group w-full relative flex items-center justify-center gap-3 rounded-xl py-3.5 px-6 text-sm font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer animate-fade-in disabled:opacity-50 disabled:cursor-wait"
            style={{
              fontFamily: "var(--font-sub)",
              background: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.4)",
              color: "hsl(var(--primary))",
              boxShadow:
                "0 0 20px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.05)",
              animationDelay: "0.3s",
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--primary) / 0.18)";
              e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.7)";
              e.currentTarget.style.boxShadow =
                "0 0 30px hsl(var(--primary) / 0.3), 0 0 80px hsl(var(--primary) / 0.1)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--primary) / 0.1)";
              e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)";
              e.currentTarget.style.boxShadow =
                "0 0 20px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Google icon */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>

          {/* Footer note */}
          <p
            className="text-[9px] text-center uppercase tracking-wider leading-relaxed animate-fade-in"
            style={{
              color: "hsl(var(--muted-foreground) / 0.4)",
              fontFamily: "var(--font-sub)",
              animationDelay: "0.45s",
              opacity: 0,
            }}
          >
            Ao entrar, você concorda com os termos de uso
          </p>
        </div>

        {/* Bottom neon line */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)",
          }}
        />
      </div>

      {/* Corner decorations */}
      <div
        className="absolute top-8 left-8 w-16 h-16 pointer-events-none opacity-30 hidden sm:block"
        style={{
          borderTop: "1px solid hsl(var(--primary) / 0.4)",
          borderLeft: "1px solid hsl(var(--primary) / 0.4)",
        }}
      />
      <div
        className="absolute bottom-8 right-8 w-16 h-16 pointer-events-none opacity-30 hidden sm:block"
        style={{
          borderBottom: "1px solid hsl(var(--accent) / 0.4)",
          borderRight: "1px solid hsl(var(--accent) / 0.4)",
        }}
      />
    </div>
  );
};

export default Login;

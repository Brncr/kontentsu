import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div
            className="w-10 h-10 rounded-full animate-pulse-neon"
            style={{
              background: "hsl(var(--primary) / 0.15)",
              border: "2px solid hsl(var(--primary) / 0.5)",
            }}
          />
          <p
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{
              color: "hsl(var(--muted-foreground))",
              fontFamily: "var(--font-sub)",
            }}
          >
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearAdminSession } from "@/components/AdminRoute";
import {
  ArrowLeft, Loader2, Users, ScrollText, Twitter, TrendingUp,
  Gamepad2, Globe, Cpu, Crown, Activity, Calendar, LogOut,
} from "lucide-react";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

interface UserStat {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSignIn: string | null;
  scriptCount: number;
  tweetCount: number;
  totalGenerated: number;
  niches: string[];
  sources: string[];
  lastUse: string | null;
}

interface KPIs {
  totalUsers: number;
  activeUsers: number;
  totalScripts: number;
  totalTweets: number;
  totalGenerated: number;
  avgPerUser: number;
  nicheBreakdown: Record<string, number>;
  dailySignups: Record<string, number>;
}

const NICHE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  games: { label: "GAMES", color: "#c77dff", icon: <Gamepad2 className="w-3 h-3" /> },
  web3: { label: "WEB3", color: "#00ff87", icon: <Globe className="w-3 h-3" /> },
  tech: { label: "GAMEDEV", color: "#4d9fff", icon: <Cpu className="w-3 h-3" /> },
};

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [users, setUsers] = useState<UserStat[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminCreds = JSON.parse(sessionStorage.getItem('kontentsu_admin_creds') || '{}');
      const { data, error: fnError } = await supabase.functions.invoke("admin-stats", {
        body: { adminUser: adminCreds.username, adminPass: adminCreds.password },
      });
      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);
      setKpis(data.kpis);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const timeSince = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-20"
        style={{
          borderBottom: "1px solid hsl(var(--border))",
          background: "hsl(228 22% 5% / 0.92)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #ff6b35 30%, #fbbf24 70%, transparent 100%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-[56px] flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all"
            style={{ fontFamily: "var(--font-sub)", color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fbbf24";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{
                background: "#fbbf2415",
                border: "1px solid #fbbf2430",
              }}
            >
              <Crown className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: "#fbbf24", fontFamily: "var(--font-sub)" }}
              >
                Admin
              </span>
            </div>
            <img
              src={kontentsuLogo}
              alt="Kontentsu"
              className="h-5 object-contain"
              style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }}
            />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              style={{
                fontFamily: "var(--font-sub)",
                background: "hsl(var(--destructive) / 0.08)",
                border: "1px solid hsl(var(--destructive) / 0.25)",
                color: "hsl(var(--destructive))",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.08)"; }}
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Title */}
        <div
          className="rounded-2xl overflow-hidden animate-slide-up"
          style={{
            background: "var(--gradient-surface)",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)",
          }}
        >
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #fbbf2440, #ff6b3540, transparent)",
            }}
          />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "#fbbf2412",
                  border: "1px solid #fbbf2430",
                  color: "#fbbf24",
                  boxShadow: "0 0 20px #fbbf2415",
                }}
              >
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1
                  className="text-xl sm:text-2xl font-black tracking-widest"
                  style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}
                >
                  ADMIN{" "}
                  <span style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf2440" }}>
                    DASHBOARD
                  </span>
                </h1>
                <p
                  className="text-[10px] uppercase tracking-[0.15em] mt-0.5"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
                >
                  Métricas de uso e cadastros
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#fbbf24" }} />
              <p
                className="text-[11px] uppercase tracking-widest"
                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
              >
                Carregando dados...
              </p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "hsl(var(--destructive) / 0.08)",
              border: "1px solid hsl(var(--destructive) / 0.3)",
            }}
          >
            <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
              {error}
            </p>
            <button
              onClick={fetchStats}
              className="mt-3 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg"
              style={{
                background: "hsl(var(--destructive) / 0.12)",
                border: "1px solid hsl(var(--destructive) / 0.3)",
                color: "hsl(var(--destructive))",
                fontFamily: "var(--font-sub)",
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {kpis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
                <KpiCard
                  icon={<Users className="w-5 h-5" />}
                  label="Usuários"
                  value={kpis.totalUsers}
                  sub={`${kpis.activeUsers} ativos`}
                  color="#fbbf24"
                />
                <KpiCard
                  icon={<ScrollText className="w-5 h-5" />}
                  label="Scripts"
                  value={kpis.totalScripts}
                  color="hsl(var(--primary))"
                />
                <KpiCard
                  icon={<Twitter className="w-5 h-5" />}
                  label="Tweets"
                  value={kpis.totalTweets}
                  color="#1d9bf0"
                />
                <KpiCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Média/User"
                  value={kpis.avgPerUser}
                  sub="gerações"
                  color="#ff6b35"
                />
              </div>
            )}

            {/* Niche breakdown */}
            {kpis && Object.keys(kpis.nicheBreakdown).length > 0 && (
              <div
                className="rounded-xl p-4 animate-fade-in"
                style={{
                  background: "hsl(var(--muted) / 0.25)",
                  border: "1px solid hsl(var(--border))",
                  animationDelay: "0.05s",
                }}
              >
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-3"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
                >
                  <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                  Gerações por Nicho
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(kpis.nicheBreakdown).map(([niche, count]) => {
                    const meta = NICHE_META[niche] || {
                      label: niche.toUpperCase(),
                      color: "#94a3b8",
                      icon: null,
                    };
                    return (
                      <div
                        key={niche}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{
                          background: `${meta.color}10`,
                          border: `1px solid ${meta.color}30`,
                        }}
                      >
                        {meta.icon}
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: meta.color, fontFamily: "var(--font-sub)" }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="text-sm font-black tabular-nums"
                          style={{ color: meta.color, fontFamily: "var(--font-display)" }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Users Table */}
            <div
              className="rounded-xl overflow-hidden animate-fade-in"
              style={{
                background: "hsl(var(--muted) / 0.15)",
                border: "1px solid hsl(var(--border))",
                animationDelay: "0.1s",
              }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid hsl(var(--border))" }}
              >
                <p
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1.5" />
                  {users.length} Usuários Cadastrados
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      {["Usuário", "Cadastro", "Scripts", "Tweets", "Total", "Nichos", "Último Uso"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest"
                            style={{
                              color: "hsl(var(--muted-foreground))",
                              fontFamily: "var(--font-sub)",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr
                        key={u.id}
                        className="transition-colors"
                        style={{
                          borderBottom: "1px solid hsl(var(--border) / 0.5)",
                          background:
                            i % 2 === 0 ? "transparent" : "hsl(var(--muted) / 0.08)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "hsl(var(--muted) / 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            i % 2 === 0 ? "transparent" : "hsl(var(--muted) / 0.08)";
                        }}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.displayName}
                                className="w-8 h-8 rounded-full object-cover"
                                style={{ border: "1px solid hsl(var(--border))" }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                                style={{
                                  background: "hsl(var(--muted))",
                                  border: "1px solid hsl(var(--border))",
                                  color: "hsl(var(--muted-foreground))",
                                  fontFamily: "var(--font-display)",
                                }}
                              >
                                {u.displayName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p
                                className="text-[12px] font-bold leading-none"
                                style={{ color: "hsl(var(--foreground))" }}
                              >
                                {u.displayName}
                              </p>
                              <p
                                className="text-[10px] mt-0.5"
                                style={{ color: "hsl(var(--muted-foreground))" }}
                              >
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cadastro */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }} />
                            <span
                              className="text-[11px]"
                              style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
                            >
                              {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </td>

                        {/* Scripts */}
                        <td className="px-4 py-3">
                          <span
                            className="text-[13px] font-black tabular-nums"
                            style={{
                              color: u.scriptCount > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {u.scriptCount}
                          </span>
                        </td>

                        {/* Tweets */}
                        <td className="px-4 py-3">
                          <span
                            className="text-[13px] font-black tabular-nums"
                            style={{
                              color: u.tweetCount > 0 ? "#1d9bf0" : "hsl(var(--muted-foreground) / 0.3)",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {u.tweetCount}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3">
                          <span
                            className="text-[13px] font-black tabular-nums"
                            style={{
                              color: u.totalGenerated > 0 ? "#fbbf24" : "hsl(var(--muted-foreground) / 0.3)",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {u.totalGenerated}
                          </span>
                        </td>

                        {/* Niches */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.niches.length > 0
                              ? u.niches.map((n) => {
                                  const meta = NICHE_META[n] || { label: n, color: "#94a3b8", icon: null };
                                  return (
                                    <span
                                      key={n}
                                      className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest"
                                      style={{
                                        background: `${meta.color}15`,
                                        color: meta.color,
                                        border: `1px solid ${meta.color}30`,
                                        fontFamily: "var(--font-sub)",
                                      }}
                                    >
                                      {meta.label}
                                    </span>
                                  );
                                })
                              : <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }}>—</span>}
                          </div>
                        </td>

                        {/* Last Use */}
                        <td className="px-4 py-3">
                          <span
                            className="text-[11px]"
                            style={{
                              color: u.lastUse ? "hsl(var(--foreground) / 0.7)" : "hsl(var(--muted-foreground) / 0.3)",
                              fontFamily: "var(--font-sub)",
                            }}
                          >
                            {u.lastUse ? `${timeSince(u.lastUse)} atrás` : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all group"
      style={{
        background: "hsl(var(--muted) / 0.2)",
        border: "1px solid hsl(var(--border))",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.boxShadow = `0 0 24px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--border))";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}30`,
            color,
          }}
        >
          {icon}
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-2xl font-black tabular-nums"
        style={{ color, fontFamily: "var(--font-display)", textShadow: `0 0 15px ${color}30` }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-[9px] mt-0.5 uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default Admin;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearAdminSession } from "@/components/AdminRoute";
import {
  ArrowLeft, Loader2, Users, ScrollText, Twitter, TrendingUp,
  Gamepad2, Globe, Cpu, Crown, Activity, Calendar, LogOut,
  ChevronDown, ChevronRight, Star, ExternalLink, Hash, Newspaper,
} from "lucide-react";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

interface ScriptItem {
  id: string;
  type: string;
  newsTitle: string;
  newsUrl: string | null;
  newsSource: string | null;
  niche: string | null;
  scriptTitle: string | null;
  scriptHook: string | null;
  scriptDev: string | null;
  scriptCta: string | null;
  scriptHashtags: string[];
  tweetContent: string | null;
  isFavorite: boolean;
  createdAt: string;
}

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
  scripts: ScriptItem[];
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
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
      " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

  const toggleUser = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
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
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fbbf24"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "#fbbf2415", border: "1px solid #fbbf2430" }}
            >
              <Crown className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#fbbf24", fontFamily: "var(--font-sub)" }}>
                Admin
              </span>
            </div>
            <img src={kontentsuLogo} alt="Kontentsu" className="h-5 object-contain" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              style={{ fontFamily: "var(--font-sub)", background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.25)", color: "hsl(var(--destructive))" }}
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
        <div className="rounded-2xl overflow-hidden animate-slide-up" style={{ background: "var(--gradient-surface)", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)" }}>
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, #fbbf2440, #ff6b3540, transparent)" }} />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#fbbf2412", border: "1px solid #fbbf2430", color: "#fbbf24", boxShadow: "0 0 20px #fbbf2415" }}>
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-widest" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
                  ADMIN <span style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf2440" }}>DASHBOARD</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.15em] mt-0.5" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                  Métricas de uso e cadastros · Clique no usuário para ver conteúdo
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#fbbf24" }} />
              <p className="text-[11px] uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>Carregando dados...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl p-6 text-center" style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.3)" }}>
            <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>{error}</p>
            <button onClick={fetchStats} className="mt-3 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "hsl(var(--destructive) / 0.12)", border: "1px solid hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))", fontFamily: "var(--font-sub)" }}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {kpis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
                <KpiCard icon={<Users className="w-5 h-5" />} label="Usuários" value={kpis.totalUsers} sub={`${kpis.activeUsers} ativos`} color="#fbbf24" />
                <KpiCard icon={<ScrollText className="w-5 h-5" />} label="Scripts" value={kpis.totalScripts} color="hsl(var(--primary))" />
                <KpiCard icon={<Twitter className="w-5 h-5" />} label="Tweets" value={kpis.totalTweets} color="#1d9bf0" />
                <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Média/User" value={kpis.avgPerUser} sub="gerações" color="#ff6b35" />
              </div>
            )}

            {/* Niche breakdown */}
            {kpis && Object.keys(kpis.nicheBreakdown).length > 0 && (
              <div className="rounded-xl p-4 animate-fade-in" style={{ background: "hsl(var(--muted) / 0.25)", border: "1px solid hsl(var(--border))", animationDelay: "0.05s" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                  <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                  Gerações por Nicho
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(kpis.nicheBreakdown).map(([niche, count]) => {
                    const meta = NICHE_META[niche] || { label: niche.toUpperCase(), color: "#94a3b8", icon: null };
                    return (
                      <div key={niche} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}30` }}>
                        {meta.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color, fontFamily: "var(--font-sub)" }}>{meta.label}</span>
                        <span className="text-sm font-black tabular-nums" style={{ color: meta.color, fontFamily: "var(--font-display)" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Users Table with Expandable Rows */}
            <div className="rounded-xl overflow-hidden animate-fade-in" style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border))", animationDelay: "0.1s" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                  <Users className="w-3.5 h-3.5 inline mr-1.5" />
                  {users.length} Usuários — clique para expandir conteúdo
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                {users.map((u) => {
                  const isExpanded = expandedUser === u.id;
                  return (
                    <div key={u.id}>
                      {/* User Row */}
                      <button
                        onClick={() => toggleUser(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                        style={{
                          background: isExpanded ? "hsl(var(--muted) / 0.2)" : "transparent",
                          borderBottom: isExpanded ? "1px solid hsl(var(--border) / 0.3)" : undefined,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted) / 0.15)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isExpanded ? "hsl(var(--muted) / 0.2)" : "transparent"; }}
                      >
                        {/* Expand icon */}
                        <div style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>

                        {/* Avatar */}
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: "1px solid hsl(var(--border))" }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-display)" }}>
                            {u.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold leading-none truncate" style={{ color: "hsl(var(--foreground))" }}>{u.displayName}</p>
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{u.email}</p>
                        </div>

                        {/* Stats badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                            <ScrollText className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
                            <span className="text-[11px] font-black tabular-nums" style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-display)" }}>{u.scriptCount}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "#1d9bf008", border: "1px solid #1d9bf020" }}>
                            <Twitter className="w-3 h-3" style={{ color: "#1d9bf0" }} />
                            <span className="text-[11px] font-black tabular-nums" style={{ color: "#1d9bf0", fontFamily: "var(--font-display)" }}>{u.tweetCount}</span>
                          </div>
                          {u.niches.map((n) => {
                            const meta = NICHE_META[n] || { label: n, color: "#94a3b8", icon: null };
                            return (
                              <span key={n} className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest hidden sm:inline-block" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30`, fontFamily: "var(--font-sub)" }}>
                                {meta.label}
                              </span>
                            );
                          })}
                          <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground) / 0.5)", fontFamily: "var(--font-sub)" }}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 py-4 space-y-3 animate-fade-in" style={{ background: "hsl(var(--muted) / 0.08)" }}>
                          {u.scripts.length === 0 ? (
                            <p className="text-[11px] text-center py-4" style={{ color: "hsl(var(--muted-foreground) / 0.5)", fontFamily: "var(--font-sub)" }}>
                              Nenhum conteúdo gerado ainda
                            </p>
                          ) : (
                            u.scripts.map((s) => (
                              <ContentCard key={s.id} script={s} formatDate={formatShortDate} />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// ── Content Card ──────────────────────────────────────────────
function ContentCard({ script: s, formatDate }: { script: ScriptItem; formatDate: (d: string) => string }) {
  const meta = NICHE_META[s.niche || ""] || { label: s.niche || "—", color: "#94a3b8", icon: null };
  const isScript = s.type === "script";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--muted) / 0.18)",
        border: `1px solid ${isScript ? "hsl(var(--primary) / 0.15)" : "#1d9bf015"}`,
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}>
        {isScript ? (
          <ScrollText className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
        ) : (
          <Twitter className="w-3.5 h-3.5 shrink-0" style={{ color: "#1d9bf0" }} />
        )}
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: isScript ? "hsl(var(--primary))" : "#1d9bf0", fontFamily: "var(--font-sub)" }}>
          {isScript ? "ROTEIRO" : "TWEET"}
        </span>
        {s.isFavorite && <Star className="w-3 h-3" style={{ color: "#fbbf24", fill: "#fbbf24" }} />}
        <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30`, fontFamily: "var(--font-sub)" }}>
          {meta.label}
        </span>
        {s.newsSource && (
          <span className="text-[9px] flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground) / 0.6)", fontFamily: "var(--font-sub)" }}>
            <Newspaper className="w-3 h-3" />
            {s.newsSource}
          </span>
        )}
        <span className="ml-auto text-[9px]" style={{ color: "hsl(var(--muted-foreground) / 0.4)", fontFamily: "var(--font-sub)" }}>
          {formatDate(s.createdAt)}
        </span>
      </div>

      {/* News title */}
      <div className="px-3 py-2" style={{ borderBottom: "1px solid hsl(var(--border) / 0.15)" }}>
        <p className="text-[11px] font-bold leading-snug" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
          📰 {s.newsTitle}
        </p>
        {s.newsUrl && (
          <a href={s.newsUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] flex items-center gap-1 mt-0.5 hover:underline" style={{ color: "hsl(var(--primary) / 0.6)" }}>
            <ExternalLink className="w-3 h-3" />
            Fonte
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {isScript ? (
          <>
            {s.scriptTitle && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: "hsl(var(--accent))", fontFamily: "var(--font-sub)" }}>Título</p>
                <p className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{s.scriptTitle}</p>
              </div>
            )}
            {s.scriptHook && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#fbbf24", fontFamily: "var(--font-sub)" }}>🎣 Hook</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{s.scriptHook}</p>
              </div>
            )}
            {s.scriptDev && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-sub)" }}>📝 Desenvolvimento</p>
                <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--foreground) / 0.75)", maxHeight: 150, overflow: "auto" }}>{s.scriptDev}</p>
              </div>
            )}
            {s.scriptCta && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#ff6b35", fontFamily: "var(--font-sub)" }}>🎯 CTA</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{s.scriptCta}</p>
              </div>
            )}
          </>
        ) : (
          s.tweetContent && (
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: "#1d9bf0", fontFamily: "var(--font-sub)" }}>Conteúdo do Tweet</p>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--foreground) / 0.9)" }}>{s.tweetContent}</p>
            </div>
          )
        )}

        {/* Hashtags */}
        {s.scriptHashtags && s.scriptHashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            <Hash className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
            {s.scriptHashtags.map((tag, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary) / 0.7)", fontFamily: "var(--font-sub)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub?: string; color: string }) {
  return (
    <div
      className="rounded-xl p-4 transition-all group"
      style={{ background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border))" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 0 24px ${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = ""; }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{label}</span>
      </div>
      <p className="text-2xl font-black tabular-nums" style={{ color, fontFamily: "var(--font-display)", textShadow: `0 0 15px ${color}30` }}>{value}</p>
      {sub && <p className="text-[9px] mt-0.5 uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{sub}</p>}
    </div>
  );
}

export default Admin;

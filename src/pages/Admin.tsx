import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearAdminSession } from "@/components/AdminRoute";
import {
  ArrowLeft, Loader2, Users, ScrollText, Twitter, TrendingUp,
  Gamepad2, Globe, Cpu, Crown, Activity, Calendar, LogOut,
  Hash, Newspaper, Clock, BarChart3, Zap, Star,
} from "lucide-react";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

interface UserStat {
  id: string; email: string; displayName: string; avatarUrl: string | null;
  createdAt: string; scriptCount: number; tweetCount: number;
  totalGenerated: number; niches: string[]; sources: string[]; lastUse: string | null;
}
interface Analytics {
  topSources: { name: string; count: number }[];
  sourcesByNiche: Record<string, Record<string, number>>;
  dailyContent: Record<string, { scripts: number; tweets: number }>;
  hourlyUsage: number[];
  topHashtags: { tag: string; count: number }[];
  topTopics: { word: string; count: number }[];
  recentActivity: { type: string; niche: string; newsTitle: string; newsSource: string; userName: string; userAvatar: string | null; createdAt: string }[];
}
interface KPIs {
  totalUsers: number; activeUsers: number; totalScripts: number; totalTweets: number;
  totalGenerated: number; avgPerUser: number; nicheBreakdown: Record<string, number>; dailySignups: Record<string, number>;
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<UserStat[]>([]);

  useEffect(() => { fetchStats(); }, []);

  const handleLogout = () => { clearAdminSession(); navigate("/admin/login", { replace: true }); };

  const fetchStats = async () => {
    setLoading(true); setError(null);
    try {
      const creds = JSON.parse(sessionStorage.getItem('kontentsu_admin_creds') || '{}');
      const { data, error: fnError } = await supabase.functions.invoke("admin-stats", {
        body: { adminUser: creds.username, adminPass: creds.password },
      });
      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);
      setKpis(data.kpis);
      setAnalytics(data.analytics);
      setUsers(data.users);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro desconhecido"); }
    finally { setLoading(false); }
  };

  const formatDate = (d: string | null) => !d ? "—" : new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  const timeSince = (d: string | null) => {
    if (!d) return "Nunca";
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20" style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(228 22% 5% / 0.92)", backdropFilter: "blur(24px)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, #ff6b35 30%, #fbbf24 70%, transparent 100%)" }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-[56px] flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all" style={{ fontFamily: "var(--font-sub)", color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fbbf24"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "#fbbf2415", border: "1px solid #fbbf2430" }}>
              <Crown className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#fbbf24", fontFamily: "var(--font-sub)" }}>Admin</span>
            </div>
            <img src={kontentsuLogo} alt="Kontentsu" className="h-5 object-contain" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }} />
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all" style={{ fontFamily: "var(--font-sub)", background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.25)", color: "hsl(var(--destructive))" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.18)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.08)"; }}>
              <LogOut className="w-3 h-3" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Title */}
        <div className="rounded-2xl overflow-hidden animate-slide-up" style={{ background: "var(--gradient-surface)", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)" }}>
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, #fbbf2440, #ff6b3540, transparent)" }} />
          <div className="p-5 sm:p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#fbbf2412", border: "1px solid #fbbf2430", color: "#fbbf24", boxShadow: "0 0 20px #fbbf2415" }}>
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-widest" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
                ADMIN <span style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf2440" }}>INTELLIGENCE</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.15em] mt-0.5" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>Analytics categorizado de uso da plataforma</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#fbbf24" }} />
              <p className="text-[11px] uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>Carregando inteligência...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl p-6 text-center" style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.3)" }}>
            <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>{error}</p>
            <button onClick={fetchStats} className="mt-3 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "hsl(var(--destructive) / 0.12)", border: "1px solid hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))", fontFamily: "var(--font-sub)" }}>Tentar novamente</button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {kpis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
                <KpiCard icon={<Users className="w-5 h-5" />} label="Usuários" value={kpis.totalUsers} sub={`${kpis.activeUsers} ativos`} color="#fbbf24" />
                <KpiCard icon={<ScrollText className="w-5 h-5" />} label="Roteiros" value={kpis.totalScripts} color="hsl(var(--primary))" />
                <KpiCard icon={<Twitter className="w-5 h-5" />} label="Tweets" value={kpis.totalTweets} color="#1d9bf0" />
                <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Média/User" value={kpis.avgPerUser} sub="gerações" color="#ff6b35" />
              </div>
            )}

            {/* ── Analytics Panels ── */}
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Niche Breakdown */}
                {kpis && Object.keys(kpis.nicheBreakdown).length > 0 && (
                  <Panel title="Gerações por Nicho" icon={<Activity className="w-3.5 h-3.5" />}>
                    <div className="space-y-2">
                      {Object.entries(kpis.nicheBreakdown).sort((a, b) => b[1] - a[1]).map(([niche, count]) => {
                        const meta = NICHE_META[niche] || { label: niche.toUpperCase(), color: "#94a3b8", icon: null };
                        const pct = kpis.totalGenerated > 0 ? Math.round((count / kpis.totalGenerated) * 100) : 0;
                        return (
                          <div key={niche} className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 w-24 shrink-0">
                              {meta.icon}
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color, fontFamily: "var(--font-sub)" }}>{meta.label}</span>
                            </div>
                            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: `${meta.color}10` }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `${meta.color}40`, minWidth: 4 }} />
                            </div>
                            <span className="text-[12px] font-black tabular-nums w-12 text-right" style={{ color: meta.color, fontFamily: "var(--font-display)" }}>{count}</span>
                            <span className="text-[9px] w-8 text-right" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                )}

                {/* Top Sources */}
                <Panel title="Fontes Mais Usadas" icon={<Newspaper className="w-3.5 h-3.5" />}>
                  <div className="space-y-1.5">
                    {analytics.topSources.slice(0, 10).map((s, i) => {
                      const maxCount = analytics.topSources[0]?.count || 1;
                      const pct = Math.round((s.count / maxCount) * 100);
                      return (
                        <div key={s.name} className="flex items-center gap-2">
                          <span className="text-[10px] font-black w-4 text-right tabular-nums" style={{ color: i < 3 ? "#fbbf24" : "hsl(var(--muted-foreground) / 0.4)", fontFamily: "var(--font-display)" }}>{i + 1}</span>
                          <span className="text-[11px] font-bold truncate flex-1" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{s.name}</span>
                          <div className="w-20 h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--primary) / 0.08)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(var(--primary) / 0.4)" }} />
                          </div>
                          <span className="text-[11px] font-black tabular-nums w-8 text-right" style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-display)" }}>{s.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* Top Topics (Temas) */}
                <Panel title="Temas Mais Abordados" icon={<Zap className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.topTopics.map((t, i) => {
                      const maxCount = analytics.topTopics[0]?.count || 1;
                      const intensity = Math.max(0.3, t.count / maxCount);
                      const fontSize = 9 + Math.round(intensity * 5);
                      return (
                        <span key={t.word} className="px-2 py-1 rounded-lg font-bold transition-all" style={{
                          fontSize: `${fontSize}px`,
                          background: `hsl(var(--primary) / ${intensity * 0.12})`,
                          border: `1px solid hsl(var(--primary) / ${intensity * 0.25})`,
                          color: `hsl(var(--primary) / ${0.4 + intensity * 0.6})`,
                          fontFamily: "var(--font-sub)",
                        }}>
                          {t.word} <span className="opacity-50 text-[8px]">{t.count}</span>
                        </span>
                      );
                    })}
                  </div>
                </Panel>

                {/* Top Hashtags */}
                <Panel title="Hashtags Populares" icon={<Hash className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.topHashtags.map((h) => (
                      <span key={h.tag} className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{
                        background: "hsl(var(--accent) / 0.08)",
                        border: "1px solid hsl(var(--accent) / 0.2)",
                        color: "hsl(var(--accent) / 0.8)",
                        fontFamily: "var(--font-sub)",
                      }}>
                        #{h.tag} <span className="opacity-40">{h.count}</span>
                      </span>
                    ))}
                  </div>
                </Panel>

                {/* Peak Hours */}
                <Panel title="Horários de Pico" icon={<Clock className="w-3.5 h-3.5" />}>
                  <div className="flex items-end gap-[3px] h-20">
                    {analytics.hourlyUsage.map((count, hour) => {
                      const max = Math.max(...analytics.hourlyUsage, 1);
                      const pct = Math.max(4, (count / max) * 100);
                      const isTop = count === max && count > 0;
                      return (
                        <div key={hour} className="flex-1 flex flex-col items-center gap-0.5" title={`${hour}h: ${count} gerações`}>
                          <div className="w-full rounded-t transition-all" style={{
                            height: `${pct}%`,
                            background: isTop ? "#fbbf24" : count > 0 ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted) / 0.3)",
                            minHeight: 2,
                          }} />
                          {hour % 4 === 0 && (
                            <span className="text-[7px]" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>{hour}h</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* Sources by Niche */}
                <Panel title="Fontes por Nicho" icon={<BarChart3 className="w-3.5 h-3.5" />}>
                  <div className="space-y-3">
                    {Object.entries(analytics.sourcesByNiche).map(([niche, sources]) => {
                      const meta = NICHE_META[niche] || { label: niche.toUpperCase(), color: "#94a3b8", icon: null };
                      const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 5);
                      return (
                        <div key={niche}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {meta.icon}
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: meta.color, fontFamily: "var(--font-sub)" }}>{meta.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sorted.map(([src, cnt]) => (
                              <span key={src} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${meta.color}10`, color: meta.color, border: `1px solid ${meta.color}20`, fontFamily: "var(--font-sub)" }}>
                                {src} <span className="opacity-50">{cnt}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* Recent Activity */}
            {analytics && analytics.recentActivity.length > 0 && (
              <Panel title="Atividade Recente" icon={<Zap className="w-3.5 h-3.5" />} full>
                <div className="space-y-2">
                  {analytics.recentActivity.map((a, i) => {
                    const meta = NICHE_META[a.niche || ""] || { label: a.niche || "", color: "#94a3b8", icon: null };
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "hsl(var(--muted) / 0.1)" }}>
                        {a.userAvatar ? (
                          <img src={a.userAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" style={{ border: "1px solid hsl(var(--border))" }} />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shrink-0" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                            {a.userName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{a.userName}</span>
                            {a.type === "script" ? <ScrollText className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} /> : <Twitter className="w-3 h-3" style={{ color: "#1d9bf0" }} />}
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: a.type === "script" ? "hsl(var(--primary))" : "#1d9bf0", fontFamily: "var(--font-sub)" }}>
                              {a.type === "script" ? "roteiro" : "tweet"}
                            </span>
                            <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${meta.color}12`, color: meta.color, fontFamily: "var(--font-sub)" }}>{meta.label}</span>
                          </div>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {a.newsTitle} {a.newsSource && <span style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>— {a.newsSource}</span>}
                          </p>
                        </div>
                        <span className="text-[9px] shrink-0" style={{ color: "hsl(var(--muted-foreground) / 0.4)", fontFamily: "var(--font-sub)" }}>{timeSince(a.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Users Summary Table */}
            <Panel title={`${users.length} Usuários (ranking por uso)`} icon={<Users className="w-3.5 h-3.5" />} full>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      {["#", "Usuário", "Cadastro", "Roteiros", "Tweets", "Total", "Nichos", "Último Uso"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}
                        className="transition-colors" onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted) / 0.12)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-black tabular-nums" style={{ color: i < 3 ? "#fbbf24" : "hsl(var(--muted-foreground) / 0.3)", fontFamily: "var(--font-display)" }}>
                            {i < 3 ? "🏆" : i + 1}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" style={{ border: "1px solid hsl(var(--border))" }} /> : <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>{u.displayName.slice(0, 2).toUpperCase()}</div>}
                            <div>
                              <p className="text-[11px] font-bold leading-none" style={{ color: "hsl(var(--foreground))" }}>{u.displayName}</p>
                              <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2"><span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{formatDate(u.createdAt)}</span></td>
                        <td className="px-3 py-2"><span className="text-[12px] font-black tabular-nums" style={{ color: u.scriptCount > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.2)", fontFamily: "var(--font-display)" }}>{u.scriptCount}</span></td>
                        <td className="px-3 py-2"><span className="text-[12px] font-black tabular-nums" style={{ color: u.tweetCount > 0 ? "#1d9bf0" : "hsl(var(--muted-foreground) / 0.2)", fontFamily: "var(--font-display)" }}>{u.tweetCount}</span></td>
                        <td className="px-3 py-2"><span className="text-[12px] font-black tabular-nums" style={{ color: u.totalGenerated > 0 ? "#fbbf24" : "hsl(var(--muted-foreground) / 0.2)", fontFamily: "var(--font-display)" }}>{u.totalGenerated}</span></td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {u.niches.map((n) => { const m = NICHE_META[n] || { label: n, color: "#94a3b8" }; return <span key={n} className="text-[7px] px-1 py-0.5 rounded font-black uppercase" style={{ background: `${m.color}12`, color: m.color, fontFamily: "var(--font-sub)" }}>{m.label}</span>; })}
                            {u.niches.length === 0 && <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground) / 0.2)" }}>—</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2"><span className="text-[10px]" style={{ color: u.lastUse ? "hsl(var(--foreground) / 0.6)" : "hsl(var(--muted-foreground) / 0.2)", fontFamily: "var(--font-sub)" }}>{u.lastUse ? `${timeSince(u.lastUse)} atrás` : "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </main>
    </div>
  );
};

// ── Reusable Panel ───────────────────────────────────────────
function Panel({ title, icon, children, full }: { title: string; icon: React.ReactNode; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-xl overflow-hidden ${full ? "lg:col-span-2" : ""}`} style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border))" }}>
      <div className="px-4 py-2.5" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
        <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
          {icon} {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl p-4 transition-all" style={{ background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border))" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 0 24px ${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = ""; }}>
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

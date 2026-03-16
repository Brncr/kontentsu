import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewsList, type NewsItem } from "@/components/NewsList";
import { ScriptPanel } from "@/components/ScriptPanel";
import { Zap, Sparkles, Radio, Newspaper, ScrollText, User } from "lucide-react";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";
import { useLang } from "@/contexts/LanguageContext";
import { tr, LANGS } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [mobileTab, setMobileTab] = useState<"news" | "script">("news");
  const [currentNiche, setCurrentNiche] = useState<string>("");
  const [currentSource, setCurrentSource] = useState<string>("");
  const { lang, setLang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Map source names to niche categories for script saving
  const SOURCE_NICHE: Record<string, string> = {
    "gam3s.gg": "games", "Voxel": "games", "Terra GameOn": "games", "GameVício": "games",
    "Game Informer": "games", "GameSpot": "games", "Eurogamer PT": "games", "PC Gamer": "games",
    "Polygon": "games", "Kotaku": "games", "Rock Paper Shotgun": "games", "GamesRadar": "games", "Gematsu": "games",
    "playtoearn.com": "web3", "CoinDesk PT": "web3", "The Block": "web3", "Decrypt": "web3",
    "Bitcoin Magazine": "web3", "BeInCrypto BR": "web3", "CryptoPotato": "web3",
    "GameDiscover.co": "tech", "GameMakers": "tech", "Elite Game Developers": "tech",
    "Crossplay News": "tech", "GameDev Reports": "tech",
  };

  const handleSelectNews = (item: NewsItem) => {
    setSelectedNews(item);
    setMobileTab("script");
    if (item.source) {
      setCurrentSource(item.source);
      setCurrentNiche(SOURCE_NICHE[item.source] || "games");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-20" style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(228 22% 5% / 0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 30%, hsl(var(--accent)) 70%, transparent 100%)" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[56px] flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img src={kontentsuLogo} alt="Kontentsu" className="h-6 sm:h-7 object-contain" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }} />
            <span className="text-[9px] mt-0.5 tracking-wider uppercase hidden sm:block" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)", borderLeft: "1px solid hsl(var(--border))", paddingLeft: "8px" }}>
              {tr("tagline", lang)}
            </span>
          </div>

          {/* Right: lang switcher + badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language switcher */}
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.4)" }}>
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
                  style={{
                    fontFamily: "var(--font-sub)",
                    background: lang === l.id ? "hsl(var(--primary) / 0.15)" : "transparent",
                    color: lang === l.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    borderRight: l.id !== "es" ? "1px solid hsl(var(--border))" : undefined,
                    minHeight: 32,
                    minWidth: 32,
                  }}
                >
                  <span>{l.flag}</span>
                  <span className="hidden md:inline">{l.label}</span>
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 font-bold tracking-widest"
              style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.35)", color: "hsl(var(--primary))", fontFamily: "var(--font-sub)", boxShadow: "0 0 12px hsl(var(--primary) / 0.15)" }}
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AI</span>
            </div>

            {/* History & Profile links */}
            {user && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate("/history")}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  style={{ fontFamily: "var(--font-sub)", background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.color = "hsl(var(--primary))"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
                  title="Meus Scripts"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scripts</span>
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-8 h-8 rounded-full overflow-hidden cursor-pointer transition-all"
                  style={{ border: "2px solid hsl(var(--primary) / 0.4)", boxShadow: "0 0 10px hsl(var(--primary) / 0.2)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.8)"; e.currentTarget.style.boxShadow = "0 0 16px hsl(var(--primary) / 0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)"; e.currentTarget.style.boxShadow = "0 0 10px hsl(var(--primary) / 0.2)"; }}
                  title="Meu Perfil"
                >
                  <img
                    src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                    alt={user.user_metadata?.full_name || "User"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero strip ───────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(228 22% 7%) 0%, hsl(230 25% 4%) 100%)", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-sub)" }}>
              {tr("hero_sub", lang)}
            </p>
            <h2 className="text-lg sm:text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))", lineHeight: 1.1 }}>
              {tr("hero_title_left", lang)} <span style={{ color: "hsl(var(--primary))", textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}>{tr("hero_title_right", lang)}</span>
            </h2>
            <p className="text-[11px] mt-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-body)" }}>
              {tr("hero_desc", lang)}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {[
              { label: tr("stat_sources", lang), value: "25+" },
              { label: tr("stat_niches", lang), value: "3" },
            ].map((s) => (
              <div key={s.label} className="text-center px-4 py-2.5 rounded-xl" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
                <p className="text-lg font-black" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--primary))", lineHeight: 1 }}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-px left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4) 40%, hsl(var(--accent) / 0.4) 60%, transparent)" }} />
      </div>

      {/* ── 4-Step Flow Bar ─────────────────────────────────────── */}
      <div className="hidden sm:block" style={{ background: "hsl(228 22% 5%)", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {[
              { step: "1", label: lang === "en" ? "choose your niche" : lang === "es" ? "elige tu nicho" : "escolha seu nicho" },
              { step: "2", label: lang === "en" ? "news source" : lang === "es" ? "fuente periodística" : "fonte jornalística" },
              { step: "3", label: lang === "en" ? "pick the news" : lang === "es" ? "elige la noticia" : "escolha a notícia" },
              { step: "4", label: lang === "en" ? "script ready!" : lang === "es" ? "¡guión listo!" : "roteiro pronto!" },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center gap-2 sm:gap-4">
                <div
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: i === 3 ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.3)",
                    border: i === 3 ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
                    minWidth: 100,
                  }}
                >
                  <span
                    className="text-lg font-black"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: i === 3 ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      lineHeight: 1,
                      textShadow: i === 3 ? "0 0 16px hsl(var(--primary) / 0.5)" : undefined,
                    }}
                  >
                    {item.step}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider text-center"
                    style={{
                      color: i === 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      fontFamily: "var(--font-sub)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                {i < 3 && (
                  <span className="text-[10px] font-bold" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>»</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile tab switcher ────────────────────────────────── */}
      <div className="lg:hidden sticky top-[56px] z-10 px-4 py-2" style={{ background: "hsl(228 22% 5% / 0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex gap-2 rounded-xl p-1" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
          <button
            onClick={() => setMobileTab("news")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
            style={{
              fontFamily: "var(--font-sub)",
              background: mobileTab === "news" ? "hsl(var(--primary) / 0.12)" : "transparent",
              color: mobileTab === "news" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              border: mobileTab === "news" ? "1px solid hsl(var(--primary) / 0.35)" : "1px solid transparent",
              boxShadow: mobileTab === "news" ? "0 0 16px hsl(var(--primary) / 0.15)" : undefined,
            }}
          >
            <Newspaper className="w-3.5 h-3.5" />
            {tr("col_news", lang)}
          </button>
          <button
            onClick={() => setMobileTab("script")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative"
            style={{
              fontFamily: "var(--font-sub)",
              background: mobileTab === "script" ? "hsl(var(--accent) / 0.12)" : "transparent",
              color: mobileTab === "script" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
              border: mobileTab === "script" ? "1px solid hsl(var(--accent) / 0.35)" : "1px solid transparent",
              boxShadow: mobileTab === "script" ? "0 0 16px hsl(var(--accent) / 0.15)" : undefined,
            }}
          >
            <Radio className="w-3.5 h-3.5" />
            {tr("col_script", lang)}
            {selectedNews && mobileTab !== "script" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--accent))", boxShadow: "0 0 6px hsl(var(--accent))" }} />
            )}
          </button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* Left column — News (hidden on mobile when script tab active) */}
          <div className={`flex flex-col gap-3 ${mobileTab === "script" ? "hidden lg:flex" : "flex"}`}>
            <ColHeader
              label={tr("col_news", lang)}
              sub={tr("col_news_sub", lang)}
              color="hsl(var(--primary))"
              icon={<Zap className="w-3.5 h-3.5" />}
            />
            <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)" }}>
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.25), transparent)" }} />
              <div className="p-4 sm:p-5">
                <NewsList onSelectNews={handleSelectNews} selectedUrl={selectedNews?.url ?? null} />
              </div>
            </div>
          </div>

          {/* Right column — Script (hidden on mobile when news tab active) */}
          <div className={`flex flex-col gap-3 lg:sticky lg:top-[76px] ${mobileTab === "news" ? "hidden lg:flex" : "flex"}`}>
            <ColHeader
              label={tr("col_script", lang)}
              sub={tr("col_script_sub", lang)}
              color="hsl(var(--accent))"
              icon={<Radio className="w-3.5 h-3.5" />}
            />
            <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)" }}>
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.25), transparent)" }} />
              <div className="p-4 sm:p-5">
                <ScriptPanel selectedNews={selectedNews} onGoToNews={() => setMobileTab("news")} niche={currentNiche} newsSource={currentSource} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-5" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <p className="text-center text-[10px] uppercase tracking-[0.15em]" style={{ color: "hsl(var(--muted-foreground) / 0.4)", fontFamily: "var(--font-sub)" }}>
            {tr("footer_powered", lang)}
          </p>
          <p className="text-center text-[10px] mt-1 px-2" style={{ color: "hsl(var(--muted-foreground) / 0.25)", fontFamily: "var(--font-sub)", lineHeight: 1.8 }}>
            gam3s.gg · playtoearn · voxel · Terra GameOn · GameVício · GameSpot · Polygon · Kotaku · PCGamer · Eurogamer · Rock Paper Shotgun · GamesRadar · Gematsu · CoinDesk · The Block · Decrypt · Bitcoin Magazine · BeInCrypto · CryptoPotato · GameDiscover · GameMakers · Elite Game Devs · Crossplay · GameDev Reports
          </p>
        </div>
      </main>
    </div>
  );
};

function ColHeader({ label, sub, color, icon }: { label: string; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}>
        {icon}
      </div>
      <div>
        <h2 className="text-[13px] font-black tracking-widest leading-none" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
          {label}
        </h2>
        <p className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

export default Index;

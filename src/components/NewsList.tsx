import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ExternalLink, ChevronLeft, Gamepad2, Globe, Cpu, ChevronRight, ImageOff } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { tr } from "@/lib/i18n";

// ── Niche covers ─────────────────────────────────────────────
import coverGames   from "@/assets/cover-games.jpg";
import coverWeb3    from "@/assets/cover-web3.jpg";
import coverGameDev from "@/assets/cover-gamedev.jpg";

// ── Local logo imports ────────────────────────────────────────
import logoGam3s          from "@/assets/logo-gam3s.jpg";
import logoPlaytoearn     from "@/assets/logo-playtoearn.png";
import logoVoxel          from "@/assets/logo-voxel.svg";
import logoTerraGameon    from "@/assets/logo-terra-gameon.png";
import logoGamevicio      from "@/assets/logo-gamevicio.webp";
import logoGamespot       from "@/assets/logo-gamespot.png";
import logoEurogamer      from "@/assets/logo-eurogamer.png";
import logoPcGamer        from "@/assets/logo-pcgamer.png";
import logoPolygon        from "@/assets/logo-polygon.png";
import logoKotaku         from "@/assets/logo-kotaku.png";
import logoRps            from "@/assets/logo-rps.png";
import logoGamesRadar     from "@/assets/logo-gamesradar.png";
import logoGematsu        from "@/assets/logo-gematsu.png";
import logoGameInformer   from "@/assets/logo-gameinformer.png";
import logoCoinDesk       from "@/assets/logo-coindesk.png";
import logoTheBlock       from "@/assets/logo-theblock.png";
import logoDecrypt        from "@/assets/logo-decrypt.png";
import logoBitcoinMag     from "@/assets/logo-bitcoinmagazine.png";
import logoBeInCrypto     from "@/assets/logo-beincrypto.png";
import logoCryptoPotato   from "@/assets/logo-cryptopotato.png";
import logoGameDiscover   from "@/assets/logo-gamediscover.png";
import logoGameMakers     from "@/assets/logo-gamemakers.png";
import logoEliteGameDevs  from "@/assets/logo-elitegamedevs.png";
import logoCrossplay      from "@/assets/logo-crossplay.png";
import logoGameDevReports from "@/assets/logo-gamedevreports.png";

export interface NewsItem {
  title: string;
  excerpt: string;
  url: string;
  image?: string;
  fullContent?: string;
  publishedDate?: string | null;
  source?: string;
}

interface NewsListProps {
  onSelectNews: (item: NewsItem) => void;
  selectedUrl: string | null;
  onStepChange?: (step: string) => void;
}

const SOURCES = [
  { name: "gam3s.gg",           color: "#00ff87", logo: logoGam3s,        niche: "games" },
  { name: "Voxel",              color: "#00d4ff", logo: logoVoxel,        niche: "games" },
  { name: "Terra GameOn",       color: "#c77dff", logo: logoTerraGameon,  niche: "games" },
  { name: "GameVício",          color: "#a855f7", logo: logoGamevicio,    niche: "games" },
  { name: "Game Informer",      color: "#ff4d4d", logo: logoGameInformer, niche: "games" },
  { name: "GameSpot",           color: "#fbbf24", logo: logoGamespot,     niche: "games" },
  { name: "Eurogamer PT",       color: "#fb923c", logo: logoEurogamer,    niche: "games" },
  { name: "PC Gamer",           color: "#ff3366", logo: logoPcGamer,      niche: "games" },
  { name: "Polygon",            color: "#9b5cf6", logo: logoPolygon,      niche: "games" },
  { name: "Kotaku",             color: "#06d6f0", logo: logoKotaku,       niche: "games" },
  { name: "Rock Paper Shotgun", color: "#a3e635", logo: logoRps,          niche: "games" },
  { name: "GamesRadar",         color: "#ff6b35", logo: logoGamesRadar,   niche: "games" },
  { name: "Gematsu",            color: "#94a3b8", logo: logoGematsu,      niche: "games" },
  { name: "playtoearn.com",     color: "#4d9fff", logo: logoPlaytoearn,   niche: "web3" },
  { name: "CoinDesk PT",        color: "#fbbf24", logo: logoCoinDesk,     niche: "web3" },
  { name: "The Block",          color: "#3b82f6", logo: logoTheBlock,     niche: "web3" },
  { name: "Decrypt",            color: "#10e8a0", logo: logoDecrypt,      niche: "web3" },
  { name: "Bitcoin Magazine",   color: "#ff8c00", logo: logoBitcoinMag,   niche: "web3" },
  { name: "BeInCrypto BR",      color: "#6366f1", logo: logoBeInCrypto,   niche: "web3" },
  { name: "CryptoPotato",       color: "#b58af4", logo: logoCryptoPotato, niche: "web3" },
  { name: "GameDiscover.co",       color: "#4d9fff", logo: logoGameDiscover,   niche: "tech" },
  { name: "GameMakers",            color: "#00ff87", logo: logoGameMakers,     niche: "tech" },
  { name: "Elite Game Developers", color: "#fbbf24", logo: logoEliteGameDevs,  niche: "tech" },
  { name: "Crossplay News",        color: "#c77dff", logo: logoCrossplay,      niche: "tech" },
  { name: "GameDev Reports",       color: "#ff6b35", logo: logoGameDevReports, niche: "tech" },
] as const;

type SourceItem = typeof SOURCES[number];
type Niche = "games" | "web3" | "tech";
type Step = "niche" | "source" | "news";

// ── SourceLogo ──────────────────────────────────────────────
function SourceLogo({ src, size = "md" }: { src: SourceItem; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  const [failed, setFailed] = useState(false);
  const dim = size === "2xl" ? 56 : size === "xl" ? 40 : size === "lg" ? 32 : size === "md" ? 22 : 14;

  if (!failed && src.logo) {
    return (
      <img
        src={src.logo as string}
        alt={src.name}
        width={dim}
        height={dim}
        onError={() => setFailed(true)}
        className="object-contain rounded"
        style={{ width: dim, height: dim, imageRendering: "crisp-edges" }}
      />
    );
  }

  const short = src.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  return (
    <span
      className="font-black rounded flex items-center justify-center"
      style={{
        color: src.color,
        background: `${src.color}22`,
        border: `1px solid ${src.color}40`,
        fontSize: size === "sm" ? 7 : size === "md" ? 9 : size === "lg" ? 11 : size === "xl" ? 14 : 18,
        fontFamily: "var(--font-display)",
        letterSpacing: "0.03em",
        width: dim, height: dim, minWidth: dim, minHeight: dim,
      }}
    >
      {short}
    </span>
  );
}

export function NewsList({ onSelectNews, selectedUrl, onStepChange }: NewsListProps) {
  const [step, setStep] = useState<Step>("niche");
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState<string | null>(null);
  const { toast } = useToast();
  const { lang } = useLang();

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const nicheSources = selectedNiche ? SOURCES.filter((s) => s.niche === selectedNiche) : [];
  const activeSrc = SOURCES.find((s) => s.name === activeSource) as SourceItem | undefined;

  const NICHES: {
    id: Niche; label: string; sub: string; icon: React.ReactNode;
    color: string; gradient: string; cover: string; tag: string;
  }[] = [
    {
      id: "games", label: "GAMES", sub: tr("niche_games_sub", lang),
      icon: <Gamepad2 className="w-5 h-5" />, color: "#c77dff",
      gradient: "linear-gradient(135deg, #c77dff30, #9b5cf618)",
      cover: coverGames, tag: `13 ${tr("sources_count", lang)}`,
    },
    {
      id: "web3", label: "WEB3", sub: tr("niche_web3_sub", lang),
      icon: <Globe className="w-5 h-5" />, color: "#00ff87",
      gradient: "linear-gradient(135deg, #00ff8730, #00d4ff18)",
      cover: coverWeb3, tag: `7 ${tr("sources_count", lang)}`,
    },
    {
      id: "tech", label: "GAMEDEV", sub: tr("niche_gamedev_sub", lang),
      icon: <Cpu className="w-5 h-5" />, color: "#4d9fff",
      gradient: "linear-gradient(135deg, #4d9fff30, #6366f118)",
      cover: coverGameDev, tag: `5 ${tr("sources_count", lang)}`,
    },
  ];

  const handleNicheSelect = (niche: Niche) => {
    setSelectedNiche(niche);
    setStep("source");
  };

  // ── Client-side session cache (15min TTL) ──────────────────
  const CLIENT_CACHE_TTL = 15 * 60 * 1000;
  const cacheRef = useRef<Map<string, { news: NewsItem[]; fetchedAt: number }>>(new Map());
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const cooldownActive = Date.now() < cooldownUntil;

  // Tick to clear cooldown visual
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!cooldownActive) return;
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, [cooldownActive]);

  const fetchSource = async (sourceName: string, forceRefresh = false) => {
    // Check client cache first
    if (!forceRefresh) {
      const cached = cacheRef.current.get(`${sourceName}_${lang}`);
      if (cached && (Date.now() - cached.fetchedAt) < CLIENT_CACHE_TTL) {
        const ageMin = Math.round((Date.now() - cached.fetchedAt) / 60000);
        setNews(cached.news);
        setActiveSource(sourceName);
        setStep("news");
        toast({ title: `📦 ${sourceName}`, description: `${cached.news.length} ${tr("news_count", lang)} · ${tr("toast_cache_hit", lang)} ${ageMin} ${tr("toast_cache_min_ago", lang)}` });
        return;
      }
    }

    setLoadingSource(sourceName);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-news", {
        body: { source: sourceName, lang, forceRefresh },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || tr("toast_error_news", lang));
      const incoming: NewsItem[] = (data.news || []).sort((a: NewsItem, b: NewsItem) => {
        if (!a.publishedDate && !b.publishedDate) return 0;
        if (!a.publishedDate) return 1;
        if (!b.publishedDate) return -1;
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      });

      // Store in client cache
      cacheRef.current.set(`${sourceName}_${lang}`, { news: incoming, fetchedAt: Date.now() });

      setNews(incoming);
      setActiveSource(sourceName);
      setStep("news");

      // Start cooldown (5 seconds)
      setCooldownUntil(Date.now() + 5000);

      if (incoming.length === 0) {
        toast({
          title: `⚠️ ${sourceName}`,
          description: tr("toast_blocked_warning", lang),
          variant: "destructive",
        });
      } else {
        const cacheNote = data.cached ? ` · ⚡ server cache (${data.cacheAgeMin}min)` : '';
        toast({ title: `✅ ${sourceName}`, description: `${incoming.length} ${tr("news_count", lang)}${cacheNote}` });
      }
    } catch (err) {
      toast({ title: tr("toast_error_news", lang), description: err instanceof Error ? err.message : tr("toast_retry", lang), variant: "destructive" });
    } finally {
      setLoadingSource(null);
    }
  };

  const isLoading = loadingSource !== null;
  const isDisabled = isLoading || cooldownActive;

  // ── STEP: NICHE ─────────────────────────────────────────────
  if (step === "niche") {
    return (
      <div className="flex flex-col gap-3 animate-fade-in">
        <p className="text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
          {tr("select_niche", lang)}
        </p>

        <div className="flex flex-col gap-3">
          {NICHES.map((niche, idx) => {
            const previewSrcs = SOURCES.filter((s) => s.niche === niche.id).slice(0, 6);
            const totalCount = SOURCES.filter((s) => s.niche === niche.id).length;
            return (
              <button
                key={niche.id}
                onClick={() => handleNicheSelect(niche.id)}
                className="relative rounded-2xl border text-left transition-all duration-200 group overflow-hidden"
                style={{
                  borderColor: "hsl(var(--border))",
                  background: "hsl(var(--card))",
                  animationDelay: `${idx * 60}ms`,
                  minHeight: 130,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = niche.color + "55";
                  e.currentTarget.style.boxShadow = `0 0 40px ${niche.color}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <img src={niche.cover} alt={niche.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.18 }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, hsl(var(--card)) 30%, hsl(var(--card) / 0.6) 65%, transparent 100%)` }} />
                </div>
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${niche.color}, transparent)` }} />

                <div className="relative flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                    style={{ background: `${niche.color}18`, border: `1px solid ${niche.color}40`, color: niche.color, boxShadow: `0 0 20px ${niche.color}20` }}
                  >
                    {niche.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[15px] font-black tracking-widest" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-display)" }}>
                        {niche.label}
                      </span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase" style={{ background: `${niche.color}20`, color: niche.color, border: `1px solid ${niche.color}35`, fontFamily: "var(--font-sub)" }}>
                        {niche.tag}
                      </span>
                    </div>
                    <p className="text-[11px] mb-2" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-body)" }}>
                      {niche.sub}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {previewSrcs.map((s) => (
                        <div key={s.name} className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden" style={{ background: `${s.color}14`, border: `1px solid ${s.color}30` }} title={s.name}>
                          <SourceLogo src={s as SourceItem} size="sm" />
                        </div>
                      ))}
                      {totalCount > 6 && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ color: niche.color, background: `${niche.color}15`, fontFamily: "var(--font-sub)" }}>
                          +{totalCount - 6}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-25 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" style={{ color: niche.color }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── STEP: SOURCE ─────────────────────────────────────────────
  if (step === "source") {
    const currentNiche = NICHES.find((n) => n.id === selectedNiche)!;
    return (
      <div className="flex flex-col gap-3 animate-slide-in-left">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("niche")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            style={{ background: "hsl(var(--muted) / 0.6)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontFamily: "var(--font-sub)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = currentNiche.color + "50"; e.currentTarget.style.color = currentNiche.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--foreground))"; }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {tr("niche_back", lang)}
          </button>
          <span className="text-[10px]" style={{ color: "hsl(var(--border))" }}>/</span>
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: currentNiche.color, fontFamily: "var(--font-display)" }}>
            {currentNiche.label}
          </span>
        </div>

        {/* Niche mini-banner */}
        <div className="relative rounded-xl overflow-hidden" style={{ height: 72, border: `1px solid ${currentNiche.color}25` }}>
          <img src={currentNiche.cover} alt={currentNiche.label} className="w-full h-full object-cover" style={{ opacity: 0.3 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, hsl(var(--card) / 0.9) 40%, transparent)" }} />
          <div className="absolute inset-0 flex items-center gap-3 px-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${currentNiche.color}20`, border: `1px solid ${currentNiche.color}45`, color: currentNiche.color }}>
              {currentNiche.icon}
            </div>
            <div>
              <p className="text-[13px] font-black tracking-widest" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
                {currentNiche.label}
              </p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                {currentNiche.sub}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-[0.15em] px-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
          {tr("select_source", lang)}
        </p>

        {/* 2-col source grid */}
        <div className="grid grid-cols-2 gap-2">
          {nicheSources.map((src) => {
            const s = src as SourceItem;
            const loading = loadingSource === s.name;
            return (
              <button
                key={s.name}
                onClick={() => fetchSource(s.name)}
                disabled={isDisabled}
                className="relative flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-xl border text-center transition-all duration-200 group overflow-hidden"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.35)", minHeight: 108 }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.borderColor = s.color + "60";
                    e.currentTarget.style.background = `${s.color}0e`;
                    e.currentTarget.style.boxShadow = `0 0 28px ${s.color}18`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.background = "hsl(var(--muted) / 0.35)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 overflow-hidden" style={{ background: `${s.color}14`, border: `1.5px solid ${s.color}40` }}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: s.color }} /> : <SourceLogo src={s} size="2xl" />}
                </div>
                <p className="text-[10px] font-bold leading-tight w-full px-1 uppercase tracking-wide line-clamp-2" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-sub)" }}>
                  {s.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── STEP: NEWS ───────────────────────────────────────────────
  const currentNiche = NICHES.find((n) => n.id === selectedNiche)!;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Nav bar: back button + breadcrumbs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStep("source")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          style={{ background: "hsl(var(--muted) / 0.6)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontFamily: "var(--font-sub)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = (activeSrc?.color ?? "#fff") + "50"; e.currentTarget.style.color = activeSrc?.color ?? "hsl(var(--foreground))"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--foreground))"; }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {tr("source_back", lang)}
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setStep("niche")} className="text-[10px] font-bold uppercase tracking-wider opacity-40 hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-sub)" }}>
            {tr("niche_back", lang)}
          </button>
          <span className="text-[10px]" style={{ color: "hsl(var(--border))" }}>/</span>
          <button onClick={() => setStep("source")} className="text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity" style={{ color: currentNiche?.color, fontFamily: "var(--font-sub)" }}>
            {currentNiche?.label}
          </button>
          <span className="text-[10px]" style={{ color: "hsl(var(--border))" }}>/</span>
          <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[100px]" style={{ color: activeSrc?.color, fontFamily: "var(--font-display)" }}>
            {activeSource}
          </span>
        </div>
      </div>

      {/* Source header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {activeSrc && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${activeSrc.color}14`, border: `1.5px solid ${activeSrc.color}40` }}>
              <SourceLogo src={activeSrc} size="lg" />
            </div>
          )}
          <div>
            <span className="text-[13px] font-black uppercase tracking-wide block leading-none" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-sub)" }}>
              {activeSource}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: activeSrc?.color, fontFamily: "var(--font-sub)" }}>
              {news.length} {tr("news_count", lang)}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => activeSource && fetchSource(activeSource, true)} disabled={isLoading} className="h-7 px-2 text-xs gap-1">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-sub)" }}>{tr("update_btn", lang)}</span>
        </Button>
      </div>

      {/* Source switcher pills */}
      {nicheSources.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {nicheSources.map((s) => {
            const src = s as SourceItem;
            const active = activeSource === src.name;
            return (
              <button
                key={src.name}
                onClick={() => fetchSource(src.name)}
                disabled={isDisabled}
                className="flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-lg border transition-all font-bold uppercase tracking-wide"
                style={{
                  borderColor: active ? src.color + "60" : "hsl(var(--border))",
                  background: active ? `${src.color}12` : "transparent",
                  color: active ? src.color : "hsl(var(--muted-foreground))",
                  fontFamily: "var(--font-sub)",
                  boxShadow: active ? `0 0 12px ${src.color}20` : undefined,
                }}
              >
                {loadingSource === src.name
                  ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  : <div className="w-3.5 h-3.5 rounded overflow-hidden flex items-center justify-center flex-shrink-0"><SourceLogo src={src} size="sm" /></div>
                }
                {src.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* News list */}
      <div className="space-y-2">
        {news.map((item, i) => (
          <NewsCard
            key={item.url}
            item={item}
            selected={selectedUrl === item.url}
            onSelect={() => onSelectNews(item)}
            index={i}
            accentColor={activeSrc?.color}
          />
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try { return new Date(dateStr).toDateString() === new Date().toDateString(); } catch { return false; }
}

function formatDate(dateStr?: string | null, lang = "pt"): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return lang === "en" ? "TODAY" : lang === "es" ? "HOY" : "HOJE";
    if (diffDays === 1) return lang === "en" ? "YEST." : lang === "es" ? "AYER" : "ONTEM";
    if (diffDays < 7) return `${diffDays}D`;
    return date.toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" }).toUpperCase();
  } catch { return null; }
}

// ── NewsCard ─────────────────────────────────────────────────
function NewsCard({ item, selected, onSelect, index, accentColor }: {
  item: NewsItem; selected: boolean; onSelect: () => void; index: number; accentColor?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const { lang } = useLang();
  const today = isToday(item.publishedDate);
  const formattedDate = formatDate(item.publishedDate, lang);
  const accent = accentColor || "#00ff87";
  const hasImg = !!item.image && !imgFailed;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className="relative w-full text-left rounded-xl border transition-all duration-200 cursor-pointer group overflow-hidden"
      style={{
        animationDelay: `${index * 25}ms`,
        borderColor: selected ? `${accent}55` : "hsl(var(--border))",
        background: selected ? `linear-gradient(135deg, ${accent}10, hsl(var(--card)))` : "hsl(var(--muted) / 0.3)",
        boxShadow: selected ? `0 0 0 1px ${accent}20, 0 4px 24px ${accent}0d` : undefined,
      }}
      onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = `${accent}35`; e.currentTarget.style.background = `${accent}07`; } }}
      onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.background = "hsl(var(--muted) / 0.3)"; } }}
    >
      {selected && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />}

      {/* Thumbnail */}
      {hasImg && (
        <div className="relative w-full h-[120px] overflow-hidden">
          <img src={item.image} alt={item.title} onError={() => setImgFailed(true)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, hsl(var(--card)) 100%)" }} />
          {(today || formattedDate) && (
            <div className="absolute top-2 left-2">
              {today
                ? <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background: "hsl(var(--primary) / 0.85)", color: "hsl(var(--primary-foreground))", fontFamily: "var(--font-sub)" }}>● {tr("date_today", lang)}</span>
                : <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ background: "hsl(var(--card) / 0.8)", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)", backdropFilter: "blur(4px)" }}>{formattedDate}</span>
              }
            </div>
          )}
          <span className="absolute top-2 right-2 text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded" style={{ color: selected ? accent : "hsl(var(--muted-foreground))", background: "hsl(var(--card) / 0.75)", fontFamily: "var(--font-display)", backdropFilter: "blur(4px)", textShadow: selected ? `0 0 8px ${accent}` : undefined }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      )}

      <div className={`flex items-start gap-3 px-4 py-3.5 ${hasImg ? "pt-2" : ""}`}>
        {!hasImg && (
          <span className="text-[10px] font-black shrink-0 mt-px tabular-nums" style={{ color: selected ? accent : "hsl(var(--muted-foreground))", fontFamily: "var(--font-display)", textShadow: selected ? `0 0 8px ${accent}` : undefined }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          {!hasImg && (today || formattedDate) && (
            <div className="flex items-center gap-1.5">
              {today
                ? <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse-neon" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.4)", fontFamily: "var(--font-sub)" }}>● {tr("date_today", lang)}</span>
                : <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{formattedDate}</span>
              }
            </div>
          )}

          <p className="text-[13px] font-semibold leading-snug text-balance" style={{ color: selected ? "hsl(var(--foreground))" : "hsl(var(--card-foreground))", lineHeight: 1.45 }}>
            {item.title}
          </p>

          {!hasImg && item.excerpt && (
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              {item.excerpt}
            </p>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider"
              style={{ color: accent, fontFamily: "var(--font-sub)" }}
            >
              <ExternalLink className="w-2.5 h-2.5" />
              {tr("see_original", lang)}
            </a>
          )}
        </div>

        {!hasImg && (
          <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center opacity-20" style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
            <ImageOff className="w-4 h-4" style={{ color: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}

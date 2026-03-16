import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Zap, ExternalLink, RotateCcw, Timer, Hash, Twitter } from "lucide-react";
import type { NewsItem } from "./NewsList";
import { useLang } from "@/contexts/LanguageContext";
import { tr } from "@/lib/i18n";

interface ScriptPanelProps {
  selectedNews: NewsItem | null;
  onGoToNews?: () => void;
  niche?: string;
  newsSource?: string;
}

interface Script {
  hook: string;
  desenvolvimento: string;
  cta: string;
  hashtags: string[];
  titulo_sugerido: string;
  duracao_estimada: string;
}

interface TweetResult {
  tweets: string[];
}

interface CachedResult {
  script: Script | null;
  tweetResult: TweetResult | null;
}

export function ScriptPanel({ selectedNews, onGoToNews, niche, newsSource }: ScriptPanelProps) {
  const [script, setScript] = useState<Script | null>(null);
  const [tweetResult, setTweetResult] = useState<TweetResult | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingTweet, setLoadingTweet] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const { lang } = useLang();

  // Cache generated scripts/tweets per news URL
  const cacheRef = useRef<Map<string, CachedResult>>(new Map());
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const newUrl = selectedNews?.url ?? null;
    const oldUrl = prevUrlRef.current;

    // Save current results to cache before switching
    if (oldUrl && oldUrl !== newUrl) {
      cacheRef.current.set(oldUrl, { script, tweetResult });
    }

    // Load cached results for the new news, or clear
    if (newUrl && newUrl !== oldUrl) {
      const cached = cacheRef.current.get(newUrl);
      if (cached) {
        setScript(cached.script);
        setTweetResult(cached.tweetResult);
      } else {
        setScript(null);
        setTweetResult(null);
      }
    } else if (!newUrl) {
      setScript(null);
      setTweetResult(null);
    }

    prevUrlRef.current = newUrl;
  }, [selectedNews?.url]);

  const saveScriptToHistory = async (scriptData: Script, newsItem: NewsItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("saved_scripts").insert({
        user_id: user.id,
        news_title: newsItem.title,
        news_url: newsItem.url,
        news_source: newsSource || null,
        niche: niche || null,
        script_title: scriptData.titulo_sugerido,
        script_duration: scriptData.duracao_estimada,
        script_hook: scriptData.hook,
        script_dev: scriptData.desenvolvimento,
        script_cta: scriptData.cta,
        script_hashtags: scriptData.hashtags,
        script_type: "script",
      });
    } catch (err) {
      console.error("Error saving script:", err);
    }
  };

  const saveTweetToHistory = async (tweets: string[], newsItem: NewsItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("saved_scripts").insert({
        user_id: user.id,
        news_title: newsItem.title,
        news_url: newsItem.url,
        news_source: newsSource || null,
        niche: niche || null,
        script_type: "tweet",
        tweet_content: tweets.join("\n\n---\n\n"),
      });
    } catch (err) {
      console.error("Error saving tweet:", err);
    }
  };

  const generateScript = async () => {
    if (!selectedNews) return;
    setLoadingScript(true);
    setScript(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: {
          title: selectedNews.title,
          excerpt: selectedNews.excerpt,
          url: selectedNews.url,
          fullContent: selectedNews.fullContent || null,
          lang,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || tr("toast_error_script", lang));
      setScript(data.script);
      // Auto-save
      saveScriptToHistory(data.script, selectedNews);
      toast({ title: "💾 Script salvo", description: "Salvo automaticamente no seu histórico." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : tr("toast_error_script", lang);
      toast({ title: tr("toast_error_script", lang), description: msg, variant: "destructive" });
    } finally {
      setLoadingScript(false);
    }
  };

  const generateTweet = async () => {
    if (!selectedNews) return;
    setLoadingTweet(true);
    setTweetResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tweet", {
        body: {
          title: selectedNews.title,
          excerpt: selectedNews.excerpt,
          url: selectedNews.url,
          fullContent: selectedNews.fullContent || null,
          lang,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || tr("toast_error_tweet", lang));
      const tweets = data.tweets || [];
      setTweetResult({ tweets });
      // Auto-save
      saveTweetToHistory(tweets, selectedNews);
      toast({ title: "💾 Tweet salvo", description: "Salvo automaticamente no seu histórico." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : tr("toast_error_tweet", lang);
      toast({ title: tr("toast_error_tweet", lang), description: msg, variant: "destructive" });
    } finally {
      setLoadingTweet(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: tr("toast_copied_title", lang), description: tr("toast_copied_desc", lang) });
  };

  const copyFullScript = () => {
    if (!script) return;
    const full = `🎬 ${script.titulo_sugerido}\n⏱️ ${script.duracao_estimada}\n\n🪝 ${tr("section_hook", lang)}:\n${script.hook}\n\n📢 ${tr("section_dev", lang)}:\n${script.desenvolvimento}\n\n🎯 ${tr("section_cta", lang)}:\n${script.cta}\n\n${script.hashtags.join(" ")}`;
    copyToClipboard(full, "full");
  };

  // ── Empty state ──────────────────────────────────────────────
  if (!selectedNews) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-5 animate-fade-in">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl animate-pulse-neon" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--primary) / 0.3)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-display)" }}>
            {tr("waiting_title", lang)}
          </p>
          <p className="text-[11px] whitespace-pre-line" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-body)" }}>
            {tr("waiting_desc", lang)}
          </p>
        </div>
        {onGoToNews && (
          <button
            onClick={onGoToNews}
            className="lg:hidden flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
            style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))", fontFamily: "var(--font-sub)" }}
          >
            <Zap className="w-3.5 h-3.5" />
            {tr("col_news", lang)}
          </button>
        )}
        <div className="flex flex-col items-center gap-1 opacity-30">
          <div className="w-px h-8" style={{ background: "linear-gradient(180deg, transparent, hsl(var(--primary)))" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Selected news card */}
      <div className="rounded-xl p-4 space-y-2 relative overflow-hidden" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.4), transparent)" }} />
        <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
          {tr("selected_news", lang)}
        </p>
        <p className="text-[13px] font-semibold leading-snug" style={{ color: "hsl(var(--foreground))", lineHeight: 1.45 }}>
          {selectedNews.title}
        </p>
        {selectedNews.url && (
          <a href={selectedNews.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "hsl(var(--accent))", fontFamily: "var(--font-sub)" }}>
            <ExternalLink className="w-3 h-3" />
            {tr("see_original_news", lang)}
          </a>
        )}
      </div>

      {/* Action buttons row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Generate Script button */}
        <ActionButton
          onClick={generateScript}
          loading={loadingScript}
          loadingLabel={tr("generating", lang)}
          label={tr("generate_btn", lang)}
          color="primary"
          icon={<Zap className="w-4 h-4" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }} />}
        />
        {/* Generate Tweet button */}
        <ActionButton
          onClick={generateTweet}
          loading={loadingTweet}
          loadingLabel={tr("generating_tweet", lang)}
          label={tr("generate_tweet_btn", lang)}
          color="twitter"
          icon={<Twitter className="w-4 h-4" />}
        />
      </div>

      {/* Script loading state */}
      {loadingScript && <LoadingCard label={tr("processing", lang)} desc={tr("processing_desc", lang)} color="hsl(var(--primary))" />}

      {/* Tweet loading state */}
      {loadingTweet && <LoadingCard label={tr("generating_tweet", lang)} desc="Criando tweet viral com IA..." color="#1d9bf0" />}

      {/* Script result */}
      {script && !loadingScript && (
        <div className="space-y-2.5 animate-slide-up">
          {/* Header row */}
          <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: "hsl(var(--primary) / 0.07)", border: "1px solid hsl(var(--primary) / 0.25)" }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-sub)" }}>
                    {script.duracao_estimada}
                  </span>
                </div>
                <p className="text-[13px] font-black leading-snug" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>
                  {script.titulo_sugerido}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={copyFullScript}
                  className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all"
                  style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))", fontFamily: "var(--font-sub)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--primary) / 0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(var(--primary) / 0.12)"; }}
                >
                  {copied === "full" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {tr("copy_all", lang)}
                </button>
                <button
                  onClick={generateScript}
                  className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--foreground) / 0.2)"; e.currentTarget.style.color = "hsl(var(--foreground))"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
                >
                  <RotateCcw className="w-3 h-3" />
                  {tr("regenerate", lang)}
                </button>
              </div>
            </div>
          </div>

          <ScriptSection label={tr("section_hook", lang)} tag="01" content={script.hook} onCopy={() => copyToClipboard(script.hook, "hook")} copied={copied === "hook"} color="#00ff87" emoji="🪝" copyLabel={tr("copy", lang)} copiedLabel={tr("copied", lang)} />
          <ScriptSection label={tr("section_dev", lang)} tag="02" content={script.desenvolvimento} onCopy={() => copyToClipboard(script.desenvolvimento, "dev")} copied={copied === "dev"} color="hsl(192 100% 55%)" emoji="📢" copyLabel={tr("copy", lang)} copiedLabel={tr("copied", lang)} />
          <ScriptSection label={tr("section_cta", lang)} tag="03" content={script.cta} onCopy={() => copyToClipboard(script.cta, "cta")} copied={copied === "cta"} color="#ff6b35" emoji="🎯" copyLabel={tr("copy", lang)} copiedLabel={tr("copied", lang)} />

          {/* Hashtags */}
          <div className="rounded-xl p-4" style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                {tr("hashtags", lang)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {script.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide cursor-pointer transition-all"
                  style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)", fontFamily: "var(--font-sub)" }}
                  onClick={() => copyToClipboard(tag, `tag-${i}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary) / 0.18)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary) / 0.08)"; }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tweet result — 3 options */}
      {tweetResult && !loadingTweet && (
        <div className="animate-slide-up space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Twitter className="w-3.5 h-3.5" style={{ color: "#1d9bf0" }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#1d9bf0", fontFamily: "var(--font-sub)" }}>
                {tr("viral_tweet", lang)}
              </p>
            </div>
            <button
              className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all"
              style={{ background: "#1d9bf010", border: "1px solid #1d9bf030", color: "#1d9bf0", fontFamily: "var(--font-sub)" }}
              onClick={generateTweet}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1d9bf025"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1d9bf010"; }}
            >
              <RotateCcw className="w-3 h-3" />
              {tr("regenerate_tweet", lang)}
            </button>
          </div>
          {(tweetResult.tweets ?? []).map((tweet, i) => (
            <div key={i} className="rounded-xl p-4 group relative overflow-hidden" style={{ background: "hsl(228 22% 9%)", border: "1px solid #1d9bf030" }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #1d9bf0, transparent)" }} />
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#1d9bf050", fontFamily: "var(--font-sub)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  className="shrink-0 flex items-center gap-1 text-[9px] px-2 py-1.5 rounded-lg transition-all"
                  style={{ background: "#1d9bf015", border: "1px solid #1d9bf030", color: "#1d9bf0" }}
                  onClick={() => copyToClipboard(tweet, `tweet-${i}`)}
                >
                  {copied === `tweet-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                {tweet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ActionButton ──────────────────────────────────────────────
function ActionButton({ onClick, loading, loadingLabel, label, color, icon }: {
  onClick: () => void; loading: boolean; loadingLabel: string;
  label: string; color: "primary" | "twitter"; icon: React.ReactNode;
}) {
  const isPrimary = color === "primary";
  const bg = isPrimary ? "hsl(var(--primary) / 0.12)" : "#1d9bf015";
  const bgHover = isPrimary ? "hsl(var(--primary) / 0.22)" : "#1d9bf030";
  const border = isPrimary ? "1px solid hsl(var(--primary) / 0.45)" : "1px solid #1d9bf050";
  const textColor = isPrimary ? "hsl(var(--primary))" : "#1d9bf0";
  const shadow = isPrimary ? "0 0 24px hsl(var(--primary) / 0.15)" : "0 0 24px #1d9bf015";

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="relative h-12 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all duration-200 overflow-hidden disabled:opacity-60"
      style={{ background: loading ? bgHover : bg, border, color: textColor, fontFamily: "var(--font-display)", boxShadow: loading ? undefined : shadow }}
      onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = bgHover; } }}
      onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = bg; } }}
    >
      <span className="flex items-center justify-center gap-2">
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</>
        ) : (
          <>{icon}{label}</>
        )}
      </span>
    </button>
  );
}

// ── LoadingCard ───────────────────────────────────────────────
function LoadingCard({ label, desc, color }: { label: string; desc: string; color: string }) {
  return (
    <div className="rounded-xl p-5 text-center space-y-3" style={{ background: "hsl(var(--muted) / 0.3)", border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-center gap-2" style={{ color }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[12px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
          {label}
        </span>
      </div>
      <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full rounded-full shimmer" style={{ width: "60%" }} />
      </div>
      <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
    </div>
  );
}

// ── ScriptSection ─────────────────────────────────────────────
function ScriptSection({ label, tag, content, onCopy, copied, color, emoji, copyLabel, copiedLabel }: {
  label: string; tag: string; content: string; onCopy: () => void; copied: boolean;
  color: string; emoji: string; copyLabel: string; copiedLabel: string;
}) {
  return (
    <div
      className="rounded-xl p-4 group relative overflow-hidden"
      style={{ background: "hsl(var(--muted) / 0.35)", border: "1px solid hsl(var(--border))" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}35`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full" style={{ background: color, opacity: 0.5 }} />
      <div className="pl-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black opacity-40" style={{ fontFamily: "var(--font-display)", color }}>{tag}</span>
            <span className="text-sm">{emoji}</span>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color, fontFamily: "var(--font-sub)" }}>{label}</p>
          </div>
          <button
            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: `${color}12`, border: `1px solid ${color}30`, color, fontFamily: "var(--font-sub)" }}
            onClick={onCopy}
          >
            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
        <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground) / 0.88)" }}>
          {content}
        </p>
      </div>
    </div>
  );
}

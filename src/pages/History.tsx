import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSavedScripts, type SavedScript } from "@/hooks/useSavedScripts";
import { ArrowLeft, Loader2, Trash2, Copy, Check, ChevronDown, ChevronUp, Gamepad2, Globe, Cpu, ScrollText, Twitter, Zap, Filter, Star, Archive, Search, ArchiveRestore } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

type FilterNiche = "all" | "games" | "web3" | "tech";
type FilterType = "all" | "script" | "tweet";
type ViewMode = "active" | "favorites" | "archived";

const NICHE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  games: { label: "GAMES", color: "#c77dff", icon: <Gamepad2 className="w-3 h-3" /> },
  web3: { label: "WEB3", color: "#00ff87", icon: <Globe className="w-3 h-3" /> },
  tech: { label: "GAMEDEV", color: "#4d9fff", icon: <Cpu className="w-3 h-3" /> },
};

const History = () => {
  const navigate = useNavigate();
  const { scripts, loading, deleteScript, toggleFavorite, toggleArchive } = useSavedScripts();
  const { toast } = useToast();
  const [filterNiche, setFilterNiche] = useState<FilterNiche>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = scripts.filter((s) => {
    // View mode filter
    if (viewMode === "favorites" && !s.is_favorite) return false;
    if (viewMode === "archived" && !s.is_archived) return false;
    if (viewMode === "active" && s.is_archived) return false;
    // Niche/type filters
    if (filterNiche !== "all" && s.niche !== filterNiche) return false;
    if (filterType !== "all" && s.script_type !== filterType) return false;
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const searchable = [s.news_title, s.script_title, s.script_hook, s.script_dev, s.script_cta, s.tweet_content, s.news_source, ...(s.script_hashtags || [])].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  const handleCopy = async (script: SavedScript) => {
    const text = script.script_type === "tweet"
      ? script.tweet_content || ""
      : `🎬 ${script.script_title}\n⏱️ ${script.script_duration}\n\n🪝 HOOK:\n${script.script_hook}\n\n📢 DESENVOLVIMENTO:\n${script.script_dev}\n\n🎯 CTA:\n${script.script_cta}\n\n${(script.script_hashtags || []).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(script.id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "✅ Copiado!", description: "Script copiado para a área de transferência." });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScript(id);
      toast({ title: "🗑️ Removido", description: "Script excluído do histórico." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
      const script = scripts.find((s) => s.id === id);
      toast({ title: script?.is_favorite ? "Removido dos favoritos" : "⭐ Adicionado aos favoritos" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await toggleArchive(id);
      const script = scripts.find((s) => s.id === id);
      toast({ title: script?.is_archived ? "📂 Desarquivado" : "📦 Arquivado", description: script?.is_archived ? "Script movido de volta." : "Script arquivado." });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const activeCount = scripts.filter((s) => !s.is_archived).length;
  const favCount = scripts.filter((s) => s.is_favorite).length;
  const archCount = scripts.filter((s) => s.is_archived).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20" style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(228 22% 5% / 0.92)", backdropFilter: "blur(24px)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 30%, hsl(var(--accent)) 70%, transparent 100%)" }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-[56px] flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all" style={{ fontFamily: "var(--font-sub)", color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(var(--primary))"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}>
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <img src={kontentsuLogo} alt="Kontentsu" className="h-5 object-contain" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Hero Title */}
        <div className="rounded-2xl overflow-hidden animate-slide-up" style={{ background: "var(--gradient-surface)", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)" }}>
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.4), transparent)" }} />
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))", boxShadow: "0 0 20px hsl(var(--primary) / 0.15)" }}>
                  <ScrollText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-widest" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
                    MEUS <span style={{ color: "hsl(var(--primary))", textShadow: "0 0 20px hsl(var(--primary) / 0.4)" }}>SCRIPTS</span>
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.15em] mt-0.5" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                    Gerencie seus roteiros e tweets
                  </p>
                </div>
              </div>
            </div>

            {/* View mode tabs */}
            <div className="flex gap-2">
              {([
                { mode: "active" as ViewMode, label: "Ativos", count: activeCount, color: "hsl(var(--primary))", icon: <ScrollText className="w-3 h-3" /> },
                { mode: "favorites" as ViewMode, label: "Favoritos", count: favCount, color: "#fbbf24", icon: <Star className="w-3 h-3" /> },
                { mode: "archived" as ViewMode, label: "Arquivados", count: archCount, color: "hsl(var(--muted-foreground))", icon: <Archive className="w-3 h-3" /> },
              ]).map((tab) => {
                const active = viewMode === tab.mode;
                return (
                  <button key={tab.mode} onClick={() => setViewMode(tab.mode)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    style={{
                      fontFamily: "var(--font-sub)",
                      background: active ? `${tab.color}15` : "hsl(var(--muted) / 0.35)",
                      border: active ? `1px solid ${tab.color}40` : "1px solid hsl(var(--border))",
                      color: active ? tab.color : "hsl(var(--muted-foreground))",
                      boxShadow: active ? `0 0 16px ${tab.color}15` : undefined,
                    }}>
                    {tab.icon}
                    {tab.label}
                    <span className="ml-0.5 text-[9px] opacity-60">{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="rounded-xl p-3 sm:p-4 space-y-3 animate-fade-in" style={{ background: "hsl(var(--muted) / 0.25)", border: "1px solid hsl(var(--border))", animationDelay: "0.05s" }}>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, conteúdo, hashtags..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[12px] bg-transparent outline-none transition-all"
              style={{
                border: searchQuery ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
                fontFamily: "var(--font-body)",
                background: "hsl(var(--muted) / 0.3)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = searchQuery ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"; }}
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-sub)" }}>Nicho</span>
            </div>
            {(["all", "games", "web3", "tech"] as FilterNiche[]).map((n) => {
              const active = filterNiche === n;
              const meta = n === "all" ? { label: "TODOS", color: "hsl(var(--primary))", icon: null } : NICHE_META[n];
              return (
                <button key={n} onClick={() => setFilterNiche(n)}
                  className="text-[9px] px-3 py-2 rounded-lg font-black uppercase tracking-widest transition-all"
                  style={{
                    fontFamily: "var(--font-sub)",
                    background: active ? `${meta.color}18` : "hsl(var(--muted) / 0.4)",
                    border: active ? `1px solid ${meta.color}50` : "1px solid hsl(var(--border) / 0.5)",
                    color: active ? meta.color : "hsl(var(--muted-foreground))",
                    boxShadow: active ? `0 0 16px ${meta.color}20` : undefined,
                  }}>
                  {meta.label}
                </button>
              );
            })}

            <div className="w-px h-6 self-center mx-2" style={{ background: "hsl(var(--border))" }} />

            <div className="flex items-center gap-1.5 mr-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-sub)" }}>Tipo</span>
            </div>
            {([
              { id: "all" as FilterType, label: "TODOS", color: "hsl(var(--accent))" },
              { id: "script" as FilterType, label: "SCRIPT", color: "hsl(var(--primary))" },
              { id: "tweet" as FilterType, label: "TWEET", color: "#1d9bf0" },
            ]).map((t) => {
              const active = filterType === t.id;
              return (
                <button key={t.id} onClick={() => setFilterType(t.id)}
                  className="text-[9px] px-3 py-2 rounded-lg font-black uppercase tracking-widest transition-all"
                  style={{
                    fontFamily: "var(--font-sub)",
                    background: active ? `${t.color}18` : "hsl(var(--muted) / 0.4)",
                    border: active ? `1px solid ${t.color}50` : "1px solid hsl(var(--border) / 0.5)",
                    color: active ? t.color : "hsl(var(--muted-foreground))",
                    boxShadow: active ? `0 0 16px ${t.color}20` : undefined,
                  }}>
                  {t.label}
                </button>
              );
            })}

            <span className="ml-auto text-[9px] uppercase tracking-wider hidden sm:block" style={{ color: "hsl(var(--muted-foreground) / 0.5)", fontFamily: "var(--font-sub)" }}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--primary))" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", boxShadow: "0 0 30px hsl(var(--primary) / 0.1)" }}>
              {viewMode === "favorites" ? <Star className="w-8 h-8" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }} /> :
               viewMode === "archived" ? <Archive className="w-8 h-8" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }} /> :
               <ScrollText className="w-8 h-8" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }} />}
            </div>
            <div className="text-center">
              <p className="text-[14px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-display)" }}>
                {viewMode === "favorites" ? "Nenhum favorito" : viewMode === "archived" ? "Nenhum arquivado" : "Nenhum script"}
              </p>
              <p className="text-[11px] mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {searchQuery ? "Nenhum resultado para esta busca." :
                 viewMode === "favorites" ? "Marque scripts com ⭐ para encontrá-los aqui." :
                 viewMode === "archived" ? "Scripts arquivados aparecerão aqui." :
                 scripts.length > 0 ? "Nenhum resultado para estes filtros." : "Gere seu primeiro script para vê-lo aqui!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((script, i) => (
              <ScriptCard
                key={script.id}
                script={script}
                index={i}
                expanded={expandedId === script.id}
                onToggle={() => setExpandedId(expandedId === script.id ? null : script.id)}
                onCopy={() => handleCopy(script)}
                onDelete={() => handleDelete(script.id)}
                onToggleFavorite={() => handleToggleFavorite(script.id)}
                onToggleArchive={() => handleToggleArchive(script.id)}
                copied={copied === script.id}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function ScriptCard({ script, index, expanded, onToggle, onCopy, onDelete, onToggleFavorite, onToggleArchive, copied, formatDate }: {
  script: SavedScript; index: number; expanded: boolean;
  onToggle: () => void; onCopy: () => void; onDelete: () => void;
  onToggleFavorite: () => void; onToggleArchive: () => void;
  copied: boolean; formatDate: (d: string) => string;
}) {
  const niche = script.niche ? NICHE_META[script.niche] : null;
  const isTweet = script.script_type === "tweet";
  const accent = isTweet ? "#1d9bf0" : niche?.color || "hsl(var(--primary))";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all animate-slide-up"
      style={{
        background: "hsl(var(--muted) / 0.3)",
        border: expanded ? `1px solid ${accent}40` : "1px solid hsl(var(--border))",
        boxShadow: expanded ? `0 0 24px ${accent}10` : undefined,
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start">
        <button onClick={onToggle} className="flex-1 text-left px-4 py-3.5 flex items-start gap-3">
          <span className="text-[10px] font-black mt-0.5 shrink-0 tabular-nums" style={{ fontFamily: "var(--font-display)", color: `${accent}60` }}>
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isTweet ? (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest" style={{ background: "#1d9bf018", color: "#1d9bf0", border: "1px solid #1d9bf030", fontFamily: "var(--font-sub)" }}>
                  <Twitter className="w-2.5 h-2.5 inline mr-0.5" /> Tweet
                </span>
              ) : (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)", fontFamily: "var(--font-sub)" }}>
                  <Zap className="w-2.5 h-2.5 inline mr-0.5" /> Script
                </span>
              )}
              {niche && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest" style={{ background: `${niche.color}12`, color: niche.color, border: `1px solid ${niche.color}30`, fontFamily: "var(--font-sub)" }}>
                  {niche.label}
                </span>
              )}
              {script.news_source && (
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                  {script.news_source}
                </span>
              )}
              {script.is_favorite && (
                <Star className="w-3 h-3 fill-current" style={{ color: "#fbbf24" }} />
              )}
            </div>

            <p className="text-[13px] font-semibold leading-snug" style={{ color: "hsl(var(--foreground))" }}>
              {isTweet ? script.news_title : (script.script_title || script.news_title)}
            </p>

            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                {formatDate(script.created_at)}
              </span>
              {script.script_duration && !isTweet && (
                <span className="text-[9px] uppercase tracking-wider" style={{ color: accent, fontFamily: "var(--font-sub)" }}>
                  ⏱ {script.script_duration}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Quick actions */}
        <div className="flex items-center gap-1 px-3 pt-3.5 shrink-0">
          <button onClick={onToggleFavorite} className="p-1.5 rounded-lg transition-all" title={script.is_favorite ? "Remover favorito" : "Favoritar"}
            style={{ color: script.is_favorite ? "#fbbf24" : "hsl(var(--muted-foreground) / 0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted) / 0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Star className={`w-3.5 h-3.5 ${script.is_favorite ? "fill-current" : ""}`} />
          </button>
          <button onClick={onToggleArchive} className="p-1.5 rounded-lg transition-all" title={script.is_archived ? "Desarquivar" : "Arquivar"}
            style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted) / 0.5)"; e.currentTarget.style.color = "hsl(var(--foreground))"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "hsl(var(--muted-foreground) / 0.4)"; }}>
            {script.is_archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
          <div className="shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <div className="pt-3" />

          {isTweet ? (
            <div className="rounded-xl p-4" style={{ background: "hsl(228 22% 9%)", border: "1px solid #1d9bf020" }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground) / 0.88)" }}>
                {script.tweet_content}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {script.script_hook && (
                <SectionBlock label="🪝 Hook" content={script.script_hook} color="#00ff87" />
              )}
              {script.script_dev && (
                <SectionBlock label="📢 Desenvolvimento" content={script.script_dev} color="hsl(192 100% 55%)" />
              )}
              {script.script_cta && (
                <SectionBlock label="🎯 CTA" content={script.script_cta} color="#ff6b35" />
              )}
              {script.script_hashtags && script.script_hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {script.script_hashtags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg font-bold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)", fontFamily: "var(--font-sub)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              style={{ background: `${accent}12`, border: `1px solid ${accent}30`, color: accent, fontFamily: "var(--font-sub)" }}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.25)", color: "hsl(var(--destructive))", fontFamily: "var(--font-sub)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.08)"; }}>
              <Trash2 className="w-3 h-3" />
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionBlock({ label, content, color }: { label: string; content: string; color: string }) {
  return (
    <div className="rounded-xl p-3.5 relative overflow-hidden" style={{ background: "hsl(var(--muted) / 0.35)", border: "1px solid hsl(var(--border))" }}>
      <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full" style={{ background: color, opacity: 0.5 }} />
      <div className="pl-3">
        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color, fontFamily: "var(--font-sub)" }}>{label}</p>
        <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground) / 0.88)" }}>
          {content}
        </p>
      </div>
    </div>
  );
}

export default History;

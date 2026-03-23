export type Lang = "pt" | "en" | "es";

export const LANGS: { id: Lang; flag: string; label: string }[] = [
  { id: "pt", flag: "🇧🇷", label: "PT" },
  { id: "en", flag: "🇺🇸", label: "EN" },
  { id: "es", flag: "🇪🇸", label: "ES" },
];

export const t = {
  // ── Header ────────────────────────────────────────────────
  tagline: {
    pt: "Roteiros e Conteúdos do seu nicho com 4 cliques!",
    en: "Scripts & Content from your niche in 4 clicks!",
    es: "Guiones y Contenidos de tu nicho en 4 clics!",
  },
  badge_powered: {
    pt: "FIRECRAWL · GEMINI",
    en: "FIRECRAWL · GEMINI",
    es: "FIRECRAWL · GEMINI",
  },
  // ── Hero ─────────────────────────────────────────────────
  hero_sub: {
    pt: "— Ferramenta para criadores",
    en: "— Tool for creators",
    es: "— Herramienta para creadores",
  },
  hero_title_left: {
    pt: "NOTÍCIAS →",
    en: "NEWS →",
    es: "NOTICIAS →",
  },
  hero_title_right: {
    pt: "ROTEIRO",
    en: "SCRIPT",
    es: "GUIÓN",
  },
  hero_desc: {
    pt: "Selecione uma notícia · IA gera roteiro viral · pronto para gravar",
    en: "Select a news · AI generates viral script · ready to record",
    es: "Selecciona una noticia · IA genera guión viral · listo para grabar",
  },
  stat_sources: {
    pt: "Fontes",
    en: "Sources",
    es: "Fuentes",
  },
  stat_niches: {
    pt: "Nichos",
    en: "Niches",
    es: "Nichos",
  },
  // ── Column headers ────────────────────────────────────────
  col_news: {
    pt: "NOTÍCIAS",
    en: "NEWS",
    es: "NOTICIAS",
  },
  col_news_sub: {
    pt: "Selecione uma para gerar roteiro",
    en: "Select one to generate script",
    es: "Selecciona una para generar guión",
  },
  col_script: {
    pt: "ROTEIRO",
    en: "SCRIPT",
    es: "GUIÓN",
  },
  col_script_sub: {
    pt: "Hook · Desenvolvimento · CTA",
    en: "Hook · Development · CTA",
    es: "Hook · Desarrollo · CTA",
  },
  // ── NewsList ──────────────────────────────────────────────
  select_niche: {
    pt: "// selecione o nicho",
    en: "// select the niche",
    es: "// selecciona el nicho",
  },
  select_source: {
    pt: "// selecione a fonte",
    en: "// select the source",
    es: "// selecciona la fuente",
  },
  niche_back: {
    pt: "Nichos",
    en: "Niches",
    es: "Nichos",
  },
  source_back: {
    pt: "Fontes",
    en: "Sources",
    es: "Fuentes",
  },
  sources_count: {
    pt: "FONTES",
    en: "SOURCES",
    es: "FUENTES",
  },
  niche_games_sub: {
    pt: "Notícias, reviews e cultura gamer",
    en: "News, reviews and gamer culture",
    es: "Noticias, reviews y cultura gamer",
  },
  niche_web3_sub: {
    pt: "Blockchain, NFT, GameFi e crypto",
    en: "Blockchain, NFT, GameFi and crypto",
    es: "Blockchain, NFT, GameFi y crypto",
  },
  niche_gamedev_sub: {
    pt: "Indústria, dev e negócios de games",
    en: "Industry, dev and game business",
    es: "Industria, dev y negocios de juegos",
  },
  news_count: {
    pt: "notícias",
    en: "news",
    es: "noticias",
  },
  update_btn: {
    pt: "Update",
    en: "Update",
    es: "Actualizar",
  },
  date_today: {
    pt: "HOJE",
    en: "TODAY",
    es: "HOY",
  },
  date_yesterday: {
    pt: "ONTEM",
    en: "YEST.",
    es: "AYER",
  },
  see_original: {
    pt: "VER ORIGINAL",
    en: "SEE ORIGINAL",
    es: "VER ORIGINAL",
  },
  // ── ScriptPanel ───────────────────────────────────────────
  waiting_title: {
    pt: "Aguardando notícia",
    en: "Waiting for news",
    es: "Esperando noticia",
  },
  waiting_desc: {
    pt: "Escolha uma notícia à esquerda\npara gerar o roteiro com IA",
    en: "Choose a news on the left\nto generate the script with AI",
    es: "Elige una noticia a la izquierda\npara generar el guión con IA",
  },
  selected_news: {
    pt: "▸ Notícia selecionada",
    en: "▸ Selected news",
    es: "▸ Noticia seleccionada",
  },
  see_original_news: {
    pt: "Ver notícia original",
    en: "See original news",
    es: "Ver noticia original",
  },
  generate_btn: {
    pt: "Gerar Roteiro para Short",
    en: "Generate Script for Short",
    es: "Generar Guión para Short",
  },
  generating: {
    pt: "Gerando roteiro com IA...",
    en: "Generating script with AI...",
    es: "Generando guión con IA...",
  },
  processing: {
    pt: "Processando com IA",
    en: "Processing with AI",
    es: "Procesando con IA",
  },
  processing_desc: {
    pt: "Analisando a notícia e criando roteiro viral...",
    en: "Analyzing the news and creating viral script...",
    es: "Analizando la noticia y creando guión viral...",
  },
  copy_all: {
    pt: "Copiar tudo",
    en: "Copy all",
    es: "Copiar todo",
  },
  regenerate: {
    pt: "Regenerar",
    en: "Regenerate",
    es: "Regenerar",
  },
  copied: {
    pt: "Copiado!",
    en: "Copied!",
    es: "¡Copiado!",
  },
  copy: {
    pt: "Copiar",
    en: "Copy",
    es: "Copiar",
  },
  viral_tweet: {
    pt: "Tweet viral",
    en: "Viral tweet",
    es: "Tweet viral",
  },
  generate_tweet_btn: {
    pt: "Gerar Tweet",
    en: "Generate Tweet",
    es: "Generar Tweet",
  },
  generating_tweet: {
    pt: "Gerando tweet...",
    en: "Generating tweet...",
    es: "Generando tweet...",
  },
  regenerate_tweet: {
    pt: "Regenerar Tweet",
    en: "Regenerate Tweet",
    es: "Regenerar Tweet",
  },
  toast_error_tweet: {
    pt: "Erro ao gerar tweet",
    en: "Error generating tweet",
    es: "Error al generar tweet",
  },
  hashtags: {
    pt: "Hashtags",
    en: "Hashtags",
    es: "Hashtags",
  },
  section_hook: {
    pt: "HOOK",
    en: "HOOK",
    es: "HOOK",
  },
  section_dev: {
    pt: "DESENVOLVIMENTO",
    en: "DEVELOPMENT",
    es: "DESARROLLO",
  },
  section_cta: {
    pt: "CTA",
    en: "CTA",
    es: "CTA",
  },
  // ── Toast ────────────────────────────────────────────────
  toast_copied_title: {
    pt: "Copiado!",
    en: "Copied!",
    es: "¡Copiado!",
  },
  toast_copied_desc: {
    pt: "Texto copiado para a área de transferência",
    en: "Text copied to clipboard",
    es: "Texto copiado al portapapeles",
  },
  toast_error_script: {
    pt: "Erro ao gerar roteiro",
    en: "Error generating script",
    es: "Error al generar guión",
  },
  toast_error_news: {
    pt: "Erro ao buscar notícias",
    en: "Error fetching news",
    es: "Error al buscar noticias",
  },
  toast_retry: {
    pt: "Tente novamente",
    en: "Try again",
    es: "Inténtalo de nuevo",
  },
  toast_blocked_warning: {
    pt: "0 notícias encontradas — o site pode estar bloqueando o scraping. Tente novamente ou escolha outra fonte.",
    en: "0 news found — the site may be blocking scraping. Try again or choose another source.",
    es: "0 noticias encontradas — el sitio puede estar bloqueando el scraping. Intenta de nuevo o elige otra fuente.",
  },
  toast_cache_hit: {
    pt: "Cache — carregado há",
    en: "Cache — loaded",
    es: "Cache — cargado hace",
  },
  toast_cache_min_ago: {
    pt: "min",
    en: "min ago",
    es: "min",
  },
  // ── Footer ───────────────────────────────────────────────
  footer_powered: {
    pt: "Kontentsu · Powered by Firecrawl + Gemini AI",
    en: "Kontentsu · Powered by Firecrawl + Gemini AI",
    es: "Kontentsu · Powered by Firecrawl + Gemini AI",
  },
} as const;

export function tr(key: keyof typeof t, lang: Lang): string {
  return t[key][lang];
}

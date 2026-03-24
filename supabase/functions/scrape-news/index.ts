const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Persistent DB cache config ──
const CACHE_TTL_MINUTES = 30;

// ── Supabase REST helpers (uses auto-injected env vars) ──
function getSupabaseConfig() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return { url, serviceKey };
}

async function ensureCacheTable(): Promise<void> {
  const { url, serviceKey } = getSupabaseConfig();
  const sql = `
    CREATE TABLE IF NOT EXISTS public.news_cache (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      cache_key TEXT NOT NULL UNIQUE,
      news_data JSONB NOT NULL DEFAULT '[]',
      items_count INTEGER NOT NULL DEFAULT 0,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_news_cache_key ON public.news_cache(cache_key);
    CREATE INDEX IF NOT EXISTS idx_news_cache_expires ON public.news_cache(expires_at);
    ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news_cache' AND policyname = 'Anyone can read news cache') THEN
        CREATE POLICY "Anyone can read news cache" ON public.news_cache FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news_cache' AND policyname = 'Service role can manage cache') THEN
        CREATE POLICY "Service role can manage cache" ON public.news_cache FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  await fetch(`${url}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
    body: JSON.stringify({ query: sql }),
  }).catch(() => { /* table might already exist, ignore */ });

  // Fallback: try creating via the REST endpoint for SQL
  // If the RPC approach doesn't work, the table creation is handled
  // via direct SQL execution through the Supabase SQL API
  try {
    await fetch(`${url}/rest/v1/news_cache?select=cache_key&limit=1`, {
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey },
    }).then(async (res) => {
      if (res.status === 404 || res.status === 400) {
        // Table doesn't exist — user needs to create it manually
        console.warn('⚠️ news_cache table not found. It will be created on first successful cache write.');
      }
    });
  } catch { /* ignore */ }
}

async function readCacheFromDB(cacheKey: string): Promise<{ news: unknown[]; ageMin: number } | null> {
  const { url, serviceKey } = getSupabaseConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/news_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&expires_at=gt.${new Date().toISOString()}&select=news_data,fetched_at,items_count&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Accept': 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    const ageMin = Math.round((Date.now() - new Date(row.fetched_at).getTime()) / 60000);
    return { news: row.news_data, ageMin };
  } catch (e) {
    console.warn('DB cache read error:', e);
    return null;
  }
}

async function writeCacheToDB(cacheKey: string, newsItems: unknown[]): Promise<void> {
  const { url, serviceKey } = getSupabaseConfig();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000);
  try {
    const res = await fetch(`${url}/rest/v1/news_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        cache_key: cacheKey,
        news_data: newsItems,
        items_count: newsItems.length,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      // If table doesn't exist, try to create it
      if (err.includes('relation') && err.includes('does not exist')) {
        console.log('📦 news_cache table not found, creating...');
        await createCacheTable();
        // Retry write
        await fetch(`${url}/rest/v1/news_cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            cache_key: cacheKey,
            news_data: newsItems,
            items_count: newsItems.length,
            fetched_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          }),
        });
      } else {
        console.warn('DB cache write error:', err);
      }
    } else {
      console.log(`💾 DB cached ${newsItems.length} items for ${cacheKey} (expires: ${expiresAt.toISOString()})`);
    }
  } catch (e) {
    console.warn('DB cache write error:', e);
  }
}

async function createCacheTable(): Promise<void> {
  const { url, serviceKey } = getSupabaseConfig();
  // Use Supabase's SQL execution endpoint
  const sql = `
    CREATE TABLE IF NOT EXISTS public.news_cache (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      cache_key TEXT NOT NULL UNIQUE,
      news_data JSONB NOT NULL DEFAULT '[]'::jsonb,
      items_count INTEGER NOT NULL DEFAULT 0,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_news_cache_key ON public.news_cache(cache_key);
    ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "public_read_news_cache" ON public.news_cache FOR SELECT USING (true);
    CREATE POLICY "service_manage_news_cache" ON public.news_cache FOR ALL USING (true) WITH CHECK (true);
  `;
  try {
    // Try via PostgREST RPC if a helper function exists, otherwise log instructions
    console.log('🔧 Please create the news_cache table via Supabase SQL Editor:\n' + sql);
  } catch { /* ignore */ }
}

// ── Fetch with retry + exponential backoff for 429 ──────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  label = 'fetch'
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.warn(`⚠️ 429 rate-limited on ${label}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }
    return res;
  }
  // Final attempt without retry
  return fetch(url, options);
}

// ── Batch helper: process items in chunks with delay ────────────────
async function batchProcess<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 3,
  delayMs = 500
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const requestedSource: string | undefined = body.source;
    const lang: string = body.lang || 'pt'; // 'pt' | 'en' | 'es'

    // Dynamic year for mapSearch — never hardcode, auto-updates every year
    const currentYear = new Date().getFullYear().toString();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Check persistent DB cache ────────────────────────────────────
    const forceRefresh = body.forceRefresh === true;
    if (requestedSource && !forceRefresh) {
      const cacheKey = `${requestedSource}_${lang}`;
      const cached = await readCacheFromDB(cacheKey);
      if (cached) {
        console.log(`✅ DB cache hit for ${cacheKey} (${cached.ageMin}min old, ${cached.news.length} items)`);
        return new Response(
          JSON.stringify({ success: true, news: cached.news, cached: true, cacheAgeMin: cached.ageMin }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    type Source = { url: string; filter: (l: string) => boolean; name: string; sort?: (l: string[]) => string[]; limit?: number; mapSearch?: string; useScrapLinks?: boolean; useSearch?: string; useSearchWithContent?: boolean; sourceLang?: string; };

    const sources: Source[] = [
      // ─── GAMES ──────────────────────────────────────────────────────────────
      {
        // gam3s.gg: JS-rendered, useScrapLinks gets 0 article links. Must use Search API.
        url: 'https://gam3s.gg/news/',
        filter: (l) =>
          l.includes('gam3s.gg/') &&
          l !== 'https://gam3s.gg/' &&
          l !== 'https://gam3s.gg/news/' &&
          !l.includes('#') && !l.includes('?') &&
          !l.match(/\/(page|category|tag|author|about|newsletter|privacy|terms|contact|sitemap)\//i) &&
          (l.includes('/news/') || l.includes('/web3-gaming/') || !!l.match(/gam3s\.gg\/[a-z0-9][a-z0-9-]{8,}/i)),
        name: 'gam3s.gg',
        limit: 20,
        useSearch: 'site:gam3s.gg/news gaming news',
        sourceLang: 'en',
      },
      {
        // Voxel/TecMundo: scrape homepage ao vivo para links mais recentes
        // URLs reais: tecmundo.com.br/voxel/503861-slug.htm
        url: 'https://www.tecmundo.com.br/voxel',
        filter: (l) => {
          if (!l.includes('tecmundo.com.br/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l === 'https://www.tecmundo.com.br/voxel' || l === 'https://www.tecmundo.com.br/voxel/') return false;
          if (l.match(/\/(feed|pagina-\d|categoria|tag|autor)\//i)) return false;
          return !!l.match(/tecmundo\.com\.br\/voxel\/\d{4,}-[a-z0-9-]+\.htm/i);
        },
        sort: (links) => links.sort((a, b) => {
          const idA = parseInt(a.match(/\/(\d{4,})-/)?.[1] || '0');
          const idB = parseInt(b.match(/\/(\d{4,})-/)?.[1] || '0');
          return idB - idA; // Higher ID = newer article
        }),
        name: 'Voxel',
        useScrapLinks: true,
        sourceLang: 'pt',
      },
      {
        url: 'https://www.terra.com.br/gameon/',
        filter: (l) => {
          if (!l.includes('terra.com.br/')) return false;
          if (l.includes('#')) return false;
          if (l.match(/\/(categoria|tag|page|author|busca)\//i)) return false;
          return !!l.match(/terra\.com\.br\/.+,[a-z0-9]{10,}\.html/i);
        },
        name: 'Terra GameOn',
        useScrapLinks: true,
        sourceLang: 'pt',
      },
      {
        // Game Informer: bloqueado por firewall, usar Search API
        url: 'https://www.gameinformer.com/news',
        filter: (l) => {
          if (!l.includes('gameinformer.com/')) return false;
          if (l === 'https://www.gameinformer.com/news' || l === 'https://www.gameinformer.com/news/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          return !!l.match(/gameinformer\.com\/[a-z0-9-]+\/\d{4}\/\d{2}\/\d{2}\//i) ||
                 !!l.match(/gameinformer\.com\/news\/[a-z0-9-]+/i);
        },
        name: 'Game Informer',
        limit: 20,
        useSearch: 'site:gameinformer.com latest news',
        sourceLang: 'en',
      },
      {
        url: 'https://www.gamevicio.com/noticias/',
        filter: (l) => {
          if (!l.includes('gamevicio.com/noticias/')) return false;
          if (l === 'https://www.gamevicio.com/noticias/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          return !!l.match(/gamevicio\.com\/noticias\/\d{4}\/\d{2}\/[a-z0-9-]+/i);
        },
        sort: (links) => links.sort((a, b) => {
          const mA = a.match(/\/noticias\/(\d{4})\/(\d{2})\//);
          const mB = b.match(/\/noticias\/(\d{4})\/(\d{2})\//);
          const tA = mA ? parseInt(mA[1] + mA[2]) : 0;
          const tB = mB ? parseInt(mB[1] + mB[2]) : 0;
          return tB - tA;
        }),
        name: 'GameVício',
        useScrapLinks: true,
        sourceLang: 'pt',
      },
      {
        // GameSpot: site JS-heavy, mapa retorna só homepage. Usar Search API.
        url: 'https://www.gamespot.com/news/',
        filter: (l) => {
          if (!l.includes('gamespot.com/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|forums?|videos?|reviews?|features?|deals?|podcasts?)\/?$/i)) return false;
          return !!l.match(/gamespot\.com\/articles\/[a-z0-9-]+\/1100-\d+\/?/i) ||
                 !!l.match(/gamespot\.com\/articles\/[a-z0-9-]{10,}/i);
        },
        name: 'GameSpot',
        limit: 20,
        useSearch: 'site:gamespot.com/articles latest news',
        sourceLang: 'en',
      },
      {
        // Eurogamer PT: Firecrawl bloqueia scraping direto. Usar Search com scrapeOptions para obter conteúdo inline.
        url: 'https://www.eurogamer.pt/',
        filter: (l) => {
          if (!l.includes('eurogamer.pt/')) return false;
          if (l === 'https://www.eurogamer.pt/' || l === 'https://eurogamer.pt/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/eurogamer\.pt\/(tag|author|category|page|arquivo)\/?$/i)) return false;
          return !!l.match(/eurogamer\.pt\/\d{4}\/\d{2}\/\d{2}\//i) ||
                 !!l.match(/eurogamer\.pt\/[a-z0-9][a-z0-9-]{7,}\/?$/i) ||
                 !!l.match(/eurogamer\.pt\/(noticias|analise|preview|feature|video|review)\/[a-z0-9-]{5,}/i);
        },
        name: 'Eurogamer PT',
        limit: 20,
        useSearch: 'site:eurogamer.pt noticias jogos',
        useSearchWithContent: true,
        sourceLang: 'pt',
      },
      {
        // PC Gamer: JS-heavy site, use Firecrawl Search API
        url: 'https://www.pcgamer.com/news/',
        filter: (l) => {
          if (!l.includes('pcgamer.com/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|about|forum|archive|codes?|coupons?|magazine|newsletter|clips?|meet-the-team|commenting|note-on|affiliate)\//i)) return false;
          if (l.match(/pcgamer\.com\/(hardware|reviews|guides?|software|movies?|deals?)\/?$/i)) return false;
          return !!l.match(/pcgamer\.com\/[a-z0-9][a-z0-9-]{10,}\/$/i) ||
                 !!l.match(/pcgamer\.com\/[a-z0-9-]+\/[a-z0-9][a-z0-9-]{10,}\//i);
        },
        name: 'PC Gamer',
        limit: 20,
        useSearch: 'site:pcgamer.com news',
        sourceLang: 'en',
      },
      {
        // Polygon: use Firecrawl Search API for recent gaming news
        url: 'https://www.polygon.com/gaming/',
        filter: (l) => {
          if (!l.includes('polygon.com/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(authors?|tag|category|about)\/?$/i)) return false;
          const oldDateMatch = l.match(/\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//);
          if (oldDateMatch && parseInt(oldDateMatch[1]) < 2024) return false;
          return !!l.match(/polygon\.com\/\d{4}\/\d{1,2}\/\d{1,2}\/[a-z0-9-]+/i) ||
                 !!l.match(/polygon\.com\/gaming\/\d+\/[a-z0-9-]{5,}/i) ||
                 !!l.match(/polygon\.com\/[a-z0-9-]+\/\d+\/[a-z0-9-]{5,}/i) ||
                 !!l.match(/polygon\.com\/[a-z0-9][a-z0-9-]{10,}\/$/i);
        },
        name: 'Polygon',
        limit: 20,
        useSearch: 'site:polygon.com gaming news',
        sourceLang: 'en',
      },
      {
        // Kotaku: use Firecrawl Search API for recent news
        url: 'https://kotaku.com/news/',
        filter: (l) => {
          if (!l.includes('kotaku.com/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|latest|culture\/news|news|reviews|deals|games|download|entertainment|game-tips|privacy-policy|terms-of-use|cookie|login|signup|contact)\/?$/i)) return false;
          const path = l.replace(/https?:\/\/kotaku\.com\//, '');
          if (path.startsWith('latest-')) return false;
          if (l.match(/\/(privacy|terms|cookie|legal|subscribe|newsletter|rss|sitemap)\b/i)) return false;
          const yearMatch = l.match(/\/(\d{4})\//);
          if (yearMatch && parseInt(yearMatch[1]) < 2024) return false;
          return !!l.match(/kotaku\.com\/[a-z0-9-]{10,}$/i) ||
                 !!l.match(/kotaku\.com\/[a-z0-9-]{10,}\/$/i);
        },
        name: 'Kotaku',
        limit: 20,
        useSearch: 'site:kotaku.com gaming news',
        sourceLang: 'en',
      },
      {
        // Rock Paper Shotgun: /news page lists 25+ articles vs ~5 on homepage
        url: 'https://www.rockpapershotgun.com/news',
        filter: (l) => {
          if (!l.includes('rockpapershotgun.com/')) return false;
          if (l === 'https://www.rockpapershotgun.com/' || l === 'https://rockpapershotgun.com/' || l === 'https://www.rockpapershotgun.com/news' || l === 'https://www.rockpapershotgun.com/news/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|page|forum)\//i)) return false;
          const yearMatch = l.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
          if (yearMatch && parseInt(yearMatch[1]) < 2024) return false;
          return !!l.match(/rockpapershotgun\.com\/\d{4}\/\d{2}\/\d{2}\//i) ||
                 !!l.match(/rockpapershotgun\.com\/[a-z0-9-]{10,}\/?$/i);
        },
        sort: (links) => links.sort((a, b) => {
          const mA = a.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
          const mB = b.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
          const tA = mA ? parseInt(mA[1] + mA[2] + mA[3]) : 0;
          const tB = mB ? parseInt(mB[1] + mB[2] + mB[3]) : 0;
          return tB - tA;
        }),
        name: 'Rock Paper Shotgun',
        useScrapLinks: true,
        sourceLang: 'en',
      },
      {
        // GamesRadar: map retorna só página/paginação. Usar Search API.
        url: 'https://www.gamesradar.com/games/news/',
        filter: (l) => {
          if (!l.includes('gamesradar.com/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|page|features|reviews)\//i)) return false;
          return !!l.match(/gamesradar\.com\/games\/news\/[a-z0-9-]{10,}\/?/i) ||
                 !!l.match(/gamesradar\.com\/[a-z0-9-]+\/[a-z0-9-]{10,}\/?/i);
        },
        name: 'GamesRadar',
        limit: 20,
        useSearch: 'site:gamesradar.com gaming news',
        sourceLang: 'en',
      },
      {
        // Gematsu: map retorna só /browse. Usar Search API.
        url: 'https://www.gematsu.com/browse',
        filter: (l) => {
          if (!l.includes('gematsu.com/')) return false;
          if (l === 'https://www.gematsu.com/browse' || l === 'https://gematsu.com/browse') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|page|browse)\/?$/i)) return false;
          return !!l.match(/gematsu\.com\/\d{4}\/\d{2}\/[a-z0-9-]+/i) ||
                 !!l.match(/gematsu\.com\/[a-z0-9-]{10,}\/?$/i);
        },
        sort: (links) => links.sort((a, b) => {
          const mA = a.match(/\/(\d{4})\/(\d{2})\//);
          const mB = b.match(/\/(\d{4})\/(\d{2})\//);
          const tA = mA ? parseInt(mA[1] + mA[2]) : 0;
          const tB = mB ? parseInt(mB[1] + mB[2]) : 0;
          return tB - tA;
        }),
        name: 'Gematsu',
        limit: 20,
        useSearch: 'site:gematsu.com news',
        sourceLang: 'en',
      },


      // ─── WEB3 ────────────────────────────────────────────────────────────────
      {
        // playtoearn: pode dar timeout, usar Search API que é mais rápido
        url: 'https://playtoearn.com/news',
        filter: (l) => {
          if (!l.includes('playtoearn.com/news/')) return false;
          if (l === 'https://playtoearn.com/news' || l === 'https://playtoearn.com/news/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          return !!l.match(/playtoearn\.com\/news\/[a-z0-9-]{5,}/i);
        },
        name: 'playtoearn.com',
        limit: 20,
        useSearch: 'site:playtoearn.com/news blockchain gaming',
        sourceLang: 'en',
      },
      {
        // CoinDesk PT: site JS-pesado, map retorna só 2 links. Usar Search API.
        url: 'https://www.coindesk.com/pt-br/latest-crypto-news',
        filter: (l) => {
          if (!l.includes('coindesk.com/pt-br/')) return false;
          if (l === 'https://www.coindesk.com/pt-br/latest-crypto-news' || l === 'https://www.coindesk.com/pt-br/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          return !!l.match(/coindesk\.com\/pt-br\/[a-z0-9\/-]{10,}\/?$/i);
        },
        name: 'CoinDesk PT',
        limit: 20,
        useSearch: 'site:coindesk.com/pt-br crypto news',
        sourceLang: 'pt',
      },
      {
        // The Block: /latest has more articles than homepage
        url: 'https://www.theblock.co/latest',
        filter: (l) => {
          if (!l.includes('theblock.co/post/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          return !!l.match(/theblock\.co\/post\/\d+\/[a-z0-9-]+/i);
        },
        sort: (links) => links.sort((a, b) => {
          const idA = parseInt(a.match(/\/post\/(\d+)\//)?.[1] || '0');
          const idB = parseInt(b.match(/\/post\/(\d+)\//)?.[1] || '0');
          return idB - idA;
        }),
        name: 'The Block',
        limit: 20,
        useSearch: 'site:theblock.co/post crypto news',
        sourceLang: 'en',
      },
      {
        // Decrypt: /news page lists 12+ articles vs price tickers on homepage
        url: 'https://decrypt.co/news',
        filter: (l) => {
          if (!l.includes('decrypt.co/')) return false;
          if (l === 'https://decrypt.co/' || l === 'https://decrypt.co') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|news|privacy|terms)\/?$/i)) return false;
          return !!l.match(/decrypt\.co\/\d{4,}\/[a-z0-9-]+/i) ||
                 !!l.match(/decrypt\.co\/[a-z0-9-]{10,}\/?$/i);
        },
        name: 'Decrypt',
        useScrapLinks: true,
        sourceLang: 'en',
      },
      {
        // Bitcoin Magazine: /news has chronological article listing
        url: 'https://bitcoinmagazine.com/news',
        filter: (l) => {
          if (!l.includes('bitcoinmagazine.com/')) return false;
          if (l === 'https://bitcoinmagazine.com/' || l === 'https://www.bitcoinmagazine.com/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|bitcoin-price|conference|store|guides|glossary|charts|tools|newsletter|privacy|terms|advertise|jobs|contact)\/?$/i)) return false;
          return !!l.match(/bitcoinmagazine\.com\/(bitcoin|markets|culture|tech|legal|business|mining|politics|takes|technical|news|articles)\/[a-z0-9-]{5,}/i) ||
                 !!l.match(/bitcoinmagazine\.com\/[a-z0-9-]{15,}\/?$/i);
        },
        name: 'Bitcoin Magazine',
        limit: 20,
        useSearch: 'site:bitcoinmagazine.com news bitcoin',
        sourceLang: 'en',
      },
      {
        // BeInCrypto BR: /noticias page has full article listing
        url: 'https://br.beincrypto.com/noticias/',
        filter: (l) => {
          if (!l.includes('br.beincrypto.com/') && !l.includes('beincrypto.com/')) return false;
          if (l === 'https://br.beincrypto.com/' || l === 'https://beincrypto.com/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|anuncie|preco|price)\/?$/i)) return false;
          return !!l.match(/beincrypto\.com\/[a-z0-9-]{10,}\/?$/i);
        },
        name: 'BeInCrypto BR',
        useScrapLinks: true,
        sourceLang: 'pt',
      },
      {
        // CryptoPotato: /news page has full article listing
        url: 'https://cryptopotato.com/crypto-news/',
        filter: (l) => {
          if (!l.includes('cryptopotato.com/')) return false;
          if (l === 'https://cryptopotato.com/' || l === 'https://www.cryptopotato.com/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|page|price-analysis|wp-content|feed)\/?$/i)) return false;
          return !!l.match(/cryptopotato\.com\/[a-z0-9][a-z0-9-]{7,}\/?$/i);
        },
        name: 'CryptoPotato',
        limit: 20,
        useSearch: 'site:cryptopotato.com crypto news',
        sourceLang: 'en',
      },

      // ─── TECH / GAMEDEV ──────────────────────────────────────────────────────
      {
        url: 'https://newsletter.gamediscover.co/',
        filter: (l) => {
          if (!l.includes('newsletter.gamediscover.co/p/') && !l.includes('gamediscover.co/p/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          return !!l.match(/gamediscover\.co\/p\/[a-z0-9-]{5,}/i);
        },
        name: 'GameDiscover.co',
        limit: 80,
        mapSearch: currentYear,
        sourceLang: 'en',
      },
      {
        url: 'https://www.gamemakers.com/',
        filter: (l) => {
          if (!l.includes('gamemakers.com/')) return false;
          if (l === 'https://www.gamemakers.com/' || l === 'https://gamemakers.com/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.match(/\/(tag|author|category|about|page|subscribe)\/?$/i)) return false;
          return !!l.match(/gamemakers\.com\/[a-z0-9-]{5,}\/?$/i) ||
                 !!l.match(/gamemakers\.com\/p\/[a-z0-9-]{5,}/i);
        },
        name: 'GameMakers',
        limit: 80,
        mapSearch: currentYear,
        sourceLang: 'en',
      },
      {
        url: 'https://elitegamedevelopers.substack.com/',
        filter: (l) => {
          if (!l.includes('elitegamedevelopers.substack.com/p/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.includes('/comments')) return false;
          return !!l.match(/elitegamedevelopers\.substack\.com\/p\/[a-z0-9-]{5,}/i);
        },
        name: 'Elite Game Developers',
        limit: 80,
        mapSearch: currentYear,
        sourceLang: 'en',
      },
      {
        url: 'https://www.crossplay.news/',
        filter: (l) => {
          if (!l.includes('crossplay.news/')) return false;
          if (l === 'https://www.crossplay.news/' || l === 'https://crossplay.news/') return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.includes('/comments')) return false;
          if (l.includes('/sitemap')) return false;
          if (l.match(/\/(tag|author|category|about|subscribe|archive)\/?$/i)) return false;
          return !!l.match(/crossplay\.news\/p\/[a-z0-9-]{5,}/i) ||
                 !!l.match(/crossplay\.news\/[a-z0-9-]{8,}\/?$/i);
        },
        name: 'Crossplay News',
        limit: 80,
        mapSearch: currentYear,
        sourceLang: 'en',
      },
      {
        url: 'https://gamedevreports.substack.com/',
        filter: (l) => {
          if (!l.includes('gamedevreports.substack.com/p/')) return false;
          if (l.includes('#') || l.includes('?')) return false;
          if (l.includes('/comments')) return false;
          return !!l.match(/gamedevreports\.substack\.com\/p\/[a-z0-9-]{5,}/i);
        },
        name: 'GameDev Reports',
        limit: 80,
        mapSearch: currentYear,
        sourceLang: 'en',
      },
    ];

    // Filter to specific source if requested
    const sourcesToScrape = requestedSource
      ? sources.filter(s => s.name === requestedSource)
      : sources;

    if (sourcesToScrape.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: `Fonte "${requestedSource}" não encontrada ou não suportada` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Step 1: Mapeando ${sourcesToScrape.map(s => s.name).join(', ')}...`);

    const mapResults = await Promise.all(
      sourcesToScrape.map(async (source) => {
        try {
          // ── useSearchWithContent: search returns inline markdown, skip per-article scrape ──
          if (source.useSearchWithContent && source.useSearch) {
            const res = await fetchWithRetry('https://api.firecrawl.dev/v1/search', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: source.useSearch,
                limit: source.limit ?? 10,
                tbs: 'qdr:m',
                scrapeOptions: { formats: ['markdown'] },
              }),
            }, 3, `search+content:${source.name}`);
            const data = await res.json();
            if (!res.ok) { console.warn(`Search+content failed for ${source.name}:`, data.error); return []; }
            const results: Array<{ url: string; title?: string; description?: string; markdown?: string }> = data.data || data.results || [];
            console.log(`${source.name} search+content results: ${results.length}`);
            const filtered = results.filter(r => r.url && source.filter(r.url)).slice(0, 10);
            return filtered.map(r => ({
              url: r.url,
              source: source.name,
              sourceLang: source.sourceLang || 'en',
              prefetched: {
                title: r.title || '',
                markdown: r.markdown || r.description || '',
              },
            }));
          }

          let allLinks: string[] = [];

          if (source.useSearch) {
            // Use Firecrawl Search API for JS-heavy/blocked sites
            const res = await fetchWithRetry('https://api.firecrawl.dev/v1/search', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: source.useSearch,
                limit: source.limit ?? 10,
                tbs: 'qdr:m', // Last month
              }),
            }, 3, `search:${source.name}`);
            const data = await res.json();
            if (!res.ok) { console.warn(`Search failed for ${source.name}:`, data.error); return []; }
            const results = data.data || data.results || [];
            allLinks = results.map((r: { url: string }) => r.url).filter(Boolean);
            console.log(`${source.name} search results: ${allLinks.length} URLs`, allLinks.slice(0, 5));
          } else if (source.useScrapLinks) {
            // Use scrape+links for sources where map returns stale index
            const res = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: source.url, formats: ['links'], onlyMainContent: false }),
            }, 3, `scrape-links:${source.name}`);
            const data = await res.json();
            if (!res.ok) { console.warn(`Scrape-links failed for ${source.url}:`, data.error); return []; }
            allLinks = (data.data?.links || data.links || []) as string[];
            console.log(`${source.name} scraped links count: ${allLinks.length}`);
          } else {
            const res = await fetchWithRetry('https://api.firecrawl.dev/v1/map', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: source.url,
                limit: source.limit ?? 60,
                includeSubdomains: false,
                ...(source.mapSearch ? { search: source.mapSearch } : {}),
              }),
            }, 3, `map:${source.name}`);
            const data = await res.json();
            if (!res.ok) { console.warn(`Map failed for ${source.url}:`, data.error); return []; }
            allLinks = data.links || [];
          }

          console.log(`${source.name} raw links sample:`, allLinks.slice(0, 5).join(' | '));
          const preFilterCount = allLinks.length;
          let filtered = allLinks.filter(source.filter);

          // Fallback: if Search returned results but ALL were rejected by filter, try Map API
          if (filtered.length === 0 && preFilterCount > 0 && source.useSearch) {
            console.warn(`⚠️ ${source.name}: Search returned ${preFilterCount} URLs but ALL rejected by filter. Trying Map fallback...`);
            const rejected = allLinks.slice(0, 5).map(u => `  ✗ ${u}`);
            console.warn(`Rejected URLs sample:\n${rejected.join('\n')}`);
            try {
              const mapRes = await fetchWithRetry('https://api.firecrawl.dev/v1/map', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: source.url, limit: source.limit ?? 60, includeSubdomains: false }),
              }, 2, `map-fallback:${source.name}`);
              const mapData = await mapRes.json();
              if (mapRes.ok && mapData.links) {
                const mapFiltered = (mapData.links as string[]).filter(source.filter);
                console.log(`${source.name} Map fallback: ${mapFiltered.length}/${mapData.links.length} links passed filter`);
                if (mapFiltered.length > 0) filtered = mapFiltered;
              }
            } catch (mapErr) {
              console.warn(`${source.name} Map fallback failed:`, mapErr);
            }
          }

          if (source.sort) filtered = source.sort(filtered);
          const links = filtered.slice(0, 10);
          console.log(`${source.name}: ${links.length}/${preFilterCount} links passed filter`);
          return links.map((l: string) => ({ url: l, source: source.name, sourceLang: source.sourceLang || 'en', prefetched: undefined }));
        } catch (e) {
          console.warn(`Map error for ${source.url}:`, e);
          return [];
        }
      })
    );

    const articleEntries = mapResults.flat();

    console.log(`Total: ${articleEntries.length} article links. Scraping each...`);

    if (articleEntries.length === 0) {
      return new Response(
        JSON.stringify({ success: true, news: [], warning: 'Nenhum artigo encontrado. Tente novamente ou tente outro site.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Scrape articles in batches of 3 (reduces burst pressure)
    const scrapeArticle = async ({ url, source, sourceLang, prefetched }: typeof articleEntries[number]) => {
      try {
        let markdown = '';
        let rawHtml = '';
        let metadata: Record<string, unknown> = {};

        if (prefetched) {
          // Use pre-fetched content from Search API (avoids blocked scrape)
          markdown = prefetched.markdown || '';
          const rawTitle = prefetched.title || extractFirstHeading(markdown) || extractTitleFromUrl(url);
          const excerpt = extractExcerpt(markdown, rawTitle);
          const image = extractImageFromMarkdown(markdown) || null;
          const publishedDate = extractDateFromUrl(url) || extractDateFromMarkdown(markdown) || null;
          const normalizedDate = publishedDate ? normalizeDate(publishedDate) : null;
          const needsTranslation = lang === 'pt' && sourceLang !== 'pt';
          const title = needsTranslation ? await translateTitle(rawTitle, 'pt') : cleanTitle(rawTitle);
          console.log(`Prefetched: ${url} → date: ${normalizedDate || 'none'}, image: ${image ? 'found' : 'none'}`);
          return { title, excerpt, url, image: image ? cleanImageUrl(image) : undefined, source, publishedDate: normalizedDate, fullContent: markdown.slice(0, 3000) };
        }

        console.log(`Scraping: ${url}`);
        const res = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'rawHtml'],
            onlyMainContent: false,
            timeout: 30000,
          }),
        }, 3, `scrape:${url}`);

        const data = await res.json();
        if (!res.ok || !data.success) {
          console.warn(`Failed to scrape ${url}:`, data.error);
          return null;
        }

        markdown = data.data?.markdown || data.markdown || '';
        rawHtml = data.data?.rawHtml || data.rawHtml || '';
        metadata = data.data?.metadata || data.metadata || {};

        const rawTitle = metadata.title || extractFirstHeading(markdown) || extractTitleFromUrl(url);

        const metaKeys = Object.keys(metadata);
        const dateKeys = metaKeys.filter(k => /date|time|publish|post|creat|modif/i.test(k));
        if (dateKeys.length > 0) {
          console.log(`Date metadata for ${url}:`, Object.fromEntries(dateKeys.map(k => [k, metadata[k]])));
        }

        const publishedDate =
          metadata.publishedTime ||
          metadata.modifiedTime ||
          metadata.datePublished ||
          metadata.dateCreated ||
          metadata.dateModified ||
          metadata['article:published_time'] ||
          metadata['og:article:published_time'] ||
          metadata['og:updated_time'] ||
          metadata['article:modified_time'] ||
          metadata['dc.date'] ||
          metadata['dc.date.issued'] ||
          metadata['sailthru.date'] ||
          extractDateFromUrl(url) ||
          extractDateFromHtml(rawHtml) ||
          extractDateFromMarkdown(markdown) ||
          null;

        const normalizedDate = publishedDate ? normalizeDate(publishedDate) : null;
        console.log(`Date result for ${url}: ${normalizedDate || 'NOT FOUND'}`);

        // Skip old articles — Game Informer gets 365 days, others 90 days
        if (normalizedDate) {
          const parsed = new Date(normalizedDate);
          if (!isNaN(parsed.getTime())) {
            const maxDays = source === 'Game Informer' ? 365 : 90;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - maxDays);
            if (parsed < cutoff) {
              console.log(`Skipping old article: ${url} (date: ${normalizedDate})`);
              return null;
            }
          }
        }

        const excerpt = extractExcerpt(markdown, rawTitle);

        // Extract image with smart fallback chain
        const rawImage =
          metadata['og:image'] ||
          metadata.ogImage ||
          metadata.image ||
          metadata['twitter:image'] ||
          metadata['twitter:image:src'];

        const metaImage = normalizeImageField(rawImage);

        const image =
          metaImage ||
          extractImageFromHtml(rawHtml) ||
          extractImageFromMarkdown(markdown) ||
          null;

        const cleanedImage = image ? cleanImageUrl(image) : null;

        console.log(`Image for ${url}: ${cleanedImage ? 'found' : 'none'}`);

        // Determine if title needs translation
        // Only translate to PT if source lang is not PT and app lang is PT
        const needsTranslation = lang === 'pt' && sourceLang !== 'pt';
        const title = needsTranslation
          ? await translateTitle(rawTitle, 'pt')
          : cleanTitle(rawTitle);

        return {
          title,
          excerpt,
          url,
          image: cleanedImage || undefined,
          source,
          publishedDate: normalizedDate || null,
          fullContent: markdown.slice(0, 3000),
        };
      } catch (err) {
        console.warn(`Error scraping ${url}:`, err);
        return null;
      }
    };

    const results = await batchProcess(articleEntries, scrapeArticle, 3, 500);
    const newsItems = results.filter(Boolean);

    console.log(`Successfully scraped ${newsItems.length} articles`);

    newsItems.sort((a, b) => {
      if (!a.publishedDate && !b.publishedDate) return 0;
      if (!a.publishedDate) return 1;
      if (!b.publishedDate) return -1;
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    });

    // ── Store in persistent DB cache ──────────────────────────────────
    if (requestedSource) {
      const cacheKey = `${requestedSource}_${lang}`;
      await writeCacheToDB(cacheKey, newsItems);
    }

    return new Response(
      JSON.stringify({ success: true, news: newsItems, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ── Translate title using Google Gemini API ────────────────────
async function translateTitle(title: string, targetLang: string): Promise<string> {
  try {
    if (!title || title.trim().length === 0) return title;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      console.warn('GEMINI_API_KEY not set, skipping translation');
      return cleanTitle(title);
    }

    const langNames: Record<string, string> = { pt: 'Brazilian Portuguese', en: 'English', es: 'Spanish' };
    const targetName = langNames[targetLang] || 'Brazilian Portuguese';

    const prompt = `Translate this news headline to ${targetName}. Return ONLY the translated headline, nothing else, no quotes, no explanation:\n\n${title}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    });

    if (!res.ok) {
      console.warn('Gemini translation failed:', res.status);
      return cleanTitle(title);
    }

    const json = await res.json();
    const translated = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (translated && translated.length > 0) {
      console.log(`Translated: "${title}" → "${translated}"`);
      return cleanTitle(translated);
    }
    return cleanTitle(title);
  } catch (e) {
    console.warn('Translation error:', e);
    return cleanTitle(title);
  }
}

// ── Normalize a date string to YYYY-MM-DD ────────────────────────────────────
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  // Try YYYY-MM-DD pattern already
  const simple = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (simple) return simple[1];
  return null;
}

// ── Normalize image field (handles string | string[] | undefined) ──────────────
function normalizeImageField(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.startsWith('http') ? trimmed : null;
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      const result = normalizeImageField(item);
      if (result) return result;
    }
  }
  return null;
}

// ── Clean image URL: remove Firecrawl size modifiers, whitespace, etc. ────────
function cleanImageUrl(url: string): string {
  return url
    .trim()
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/\s+/g, '')
    .replace(/\$s_![^!]+!,/g, '');
}

function extractDateFromUrl(url: string): string | null {
  const m = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (m) {
    const iso = `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }
  return null;
}

function extractDateFromHtml(html: string): string | null {
  if (!html) return null;
  const patterns = [
    // Standard meta article:published_time
    /property=["']article:published_time["'][^>]*?content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*?property=["']article:published_time["']/i,
    /property=["']og:article:published_time["'][^>]*?content=["']([^"']+)["']/i,
    // published date meta names
    /name=["']publishdate["'][^>]*?content=["']([^"']+)["']/i,
    /name=["']publish[_-]?date["'][^>]*?content=["']([^"']+)["']/i,
    /name=["']date["'][^>]*?content=["']([^"']+)["']/i,
    /name=["']dc\.date["'][^>]*?content=["']([^"']+)["']/i,
    /name=["']sailthru\.date["'][^>]*?content=["']([^"']+)["']/i,
    // JSON-LD datePublished, dateCreated, uploadDate
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /"dateCreated"\s*:\s*"([^"]+)"/i,
    /"uploadDate"\s*:\s*"([^"]+)"/i,
    /"dateModified"\s*:\s*"([^"]+)"/i,
    // HTML <time> element with datetime attribute
    /<time[^>]+datetime=["']([^"']+)["']/i,
    // data-published / data-date attributes
    /data-published=["']([^"']+)["']/i,
    /data-date=["']([^"']+)["']/i,
    /data-publish-?date=["']([^"']+)["']/i,
    /data-timestamp=["'](\d{10,13})["']/i,   // unix timestamp
    // itemprop datePublished
    /itemprop=["']datePublished["'][^>]*?content=["']([^"']+)["']/i,
    /itemprop=["']datePublished["'][^>]*?datetime=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*?itemprop=["']datePublished["']/i,
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m && m[1]) {
      let val = m[1].trim();
      // Handle unix timestamp (10 or 13 digits)
      if (/^\d{10}$/.test(val)) return new Date(parseInt(val) * 1000).toISOString().slice(0, 10);
      if (/^\d{13}$/.test(val)) return new Date(parseInt(val)).toISOString().slice(0, 10);
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function extractDateFromMarkdown(markdown: string): string | null {
  const text = markdown.slice(0, 3000);

  const enMonths: Record<string, string> = {
    january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
    july:'07', august:'08', september:'09', october:'10', november:'11', december:'12'
  };
  const ptMonths: Record<string, string> = {
    janeiro:'01', fevereiro:'02', março:'03', abril:'04', maio:'05', junho:'06',
    julho:'07', agosto:'08', setembro:'09', outubro:'10', novembro:'11', dezembro:'12'
  };
  const esMonths: Record<string, string> = {
    enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
    julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
  };

  // ISO datetime in text
  const isoDatetime = text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (isoDatetime) return isoDatetime[1].slice(0, 10);

  // ISO date in text
  const isoDate = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoDate) {
    const d = new Date(isoDate[1]);
    if (!isNaN(d.getTime())) return isoDate[1];
  }

  // English: "March 5, 2026" or "5 March 2026"
  const enLong = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (enLong) {
    const iso = `${enLong[3]}-${enMonths[enLong[1].toLowerCase()]}-${enLong[2].padStart(2,'0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }
  const enLong2 = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december),?\s+(\d{4})/i);
  if (enLong2) {
    const iso = `${enLong2[3]}-${enMonths[enLong2[2].toLowerCase()]}-${enLong2[1].padStart(2,'0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  // Portuguese: "5 de março de 2026"
  const ptLong = text.match(/(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);
  if (ptLong) {
    const iso = `${ptLong[3]}-${ptMonths[ptLong[2].toLowerCase()]}-${ptLong[1].padStart(2,'0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  // Spanish: "5 de marzo de 2026"
  const esLong = text.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i);
  if (esLong) {
    const iso = `${esLong[3]}-${esMonths[esLong[2].toLowerCase()]}-${esLong[1].padStart(2,'0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  // Brazilian DD/MM/YYYY
  const brDate = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (brDate) {
    const iso = `${brDate[3]}-${brDate[2]}-${brDate[1]}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  // US MM/DD/YYYY
  const usDate = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (usDate) {
    const iso = `${usDate[3]}-${usDate[1].padStart(2,'0')}-${usDate[2].padStart(2,'0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  return null;
}

function extractFirstHeading(markdown: string): string {
  const match = markdown.match(/^#{1,2}\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function extractTitleFromUrl(url: string): string {
  const segments = url.replace(/\/$/, '').split('/');
  const slug = segments[segments.length - 1] || '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[\|–\-]\s*(gam3s|gam3s\.gg|tecmundo|voxel|terra|gamevicio|playtoearn|coindesk|theblock|decrypt|bitcoin magazine|beincrypto|cryptopotato|gamespot|eurogamer|pcgamer|polygon|kotaku|rock paper shotgun|gamesradar|gematsu|gamediscover|gamemakers|elite game developers|crossplay|gamedev reports).*/i, '')
    .trim();
}

function extractExcerpt(markdown: string, title: string): string {
  const lines = markdown.split('\n').filter(l => l.trim());
  const excerptLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.startsWith('!')) continue;
    if (line.startsWith('[') && line.includes('](')) continue;
    if (line.length < 40) continue;
    if (title && line.toLowerCase().includes(title.toLowerCase().slice(0, 20))) continue;

    excerptLines.push(line.trim());
    if (excerptLines.length >= 3) break;
  }

  return excerptLines.join(' ').substring(0, 400) || 'Clique para gerar o roteiro desta notícia.';
}

function extractImageFromHtml(html: string): string | null {
  if (!html) return null;

  const isSmallImage = (u: string) =>
    /[,_-](w_40|w_36|w_48|w_64|w_80|h_40|h_36|h_48|h_64|h_80)[,_)/]/.test(u) ||
    u.includes('/favicon') ||
    u.includes('/icon') ||
    u.endsWith('.svg');

  const patterns = [
    // Standard og:image (all attribute order variants)
    /property=["']og:image["'][^>]*?content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*?property=["']og:image["']/i,
    // og:image:secure_url
    /property=["']og:image:secure_url["'][^>]*?content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*?property=["']og:image:secure_url["']/i,
    // Twitter image
    /name=["']twitter:image["'][^>]*?content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*?name=["']twitter:image["']/i,
    /name=["']twitter:image:src["'][^>]*?content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*?name=["']twitter:image:src["']/i,
    // JSON-LD structured data
    /"og:image"\s*:\s*"([^"]+)"/i,
    /"thumbnailUrl"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*\{\s*"@type"\s*:\s*"ImageObject"\s*,\s*"url"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*\[\s*"(https?:\/\/[^"]+)"/i,
    /"image"\s*:\s*"(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif))"/i,
    // Generic meta tag catch-all
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)[^"']*["'][^>]*content=["']([^"']+)["']/i,
    // data-src / srcset hero images
    /srcset=["'][^"']*?(https?:\/\/[^\s"',]+(?:\.jpg|\.jpeg|\.png|\.webp))[^"']*?["']/i,
    // Regular <img> src with typical CMS CDN patterns
    /<img[^>]+src=["'](https?:\/\/(?:cdn\.|images\.|assets\.|media\.|static\.|cloudfront\.)[^"']+(?:\.jpg|\.jpeg|\.png|\.webp))[^"'>]*>/i,
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m && m[1] && m[1].startsWith('http') && !isSmallImage(m[1])) return m[1];
  }
  return null;
}

function extractImageFromMarkdown(markdown: string): string | null {
  if (!markdown) return null;
  const imgRegex = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  let match;
  while ((match = imgRegex.exec(markdown)) !== null) {
    let url = match[1].trim().replace(/\n/g, '').replace(/\s+/g, '');
    if (/[,_](w_40|w_36|w_48|h_40|h_36|h_48|w_64|h_64|w_80|h_80)[,_)/]/.test(url)) continue;
    if (/favicon|\/icon[_-]|logo[_-]\d|profile_photo|avatar/.test(url)) continue;
    if (url.endsWith('.svg') || url.includes('.svg?')) continue;
    if (url.startsWith('data:')) continue;
    if (url.includes('substack') || url.includes('substackcdn')) {
      if (/w_1456|c_limit|1920x1080|1488x|1280x/.test(url) || !/w_\d{2,3}[,_)]/.test(url)) {
        return url.replace(/\$s_![^!]+!,/g, '');
      }
      continue;
    }
    if (url.startsWith('http')) return url;
  }
  return null;
}

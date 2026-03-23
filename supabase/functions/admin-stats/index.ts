const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Admin credentials (same as frontend)
const ADMIN_USERS = [
  { username: 'brncrysis', password: '123456' },
  { username: 'nenesk', password: '123456' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin credentials from request body
    const body = await req.json().catch(() => ({}));
    const { adminUser, adminPass } = body;

    const isAdmin = ADMIN_USERS.some(
      (u) => u.username === adminUser && u.password === adminPass
    );

    if (!isAdmin) {
      // Fallback: check JWT auth (for backwards compatibility)
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
      const anonClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await anonClient.auth.getUser();
      if (authError || !user || !['g91700194@gmail.com'].includes(user.email || '')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Acesso negado' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use service role client to access all data
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all users from auth.users
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    // 2. Get all saved_scripts
    const { data: scripts, error: scriptsError } = await adminClient
      .from('saved_scripts')
      .select('id, user_id, niche, script_type, created_at, news_source, news_title, script_hashtags')
      .order('created_at', { ascending: false });
    if (scriptsError) throw scriptsError;

    const allScripts = scripts || [];

    // ── 3. Per-user stats (lean — no raw content) ──
    const userStats = users.map((u: any) => {
      const us = allScripts.filter((s: any) => s.user_id === u.id);
      const scriptCount = us.filter((s: any) => s.script_type === 'script').length;
      const tweetCount = us.filter((s: any) => s.script_type === 'tweet').length;
      const niches = [...new Set(us.map((s: any) => s.niche).filter(Boolean))];
      const sources = [...new Set(us.map((s: any) => s.news_source).filter(Boolean))];
      const lastUse = us.length > 0 ? us[0].created_at : null;

      return {
        id: u.id,
        email: u.email || '',
        displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email || 'Sem nome',
        avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        scriptCount,
        tweetCount,
        totalGenerated: scriptCount + tweetCount,
        niches,
        sources,
        lastUse,
      };
    });
    userStats.sort((a: any, b: any) => b.totalGenerated - a.totalGenerated);

    // ── 4. KPIs ──
    const totalUsers = users.length;
    const totalScripts = allScripts.filter((s: any) => s.script_type === 'script').length;
    const totalTweets = allScripts.filter((s: any) => s.script_type === 'tweet').length;
    const totalGenerated = totalScripts + totalTweets;
    const activeUsers = userStats.filter((u: any) => u.totalGenerated > 0).length;
    const avgPerUser = totalUsers > 0 ? Math.round((totalGenerated / totalUsers) * 10) / 10 : 0;

    // ── 5. Analytics Intelligence ──

    // 5a. Niche breakdown
    const nicheBreakdown: Record<string, number> = {};
    allScripts.forEach((s: any) => {
      if (s.niche) nicheBreakdown[s.niche] = (nicheBreakdown[s.niche] || 0) + 1;
    });

    // 5b. Top sources (ranked by usage)
    const sourceCount: Record<string, number> = {};
    allScripts.forEach((s: any) => {
      if (s.news_source) sourceCount[s.news_source] = (sourceCount[s.news_source] || 0) + 1;
    });
    const topSources = Object.entries(sourceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // 5c. Source per niche
    const sourcesByNiche: Record<string, Record<string, number>> = {};
    allScripts.forEach((s: any) => {
      if (s.niche && s.news_source) {
        if (!sourcesByNiche[s.niche]) sourcesByNiche[s.niche] = {};
        sourcesByNiche[s.niche][s.news_source] = (sourcesByNiche[s.niche][s.news_source] || 0) + 1;
      }
    });

    // 5d. Daily content generation (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyContent: Record<string, { scripts: number; tweets: number }> = {};
    const dailySignups: Record<string, number> = {};

    allScripts.forEach((s: any) => {
      const d = new Date(s.created_at);
      if (d >= thirtyDaysAgo) {
        const key = d.toISOString().slice(0, 10);
        if (!dailyContent[key]) dailyContent[key] = { scripts: 0, tweets: 0 };
        if (s.script_type === 'script') dailyContent[key].scripts++;
        else dailyContent[key].tweets++;
      }
    });

    users.forEach((u: any) => {
      const d = new Date(u.created_at);
      if (d >= thirtyDaysAgo) {
        const key = d.toISOString().slice(0, 10);
        dailySignups[key] = (dailySignups[key] || 0) + 1;
      }
    });

    // 5e. Peak usage hours
    const hourlyUsage: number[] = new Array(24).fill(0);
    allScripts.forEach((s: any) => {
      const h = new Date(s.created_at).getHours();
      hourlyUsage[h]++;
    });

    // 5f. Top hashtags
    const hashtagCount: Record<string, number> = {};
    allScripts.forEach((s: any) => {
      if (s.script_hashtags && Array.isArray(s.script_hashtags)) {
        s.script_hashtags.forEach((tag: string) => {
          const clean = tag.replace(/^#/, '').toLowerCase();
          if (clean) hashtagCount[clean] = (hashtagCount[clean] || 0) + 1;
        });
      }
    });
    const topHashtags = Object.entries(hashtagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // 5g. Top topics (extract keywords from news titles)
    const stopWords = new Set(['de','do','da','dos','das','e','a','o','um','uma','para','com','em','no','na','nos','nas','por','se','que','é','ao','os','as','mais','como','sobre','the','and','of','to','in','for','is','on','with','by','at','an','from','its','new','has','are','will','be','it','was','not','this','but','or','have','had','been','can','than','all','their','after','into','out','up','one','may','could','first','also','two','been','now','just','over','back','if','our','us','his','her','she','he','my','me','we','they','them','no','so','any','what','which','when','who','would','there','each','make','how','other','can']);
    const wordCount: Record<string, number> = {};
    allScripts.forEach((s: any) => {
      if (s.news_title) {
        const words = s.news_title.toLowerCase()
          .replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/gi, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 3 && !stopWords.has(w));
        words.forEach((w: string) => {
          wordCount[w] = (wordCount[w] || 0) + 1;
        });
      }
    });
    const topTopics = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([word, count]) => ({ word, count }));

    // 5h. Recent activity (last 10 items — summary only)
    const recentActivity = allScripts.slice(0, 10).map((s: any) => {
      const user = users.find((u: any) => u.id === s.user_id);
      return {
        type: s.script_type,
        niche: s.niche,
        newsTitle: s.news_title,
        newsSource: s.news_source,
        userName: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Anônimo',
        userAvatar: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
        createdAt: s.created_at,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        kpis: { totalUsers, activeUsers, totalScripts, totalTweets, totalGenerated, avgPerUser, nicheBreakdown, dailySignups },
        analytics: {
          topSources,
          sourcesByNiche,
          dailyContent,
          hourlyUsage,
          topHashtags,
          topTopics,
          recentActivity,
        },
        users: userStats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin stats error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

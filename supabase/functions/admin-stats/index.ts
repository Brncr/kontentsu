const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_EMAILS = ['g91700194@gmail.com'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify JWT with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin access
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado — não é admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to access all data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all users from auth.users
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    // 2. Get all saved_scripts
    const { data: scripts, error: scriptsError } = await adminClient
      .from('saved_scripts')
      .select('id, user_id, niche, script_type, created_at, news_source');
    if (scriptsError) throw scriptsError;

    // 3. Build per-user stats
    const userStats = users.map((u: any) => {
      const userScripts = (scripts || []).filter((s: any) => s.user_id === u.id);
      const scriptCount = userScripts.filter((s: any) => s.script_type === 'script').length;
      const tweetCount = userScripts.filter((s: any) => s.script_type === 'tweet').length;
      const niches = [...new Set(userScripts.map((s: any) => s.niche).filter(Boolean))];
      const sources = [...new Set(userScripts.map((s: any) => s.news_source).filter(Boolean))];
      const lastUse = userScripts.length > 0
        ? userScripts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;

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

    // Sort by most recent signup
    userStats.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 4. Build KPIs
    const totalUsers = users.length;
    const totalScripts = (scripts || []).filter((s: any) => s.script_type === 'script').length;
    const totalTweets = (scripts || []).filter((s: any) => s.script_type === 'tweet').length;
    const totalGenerated = totalScripts + totalTweets;
    const activeUsers = userStats.filter((u: any) => u.totalGenerated > 0).length;
    const avgPerUser = totalUsers > 0 ? Math.round((totalGenerated / totalUsers) * 10) / 10 : 0;

    // Niche breakdown
    const nicheBreakdown: Record<string, number> = {};
    (scripts || []).forEach((s: any) => {
      if (s.niche) nicheBreakdown[s.niche] = (nicheBreakdown[s.niche] || 0) + 1;
    });

    // Daily signups (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailySignups: Record<string, number> = {};
    users.forEach((u: any) => {
      const d = new Date(u.created_at);
      if (d >= thirtyDaysAgo) {
        const key = d.toISOString().slice(0, 10);
        dailySignups[key] = (dailySignups[key] || 0) + 1;
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        kpis: {
          totalUsers,
          activeUsers,
          totalScripts,
          totalTweets,
          totalGenerated,
          avgPerUser,
          nicheBreakdown,
          dailySignups,
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

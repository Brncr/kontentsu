const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, url, fullContent: preScrapedContent, lang = "pt" } = await req.json();
    const langMap: Record<string, string> = {
      pt: "Brazilian Portuguese",
      en: "English",
      es: "Spanish",
    };
    const targetLang = langMap[lang] || "Brazilian Portuguese";

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use pre-scraped content if available (from scrape-news), otherwise fall back to excerpt
    const fullContent = preScrapedContent || excerpt;
    console.log(`Generating script for: "${title}" (content length: ${fullContent.length} chars)`);

    const systemPrompt = `You are an expert scriptwriter who transforms news into highly engaging short videos for social media (30 to 90 seconds). Always respond entirely in ${targetLang}.`;

    const userPrompt = `Vou enviar abaixo o texto completo de um artigo de notícia.

Sua tarefa é transformar essa notícia em um roteiro falado para vídeo curto, com apresentador carismático, seguindo esta estrutura obrigatória:

Comece com um gancho que prende a atenção do expectador. obrigatoriamente o vídeo precisa começar ou criando tensão, ou gerando dúvida ou ativando uma emoção. isso pode ser feito através de uma afirmação ou uma pergunta Aqui você tem 7 opções:

1) conectando a notícia diretamente com a vida da pessoa (impacto prático e gerando uma imagem mental pra ela se imaginar naquela situação específica).

2) criando um contraste com duas ideias opostas lado a lado. o objetivo desse é criar incoerência pro expectador ter vontade de entender

3) criando uma lacuna mental de curiosidade, gerando um mistério que será revelado depois no roteiro

4) apontando pra uma consequência financeira direta do expectador, como algo que vai mexer no bolso de quem tá assistindo e por isso é importante prestar atenção

5) criando um conflito que prende a pessoa

6) começando com quebra de expectativa, iniciando o roteiro de uma forma impactante diferente do que a pessoa espera

7) um gancho de urgência como uma mudança importante ou uma atualização. nunca criar urgências falsas!

em seguida Apresente o fato principal de forma clara e simples.

Mostre o conflito ou tensão envolvida na notícia.

Explique o que muda agora, se couber na notícia (antes vs depois).

Traduza o impacto real na vida do público.

Finalize com uma reflexão, alerta ou pergunta que estimule comentário.

Se o vídeo gerou indignação → o CTA precisa canalizar indignação.

Se gerou identificação → o CTA precisa aprofundar identificação.

Se gerou curiosidade → o CTA precisa continuar o assunto.

Se a notícia afeta muita gente ou envolve dinheiro ou envolve risco ou envolve mudança prática, estimule o compartilhamento ao invés do comentário. se a notícia é útil pras outras pessoas, vamos estimular esse comportamento de compartilhar

Regras importantes:

Linguagem simples, natural e conversada. Substituir "está" por "tá", por exemplo.

Evitar linguagem jornalística formal.

Criar curiosidade nos primeiros segundos.

Usar contraste quando possível.

Explicar termos técnicos com exemplos do cotidiano.

Não inventar informações que não estejam no texto.

Duração estimada entre 30 e 90 segundos.

Entregar apenas o roteiro final, pronto para ser lido pelo apresentador.

TÍTULO: ${title}
CONTEÚDO COMPLETO: ${fullContent}

Retorne APENAS este JSON (sem markdown):
{
  "hook": "Gancho de abertura (2-3 frases impactantes, pronto para leitura)",
  "desenvolvimento": "Fato principal + conflito + antes vs depois (pode usar quebras de linha pra indicar pausas)",
  "cta": "CTA final alinhado à emoção gerada pela notícia",
  "hashtags": ["hashtags relevantes"],
  "titulo_sugerido": "Título chamativo para o vídeo",
  "duracao_estimada": "XX segundos"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
        ],
        generationConfig: { temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar roteiro com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let script;
    try {
      // Remove possible markdown code blocks
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      script = JSON.parse(cleaned);
    } catch {
      // Return raw content if not valid JSON
      script = {
        hook: content.substring(0, 200),
        desenvolvimento: content.substring(200, 600),
        cta: 'Curtiu? Segue o canal pra mais notícias de games! 🎮',
        hashtags: ['#games', '#gaming', '#shorts'],
        titulo_sugerido: title,
        duracao_estimada: '55 segundos',
      };
    }

    return new Response(
      JSON.stringify({ success: true, script }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

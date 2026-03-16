const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, url, fullContent: preScrapedContent } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullContent = preScrapedContent || excerpt;
    console.log(`Generating tweets for: "${title}" (content length: ${fullContent.length} chars)`);

    const systemPrompt = `Aja como um creator ativo do X (Twitter) que comenta notícias sobre mercado de games, tecnologia, Web3, cripto e economia digital. Você transforma matérias jornalísticas em tweets naturais que parecem comentários espontâneos de quem acabou de ler algo interessante.`;

    const userPrompt = `Seu objetivo é transformar a matéria abaixo em tweets com alto potencial de alcance e engajamento.

Regras:
- Escreva sempre em português
- Gere exatamente 3 opções de tweet
- Os tweets devem parecer escritos por uma pessoa real, não por veículo jornalístico ou IA
- Evite linguagem institucional, burocrática ou excessivamente analítica
- Misture: pensamento espontâneo de creator + percepção de quem entende da indústria

Reações diferentes:
Cada tweet deve representar uma reação DIFERENTE do creator à notícia.
Exemplos de reações: estranhamento, crítica, desconfiança, preocupação, curiosidade, surpresa, admiração, implicação sobre o mercado.
As 3 opções devem ter abordagens CLARAMENTE DIFERENTES. Evite repetir a mesma ideia ou estrutura.

Distribuição emocional:
Provocar emoções no leitor com essa distribuição:
- ~60% emoções negativas: desconfiança, preocupação, frustração, indignação, aversão
- ~40% emoções positivas: surpresa, admiração, curiosidade, empolgação
Essas emoções devem surgir naturalmente a partir da notícia.

Conteúdo:
Identifique os pontos mais interessantes da matéria. Cada tweet deve focar em um ângulo DIFERENTE:
- implicações para o mercado
- decisão curiosa ou controversa
- possível impacto futuro
- reação da indústria
- detalhe inesperado
- número ou dado interessante
Evite simplesmente resumir a matéria. Destaque algo relevante e reaja a isso.

Naturalidade:
Soem humanos e espontâneos. Podem incluir:
- dúvida
- hipótese
- observação incompleta
- reação emocional
Evite análises perfeitas ou conclusões totalmente fechadas. Tweets humanos parecem pensamentos rápidos.

Anti-padrões de IA:
Evite estruturas comuns: "não é apenas X, é Y", "não só X, mas Y", "X entendeu que precisa Y", "isso muda tudo/jogo", "isso redefine a indústria"
Evite frases grandiosas, genéricas ou que soem como slogans. Prefira observações específicas e naturais.

Formato:
- Frases curtas e escaneáveis
- Pequenas quebras de linha quando fizer sentido
- Evite blocos grandes de texto
- Fácil de consumir rapidamente no feed

Emojis:
- Use em ~10% dos tweets
- Apenas quando encaixarem perfeitamente
- Nunca force

Hashtags:
- Não use hashtags

Comprimento:
- Sem limite rígido, mas seja conciso
- Evite textos longos ou excessivamente explicativos

Saída:
- Apenas os 3 tweets numerados
- Sem explicações adicionais

TÍTULO: ${title}
MATÉRIA COMPLETA: ${fullContent}

Retorne APENAS este JSON (sem markdown):
{
  "tweets": [
    "Texto completo do tweet 1",
    "Texto completo do tweet 2",
    "Texto completo do tweet 3"
  ]
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
        JSON.stringify({ error: 'Erro ao gerar tweets com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let result;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = {
        tweets: [content.substring(0, 500)],
      };
    }

    return new Response(
      JSON.stringify({ success: true, tweets: result.tweets }),
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

const SYSTEM_PROMPT = `Você é a agente "Lara", analista de comunicação em relacionamentos amorosos, com base em psicologia, especialmente Terapia Cognitivo-Comportamental (TCC), comunicação interpessoal e análise de comportamento.

OBJETIVO:
Ajudar a pessoa usuária a compreender melhor a dinâmica da conversa, promovendo clareza emocional e reflexão, sem induzir decisões impulsivas.

REGRAS FUNDAMENTAIS (OBRIGATÓRIAS):
- Nunca trate interpretações como verdades absolutas.
- Nunca tire conclusões definitivas.
- Nunca sugira término, afastamento ou decisões radicais.
- Não realize diagnósticos psicológicos ou psiquiátricos.
- Não julgue nenhuma das partes.
- Não use linguagem alarmista ou acusatória.
- Sempre use linguagem de possibilidade.

LINGUAGEM OBRIGATÓRIA DE HIPÓTESE:
Use expressões como:
- "Pode indicar que..."
- "Uma possível interpretação é..."
- "Isso pode sugerir..."
- "É possível que..."
Evite frases conclusivas.

ENTRADA ESPERADA:
A usuária pode enviar:
1) Conversa colada em texto livre;
2) Export de WhatsApp no formato de linhas com data/hora/nome/mensagem;
3) Trechos parciais e desorganizados.

VOCÊ DEVE:
1. Identificar e limpar ruídos do texto (ex.: "Mensagens e chamadas são protegidas...", "<Arquivo de mídia oculto>", "imagem omitida", etc.).
2. Reconhecer o formato do WhatsApp automaticamente, incluindo padrões comuns como:
   - dd/mm/aaaa hh:mm - Nome: Mensagem
   - [dd/mm/aaaa, hh:mm:ss] Nome: Mensagem
3. Ignorar metadados sem conteúdo emocional relevante.
4. Se faltar contexto, declarar limites com cuidado e seguir com hipóteses leves.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. Comunicação
2. Emoções
3. Análise Cognitiva (TCC)
4. Padrões de Interação
5. Hipóteses Centrais (linguagem de possibilidade)
6. Reflexão Guiada

Em "Reflexão Guiada", faça de 5 a 8 perguntas abertas e nunca dê ordens.

BLOCO FINAL OBRIGATÓRIO:
"Limites desta análise: esta leitura é interpretativa e baseada apenas no recorte enviado. Ela não substitui terapia ou avaliação profissional."

ESTILO:
- Neutro, empático, cuidadoso e claro.
- Profundo, mas sem dramatização.
- Foque em clareza e consciência emocional.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY não configurada na Vercel."
    });
  }

  const { contexto = "", conversa = "" } = req.body || {};
  if (!conversa || !conversa.trim()) {
    return res.status(400).json({ error: "A conversa é obrigatória." });
  }

  try {
    const userPrompt = `Analise a conversa abaixo seguindo EXATAMENTE a estrutura:
1) Comunicação
2) Emoções
3) Análise Cognitiva (TCC)
4) Padrões de Interação
5) Hipóteses Centrais (linguagem de possibilidade)
6) Reflexão Guiada

Regras:
- Não concluir nada de forma definitiva
- Não sugerir término ou decisão radical
- Não diagnosticar
- Usar tom neutro, empático e cuidadoso

CONTEXTO (opcional):
${contexto}

CONVERSA:
${conversa}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Falha ao gerar análise."
      });
    }

    const output =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "Não foi possível gerar análise no momento.";

    return res.status(200).json({ analysis: output });
  } catch (error) {
    return res.status(500).json({
      error: "Erro inesperado ao gerar análise."
    });
  }
}

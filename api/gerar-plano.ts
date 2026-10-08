import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: { type: SchemaType.STRING },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              lanche_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              almoco: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              lanche_tarde: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              jantar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"],
          },
        },
        required: ["dia", "refeicoes"],
      },
    },
  },
  required: ["plano_semanal"],
};

export default async function handler(req: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo nao permitido." }), { status: 405, headers });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Chave de API do Gemini nao configurada no servidor." }),
      { status: 500, headers }
    );
  }

  let dados_do_paciente = "";
  try {
    const body = await req.json();
    dados_do_paciente = body.dados_do_paciente || "";
  } catch {
    return new Response(JSON.stringify({ error: "Body invalido." }), { status: 400, headers });
  }

  if (!dados_do_paciente) {
    return new Response(
      JSON.stringify({ error: "Dados do paciente sao obrigatorios." }),
      { status: 400, headers }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
      },
    });

    const prompt =
      "Voce e um nutricionista clinico profissional especialista na culinaria e rotina brasileira.\n" +
      "Gere um plano alimentar semanal completo, saudavel e diversificado com base nos dados do paciente fornecidos abaixo.\n\n" +
      "Dados do Paciente (Metas, Alergias, Restricoes e Historico):\n" +
      dados_do_paciente +
      "\n\n# Regras Criticas de Execucao:\n" +
      "- Voce deve responder APENAS e estritamente o objeto JSON solicitado.\n" +
      "- Nao inclua blocos de codigo markdown, explicacoes ou textos complementares.\n" +
      "- Adapte o cardapio rigorosamente a quaisquer alergias ou restricoes descritas nos dados.\n" +
      "- Utilize alimentos comuns, acessiveis e culturalmente aceitos no Brasil.\n" +
      "- Evite repeticoes monotonas de alimentos nos dias seguidos.\n" +
      "- Gere exatamente 7 dias: Segunda-feira, Terca-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sabado, Domingo.\n" +
      "- Cada refeicao deve ter exatamente 5 opcoes de alimentos/preparacoes.";

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    return new Response(JSON.stringify(parsed), { status: 200, headers });
  } catch (err: any) {
    console.error("Erro ao chamar Gemini:", err);
    return new Response(
      JSON.stringify({
        error: "Falha ao gerar plano com IA. Tente novamente.",
        details: err?.message || "Erro desconhecido",
      }),
      { status: 500, headers }
    );
  }
}

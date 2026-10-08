import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

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
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
  },
  required: ['plano_semanal'],
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-gerar-plano-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/gerar-plano', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

            if (req.method === 'OPTIONS') {
              res.statusCode = 200
              res.end()
              return
            }

            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Método não permitido.' }))
              return
            }

            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
            if (!apiKey) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY não configurada no ambiente.' }))
              return
            }

            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })

            req.on('end', async () => {
              try {
                const parsedBody = JSON.parse(body || '{}')
                const dados_do_paciente = parsedBody.dados_do_paciente

                if (!dados_do_paciente) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: 'Dados do paciente são obrigatórios.' }))
                  return
                }

                const genAI = new GoogleGenerativeAI(apiKey)
                // Use gemini-2.5-flash with fallback to gemini-1.5-flash if needed
                const model = genAI.getGenerativeModel({
                  model: 'gemini-2.5-flash',
                  generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema as any,
                  },
                })

                const prompt =
                  'Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.\n' +
                  'Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.\n\n' +
                  'Dados do Paciente (Metas, Alergias, Restrições e Histórico):\n' +
                  dados_do_paciente +
                  '\n\n# Regras Críticas de Execução:\n' +
                  '- Você deve responder APENAS e estritamente o objeto JSON solicitado.\n' +
                  '- Não inclua blocos de código markdown, explicações ou textos complementares.\n' +
                  '- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.\n' +
                  '- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.\n' +
                  '- Evite repetições monótonas de alimentos nos dias seguidos.\n' +
                  '- Gere exatamente 7 dias: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado, Domingo.\n' +
                  '- Cada refeição deve ter exatamente 5 opções de alimentos/preparações.'

                const result = await model.generateContent(prompt)
                const responseText = result.response.text()
                const data = JSON.parse(responseText)

                res.statusCode = 200
                res.end(JSON.stringify(data))
              } catch (err: any) {
                console.error('[API /api/gerar-plano] Erro ao gerar plano:', err)
                res.statusCode = 500
                res.end(
                  JSON.stringify({
                    error: err?.message || 'Falha ao processar requisição com Gemini.',
                  })
                )
              }
            })
          })
        },
      },
    ],
  }
})

import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AffinityResult, Party, PoliticalData, UserAnswers, UserWeights } from '../types';

const model = 'gemini-2.5-flash';
const MAX_CHAT_CONTEXT_CHARS = 12000;

type AiAction = 'result-explanation' | 'vote-intention' | 'chat';

const answerTextByValue: Record<string, string> = {
  '2': 'Totalmente de acuerdo',
  '1': 'De acuerdo',
  '0': 'Neutral',
  '-1': 'En desacuerdo',
  '-2': 'Totalmente en desacuerdo',
};

const stanceTextByValue: Record<string, string> = {
  ...answerTextByValue,
  '0': 'Neutral / Postura intermedia',
};

const formatUserAnswers = (userAnswers: UserAnswers, userWeights: UserWeights, politicalData: PoliticalData) => {
  let formattedString = 'Preferencias y respuestas del usuario:\n';

  politicalData.topics.forEach((topic) => {
    const weight = userWeights[topic.id];
    const weightText = ['Muy poco importante', 'Poco importante', 'Importante', 'Muy importante', 'Extremadamente importante'][weight] || 'No indicado';
    formattedString += `\nTema: ${topic.title} (Importancia asignada: ${weightText})\n`;

    topic.questions.forEach((question) => {
      const answer = userAnswers[question.id];
      if (answer !== null && answer !== undefined) {
        formattedString += `- Pregunta: "${question.description}"\n  - Respuesta del usuario: ${answerTextByValue[String(answer)] || 'No indicada'}\n`;
      }
    });
  });

  return formattedString;
};

const buildResultExplanationPrompt = (
  affinityResults: AffinityResult[],
  userAnswers: UserAnswers,
  userWeights: UserWeights,
  politicalData: PoliticalData
) => {
  const topParties = affinityResults.slice(0, 3).map((result) => `${result.party} (${result.score.toFixed(1)}%)`).join(', ');
  const userProfile = formatUserAnswers(userAnswers, userWeights, politicalData);

  return `
Eres un analista político experto, neutral e imparcial. Tu tarea es explicar de forma razonada y detallada por qué un usuario tiene una determinada afinidad con ciertos partidos políticos españoles, basándote en sus respuestas a un cuestionario.

A continuación se presenta un resumen de los resultados de afinidad y las respuestas del usuario.

Resultados de Afinidad:
El usuario muestra la mayor afinidad con los siguientes partidos: ${topParties}.

${userProfile}

Análisis a realizar:
1. **Resumen del Perfil Ideológico:** Basándote en el conjunto de sus respuestas, describe brevemente el perfil ideológico general del usuario.
2. **Análisis por Partido Principal:** Para el partido con mayor afinidad, explica por qué existe esa coincidencia. Menciona 2-3 temas o preguntas específicas donde sus posturas son casi idénticas a las del partido.
3. **Análisis Comparativo:** Compara brevemente por qué tiene afinidad con el segundo y tercer partido.
4. **Conclusión Clara y Neutral:** Finaliza con un resumen conciso y neutral, sin dar ninguna recomendación de voto.

Usa un tono claro, educativo y estrictamente objetivo. Formatea la respuesta usando Markdown para una mejor legibilidad.
`;
};

const buildVoteIntentionPrompt = (
  selectedParty: Party,
  userAnswers: UserAnswers,
  userWeights: UserWeights,
  politicalData: PoliticalData
) => {
  const userProfile = formatUserAnswers(userAnswers, userWeights, politicalData);

  let partyStances = `Posturas del partido seleccionado (${selectedParty}):\n`;
  politicalData.topics.forEach((topic) => {
    partyStances += `\nTema: ${topic.title}\n`;
    topic.questions.forEach((question) => {
      const stance = question.partyStances.find((partyStance) => partyStance.party === selectedParty);
      if (stance) {
        partyStances += `- Pregunta: "${question.description}"\n  - Postura del partido: ${stanceTextByValue[String(stance.stance)] || 'No indicada'}\n`;
      }
    });
  });

  return `
Eres un analista político experto, neutral y objetivo. Tu tarea es comparar las opiniones de un usuario con el programa del partido político que ha indicado como su intención de voto.

Partido Seleccionado por el Usuario: ${selectedParty}

${userProfile}

${partyStances}

Análisis a realizar:
1. **Puntos de Máximo Alineamiento:** Identifica de 3 a 4 temas o preguntas específicas donde las respuestas del usuario coinciden fuertemente con la postura de ${selectedParty}. Explica brevemente cada punto.
2. **Puntos de Mayor Divergencia:** Identifica de 2 a 3 temas o preguntas específicas donde las respuestas del usuario se oponen o difieren significativamente de la postura de ${selectedParty}.
3. **Conclusión Neutral:** Resume el grado de alineamiento general sin emitir juicios de valor ni recomendaciones.

Usa un tono informativo y equilibrado. Formatea la respuesta usando Markdown.
`;
};

const buildChatPrompt = (question: string, context: string) => `
Eres un asistente de IA llamado "Vota Informado", un analista político neutral, experto y bien informado.

Instrucciones:
1. Proporciona respuestas completas y objetivas sobre política española.
2. Utiliza el contexto de la aplicación como base principal, enriqueciéndolo con conocimiento general cuando sea apropiado.
3. Identifica posturas de partidos cuando sea posible.
4. Mantén neutralidad: informa, no recomiendes voto.
5. Si la pregunta no está relacionada con política española, declina responder amablemente.

Contexto resumido de posturas en la aplicación:
---
${context.slice(0, MAX_CHAT_CONTEXT_CHARS)}
---

Pregunta del usuario:
${question}
`;

const getPrompt = (body: Record<string, unknown>) => {
  const action = body.action as AiAction | undefined;

  if (action === 'result-explanation') {
    return buildResultExplanationPrompt(
      body.affinityResults as AffinityResult[],
      body.userAnswers as UserAnswers,
      body.userWeights as UserWeights,
      body.politicalData as PoliticalData
    );
  }

  if (action === 'vote-intention') {
    return buildVoteIntentionPrompt(
      body.selectedParty as Party,
      body.userAnswers as UserAnswers,
      body.userWeights as UserWeights,
      body.politicalData as PoliticalData
    );
  }

  if (action === 'chat') {
    return buildChatPrompt(String(body.question || ''), String(body.context || ''));
  }

  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'El servicio de análisis por IA no está configurado.' });
  }

  const prompt = getPrompt(req.body || {});
  if (!prompt) {
    return res.status(400).json({ error: 'Solicitud de análisis no válida.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: 'Hubo un error al generar el análisis. Por favor, inténtalo de nuevo más tarde.' });
  }
}

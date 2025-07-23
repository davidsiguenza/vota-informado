import { GoogleGenAI } from "@google/genai";
import { AffinityResult, Party, PoliticalData, UserAnswers, UserWeights } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY for Gemini is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const formatUserAnswers = (userAnswers: UserAnswers, userWeights: UserWeights, politicalData: PoliticalData) => {
    let formattedString = "Preferencias y respuestas del usuario:\n";
    
    politicalData.topics.forEach(topic => {
        const weight = userWeights[topic.id];
        const weightText = ['Muy poco importante', 'Poco importante', 'Importante', 'Muy importante', 'Extremadamente importante'][weight];
        formattedString += `\nTema: ${topic.title} (Importancia asignada: ${weightText})\n`;
        
        topic.questions.forEach(q => {
            const answer = userAnswers[q.id];
            if (answer !== null && answer !== undefined) {
                const answerText = {
                    '2': 'Totalmente de acuerdo',
                    '1': 'De acuerdo',
                    '0': 'Neutral',
                    '-1': 'En desacuerdo',
                    '-2': 'Totalmente en desacuerdo'
                }[answer];
                formattedString += `- Pregunta: "${q.description}"\n  - Respuesta del usuario: ${answerText}\n`;
            }
        });
    });
    
    return formattedString;
};

export const generateResultExplanation = async (
    affinityResults: AffinityResult[],
    userAnswers: UserAnswers,
    userWeights: UserWeights,
    politicalData: PoliticalData
): Promise<string> => {
    if (!API_KEY) return "El servicio de análisis por IA no está disponible. Falta la clave de API.";
    
    const topParties = affinityResults.slice(0, 3).map(r => `${r.party} (${r.score.toFixed(1)}%)`).join(', ');
    const userProfile = formatUserAnswers(userAnswers, userWeights, politicalData);

    const prompt = `
      Eres un analista político experto, neutral e imparcial. Tu tarea es explicar de forma razonada y detallada por qué un usuario tiene una determinada afinidad con ciertos partidos políticos españoles, basándote en sus respuestas a un cuestionario.

      A continuación se presenta un resumen de los resultados de afinidad y las respuestas del usuario.

      Resultados de Afinidad:
      El usuario muestra la mayor afinidad con los siguientes partidos: ${topParties}.

      ${userProfile}

      Análisis a realizar:
      1.  **Resumen del Perfil Ideológico:** Basándote en el conjunto de sus respuestas, describe brevemente el perfil ideológico general del usuario (p. ej., "perfil progresista en lo social y liberal en lo económico", "perfil conservador en todos los ejes", etc.).
      2.  **Análisis por Partido Principal:** Para el partido con mayor afinidad, explica detalladamente por qué existe esa coincidencia. Menciona 2-3 temas o preguntas específicas donde sus posturas son casi idénticas a las del partido.
      3.  **Análisis Comparativo:** Compara brevemente por qué tiene afinidad con el segundo y tercer partido. Menciona si la afinidad se debe a los mismos temas que el primer partido o a coincidencias en otros ejes.
      4.  **Conclusión Clara y Neutral:** Finaliza con un resumen conciso y neutral, sin dar ninguna recomendación de voto. El objetivo es que el usuario entienda el porqué de sus resultados.

      Usa un tono claro, educativo y estrictamente objetivo. Formatea la respuesta usando Markdown para una mejor legibilidad (títulos, listas).
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating result explanation:", error);
        return "Hubo un error al generar la explicación. Por favor, inténtalo de nuevo más tarde.";
    }
};

export const generateVoteIntentionAnalysis = async (
    selectedParty: Party,
    userAnswers: UserAnswers,
    userWeights: UserWeights,
    politicalData: PoliticalData
): Promise<string> => {
     if (!API_KEY) return "El servicio de análisis por IA no está disponible. Falta la clave de API.";

    const userProfile = formatUserAnswers(userAnswers, userWeights, politicalData);

    let partyStances = `Posturas del partido seleccionado (${selectedParty}):\n`;
    politicalData.topics.forEach(topic => {
        partyStances += `\nTema: ${topic.title}\n`;
        topic.questions.forEach(q => {
            const stance = q.partyStances.find(p => p.party === selectedParty);
            if(stance) {
                 const stanceText = {
                    '2': 'Totalmente de acuerdo',
                    '1': 'De acuerdo',
                    '0': 'Neutral / Postura intermedia',
                    '-1': 'En desacuerdo',
                    '-2': 'Totalmente en desacuerdo'
                }[stance.stance];
                partyStances += `- Pregunta: "${q.description}"\n  - Postura del partido: ${stanceText}\n`;
            }
        });
    });


    const prompt = `
      Eres un analista político experto, neutral y objetivo. Tu tarea es comparar las opiniones de un usuario con el programa del partido político que ha indicado como su intención de voto.

      A continuación se presenta el perfil de respuestas del usuario y un resumen de las posturas del partido seleccionado.

      Partido Seleccionado por el Usuario: ${selectedParty}

      ${userProfile}
      
      ${partyStances}

      Análisis a realizar:
      Debes generar un análisis claro y estructurado que contenga lo siguiente:
      1.  **Puntos de Máximo Alineamiento:** Identifica de 3 a 4 temas o preguntas específicas donde las respuestas del usuario coinciden fuertemente con la postura de ${selectedParty}. Explica brevemente cada punto.
      2.  **Puntos de Mayor Divergencia:** Identifica de 2 a 3 temas o preguntas específicas donde las respuestas del usuario se oponen o difieren significativamente de la postura de ${selectedParty}. Explica brevemente cada punto de fricción.
      3.  **Conclusión Neutral:** Escribe un párrafo final que resuma el grado de alineamiento general sin emitir juicios de valor ni recomendaciones. El objetivo es que el usuario pueda reflexionar sobre cómo sus opiniones se comparan con las del partido que piensa votar.

      Usa un tono informativo y equilibrado. Formatea la respuesta usando Markdown para que sea fácil de leer (títulos, listas con viñetas).
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating vote intention analysis:", error);
        return "Hubo un error al generar el análisis. Por favor, inténtalo de nuevo más tarde.";
    }
};

export const generateChatResponse = async (
    question: string,
    context: string
): Promise<string> => {
    if (!API_KEY) return "El servicio de análisis por IA no está disponible. Falta la clave de API.";

    const prompt = `
      Eres un asistente de IA llamado "Vota Informado", un analista político neutral, experto y bien informado.

      **Instrucciones:**
      1.  **Proporciona respuestas completas y objetivas:** Utiliza tu conocimiento general y tu acceso a información actualizada de fuentes fiables para responder a la pregunta del usuario sobre el panorama político español.
      2.  **Utiliza el contexto como base:** A continuación se te proporciona un resumen de las posturas oficiales de los partidos en 10 temas clave. Utiliza esta información como la base principal para tus respuestas, enriqueciéndola con tu conocimiento general cuando sea apropiado.
      3.  **Identifica las posturas de los partidos:** Siempre que sea posible, menciona qué partidos se alinean con las diferentes posturas o hechos que presentas.
      4.  **Mantén la neutralidad:** No muestres sesgos ni emitas opiniones. Tu objetivo es informar al usuario de manera equilibrada.
      5.  **Formato claro:** Formatea la respuesta usando Markdown para una buena legibilidad.
      6.  Si la pregunta no está relacionada con la política española, declina responder amablemente.

      **Contexto (Resumen de Posturas de los Partidos en la Aplicación):**
      ---
      ${context}
      ---

      **Pregunta del Usuario:**
      ${question}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating chat response:", error);
        return "Hubo un error al comunicarme con la IA. Por favor, inténtalo de nuevo más tarde.";
    }
};
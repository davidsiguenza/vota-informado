import { AffinityResult, Party, PoliticalData, UserAnswers, UserWeights } from "../types";

const AI_ENDPOINT = '/api/ai';

type AiAction = 'result-explanation' | 'vote-intention' | 'chat';

const callAiEndpoint = async <TPayload extends Record<string, unknown>>(
    action: AiAction,
    payload: TPayload
): Promise<string> => {
    try {
        const response = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...payload }),
        });

        const data = await response.json().catch(() => null) as { text?: string; error?: string } | null;

        if (!response.ok) {
            return data?.error || 'El servicio de análisis por IA no está disponible ahora mismo.';
        }

        return data?.text || 'No se recibió respuesta del servicio de análisis por IA.';
    } catch (error) {
        console.error('Error calling AI endpoint:', error);
        return 'Hubo un error al comunicarme con la IA. Por favor, inténtalo de nuevo más tarde.';
    }
};

export const generateResultExplanation = async (
    affinityResults: AffinityResult[],
    userAnswers: UserAnswers,
    userWeights: UserWeights,
    politicalData: PoliticalData
): Promise<string> => {
    return callAiEndpoint('result-explanation', {
        affinityResults,
        userAnswers,
        userWeights,
        politicalData,
    });
};

export const generateVoteIntentionAnalysis = async (
    selectedParty: Party,
    userAnswers: UserAnswers,
    userWeights: UserWeights,
    politicalData: PoliticalData
): Promise<string> => {
    return callAiEndpoint('vote-intention', {
        selectedParty,
        userAnswers,
        userWeights,
        politicalData,
    });
};

export const generateChatResponse = async (
    question: string,
    context: string
): Promise<string> => {
    return callAiEndpoint('chat', {
        question,
        context,
    });
};

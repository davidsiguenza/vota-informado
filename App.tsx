
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserAnswers, UserWeights, Stance, AffinityResult, Party, Question, CompassPoint, PoliticalData, ChatMessage, Point } from './types';
import politicalData from './data/politicalData';
import { SparklesIcon, ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon, TrophyIcon, InfoIcon, PaperAirplaneIcon } from './components/IconComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LabelList, Label } from 'recharts';
import { generateResultExplanation, generateVoteIntentionAnalysis, generateChatResponse } from './services/geminiService';

// --- Helper Types ---
type View = 'weights' | 'questionnaire' | 'results';

// --- Helper Components defined outside App to prevent re-renders ---

const Header: React.FC<{ onInfoClick: () => void }> = ({ onInfoClick }) => (
    <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
                <SparklesIcon className="w-10 h-10 text-indigo-600" />
                Vota Informado
            </h1>
            <p className="mt-2 text-center text-lg text-gray-600">Descubre tu afinidad política en España</p>
            <button
                onClick={onInfoClick}
                className="absolute top-1/2 right-4 sm:right-6 lg:right-8 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Acerca de esta herramienta"
            >
                <InfoIcon className="w-8 h-8" />
            </button>
        </div>
    </header>
);

const TopicWeightsComponent: React.FC<{
    userWeights: UserWeights;
    onWeightChange: (topicId: string, value: number) => void;
    onNext: () => void;
}> = ({ userWeights, onWeightChange, onNext }) => (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Paso 1: ¿Qué temas te importan más?</h2>
        <p className="text-gray-600 mb-6">Ajusta la importancia de cada tema. Esto ayudará a ponderar tus resultados finales.</p>
        <div className="space-y-6">
            {politicalData.topics.map(topic => (
                <div key={topic.id} className="p-4 border border-gray-200 rounded-lg">
                    <label htmlFor={topic.id} className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3">
                        <span className="text-indigo-600">{topic.icon}</span> {topic.title}
                    </label>
                    <input
                        id={topic.id}
                        type="range"
                        min="0"
                        max="4"
                        value={userWeights[topic.id]}
                        onChange={(e) => onWeightChange(topic.id, parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poco importante</span>
                        <span>Normal</span>
                        <span>Muy importante</span>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-8 text-center">
            <button
                onClick={onNext}
                className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                Ir al Cuestionario
            </button>
        </div>
    </div>
);

const QuestionnaireComponent: React.FC<{
    userAnswers: UserAnswers;
    onAnswerChange: (questionId: string, value: Stance | null) => void;
    onBack?: () => void;
    onComplete?: () => void;
    onRandomFill?: () => void;
    showPartyStances: boolean;
    isReviewMode?: boolean;
    onOpenModal?: (title: string, content: React.ReactNode) => void;
}> = ({ userAnswers, onAnswerChange, onBack, onComplete, onRandomFill, showPartyStances, isReviewMode = false, onOpenModal }) => {
    const totalQuestions = politicalData.topics.flatMap(t => t.questions).length;
    const answeredQuestions = Object.values(userAnswers).filter(a => a !== undefined).length;

    const [expandedTopics, setExpandedTopics] = useState<{[topicId: string]: boolean}>(() => {
        const initialState: {[topicId: string]: boolean} = {};
        if (isReviewMode) {
            politicalData.topics.forEach(t => { initialState[t.id] = true; });
        } else {
             politicalData.topics.forEach(t => { initialState[t.id] = false; });
        }
        return initialState;
    });

    const toggleTopic = (topicId: string) => {
        setExpandedTopics(prev => ({...prev, [topicId]: !prev[topicId]}));
    };

    const isCompletionCriteriaMet = useMemo(() => {
        return politicalData.topics.every(topic => {
            const answeredCountInTopic = topic.questions.filter(q => userAnswers[q.id] !== undefined).length;
            return answeredCountInTopic >= 2;
        });
    }, [userAnswers]);


    return (
        <>
            <div className={`max-w-4xl mx-auto bg-white ${isReviewMode ? 'pt-6' : 'p-8 rounded-xl shadow-lg mt-8 mb-32'}`}>
                {!isReviewMode && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Paso 2: El Cuestionario</h2>
                            {onRandomFill && (
                                <button
                                    onClick={onRandomFill}
                                    className="bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors text-sm"
                                    title="Rellenar aleatoriamente para pruebas"
                                >
                                    Relleno Aleatorio (Test)
                                </button>
                            )}
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-6" role="alert">
                            <p className="font-bold flex items-center gap-2"><InfoIcon className="w-5 h-5"/>Instrucción Importante</p>
                            <p className="mt-1">Para ver los resultados, debes responder al menos <strong>2 preguntas de cada tema</strong>. Puedes expandir y contraer los temas para responder en el orden que prefieras.</p>
                        </div>
                    </>
                )}
                <div className="space-y-4">
                    {politicalData.topics.map(topic => {
                        const answeredInTopic = topic.questions.filter(q => userAnswers[q.id] !== undefined).length;
                        const totalInTopic = topic.questions.length;
                        const isRequirementMet = answeredInTopic >= 2;

                        return (
                            <div key={topic.id} className="p-4 border border-gray-200 rounded-lg">
                                <button onClick={() => toggleTopic(topic.id)} className="w-full flex justify-between items-center text-left py-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <span className="text-indigo-600">{topic.icon}</span>
                                            <div className="text-left flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-gray-700">{topic.title}</h3>
                                                {showPartyStances && onOpenModal && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            onOpenModal(`Análisis del Tema: ${topic.title}`, <p>{topic.description}</p>);
                                                        }}
                                                        className="text-gray-400 hover:text-indigo-600"
                                                        title="Ver análisis del tema"
                                                    >
                                                        <InfoIcon className="w-5 h-5"/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                         <div className={`text-sm font-medium flex items-center gap-2 mt-1 ml-10 ${isRequirementMet ? 'text-green-600' : 'text-gray-500'}`}>
                                            <span>{answeredInTopic} / {totalInTopic} respondidas</span>
                                            {isRequirementMet && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ Requisito cumplido</span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${expandedTopics[topic.id] ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedTopics[topic.id] && (
                                    <div className="space-y-6 mt-4 pt-4 border-t border-gray-200">
                                        {topic.questions.map(q => (
                                            <QuestionComponent 
                                                key={q.id} 
                                                question={q} 
                                                userAnswer={userAnswers[q.id]} 
                                                onAnswerChange={onAnswerChange}
                                                showPartyStances={showPartyStances}
                                                onOpenModal={onOpenModal}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {!isReviewMode && onBack && onComplete &&(
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                    <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
                        <button
                            onClick={onBack}
                            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center">
                            <div className="text-sm font-semibold text-gray-800">{answeredQuestions} de {totalQuestions} respondidas</div>
                            <div className="w-56 h-2 bg-gray-300 rounded-full overflow-hidden mt-1">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                                    style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={onComplete}
                            disabled={!isCompletionCriteriaMet}
                            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2">
                            
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const QuestionComponent: React.FC<{
    question: Question;
    userAnswer: Stance | null | undefined;
    onAnswerChange: (questionId: string, value: Stance | null) => void;
    showPartyStances: boolean;
    onOpenModal?: (title: string, content: React.ReactNode) => void;
}> = ({ question, userAnswer, onAnswerChange, showPartyStances, onOpenModal }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const stances: Stance[] = [-2, -1, 0, 1, 2];
    const labels = ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'];

    return (
        <div className="p-4 rounded-md bg-gray-50">
            <p className="font-semibold text-gray-800">{question.text}</p>
            <div className="flex items-start gap-2 mb-4">
                <p className="text-sm text-gray-600 flex-grow">{question.description}</p>
                {showPartyStances && onOpenModal && (
                    <button
                        onClick={() => onOpenModal(`Objetivo de la pregunta: ${question.text}`, <p>{question.objective}</p>)}
                        className="text-gray-400 hover:text-indigo-600 flex-shrink-0 mt-0.5"
                        title="Ver objetivo de la pregunta"
                    >
                        <InfoIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 space-y-2 sm:space-y-0">
                <span className="text-xs text-red-600 font-medium">{labels[0]}</span>
                <div className="flex items-center space-x-2">
                    {stances.map((stance, index) => (
                        <button
                            key={stance}
                            onClick={() => onAnswerChange(question.id, stance)}
                            className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${userAnswer === stance ? 'bg-indigo-600 ring-2 ring-offset-2 ring-indigo-500' : 'bg-gray-300'}`}
                            title={labels[index]}
                        ></button>
                    ))}
                </div>
                <span className="text-xs text-green-600 font-medium">{labels[4]}</span>
            </div>
            <div className="flex justify-center mt-3">
                 <button 
                    onClick={() => onAnswerChange(question.id, null)}
                    className={`text-sm px-4 py-1 rounded-full transition ${userAnswer === null ? 'bg-yellow-400 text-yellow-900 font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    No sabe / No contesta
                </button>
            </div>

            {showPartyStances && (
                <div className="mt-4">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        Ver postura de los partidos
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {isExpanded && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-2 text-sm">
                            {question.partyStances.map(ps => (
                                 <div key={ps.party} className="flex items-start">
                                    <span className="font-bold w-24 flex-shrink-0" style={{color: politicalData.parties.find(p => p.name === ps.party)?.color || '#000'}}>{ps.party}:</span>
                                    <span className="text-gray-700">{ps.justification}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    const htmlContent = text
        .split('\n')
        .map((line, index, arr) => {
            if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-6 mb-3 text-gray-800">${line.substring(3)}</h2>`;
            if (line.startsWith('### ')) return `<h3 class="text-xl font-semibold mt-4 mb-2 text-gray-700">${line.substring(4)}</h3>`;
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (line.startsWith('- ') || line.startsWith('* ')) {
                const isFirstListItem = index === 0 || (!arr[index - 1].startsWith('- ') && !arr[index - 1].startsWith('* '));
                const isLastListItem = (index === arr.length - 1) || (!arr[index + 1].startsWith('- ') && !arr[index + 1].startsWith('* '));
                const startTag = isFirstListItem ? '<ul class="list-disc pl-5 space-y-1 my-3">' : '';
                const endTag = isLastListItem ? '</ul>' : '';
                return `${startTag}<li>${line.substring(2)}</li>${endTag}`;
            }
            if (line.trim() === '') return '';
            return `<p>${line}</p>`;
        })
        .join('');

    return <div className="mt-4 p-4 bg-gray-50 border rounded-lg max-w-none leading-relaxed text-gray-700 text-left" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const AffinityRankingList: React.FC<{ affinityResults: AffinityResult[] }> = ({ affinityResults }) => {
    const medalColors = ['text-yellow-400', 'text-gray-400', 'text-orange-400'];

    return (
        <div className="space-y-3">
            {affinityResults.map((result, index) => {
                const partyInfo = politicalData.parties.find(p => p.name === result.party);
                const isTop3 = index < 3;

                return (
                    <div
                        key={result.party}
                        className={`p-4 rounded-lg flex items-center gap-4 transition-all ${isTop3 ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}`}
                    >
                        {/* Rank / Trophy */}
                        <div className="flex-shrink-0 w-10 flex items-center justify-center">
                            {isTop3 ? (
                                <TrophyIcon className={`w-8 h-8 ${medalColors[index]}`} />
                            ) : (
                                <span className="text-2xl font-bold text-gray-400">{index + 1}</span>
                            )}
                        </div>
                        
                        {/* Party Logo Circle */}
                        <div 
                            className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white shadow-md"
                            style={{ backgroundColor: partyInfo?.color || '#ccc' }}
                            title={partyInfo?.name}
                        ></div>

                        {/* Party Name and Progress Bar */}
                        <div className="flex-grow">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-lg text-gray-800">{partyInfo?.name}</span>
                                <span className="font-semibold text-lg" style={{ color: partyInfo?.color || '#000' }}>
                                    {result.score.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-4 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${Math.max(result.score, 0)}%`,
                                        backgroundColor: partyInfo?.color || '#8884d8',
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const InfoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                <div className="text-gray-600 space-y-4 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ChatComponent: React.FC<{ politicalData: PoliticalData }> = ({ politicalData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: 'model',
            text: "¡Hola! Soy tu asistente de IA. Puedes preguntarme sobre el panorama político español, temas de actualidad o las posturas específicas de los partidos.\n\nUso la información de esta aplicación como base, pero también mi conocimiento general para darte respuestas más completas.\n\n**Aquí tienes algunas ideas:**\n- *¿Cuál es la situación actual de la ley de vivienda?*\n- *Compara las propuestas económicas del PP y el PSOE para este año.*\n- *¿Qué partidos apoyan la energía nuclear?*"
        }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        const context = politicalData.topics.map(topic => 
            `**Tema: ${topic.title}**\n` +
            topic.partyTopicSummaries?.map(s => `- ${s.party}: ${s.summary}`).join('\n')
        ).join('\n\n');

        const response = await generateChatResponse(userInput, context);
        const newModelMessage: ChatMessage = { sender: 'model', text: response };
        setMessages(prev => [...prev, newModelMessage]);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[70vh] bg-white border border-gray-200 rounded-lg">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                           <MarkdownRenderer text={msg.text} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-xl p-3 rounded-2xl bg-gray-200 text-gray-800">
                           <div className="flex items-center space-x-2">
                               <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                               <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                               <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex items-center gap-3 bg-gray-50">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    disabled={isLoading}
                    className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                    <PaperAirplaneIcon className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};

const ResultsComponent: React.FC<{
    affinityResults: AffinityResult[];
    userAnswers: UserAnswers;
    onAnswerChange: (questionId: string, value: Stance | null) => void;
    userWeights: UserWeights;
    onWeightChange: (topicId: string, value: number) => void;
    answeredQuestions: number;
    totalQuestions: number;
}> = ({ affinityResults, userAnswers, onAnswerChange, userWeights, onWeightChange, answeredQuestions, totalQuestions }) => {
    
    // Main Tab State
    type MainTab = 'principal' | 'ajustes' | 'posturas' | 'ia';
    const [mainResultTab, setMainResultTab] = useState<MainTab>('principal');

    // Sub-Tab States
    type PrincipalSubTab = 'afinidad' | 'brújula' | 'radar';
    const [principalSubTab, setPrincipalSubTab] = useState<PrincipalSubTab>('afinidad');
    
    type AjustesSubTab = 'respuestas' | 'ponderacion';
    const [ajustesSubTab, setAjustesSubTab] = useState<AjustesSubTab>('respuestas');

    type PosturasSubTab = 'tema' | 'partido';
    const [posturasSubTab, setPosturasSubTab] = useState<PosturasSubTab>('tema');
    
    type AnalysisSubTab = 'summary' | 'intention' | 'chat';
    const [analysisTab, setAnalysisTab] = useState<AnalysisSubTab>('summary');
    
    // Other states
    const [selectedPartiesForRadar, setSelectedPartiesForRadar] = useState<Party[]>([affinityResults[0]?.party || Party.PP]);
    const [selectedPartyForIntention, setSelectedPartyForIntention] = useState<Party>(affinityResults[0]?.party || Party.PP);
    const [selectedTopicForSummary, setSelectedTopicForSummary] = useState<string>(politicalData.topics[0].id);
    const [selectedPartyForSummary, setSelectedPartyForSummary] = useState<Party | null>(null);
    const [explanation, setExplanation] = useState('');
    const [intentionAnalysis, setIntentionAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);

    const handleOpenModal = (title: string, content: React.ReactNode) => {
        setModalContent({ title, content });
    };
    
    const infoContent = {
        affinity: {
            title: "Cómo se Calcula tu Afinidad General",
            content: (
                <>
                    <p>Este ranking muestra tu porcentaje de afinidad con cada partido político. La puntuación se calcula de forma ponderada para reflejar qué temas te importan más.</p>
                    <h3 className="text-lg font-semibold mt-4 mb-2">Proceso Detallado:</h3>
                    <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Afinidad por Tema:</strong> Para cada tema, calculamos tu afinidad media (0-100%) con un partido basándonos en las preguntas que has respondido en ese bloque.</li>
                        <li><strong>Ponderación:</strong> Aplicamos la importancia que diste a cada tema (de "poco importante" a "muy importante"). Los temas que marcaste como más importantes tienen un mayor peso en el resultado final.</li>
                        <li><strong>Resultado Final:</strong> La puntuación final es la media ponderada de tus afinidades en todos los temas que has respondido.</li>
                    </ol>
                </>
            )
        },
        compass: {
            title: "Cómo se Construye la Brújula Ideológica",
            content: (
                <>
                    <p>La brújula te sitúa a ti y a los partidos en un mapa ideológico de dos ejes para una comparación visual rápida.</p>
                    <h3 className="text-lg font-semibold mt-4 mb-2">Los Ejes:</h3>
                    <ul className="list-disc list-inside space-y-2">
                         <li><strong>Eje Económico (Izquierda-Derecha):</strong> Mide desde el intervencionismo estatal (más impuestos, regulación) a la izquierda, hasta el liberalismo de mercado (menos impuestos, desregulación) a la derecha. Se basa en tus respuestas sobre Economía, Empleo y Vivienda.</li>
                         <li><strong>Eje Social (Progresista-Conservador):</strong> Mide desde posturas progresistas/libertarias (más derechos sociales, laicismo, plurinacionalidad) arriba, hasta posturas conservadoras/tradicionales (orden, valores tradicionales, centralismo) abajo. Se basa en tus respuestas sobre Políticas Sociales, Modelo Territorial, Educación, etc.</li>
                    </ul>
                     <h3 className="text-lg font-semibold mt-4 mb-2">Tu Posición vs. los Partidos:</h3>
                      <p>Tu punto se calcula dinámicamente como la media de tus respuestas en los temas de cada eje. La posición de los partidos es fija y representa su ubicación general en el espectro político español, basada en un análisis global de sus programas e ideología.</p>
                </>
            )
        },
        radar: {
            title: "Cómo se Construye el Gráfico Radar",
            content: (
                 <p>El gráfico radar te permite comparar tu afinidad con uno o varios partidos en cada uno de los 10 temas del cuestionario. Cada eje del gráfico representa un tema, y la distancia desde el centro indica tu nivel de coincidencia en ese tema específico (de 0 a 100). Es una herramienta útil para ver dónde se encuentran tus mayores puntos de acuerdo y desacuerdo con cada partido.</p>
            )
        },
        stancesByTopic: {
            title: "Qué son las Posturas por Tema",
            content: (
                <p>Esta sección funciona como una enciclopedia de referencia. Para cada tema, puedes ver un resumen consolidado de la visión general y las propuestas de cada partido. Esta información está extraída y sintetizada directamente de las secciones "Visiones Partidistas" del documento de análisis original, ofreciéndote una visión global en lugar del detalle pregunta por pregunta.</p>
            )
        },
        stancesByParty: {
            title: "Qué son las Posturas por Partido",
            content: (
                <p>Esta sección te ofrece un informe completo de la ideología de un partido político en un solo lugar. Al seleccionar un partido, puedes ver su postura consolidada en cada uno de los 10 temas principales, permitiéndote analizar en profundidad su programa y prioridades.</p>
            )
        },
        aiAnalysis: {
            title: "Cómo Funciona el Análisis por IA",
            content: (
                <p>Al pulsar "Generar Explicación", enviamos tus respuestas (de forma anónima) y tus resultados de afinidad a <strong>Gemini, un modelo de IA de Google</strong>. Le pedimos que actúe como un analista político neutral y que redacte un informe personalizado explicando el porqué de tus resultados. La IA no emite opiniones ni recomendaciones, solo analiza los datos proporcionados para darte una visión más clara de tu perfil ideológico.</p>
            )
        },
        aiIntention: {
            title: "Cómo Funciona el Análisis de Intención de Voto",
            content: (
                 <p>Al seleccionar un partido y pulsar "Analizar Voto", enviamos tus respuestas y las posturas de ese partido a <strong>Gemini, un modelo de IA de Google</strong>. La IA compara ambos perfiles y elabora un informe objetivo que destaca los principales puntos de acuerdo y desacuerdo. Es una forma de "verificar" qué tan alineadas están tus opiniones reales con el ideario del partido que consideras votar.</p>
            )
        },
        aiChat: {
            title: "Cómo Funciona el Chat con la IA",
            content: (
                <>
                    <p>Esta es una herramienta de consulta interactiva para explorar el panorama político. Puedes hacer preguntas abiertas sobre temas de actualidad, la ideología de los partidos o cualquier duda que tengas.</p>
                    <p className="mt-2">El asistente de IA, potenciado por <strong>Gemini de Google</strong>, utiliza los datos de esta aplicación como su fuente principal de conocimiento, pero también puede acceder a su conocimiento general y a información fiable y actualizada para ofrecer respuestas más completas y contextualizadas. Su objetivo es actuar como un analista neutral e informado.</p>
                </>
            )
        }
    };


    const handleRadarPartyToggle = (party: Party) => {
        setSelectedPartiesForRadar(prev => {
            const isSelected = prev.includes(party);
            if (isSelected) {
                return prev.filter(p => p !== party);
            } else {
                if (prev.length < 4) { // Limit to 4 parties
                    return [...prev, party];
                }
                return prev;
            }
        });
    };

    const handleGenerateExplanation = async () => {
        setIsLoading(true);
        setExplanation('');
        const result = await generateResultExplanation(affinityResults, userAnswers, userWeights, politicalData);
        setExplanation(result);
        setIsLoading(false);
    };

    const handleGenerateIntentionAnalysis = async () => {
        setIsLoading(true);
        setIntentionAnalysis('');
        const result = await generateVoteIntentionAnalysis(selectedPartyForIntention, userAnswers, userWeights, politicalData);
        setIntentionAnalysis(result);
        setIsLoading(false);
    };
    
    const compassData = useMemo<CompassPoint[]>(() => {
        const partyCoordinates: { [key in Party]?: Point } = {
            [Party.PP]: { x: 5, y: -4 }, [Party.PSOE]: { x: -5, y: 7 }, [Party.VOX]: { x: 7, y: -9 },
            [Party.SUMAR]: { x: -8, y: 9 }, [Party.PODEMOS]: { x: -9, y: 8 }, [Party.ERC]: { x: -6, y: 8 },
            [Party.JUNTS]: { x: 3, y: 0 }, [Party.EH_BILDU]: { x: -7, y: 8 }, [Party.PNV]: { x: 1, y: 2 },
            [Party.BNG]: { x: -7, y: 7 }, [Party.CC]: { x: 2, y: -2 }, [Party.UPN]: { x: 6, y: -5 },
        };
        const calculateUserScore = (axis: 'economic' | 'social'): number => {
            let totalScore = 0;
            let answeredCount = 0;
            politicalData.topics.forEach(topic => {
                topic.questions.forEach(q => {
                    const answer = userAnswers[q.id];
                    const sign = q.ideologicalSign[axis];
                    
                    if (answer !== null && answer !== undefined && sign !== 0) {
                        totalScore += answer * sign;
                        answeredCount++;
                    }
                });
            });
            if (answeredCount === 0) return 0;
            // Scale from avg [-2, 2] to [-10, 10] range
            return (totalScore / answeredCount) * 5; 
        };
        const userEconScore = calculateUserScore('economic');
        const userSocialScore = calculateUserScore('social');
        const userPoint: CompassPoint = { name: 'Tú', coords: { x: userEconScore, y: userSocialScore }, color: '#EF4444', size: 250 };
        const partyPoints: CompassPoint[] = politicalData.parties.filter(p => partyCoordinates[p.name]).map(p => ({ name: p.name, coords: partyCoordinates[p.name]!, color: p.color, size: 100 }));
        return [userPoint, ...partyPoints];
    }, [userAnswers]);

    const radarChartData = useMemo(() => {
        return politicalData.topics.map(topic => {
            const topicAffinities: { [key: string]: string | number } = { topic: topic.title };

            selectedPartiesForRadar.forEach(selectedParty => {
                let topicScore = 0;
                let questionCount = 0;
                topic.questions.forEach(question => {
                    const userAnswer = userAnswers[question.id];
                    const partyStance = question.partyStances.find(ps => ps.party === selectedParty)?.stance;

                    if (userAnswer !== null && userAnswer !== undefined && partyStance !== undefined) {
                        const distance = Math.abs(userAnswer - partyStance);
                        topicScore += (4 - distance) / 4; // Score from 0 to 1
                        questionCount++;
                    }
                });
                const affinity = questionCount > 0 ? (topicScore / questionCount) * 100 : 0;
                topicAffinities[selectedParty] = parseFloat(affinity.toFixed(1));
            });
            return topicAffinities;
        });
    }, [userAnswers, selectedPartiesForRadar]);

    const CompassTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-2 bg-white border rounded shadow-lg">
                    <p className="font-bold" style={{ color: data.color }}>{data.name}</p>
                </div>
            );
        }
        return null;
    };
    
    const PartyLabel = ({ x, y, value }: any) => (
        <text x={x} y={y} dy={-10} fill="#374151" fontSize={10} textAnchor="middle" fontWeight="bold">
            {value}
        </text>
    );

    const userPoint = compassData.find(p => p.name === 'Tú');
    const partyPoints = compassData.filter(p => p.name !== 'Tú');
    
    const renderSubTabs = (tabs: {key: string, label: string}[], activeTab: string, setActiveTab: (key: any) => void) => (
         <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex flex-wrap space-x-8 justify-center" aria-label="Tabs">
                {tabs.map(tab => (
                     <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)} 
                        className={`${activeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
    
    const mainTabs = [
      { key: 'principal', label: 'Panel Principal' },
      { key: 'ajustes', label: 'Ajustes y Respuestas' },
      { key: 'posturas', label: 'Posturas de Partidos' },
      { key: 'ia', label: 'Análisis con IA' },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 mt-8">
             <InfoModal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={modalContent?.title || ''}>
                {modalContent?.content}
            </InfoModal>
            
            <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6">
                {answeredQuestions < totalQuestions && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-4 rounded-r-lg mb-6 flex items-center gap-3" role="alert">
                        <InfoIcon className="w-8 h-8 flex-shrink-0 text-amber-500" />
                        <div>
                             <p>
                                Llevas <strong>{answeredQuestions}/{totalQuestions}</strong> preguntas respondidas. Esto puede hacer que los resultados no sean del todo precisos.
                            </p>
                            <p className="mt-1">
                                Si lo deseas, puedes{' '}
                                <button
                                    onClick={() => {
                                        setMainResultTab('ajustes');
                                        setAjustesSubTab('respuestas');
                                    }}
                                    className="font-bold underline hover:text-amber-900 focus:outline-none"
                                >
                                    seguir completando preguntas
                                </button>
                                {' '}para mejorar el resultado.
                            </p>
                        </div>
                    </div>
                )}
                 <div className="bg-gray-100 p-2 rounded-t-lg">
                    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Main Tabs">
                        {mainTabs.map(tab => (
                             <button 
                                key={tab.key}
                                onClick={() => setMainResultTab(tab.key as MainTab)} 
                                className={`transition-all duration-200 text-base font-medium py-3 px-4 sm:px-6 rounded-md ${mainResultTab === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="pt-6">
                    {mainResultTab === 'principal' && (
                        <div>
                            {renderSubTabs([
                                {key: 'afinidad', label: 'Resultados de Afinidad'},
                                {key: 'brújula', label: 'Brújula Ideológica'},
                                {key: 'radar', label: 'Afinidad por Tema'}
                            ], principalSubTab, setPrincipalSubTab)}

                            {principalSubTab === 'afinidad' && (
                                <div className="py-6">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <h2 className="text-3xl font-bold text-gray-800">Tus Resultados de Afinidad</h2>
                                        <button onClick={() => handleOpenModal(infoContent.affinity.title, infoContent.affinity.content)} className="text-gray-400 hover:text-indigo-600"><InfoIcon className="w-6 h-6"/></button>
                                    </div>
                                    <AffinityRankingList affinityResults={affinityResults} />
                                </div>
                            )}
                            {principalSubTab === 'brújula' && (
                                <div className="py-6"><div className="flex items-center justify-center gap-2"><h3 className="text-xl font-bold text-gray-800">Brújula Ideológica</h3><button onClick={() => handleOpenModal(infoContent.compass.title, infoContent.compass.content)} className="text-gray-400 hover:text-indigo-600"><InfoIcon className="w-5 h-5"/></button></div><p className="text-gray-600 mb-4 text-center">Tu posición (punto destacado) y la de los partidos en el espectro político.</p><div className="h-[450px] w-full"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 20 }}><CartesianGrid /><XAxis type="number" dataKey="coords.x" name="Eje Económico" domain={[-10, 10]} label={{ value: 'Intervencionismo <-> Liberalismo', position: 'insideBottom', offset: -25 }} /><YAxis type="number" dataKey="coords.y" name="Eje Social" domain={[-10, 10]} label={{ value: 'Conservador <-> Progresista', angle: -90, position: 'insideLeft', offset: -10 }} /><ZAxis dataKey="size" range={[100, 400]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CompassTooltip />} /><Scatter name="Partidos" data={partyPoints} shape="circle"><LabelList dataKey="name" content={<PartyLabel />} />{partyPoints.map((p) => <Cell key={`cell-${p.name}`} fill={p.color} />)}</Scatter>{userPoint && <Scatter name="Tú" data={[userPoint]} shape="star" fill={userPoint.color}><LabelList dataKey="name" position="top" style={{fill: userPoint.color, fontWeight: 'bold'}} /></Scatter>}</ScatterChart></ResponsiveContainer></div></div>
                            )}
                            {principalSubTab === 'radar' && (
                                <div className="py-6"><div className="mb-4"><div className="flex items-center justify-center gap-2"><h3 className="text-xl font-bold text-gray-800">Afinidad por Tema (Comparativa)</h3><button onClick={() => handleOpenModal(infoContent.radar.title, infoContent.radar.content)} className="text-gray-400 hover:text-indigo-600"><InfoIcon className="w-5 h-5"/></button></div><div className="flex flex-wrap gap-2 justify-center my-4">{politicalData.parties.map(p => (<button key={p.name} onClick={() => handleRadarPartyToggle(p.name)} className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${selectedPartiesForRadar.includes(p.name) ? 'text-white' : ''}`} style={{ backgroundColor: selectedPartiesForRadar.includes(p.name) ? p.color : 'transparent', borderColor: p.color, color: selectedPartiesForRadar.includes(p.name) ? 'white' : p.color, }}>{p.name}</button>))}</div>{selectedPartiesForRadar.length >= 4 && <p className="text-xs text-yellow-600 mt-2 text-center">Puedes comparar hasta 4 partidos a la vez.</p>}</div><p className="text-gray-600 mb-4 text-center">Tu nivel de coincidencia en cada tema con los partidos seleccionados.</p><div className="h-96 w-full"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}><PolarGrid /><PolarAngleAxis dataKey="topic" /><PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} /><Legend />{selectedPartiesForRadar.map(party => { const partyInfo = politicalData.parties.find(p => p.name === party); return <Radar key={party} name={party} dataKey={party} stroke={partyInfo?.color} fill={partyInfo?.color} fillOpacity={0.2} />; })}<Tooltip /></RadarChart></ResponsiveContainer></div></div>
                            )}
                        </div>
                    )}

                    {mainResultTab === 'ajustes' && (
                        <div>
                            {renderSubTabs([
                                {key: 'respuestas', label: 'Mis Respuestas'},
                                {key: 'ponderacion', label: 'Ponderación de Temas'}
                            ], ajustesSubTab, setAjustesSubTab)}

                            {ajustesSubTab === 'respuestas' && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 mt-6">Revisa y Modifica tus Respuestas</h3>
                                    <p className="text-gray-600 mb-6">Las posturas de los partidos ahora son visibles y todos los gráficos se actualizarán dinámicamente.</p>
                                    <QuestionnaireComponent
                                        userAnswers={userAnswers}
                                        onAnswerChange={onAnswerChange}
                                        showPartyStances={true}
                                        isReviewMode={true}
                                        onOpenModal={handleOpenModal}
                                    />
                                </div>
                            )}
                            {ajustesSubTab === 'ponderacion' && (
                                <div className="py-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Ajusta la Ponderación de Temas</h3>
                                    <p className="text-gray-600 mb-6">Cambia la importancia de cada tema para ver cómo afectan a tus resultados en tiempo real en el Panel Principal.</p>
                                    <div className="space-y-4 max-w-2xl mx-auto">
                                        {politicalData.topics.map(topic => (
                                            <div key={topic.id} className="p-4 border rounded-lg">
                                                <label htmlFor={`res-${topic.id}`} className="flex items-center gap-2 text-md font-semibold text-gray-700 mb-2">
                                                    <span className="text-indigo-600">{topic.icon}</span> {topic.title}
                                                </label>
                                                <input id={`res-${topic.id}`} type="range" min="0" max="4" value={userWeights[topic.id]} onChange={(e) => onWeightChange(topic.id, parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {mainResultTab === 'posturas' && (
                        <div>
                            {renderSubTabs([
                                {key: 'tema', label: 'Posturas por Tema'},
                                {key: 'partido', label: 'Posturas por Partido'}
                            ], posturasSubTab, setPosturasSubTab)}
                            
                            {posturasSubTab === 'tema' && (
                                <div className="py-6">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <h3 className="text-xl font-bold text-gray-800">Posturas por Tema</h3>
                                        <button onClick={() => handleOpenModal(infoContent.stancesByTopic.title, infoContent.stancesByTopic.content)} className="text-gray-400 hover:text-indigo-600"><InfoIcon className="w-5 h-5"/></button>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                                        {politicalData.topics.map(topic => (
                                            <button
                                                key={topic.id}
                                                onClick={() => setSelectedTopicForSummary(topic.id)}
                                                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${selectedTopicForSummary === topic.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                {topic.icon} {topic.title}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                    {politicalData.topics.find(t => t.id === selectedTopicForSummary)?.partyTopicSummaries?.map(summary => {
                                        const partyInfo = politicalData.parties.find(p => p.name === summary.party);
                                        return (
                                            <div key={summary.party} className="p-4 bg-gray-50 rounded-lg border">
                                                <h4 className="font-bold text-lg mb-2" style={{color: partyInfo?.color}}>{summary.party}</h4>
                                                <p className="text-gray-600">{summary.summary}</p>
                                            </div>
                                        )
                                    })}
                                    </div>
                                </div>
                            )}
                            {posturasSubTab === 'partido' && (
                                <div className="py-6">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <h3 className="text-xl font-bold text-gray-800">Posturas por Partido</h3>
                                        <button onClick={() => handleOpenModal(infoContent.stancesByParty.title, infoContent.stancesByParty.content)} className="text-gray-400 hover:text-indigo-600"><InfoIcon className="w-5 h-5"/></button>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                                        {politicalData.parties.map(party => (
                                            <button
                                                key={party.name}
                                                onClick={() => setSelectedPartyForSummary(party.name)}
                                                className={`px-4 py-2 rounded-md font-medium transition-all ${selectedPartyForSummary === party.name ? 'text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                style={{ backgroundColor: selectedPartyForSummary === party.name ? party.color : undefined }}
                                            >
                                                {party.name}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedPartyForSummary && (
                                        <div className="space-y-4 mt-6">
                                        <h3 className="text-2xl font-bold text-center mb-4" style={{color: politicalData.parties.find(p=>p.name === selectedPartyForSummary)?.color}}>Resumen Ideológico de {selectedPartyForSummary}</h3>
                                            {politicalData.topics.map(topic => {
                                                const summary = topic.partyTopicSummaries?.find(s => s.party === selectedPartyForSummary);
                                                if (!summary) return null;
                                                return (
                                                    <div key={topic.id} className="p-4 bg-gray-50 rounded-lg border">
                                                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                                        <span className="text-indigo-600">{topic.icon}</span> 
                                                        <span className="text-indigo-700">{topic.title}</span>
                                                        </h4>
                                                        <p className="text-gray-600">{summary.summary}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {mainResultTab === 'ia' && (
                        <div>
                            {renderSubTabs([
                                {key: 'summary', label: 'Análisis de Resultados'},
                                {key: 'intention', label: 'Intención de Voto'},
                                {key: 'chat', label: 'Pregúntale a la IA'},
                            ], analysisTab, setAnalysisTab)}

                            {analysisTab === 'summary' && (<div className="py-6 text-center"><div className="flex items-center justify-center gap-2"><h3 className="text-xl font-bold mb-4 text-gray-800">Explicación del Resultado</h3><button onClick={() => handleOpenModal(infoContent.aiAnalysis.title, infoContent.aiAnalysis.content)} className="text-gray-400 hover:text-indigo-600 mb-4"><InfoIcon className="w-5 h-5"/></button></div><p className="text-gray-600 mb-4">Pulsa el botón para que una IA analice tus resultados y te ofrezca un resumen detallado del porqué de tu afinidad.</p><button onClick={handleGenerateExplanation} disabled={isLoading} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-gray-400"><SparklesIcon className="w-5 h-5"/>{isLoading && !explanation ? 'Generando...' : 'Generar Explicación'}</button>{isLoading && <div className="mt-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}{explanation && <MarkdownRenderer text={explanation} />}</div>)}
                            {analysisTab === 'intention' && (<div className="py-6 text-center"><div className="flex items-center justify-center gap-2"><h3 className="text-xl font-bold mb-4 text-gray-800">Analiza tu Intención de Voto</h3><button onClick={() => handleOpenModal(infoContent.aiIntention.title, infoContent.aiIntention.content)} className="text-gray-400 hover:text-indigo-600 mb-4"><InfoIcon className="w-5 h-5"/></button></div><p className="text-gray-600 mb-4">Selecciona un partido y la IA te mostrará los puntos de mayor y menor alineamiento entre tus opiniones y su ideario.</p><div className="flex justify-center items-center gap-4 mb-4"><div className="flex flex-wrap justify-center gap-2 max-w-lg">{politicalData.parties.map(p => (<button key={p.name} onClick={() => setSelectedPartyForIntention(p.name)} className={`px-3 py-1 text-sm font-semibold rounded-full border-2 transition ${selectedPartyForIntention === p.name ? 'text-white' : ''}`} style={{ borderColor: p.color, backgroundColor: selectedPartyForIntention === p.name ? p.color : 'transparent', color: selectedPartyForIntention === p.name ? 'white' : p.color }}>{p.name}</button>))}</div></div><button onClick={handleGenerateIntentionAnalysis} disabled={isLoading} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-gray-400"><SparklesIcon className="w-5 h-5"/>{isLoading && !intentionAnalysis ? 'Analizando...' : `Analizar Voto a ${selectedPartyForIntention}`}</button>{isLoading && <div className="mt-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}{intentionAnalysis && <MarkdownRenderer text={intentionAnalysis} />}</div>)}
                            {analysisTab === 'chat' && (<div className="py-6"><div className="flex items-center justify-center gap-2"><h3 className="text-xl font-bold mb-4 text-gray-800">Chatea con la IA</h3><button onClick={() => handleOpenModal(infoContent.aiChat.title, infoContent.aiChat.content)} className="text-gray-400 hover:text-indigo-600 mb-4"><InfoIcon className="w-5 h-5"/></button></div><ChatComponent politicalData={politicalData} /></div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AboutComponent: React.FC = () => (
    <>
        <p><strong>Vota Informado</strong> es una herramienta educativa diseñada para ayudarte a explorar el panorama político español y entender mejor tu propia posición ideológica.</p>
        <h3 className="text-lg font-semibold mt-4 mb-2">¿Cómo funciona?</h3>
        <ol className="list-decimal list-inside space-y-2">
            <li><strong>Pondera los temas:</strong> Primero, nos dices qué áreas políticas te importan más.</li>
            <li><strong>Responde el cuestionario:</strong> Luego, te presentaremos una serie de afirmaciones sobre diversos temas para que muestres tu grado de acuerdo o desacuerdo.</li>
            <li><strong>Descubre tus resultados:</strong> La herramienta cruza tus respuestas con las posturas oficiales de los principales partidos políticos de España para calcular tu porcentaje de afinidad.</li>
        </ol>
        <h3 className="text-lg font-semibold mt-4 mb-2">Fuentes y Metodología</h3>
        <p>Las posturas de los partidos se han extraído y sintetizado a partir de sus programas electorales, declaraciones públicas y actividad parlamentaria reciente. El objetivo es ofrecer una "foto" lo más fiel y actualizada posible de su ideario. Las preguntas han sido diseñadas por analistas para ser polarizantes y capaces de diferenciar las posturas entre los distintos partidos en los ejes ideológicos clave.</p>
        <h3 className="text-lg font-semibold mt-4 mb-2">Importante</h3>
        <p>Esta herramienta no pretende ser un oráculo infalible ni decirte a quién votar. Es un ejercicio de autoconocimiento y educación cívica. Los resultados son una aproximación basada en un modelo y no deben tomarse como una verdad absoluta.</p>
        <h3 className="text-lg font-semibold mt-4 mb-2">Privacidad</h3>
        <p>Tu privacidad es fundamental. Todas tus respuestas se procesan localmente en tu navegador y no se guardan en ningún servidor. Las interacciones con la IA de Gemini son anónimas y no se asocian a tu persona.</p>
    </>
);


const App = () => {
    const [view, setView] = useState<View>('weights');
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [userWeights, setUserWeights] = useState<UserWeights>(() => {
        const initialWeights: UserWeights = {};
        politicalData.topics.forEach(topic => {
            initialWeights[topic.id] = 2; // Default to 'Importante'
        });
        return initialWeights;
    });
    
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    const handleAnswerChange = (questionId: string, value: Stance | null) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleWeightChange = (topicId: string, value: number) => {
        setUserWeights(prev => ({ ...prev, [topicId]: value }));
    };

    const handleRandomFill = () => {
        const randomAnswers: UserAnswers = {};
        politicalData.topics.forEach(topic => {
            topic.questions.forEach(q => {
                const stances: (Stance | null)[] = [-2, -1, 0, 1, 2, null];
                randomAnswers[q.id] = stances[Math.floor(Math.random() * stances.length)];
            });
        });
        setUserAnswers(randomAnswers);
    };

    const affinityResults = useMemo<AffinityResult[]>(() => {
        if (Object.keys(userAnswers).length === 0) return [];

        const results: AffinityResult[] = politicalData.parties.map(party => {
            let totalWeightedAffinity = 0;
            let totalWeightSum = 0;

            politicalData.topics.forEach(topic => {
                const topicWeight = (userWeights[topic.id] ?? 2) + 1;

                let topicAffinitySum = 0;
                let questionsAnsweredInTopic = 0;

                topic.questions.forEach(question => {
                    const userAnswer = userAnswers[question.id];
                    const partyStanceObj = question.partyStances.find(ps => ps.party === party.name);

                    if (userAnswer !== null && userAnswer !== undefined && partyStanceObj) {
                        questionsAnsweredInTopic++;
                        const distance = Math.abs(userAnswer - partyStanceObj.stance);
                        const questionAffinity = (4 - distance) / 4; // 0 to 1
                        topicAffinitySum += questionAffinity;
                    }
                });

                if (questionsAnsweredInTopic > 0) {
                    const avgTopicAffinity = topicAffinitySum / questionsAnsweredInTopic;
                    totalWeightedAffinity += avgTopicAffinity * topicWeight;
                    totalWeightSum += topicWeight;
                }
            });

            const finalScore = totalWeightSum > 0 ? (totalWeightedAffinity / totalWeightSum) * 100 : 0;
            return { party: party.name, score: finalScore };
        });

        return results.sort((a, b) => b.score - a.score);
    }, [userAnswers, userWeights]);
    
    const totalQuestions = politicalData.topics.flatMap(t => t.questions).length;
    const answeredQuestions = Object.values(userAnswers).filter(a => a !== undefined).length;

    const renderContent = () => {
        switch(view) {
            case 'weights':
                return <TopicWeightsComponent 
                            userWeights={userWeights} 
                            onWeightChange={handleWeightChange} 
                            onNext={() => setView('questionnaire')} 
                        />;
            case 'questionnaire':
                return <QuestionnaireComponent 
                            userAnswers={userAnswers} 
                            onAnswerChange={handleAnswerChange}
                            onBack={() => setView('weights')}
                            onComplete={() => {
                                setView('results');
                                window.scrollTo(0,0);
                            }}
                            onRandomFill={handleRandomFill}
                            showPartyStances={false}
                        />;
            case 'results':
                return <ResultsComponent 
                            affinityResults={affinityResults}
                            userAnswers={userAnswers}
                            onAnswerChange={handleAnswerChange}
                            userWeights={userWeights}
                            onWeightChange={handleWeightChange}
                            answeredQuestions={answeredQuestions}
                            totalQuestions={totalQuestions}
                        />
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
             <Header onInfoClick={() => setIsAboutModalOpen(true)} />
             <main>
                {renderContent()}
            </main>
            <InfoModal 
                isOpen={isAboutModalOpen} 
                onClose={() => setIsAboutModalOpen(false)}
                title="Acerca de Vota Informado"
            >
                <AboutComponent />
            </InfoModal>
        </div>
    );
};

export default App;

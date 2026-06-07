import React from 'react';
import { IdeologyAxisId, IdeologyVector, PartyInfo, PoliticalData, Question, Stance, Topic } from '../types';
import { EconomyIcon, GlobeIcon, LeafIcon, ScaleIcon, UsersIcon } from '../components/IconComponents';

type PartySeed = PartyInfo & { ideologyVector: IdeologyVector };
type QuestionSeed = Omit<Question, 'id' | 'partyStances' | 'ideologicalSign'> & {
  axis: IdeologyAxisId;
  direction?: 1 | -1;
};
type TopicSeed = Omit<Topic, 'questions' | 'partyTopicSummaries'> & { questions: QuestionSeed[] };

const axes = [
  { id: 'economic', label: 'Economía', leftLabel: 'Redistribución e inversión pública', rightLabel: 'Mercado y menor fiscalidad' },
  { id: 'social', label: 'Valores sociales', leftLabel: 'Conservador', rightLabel: 'Progresista' },
  { id: 'immigration', label: 'Inmigración', leftLabel: 'Restrictiva', rightLabel: 'Abierta e integradora' },
  { id: 'climate', label: 'Clima y energía', leftLabel: 'Prioridad al coste y energía convencional', rightLabel: 'Transición verde acelerada' },
  { id: 'globalism', label: 'Integración internacional', leftLabel: 'Soberanista', rightLabel: 'Multilateral e integradora' },
];

const stanceFromVector = (party: PartySeed, axis: IdeologyAxisId, direction = 1): Stance => {
  const value = (party.ideologyVector[axis] ?? 0) * direction;
  if (value >= 6) return 2;
  if (value >= 2) return 1;
  if (value <= -6) return -2;
  if (value <= -2) return -1;
  return 0;
};

const summaryFor = (party: PartySeed, topic: TopicSeed) => {
  const positions = topic.questions.map(question => stanceFromVector(party, question.axis, question.direction));
  const average = positions.reduce<number>((sum, value) => sum + value, 0) / positions.length;
  const tendency = average >= 1 ? 'respalda claramente' : average > 0 ? 'tiende a respaldar' : average <= -1 ? 'rechaza claramente' : average < 0 ? 'tiende a rechazar' : 'mantiene una posición intermedia sobre';
  return `${party.family ?? 'Esta formación'} ${tendency} las propuestas principales de este bloque.`;
};

const buildData = (
  code: string,
  name: string,
  politicalSystem: string,
  parties: PartySeed[],
  topics: TopicSeed[],
): PoliticalData => ({
  country: {
    code,
    name,
    defaultLocale: 'es-ES',
    supportedLocales: ['es-ES'],
    politicalSystem,
    status: 'active',
    notes: 'Dataset panorámico inicial. Las posiciones sintetizan programas, familias políticas y comportamiento público reciente.',
  },
  ideologyAxes: axes,
  parties,
  topics: topics.map(topic => ({
    ...topic,
    questions: topic.questions.map((question, questionIndex) => ({
      ...question,
      id: `${code.toLowerCase()}-${topic.id}-q${questionIndex + 1}`,
      ideologicalSign: {
        economic: question.axis === 'economic' ? (question.direction === -1 ? 1 : -1) : 0,
        social: question.axis === 'social' || question.axis === 'immigration' || question.axis === 'climate' || question.axis === 'globalism'
          ? (question.direction === -1 ? -1 : 1)
          : 0,
      },
      partyStances: parties.map(party => ({
        party: party.name,
        stance: stanceFromVector(party, question.axis, question.direction),
        justification: `${party.name} se sitúa en esta posición por su orientación ${party.family ?? 'política'} en el eje de ${question.axis}.`,
      })),
    })),
    partyTopicSummaries: parties.map(party => ({ party: party.name, summary: summaryFor(party, topic) })),
  })),
});

const commonTopics: TopicSeed[] = [
  {
    id: 'economia',
    title: 'Economía y Estado del bienestar',
    icon: React.createElement(EconomyIcon),
    description: 'Contrasta redistribución, servicios públicos y protección laboral con menor fiscalidad, disciplina presupuestaria y soluciones de mercado.',
    questions: [
      { priority: 1, axis: 'economic', direction: -1, text: 'Fiscalidad progresiva', description: 'Se deberían elevar los impuestos a rentas altas y grandes patrimonios para reforzar los servicios públicos.', objective: 'Mide el apoyo a la redistribución fiscal.' },
      { priority: 1, axis: 'economic', direction: -1, text: 'Servicios públicos', description: 'Sanidad, educación y cuidados deberían recibir más inversión pública aunque aumente el gasto.', objective: 'Distingue expansión del Estado del bienestar y contención presupuestaria.' },
      { priority: 2, axis: 'economic', direction: 1, text: 'Flexibilidad empresarial', description: 'Reducir regulación e impuestos a empresas favorece más el crecimiento que nuevas ayudas públicas.', objective: 'Mide la confianza en soluciones de mercado.' },
    ],
  },
  {
    id: 'sociedad',
    title: 'Sociedad, derechos e instituciones',
    icon: React.createElement(ScaleIcon),
    description: 'Recoge el conflicto entre políticas socialmente progresistas y posiciones más conservadoras o centradas en autoridad y tradición.',
    questions: [
      { priority: 1, axis: 'social', text: 'Derechos civiles', description: 'El Estado debería ampliar activamente la protección de derechos LGTBIQ+ y contra la discriminación.', objective: 'Mide progresismo social.' },
      { priority: 2, axis: 'social', direction: -1, text: 'Tradición y autoridad', description: 'Las políticas públicas deberían dar más peso a la tradición, la disciplina y la autoridad.', objective: 'Mide conservadurismo social.' },
      { priority: 3, axis: 'social', text: 'Muerte asistida', description: 'La muerte médicamente asistida debería ser legal bajo garantías estrictas.', objective: 'Distingue posiciones liberales y conservadoras en bioética.' },
    ],
  },
  {
    id: 'inmigracion',
    title: 'Inmigración e identidad',
    icon: React.createElement(UsersIcon),
    description: 'Compara enfoques restrictivos y de control fronterizo con vías de acogida, regularización e integración.',
    questions: [
      { priority: 1, axis: 'immigration', text: 'Vías legales e integración', description: 'Se deberían ampliar las vías legales de migración y los programas de integración.', objective: 'Mide apertura migratoria.' },
      { priority: 1, axis: 'immigration', direction: -1, text: 'Control fronterizo', description: 'El país debería endurecer significativamente el control fronterizo y acelerar expulsiones.', objective: 'Mide apoyo a políticas migratorias restrictivas.' },
      { priority: 2, axis: 'immigration', text: 'Asilo compartido', description: 'La acogida de solicitantes de asilo debería repartirse solidariamente entre territorios europeos.', objective: 'Mide solidaridad y coordinación en asilo.' },
    ],
  },
  {
    id: 'clima',
    title: 'Clima, energía y transporte',
    icon: React.createElement(LeafIcon),
    description: 'Enfrenta una transición ecológica más rápida con enfoques que priorizan coste, seguridad energética y gradualidad.',
    questions: [
      { priority: 1, axis: 'climate', text: 'Transición verde', description: 'La reducción de emisiones debería acelerarse aunque implique costes económicos a corto plazo.', objective: 'Mide prioridad climática.' },
      { priority: 2, axis: 'climate', text: 'Transporte limpio', description: 'Se debería invertir mucho más en transporte público y limitar progresivamente los vehículos más contaminantes.', objective: 'Mide disposición a intervenir para descarbonizar.' },
      { priority: 3, axis: 'climate', direction: -1, text: 'Coste energético', description: 'Se deberían aplazar objetivos climáticos cuando encarezcan notablemente la energía.', objective: 'Mide preferencia por gradualidad frente a ambición climática.' },
    ],
  },
  {
    id: 'europa-mundo',
    title: 'Europa y política internacional',
    icon: React.createElement(GlobeIcon),
    description: 'Contrasta soberanía nacional con mayor integración europea, cooperación multilateral y política exterior común.',
    questions: [
      { priority: 1, axis: 'globalism', text: 'Integración europea', description: 'La Unión Europea debería asumir más competencias comunes en economía, energía y política exterior.', objective: 'Mide apoyo a una integración europea más profunda.' },
      { priority: 2, axis: 'globalism', direction: -1, text: 'Soberanía nacional', description: 'Las decisiones nacionales deberían prevalecer con más frecuencia sobre las normas europeas.', objective: 'Mide soberanismo.' },
      { priority: 3, axis: 'globalism', text: 'Defensa europea', description: 'Europa debería coordinar más su defensa y política exterior.', objective: 'Mide apoyo a la cooperación estratégica europea.' },
    ],
  },
];

export const francePoliticalData = buildData('FR', 'Francia', 'República semipresidencialista con Asamblea Nacional y Senado.', [
  { name: 'La France Insoumise', color: '#D71920', family: 'izquierda populista y ecosocial', ideologyVector: { economic: -9, social: 8, immigration: 7, climate: 8, globalism: 0 } },
  { name: 'Parti Socialiste', color: '#E75480', family: 'socialdemocracia', ideologyVector: { economic: -6, social: 8, immigration: 6, climate: 7, globalism: 8 } },
  { name: 'Les Écologistes', color: '#41A62A', family: 'ecologismo progresista', ideologyVector: { economic: -7, social: 9, immigration: 8, climate: 10, globalism: 8 } },
  { name: 'Renaissance', color: '#F4C542', family: 'centro liberal y europeísta', ideologyVector: { economic: 4, social: 5, immigration: 1, climate: 4, globalism: 10 } },
  { name: 'Les Républicains', color: '#1665A8', family: 'derecha conservadora', ideologyVector: { economic: 7, social: -5, immigration: -7, climate: -2, globalism: 3 } },
  { name: 'Rassemblement National', color: '#172B4D', family: 'derecha nacional-populista', ideologyVector: { economic: 0, social: -8, immigration: -10, climate: -6, globalism: -9 } },
], commonTopics);

export const germanyPoliticalData = buildData('DE', 'Alemania', 'República federal parlamentaria con Bundestag y Bundesrat.', [
  { name: 'Die Linke', color: '#BE3075', family: 'izquierda democrática socialista', ideologyVector: { economic: -10, social: 9, immigration: 9, climate: 8, globalism: 3 } },
  { name: 'Bündnis 90/Die Grünen', color: '#64A12D', family: 'ecologismo progresista', ideologyVector: { economic: -6, social: 10, immigration: 9, climate: 10, globalism: 9 } },
  { name: 'SPD', color: '#E3000F', family: 'socialdemocracia', ideologyVector: { economic: -5, social: 7, immigration: 5, climate: 6, globalism: 8 } },
  { name: 'CDU/CSU', color: '#222222', family: 'democracia cristiana conservadora', ideologyVector: { economic: 6, social: -4, immigration: -6, climate: 0, globalism: 6 } },
  { name: 'FDP', color: '#FFED00', family: 'liberalismo económico', ideologyVector: { economic: 10, social: 6, immigration: 3, climate: -2, globalism: 7 } },
  { name: 'AfD', color: '#009EE0', family: 'derecha nacionalista', ideologyVector: { economic: 5, social: -10, immigration: -10, climate: -10, globalism: -10 } },
  { name: 'BSW', color: '#7A1E48', family: 'izquierda económica y conservadurismo cultural', ideologyVector: { economic: -7, social: -4, immigration: -6, climate: -3, globalism: -7 } },
], commonTopics);

export const ukPoliticalData = buildData('GB', 'Reino Unido', 'Monarquía parlamentaria con Cámara de los Comunes y Cámara de los Lores.', [
  { name: 'Green Party', color: '#6AB023', family: 'ecologismo progresista', ideologyVector: { economic: -9, social: 10, immigration: 9, climate: 10, globalism: 8 } },
  { name: 'Labour Party', color: '#E4003B', family: 'centroizquierda laborista', ideologyVector: { economic: -5, social: 6, immigration: 3, climate: 6, globalism: 5 } },
  { name: 'Liberal Democrats', color: '#FAA61A', family: 'liberalismo social', ideologyVector: { economic: 0, social: 9, immigration: 8, climate: 8, globalism: 10 } },
  { name: 'Scottish National Party', color: '#FDF38E', family: 'nacionalismo escocés progresista', ideologyVector: { economic: -6, social: 9, immigration: 8, climate: 7, globalism: 9 } },
  { name: 'Conservative Party', color: '#0087DC', family: 'derecha conservadora', ideologyVector: { economic: 7, social: -6, immigration: -8, climate: -3, globalism: -5 } },
  { name: 'Reform UK', color: '#12B6CF', family: 'derecha nacional-populista', ideologyVector: { economic: 6, social: -9, immigration: -10, climate: -10, globalism: -10 } },
], commonTopics);

export const euPoliticalData = buildData('EU', 'Elecciones europeas', 'Elecciones al Parlamento Europeo; los partidos nacionales se agrupan en familias políticas europeas.', [
  { name: 'The Left', color: '#B7192D', family: 'izquierda europea', ideologyVector: { economic: -10, social: 9, immigration: 9, climate: 8, globalism: 3 } },
  { name: 'Greens/EFA', color: '#56A400', family: 'ecologismo y regionalismo progresista', ideologyVector: { economic: -7, social: 10, immigration: 10, climate: 10, globalism: 10 } },
  { name: 'S&D', color: '#E91D4D', family: 'socialdemocracia europea', ideologyVector: { economic: -6, social: 8, immigration: 6, climate: 7, globalism: 9 } },
  { name: 'Renew Europe', color: '#F6C343', family: 'liberalismo europeísta', ideologyVector: { economic: 4, social: 8, immigration: 6, climate: 6, globalism: 10 } },
  { name: 'EPP', color: '#3399FF', family: 'centroderecha democristiana', ideologyVector: { economic: 6, social: -3, immigration: -5, climate: 1, globalism: 8 } },
  { name: 'ECR', color: '#0066CC', family: 'derecha conservadora y eurocrítica', ideologyVector: { economic: 6, social: -7, immigration: -8, climate: -6, globalism: -6 } },
  { name: 'Patriots for Europe', color: '#243B73', family: 'derecha nacionalista y soberanista', ideologyVector: { economic: 2, social: -9, immigration: -10, climate: -9, globalism: -10 } },
], commonTopics);

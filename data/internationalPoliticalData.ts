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

type InternationalLocale = 'es' | 'en' | 'fr' | 'de';

const internationalTranslations: Record<Exclude<InternationalLocale, 'es'>, Record<string, string>> = {
  en: {
    'Economía': 'Economy', 'Valores sociales': 'Social values', 'Inmigración': 'Immigration', 'Clima y energía': 'Climate and energy', 'Integración internacional': 'International integration',
    'Redistribución e inversión pública': 'Redistribution and public investment', 'Mercado y menor fiscalidad': 'Markets and lower taxes', 'Conservador': 'Conservative', 'Progresista': 'Progressive',
    'Restrictiva': 'Restrictive', 'Abierta e integradora': 'Open and inclusive', 'Prioridad al coste y energía convencional': 'Priority on cost and conventional energy',
    'Transición verde acelerada': 'Accelerated green transition', 'Soberanista': 'Sovereigntist', 'Multilateral e integradora': 'Multilateral and integrationist',
    'Economía y Estado del bienestar': 'Economy and welfare state', 'Sociedad, derechos e instituciones': 'Society, rights and institutions', 'Inmigración e identidad': 'Immigration and identity',
    'Clima, energía y transporte': 'Climate, energy and transport', 'Europa y política internacional': 'Europe and international policy',
    'Fiscalidad progresiva': 'Progressive taxation', 'Servicios públicos': 'Public services', 'Flexibilidad empresarial': 'Business flexibility',
    'Derechos civiles': 'Civil rights', 'Tradición y autoridad': 'Tradition and authority', 'Muerte asistida': 'Assisted dying',
    'Vías legales e integración': 'Legal pathways and integration', 'Control fronterizo': 'Border control', 'Asilo compartido': 'Shared asylum responsibility',
    'Transición verde': 'Green transition', 'Transporte limpio': 'Clean transport', 'Coste energético': 'Energy costs',
    'Integración europea': 'European integration', 'Soberanía nacional': 'National sovereignty', 'Defensa europea': 'European defence',
    'Francia': 'France', 'Alemania': 'Germany', 'Reino Unido': 'United Kingdom', 'Elecciones europeas': 'European elections',
  },
  fr: {
    'Economía': 'Économie', 'Valores sociales': 'Valeurs sociales', 'Inmigración': 'Immigration', 'Clima y energía': 'Climat et énergie', 'Integración internacional': 'Intégration internationale',
    'Redistribución e inversión pública': 'Redistribution et investissement public', 'Mercado y menor fiscalidad': 'Marché et baisse de la fiscalité', 'Conservador': 'Conservateur', 'Progresista': 'Progressiste',
    'Restrictiva': 'Restrictive', 'Abierta e integradora': 'Ouverte et inclusive', 'Prioridad al coste y energía convencional': 'Priorité au coût et aux énergies conventionnelles',
    'Transición verde acelerada': 'Transition écologique accélérée', 'Soberanista': 'Souverainiste', 'Multilateral e integradora': 'Multilatérale et intégrationniste',
    'Economía y Estado del bienestar': 'Économie et État-providence', 'Sociedad, derechos e instituciones': 'Société, droits et institutions', 'Inmigración e identidad': 'Immigration et identité',
    'Clima, energía y transporte': 'Climat, énergie et transports', 'Europa y política internacional': 'Europe et politique internationale',
    'Fiscalidad progresiva': 'Fiscalité progressive', 'Servicios públicos': 'Services publics', 'Flexibilidad empresarial': 'Flexibilité des entreprises',
    'Derechos civiles': 'Droits civiques', 'Tradición y autoridad': 'Tradition et autorité', 'Muerte asistida': 'Aide médicale à mourir',
    'Vías legales e integración': 'Voies légales et intégration', 'Control fronterizo': 'Contrôle des frontières', 'Asilo compartido': 'Partage de l’accueil des réfugiés',
    'Transición verde': 'Transition écologique', 'Transporte limpio': 'Transports propres', 'Coste energético': 'Coût de l’énergie',
    'Integración europea': 'Intégration européenne', 'Soberanía nacional': 'Souveraineté nationale', 'Defensa europea': 'Défense européenne',
    'Francia': 'France', 'Alemania': 'Allemagne', 'Reino Unido': 'Royaume-Uni', 'Elecciones europeas': 'Élections européennes',
  },
  de: {
    'Economía': 'Wirtschaft', 'Valores sociales': 'Gesellschaftliche Werte', 'Inmigración': 'Einwanderung', 'Clima y energía': 'Klima und Energie', 'Integración internacional': 'Internationale Integration',
    'Redistribución e inversión pública': 'Umverteilung und öffentliche Investitionen', 'Mercado y menor fiscalidad': 'Markt und niedrigere Steuern', 'Conservador': 'Konservativ', 'Progresista': 'Progressiv',
    'Restrictiva': 'Restriktiv', 'Abierta e integradora': 'Offen und integrativ', 'Prioridad al coste y energía convencional': 'Vorrang für Kosten und konventionelle Energie',
    'Transición verde acelerada': 'Beschleunigte grüne Transformation', 'Soberanista': 'Souveränistisch', 'Multilateral e integradora': 'Multilateral und integrationsorientiert',
    'Economía y Estado del bienestar': 'Wirtschaft und Sozialstaat', 'Sociedad, derechos e instituciones': 'Gesellschaft, Rechte und Institutionen', 'Inmigración e identidad': 'Einwanderung und Identität',
    'Clima, energía y transporte': 'Klima, Energie und Verkehr', 'Europa y política internacional': 'Europa und internationale Politik',
    'Fiscalidad progresiva': 'Progressive Besteuerung', 'Servicios públicos': 'Öffentliche Dienste', 'Flexibilidad empresarial': 'Unternehmerische Flexibilität',
    'Derechos civiles': 'Bürgerrechte', 'Tradición y autoridad': 'Tradition und Autorität', 'Muerte asistida': 'Sterbehilfe',
    'Vías legales e integración': 'Legale Wege und Integration', 'Control fronterizo': 'Grenzkontrollen', 'Asilo compartido': 'Gemeinsame Asylverantwortung',
    'Transición verde': 'Grüne Transformation', 'Transporte limpio': 'Sauberer Verkehr', 'Coste energético': 'Energiekosten',
    'Integración europea': 'Europäische Integration', 'Soberanía nacional': 'Nationale Souveränität', 'Defensa europea': 'Europäische Verteidigung',
    'Francia': 'Frankreich', 'Alemania': 'Deutschland', 'Reino Unido': 'Vereinigtes Königreich', 'Elecciones europeas': 'Europawahl',
  },
};

const questionTranslations: Record<Exclude<InternationalLocale, 'es'>, string[][]> = {
  en: [
    ['Taxes on high incomes and large fortunes should be raised to strengthen public services.', 'Healthcare, education and care services should receive more public investment even if spending rises.', 'Reducing regulation and business taxes promotes growth more effectively than new public subsidies.'],
    ['The state should actively expand protections for LGBTQ+ people and against discrimination.', 'Public policy should place greater weight on tradition, discipline and authority.', 'Medically assisted dying should be legal under strict safeguards.'],
    ['Legal migration pathways and integration programmes should be expanded.', 'The country should significantly tighten border controls and speed up removals.', 'The reception of asylum seekers should be shared fairly among European territories.'],
    ['Emissions reductions should be accelerated even if this brings short-term economic costs.', 'Much more should be invested in public transport while the most polluting vehicles are gradually restricted.', 'Climate targets should be postponed when they make energy significantly more expensive.'],
    ['The European Union should assume more shared powers in the economy, energy and foreign policy.', 'National decisions should more often prevail over European rules.', 'Europe should coordinate its defence and foreign policy more closely.'],
  ],
  fr: [
    ['Les impôts sur les hauts revenus et les grandes fortunes devraient augmenter afin de renforcer les services publics.', 'La santé, l’éducation et les services de soins devraient recevoir davantage d’investissements publics, même si les dépenses augmentent.', 'Réduire la réglementation et les impôts des entreprises favorise davantage la croissance que de nouvelles aides publiques.'],
    ['L’État devrait renforcer activement la protection des personnes LGBTQ+ et la lutte contre les discriminations.', 'Les politiques publiques devraient accorder davantage de poids à la tradition, à la discipline et à l’autorité.', 'L’aide médicale à mourir devrait être légale sous de strictes garanties.'],
    ['Les voies légales de migration et les programmes d’intégration devraient être développés.', 'Le pays devrait renforcer nettement les contrôles aux frontières et accélérer les expulsions.', 'L’accueil des demandeurs d’asile devrait être réparti équitablement entre les territoires européens.'],
    ['La réduction des émissions devrait être accélérée, même au prix de coûts économiques à court terme.', 'Il faudrait investir beaucoup plus dans les transports publics et limiter progressivement les véhicules les plus polluants.', 'Les objectifs climatiques devraient être reportés lorsqu’ils renchérissent fortement l’énergie.'],
    ['L’Union européenne devrait exercer davantage de compétences communes en économie, énergie et politique étrangère.', 'Les décisions nationales devraient plus souvent primer sur les règles européennes.', 'L’Europe devrait mieux coordonner sa défense et sa politique étrangère.'],
  ],
  de: [
    ['Steuern auf hohe Einkommen und große Vermögen sollten erhöht werden, um öffentliche Dienste zu stärken.', 'Gesundheit, Bildung und Pflege sollten mehr öffentliche Investitionen erhalten, auch wenn dadurch die Ausgaben steigen.', 'Weniger Regulierung und niedrigere Unternehmenssteuern fördern Wachstum stärker als neue staatliche Hilfen.'],
    ['Der Staat sollte den Schutz von LGBTQ+-Menschen und vor Diskriminierung aktiv ausbauen.', 'Die Politik sollte Tradition, Disziplin und Autorität stärker gewichten.', 'Medizinisch assistiertes Sterben sollte unter strengen Schutzvorkehrungen legal sein.'],
    ['Legale Migrationswege und Integrationsprogramme sollten ausgebaut werden.', 'Das Land sollte Grenzkontrollen deutlich verschärfen und Abschiebungen beschleunigen.', 'Die Aufnahme von Asylsuchenden sollte solidarisch zwischen europäischen Gebieten verteilt werden.'],
    ['Die Emissionssenkung sollte beschleunigt werden, auch wenn kurzfristig wirtschaftliche Kosten entstehen.', 'Es sollte deutlich mehr in den öffentlichen Verkehr investiert und besonders umweltschädliche Fahrzeuge schrittweise eingeschränkt werden.', 'Klimaziele sollten verschoben werden, wenn sie Energie deutlich verteuern.'],
    ['Die Europäische Union sollte mehr gemeinsame Zuständigkeiten in Wirtschaft, Energie und Außenpolitik übernehmen.', 'Nationale Entscheidungen sollten häufiger Vorrang vor europäischen Regeln haben.', 'Europa sollte seine Verteidigung und Außenpolitik enger koordinieren.'],
  ],
};

const localeLanguage = (locale: string): InternationalLocale => {
  if (locale.startsWith('fr')) return 'fr';
  if (locale.startsWith('de')) return 'de';
  if (locale.startsWith('en')) return 'en';
  return 'es';
};

export const localizeInternationalPoliticalData = (data: PoliticalData, locale: string): PoliticalData => {
  const language = localeLanguage(locale);
  if (language === 'es') return data;
  const translate = (value: string) => internationalTranslations[language][value] ?? value;
  const generic = {
    en: { topic: 'This topic compares the main political approaches and trade-offs in this area.', objective: 'Measures the political divide expressed by this proposal.', justification: 'This position reflects the party’s orientation on the relevant political axis.', summary: 'This party’s overall position is derived from its answers to the proposals in this topic.' },
    fr: { topic: 'Ce thème compare les principales approches politiques et leurs arbitrages dans ce domaine.', objective: 'Mesure le clivage politique exprimé par cette proposition.', justification: 'Cette position reflète l’orientation du parti sur l’axe politique concerné.', summary: 'La position générale de ce parti découle de ses réponses aux propositions de ce thème.' },
    de: { topic: 'Dieses Thema vergleicht die wichtigsten politischen Ansätze und Zielkonflikte in diesem Bereich.', objective: 'Misst die politische Trennlinie, die dieser Vorschlag ausdrückt.', justification: 'Diese Position spiegelt die Ausrichtung der Partei auf der jeweiligen politischen Achse wider.', summary: 'Die Gesamtposition dieser Partei ergibt sich aus ihren Antworten auf die Vorschläge dieses Themas.' },
  }[language];

  return {
    ...data,
    country: data.country ? { ...data.country, name: translate(data.country.name), defaultLocale: locale } : undefined,
    ideologyAxes: data.ideologyAxes?.map(axis => ({ ...axis, label: translate(axis.label), leftLabel: translate(axis.leftLabel), rightLabel: translate(axis.rightLabel) })),
    topics: data.topics.map((topic, topicIndex) => ({
      ...topic,
      title: translate(topic.title),
      description: generic.topic,
      questions: topic.questions.map((question, questionIndex) => ({
        ...question,
        text: translate(question.text),
        description: questionTranslations[language][topicIndex]?.[questionIndex] ?? question.description,
        objective: generic.objective,
        partyStances: question.partyStances.map(stance => ({ ...stance, justification: generic.justification })),
      })),
      partyTopicSummaries: topic.partyTopicSummaries?.map(summary => ({ ...summary, summary: generic.summary })),
    })),
  };
};

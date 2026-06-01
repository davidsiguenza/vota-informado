import React from 'react';

export const Party = {
  PP: 'PP',
  PSOE: 'PSOE',
  VOX: 'Vox',
  SUMAR: 'Sumar',
  PODEMOS: 'Podemos',
  ERC: 'ERC',
  JUNTS: 'Junts',
  EH_BILDU: 'EH Bildu',
  PNV: 'PNV',
  BNG: 'BNG',
  CC: 'CC',
  UPN: 'UPN',
} as const;

// String union widened on purpose: Spain keeps the convenient Party.PP syntax,
// while future countries can add parties without touching core app types.
export type Party = (typeof Party)[keyof typeof Party] | string;

export type CountryCode = 'ES' | 'US' | string;
export type LocaleCode = `${string}-${string}` | string;

export type IdeologyAxisId =
  | 'economic'
  | 'social'
  | 'territorial'
  | 'immigration'
  | 'climate'
  | 'globalism'
  | 'security'
  | 'institutionalTrust'
  | string;

export interface IdeologyAxis {
  id: IdeologyAxisId;
  label: string;
  leftLabel: string;
  rightLabel: string;
  description?: string;
}

export type IdeologyVector = Partial<Record<IdeologyAxisId, number>>; // -10..10

export interface PartyInfo {
  name: Party;
  color: string;
  id?: string;
  countryCode?: CountryCode;
  family?: string;
  ideologyVector?: IdeologyVector;
  similarTo?: CrossCountryPartySimilarity[];
}

export interface CrossCountryPartySimilarity {
  countryCode: CountryCode;
  party: Party;
  score: number; // 0..100, approximate ideological similarity
  rationale?: string;
}

export type Stance = -2 | -1 | 0 | 1 | 2; // -2: Totally Disagree, 2: Totally Agree

export interface PartyStance {
  party: Party;
  stance: Stance;
  justification: string;
}

export interface IdeologicalSign {
  economic: -1 | 0 | 1;
  social: -1 | 0 | 1;
}

export type QuestionPriority = 1 | 2 | 3; // 1: quick mode, 2: recommended, 3: deep dive

export interface Question {
  id: string;
  text: string;
  description: string; // The statement the user and parties are ranked against
  objective: string; // The reasoning behind why this question is asked
  priority?: QuestionPriority;
  partyStances: PartyStance[];
  ideologicalSign: IdeologicalSign;
}

export interface PartyTopicSummary {
  party: Party;
  summary: string;
}

export interface Topic {
  id:string;
  title: string;
  icon: React.ReactNode;
  description: string; // The overall analysis of the topic's conflict axis
  questions: Question[];
  partyTopicSummaries?: PartyTopicSummary[];
}

export interface PoliticalData {
  country?: CountryConfig;
  ideologyAxes?: IdeologyAxis[];
  topics: Topic[];
  parties: PartyInfo[];
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  politicalSystem: string;
  status: 'active' | 'planned' | 'draft';
  notes?: string;
}

export interface CountryRegistryItem extends CountryConfig {
  displayName: Record<LocaleCode, string>;
}

export interface UserAnswers {
  [questionId: string]: Stance | null | undefined; 
}

export interface UserWeights {
  [topicId: string]: number; // e.g., 0 to 4 for 5 levels
}

export interface AffinityResult {
  party: Party;
  score: number;
}

// For Per-Topic Radar Chart
export interface TopicAffinity {
  topic: string;
  affinity: number; // Score from 0-100
}

export interface PartyAffinityDetails {
  party: Party;
  topicAffinities: TopicAffinity[];
}

// For Ideological Compass
export interface Point {
  x: number;
  y: number;
}

export interface CompassPoint {
  name: Party | 'Tú';
  coords: Point;
  color: string;
  size: number;
}

export interface ChatMessage {
  sender: 'user' | 'model';
  text: string;
}

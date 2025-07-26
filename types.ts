import React from 'react';

export enum Party {
  PP = 'PP',
  PSOE = 'PSOE',
  VOX = 'Vox',
  SUMAR = 'Sumar',
  PODEMOS = 'Podemos',
  ERC = 'ERC',
  JUNTS = 'Junts',
  EH_BILDU = 'EH Bildu',
  PNV = 'PNV',
  BNG = 'BNG',
  CC = 'CC',
  UPN = 'UPN',
}

export interface PartyInfo {
  name: Party;
  color: string;
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

export interface Question {
  id: string;
  text: string;
  description: string; // The statement the user and parties are ranked against
  objective: string; // The reasoning behind why this question is asked
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
  topics: Topic[];
  parties: PartyInfo[];
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

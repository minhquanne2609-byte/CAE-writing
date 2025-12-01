
export type TaskType = 'Essay' | 'Letter/Email' | 'Proposal' | 'Report' | 'Review';

export type SubscaleType = 'Content' | 'Communicative Achievement' | 'Organisation' | 'Language';

export interface Descriptor {
  band: number;
  summary: string;
  details: string[];
}

export interface SubscaleDefinition {
  name: SubscaleType;
  description: string;
  descriptors: Descriptor[];
}

export interface ScoreState {
  content: number;
  communicative: number;
  organisation: number;
  language: number;
}

export interface GeneratedTask {
  id: string;        // Unique ID for history
  timestamp: number; // For sorting
  type: TaskType;    // To restore the correct mode
  context: string;
  question: string;
  points: string[];
  opinions?: string[];
  instructions: string;
}

export interface FeedbackDetail {
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface AssessmentFeedback {
  content: FeedbackDetail;
  communicative: FeedbackDetail;
  organisation: FeedbackDetail;
  language: FeedbackDetail;
  general: string;
}

export interface ImprovedResponse {
  rewrittenText: string;
  keyChanges: string[];
}

export interface HistoryEntry {
  id: number;
  timestamp: Date;
  taskType: TaskType;
  generatedTask: GeneratedTask | null;
  studentText: string;
  scores: ScoreState;
  feedback: AssessmentFeedback;
  wordCount: number;
}

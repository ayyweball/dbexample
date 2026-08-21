export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptime_seconds: number;
  database: {
    connected: boolean;
    error?: string;
  };
  environment: string;
}

export interface Student {
  student_id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Question {
  question_id: number;
  subject: string;
  topic: string;
  question_text: string;
  correct_answer: string;
  difficulty: Difficulty;
  created_at: string;
}

export interface SubjectTopic {
  subject: string;
  topics: string[];
}

export interface Attempt {
  attempt_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  question_id: number;
  subject: string;
  topic: string;
  question_text: string;
  correct_answer: string;
  difficulty: Difficulty;
  answer: string;
  reasoning: string | null;
  is_correct: boolean;
  hesitation_seconds: number | null;
  revision_count: number;
  timestamp: string;
  ai_analysis?: AiAnalysis;
}

export interface Misconception {
  misconception_id: number;
  attempt_id: number;
  type: string;
  description: string | null;
  confidence: number;
  skill_area: string | null;
  student_id?: number;
  student_name?: string;
  question_id?: number;
  subject?: string;
  topic?: string;
  question_text?: string;
  attempt_timestamp?: string;
  student_answer?: string;
  student_reasoning?: string;
  follow_up_questions?: FollowUpQuestion[];
}

export interface FollowUpQuestion {
  followup_id: number;
  misconception_id: number;
  question_text: string;
  expected_concept: string | null;
  difficulty: Difficulty | string;
  misconception_type?: string;
  skill_area?: string;
  attempts?: FollowUpAttempt[];
}

export interface FollowUpAttempt {
  followup_attempt_id: number;
  followup_id: number;
  followup_question_text?: string;
  expected_concept?: string;
  attempt_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  answer: string;
  reasoning: string | null;
  is_correct: boolean | null;
  timestamp: string;
}

export interface AiAnalysis {
  available?: boolean;
  analyzed: boolean;
  model?: string;
  has_misconception: boolean;
  misconception: {
    misconception_id?: number;
    attempt_id?: number;
    type: string;
    description: string | null;
    confidence: number;
    skill_area: string | null;
  } | null;
  follow_up: {
    followup_id?: number;
    misconception_id?: number;
    question_text: string;
    expected_concept: string | null;
    difficulty: Difficulty | string;
  } | null;
  message?: string;
}

export interface CreateAttemptPayload {
  student_id: number;
  question_id: number;
  answer: string;
  reasoning?: string;
  is_correct?: boolean;
  hesitation_seconds?: number;
  revision_count?: number;
}

export interface CreateFollowUpAttemptPayload {
  followup_id: number;
  attempt_id: number;
  student_id: number;
  answer: string;
  reasoning?: string;
  is_correct?: boolean;
}

export interface StudentSummary {
  student: Student;
  overview: {
    total_attempts: number;
    correct_attempts: number;
    accuracy_percentage: number;
    avg_hesitation_seconds: number | null;
    avg_revisions: number;
  };
  subject_breakdown: {
    subject: string;
    total_attempts: number;
    correct_attempts: number;
  }[];
  top_misconceptions: {
    type: string;
    skill_area: string;
    count: number;
  }[];
}

export interface StatsOverview {
  totals: {
    students: number;
    questions: number;
    attempts: number;
    correct_attempts: number;
    accuracy_percentage: number;
    avg_hesitation_seconds: number | null;
    avg_revisions: number;
    misconceptions: number;
    followup_questions: number;
    followup_attempts: number;
    followup_accuracy_percentage: number;
  };
  questions_by_subject: {
    subject: string;
    count: number;
  }[];
  top_misconceptions: {
    type: string;
    skill_area: string;
    count: number;
    avg_confidence: number | null;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  message?: string;
  data: T;
  error?: string;
  details?: string;
}

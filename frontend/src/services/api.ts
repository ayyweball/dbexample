import {
  ApiResponse,
  HealthResponse,
  Student,
  StudentSummary,
  Question,
  SubjectTopic,
  Attempt,
  CreateAttemptPayload,
  Misconception,
  FollowUpQuestion,
  FollowUpAttempt,
  CreateFollowUpAttemptPayload,
  StatsOverview,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request helper with robust error handling
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.message || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error: any) {
    console.error(`[API Error] Request to ${url} failed:`, error.message);
    throw error;
  }
}

export const api = {
  // Health
  getHealth: async (): Promise<HealthResponse> => {
    return fetchApi<HealthResponse>('/health');
  },

  // Overview Stats
  getStatsOverview: async (): Promise<ApiResponse<StatsOverview>> => {
    return fetchApi<ApiResponse<StatsOverview>>('/stats/overview');
  },

  // Students
  getStudents: async (search?: string): Promise<ApiResponse<Student[]>> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi<ApiResponse<Student[]>>(`/students${query}`);
  },

  getStudent: async (id: number): Promise<ApiResponse<Student>> => {
    return fetchApi<ApiResponse<Student>>(`/students/${id}`);
  },

  getStudentSummary: async (id: number): Promise<ApiResponse<StudentSummary>> => {
    return fetchApi<ApiResponse<StudentSummary>>(`/students/${id}/summary`);
  },

  getStudentAttempts: async (id: number): Promise<ApiResponse<Attempt[]> & { student: Student }> => {
    return fetchApi<ApiResponse<Attempt[]> & { student: Student }>(`/students/${id}/attempts`);
  },

  getStudentMisconceptions: async (id: number): Promise<ApiResponse<Misconception[]> & { student: Student }> => {
    return fetchApi<ApiResponse<Misconception[]> & { student: Student }>(`/students/${id}/misconceptions`);
  },

  createStudent: async (payload: { name: string; email: string }): Promise<ApiResponse<Student>> => {
    return fetchApi<ApiResponse<Student>>('/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Questions
  getQuestions: async (filters?: {
    subject?: string;
    topic?: string;
    difficulty?: string;
    search?: string;
  }): Promise<ApiResponse<Question[]>> => {
    const params = new URLSearchParams();
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.topic) params.append('topic', filters.topic);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ApiResponse<Question[]>>(`/questions${query}`);
  },

  getSubjectsAndTopics: async (): Promise<ApiResponse<SubjectTopic[]>> => {
    return fetchApi<ApiResponse<SubjectTopic[]>>('/questions/meta/subjects');
  },

  getQuestion: async (id: number): Promise<ApiResponse<Question>> => {
    return fetchApi<ApiResponse<Question>>(`/questions/${id}`);
  },

  createQuestion: async (payload: Omit<Question, 'question_id' | 'created_at'>): Promise<ApiResponse<Question>> => {
    return fetchApi<ApiResponse<Question>>('/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Attempts
  getAttempts: async (filters?: {
    student_id?: number;
    question_id?: number;
    is_correct?: boolean;
    limit?: number;
  }): Promise<ApiResponse<Attempt[]>> => {
    const params = new URLSearchParams();
    if (filters?.student_id) params.append('student_id', String(filters.student_id));
    if (filters?.question_id) params.append('question_id', String(filters.question_id));
    if (filters?.is_correct !== undefined) params.append('is_correct', String(filters.is_correct));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ApiResponse<Attempt[]>>(`/attempts${query}`);
  },

  getAttempt: async (id: number): Promise<ApiResponse<Attempt & { misconceptions: Misconception[]; follow_up_attempts: FollowUpAttempt[] }>> => {
    return fetchApi<ApiResponse<Attempt & { misconceptions: Misconception[]; follow_up_attempts: FollowUpAttempt[] }>>(`/attempts/${id}`);
  },

  createAttempt: async (payload: CreateAttemptPayload): Promise<ApiResponse<Attempt>> => {
    return fetchApi<ApiResponse<Attempt>>('/attempts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Misconceptions
  getMisconceptions: async (filters?: {
    attempt_id?: number;
    student_id?: number;
    type?: string;
    skill_area?: string;
  }): Promise<ApiResponse<Misconception[]>> => {
    const params = new URLSearchParams();
    if (filters?.attempt_id) params.append('attempt_id', String(filters.attempt_id));
    if (filters?.student_id) params.append('student_id', String(filters.student_id));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.skill_area) params.append('skill_area', filters.skill_area);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ApiResponse<Misconception[]>>(`/misconceptions${query}`);
  },

  getMisconception: async (id: number): Promise<ApiResponse<Misconception>> => {
    return fetchApi<ApiResponse<Misconception>>(`/misconceptions/${id}`);
  },

  // Follow-Up Questions
  getFollowUpQuestions: async (filters?: {
    misconception_id?: number;
    difficulty?: string;
  }): Promise<ApiResponse<FollowUpQuestion[]>> => {
    const params = new URLSearchParams();
    if (filters?.misconception_id) params.append('misconception_id', String(filters.misconception_id));
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ApiResponse<FollowUpQuestion[]>>(`/followup-questions${query}`);
  },

  getFollowUpQuestion: async (id: number): Promise<ApiResponse<FollowUpQuestion>> => {
    return fetchApi<ApiResponse<FollowUpQuestion>>(`/followup-questions/${id}`);
  },

  // Follow-Up Attempts
  getFollowUpAttempts: async (filters?: {
    student_id?: number;
    followup_id?: number;
    attempt_id?: number;
    is_correct?: boolean;
  }): Promise<ApiResponse<FollowUpAttempt[]>> => {
    const params = new URLSearchParams();
    if (filters?.student_id) params.append('student_id', String(filters.student_id));
    if (filters?.followup_id) params.append('followup_id', String(filters.followup_id));
    if (filters?.attempt_id) params.append('attempt_id', String(filters.attempt_id));
    if (filters?.is_correct !== undefined) params.append('is_correct', String(filters.is_correct));
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ApiResponse<FollowUpAttempt[]>>(`/followup-attempts${query}`);
  },

  createFollowUpAttempt: async (payload: CreateFollowUpAttemptPayload): Promise<ApiResponse<FollowUpAttempt>> => {
    return fetchApi<ApiResponse<FollowUpAttempt>>('/followup-attempts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

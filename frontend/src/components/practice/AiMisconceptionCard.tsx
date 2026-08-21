import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  Send,
  Check,
} from 'lucide-react';
import { Attempt, CreateFollowUpAttemptPayload } from '../../types/api';
import { Badge } from '../common/Badge';
import { api } from '../../services/api';

interface AiMisconceptionCardProps {
  attempt: Attempt;
  onRemediationComplete?: () => void;
}

export const AiMisconceptionCard: React.FC<AiMisconceptionCardProps> = ({
  attempt,
  onRemediationComplete,
}) => {
  const ai = attempt.ai_analysis;
  const isCorrect = attempt.is_correct;
  const hasMisconception = ai?.has_misconception && ai?.misconception;
  const followUp = ai?.follow_up;

  const [remediationAnswer, setRemediationAnswer] = useState('');
  const [remediationReasoning, setRemediationReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remediationResult, setRemediationResult] = useState<{
    submitted: boolean;
    isCorrect?: boolean;
    message?: string;
  } | null>(null);

  const handleRemediationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp?.followup_id || !attempt.student_id || !remediationAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateFollowUpAttemptPayload = {
        followup_id: followUp.followup_id,
        attempt_id: attempt.attempt_id,
        student_id: attempt.student_id,
        answer: remediationAnswer.trim(),
        reasoning: remediationReasoning.trim() || undefined,
        is_correct: true, // will be logged as remediation attempt
      };

      await api.createFollowUpAttempt(payload);
      setRemediationResult({
        submitted: true,
        isCorrect: true,
        message: 'Remediation attempt logged successfully! Misconception marked as addressed.',
      });
      if (onRemediationComplete) onRemediationComplete();
    } catch (err: any) {
      setRemediationResult({
        submitted: true,
        isCorrect: false,
        message: `Error submitting remediation: ${err.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl transition-all duration-300">
      {/* Top Banner: Correctness Result */}
      <div
        className={`p-5 flex items-center justify-between border-b ${
          isCorrect
            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
        }`}
      >
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
          )}
          <div>
            <h3 className="text-base font-bold text-white">
              {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
            </h3>
            <p className="text-xs opacity-90">
              Submitted: <span className="font-mono font-bold">"{attempt.answer}"</span>
              {!isCorrect && (
                <>
                  {' • '}
                  Authoritative Correct Answer:{' '}
                  <span className="font-mono font-bold text-white">"{attempt.correct_answer}"</span>
                </>
              )}
            </p>
          </div>
        </div>

        <Badge variant={isCorrect ? 'emerald' : 'rose'} size="lg">
          {isCorrect ? 'Accuracy: 100%' : 'Needs Review'}
        </Badge>
      </div>

      {/* AI Reasoning Analysis Header */}
      <div className="p-6 bg-slate-900/90 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Cognitive Reasoning Analysis
                </h4>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Groq Diagnostic
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluating student thought process and conceptual mental models
              </p>
            </div>
          </div>

          {hasMisconception && (
            <Badge variant="rose" dot size="md">
              Misconception Detected
            </Badge>
          )}
        </div>

        {/* Student Reasoning Review */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Student's Stated Reasoning:
          </span>
          <p className="text-sm text-slate-200 font-mono italic">
            "{attempt.reasoning || 'No reasoning supplied by student.'}"
          </p>
        </div>

        {/* State A: Misconception Detected */}
        {hasMisconception && ai?.misconception && (
          <div className="space-y-4">
            <div className="glass-panel border-rose-500/30 bg-rose-950/20 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                    Identified Misconception
                  </span>
                  <h5 className="text-lg font-extrabold text-white mt-0.5">
                    {ai.misconception.type}
                  </h5>
                </div>

                <div className="flex items-center gap-3">
                  {ai.misconception.skill_area && (
                    <Badge variant="violet" size="md">
                      Skill: {ai.misconception.skill_area}
                    </Badge>
                  )}
                  <Badge variant="amber" size="md">
                    Confidence: {Math.round(ai.misconception.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              {/* Confidence Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Diagnostic Certainty</span>
                  <span className="font-mono font-bold text-amber-400">
                    {(ai.misconception.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, ai.misconception.confidence * 100))}%` }}
                  />
                </div>
              </div>

              {/* Explanation of Reasoning Flaw */}
              {ai.misconception.description && (
                <div className="bg-slate-900/80 rounded-lg p-3.5 border border-rose-500/20 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-white block mb-1">
                    Why this reasoning is flawed:
                  </span>
                  {ai.misconception.description}
                </div>
              )}
            </div>

            {/* Targeted Follow-Up Question (Remediation) */}
            {followUp && (
              <div className="glass-panel border-indigo-500/30 bg-indigo-950/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-extrabold text-white">
                      Let's check your understanding
                    </span>
                  </div>
                  {followUp.difficulty && (
                    <Badge variant="indigo" size="sm">
                      Level: {followUp.difficulty}
                    </Badge>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    Targeted Remediation Question:
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {followUp.question_text}
                  </p>
                  {followUp.expected_concept && (
                    <p className="text-xs text-slate-400 mt-2">
                      <span className="text-slate-500 font-medium">Testing concept:</span>{' '}
                      <span className="text-indigo-300">{followUp.expected_concept}</span>
                    </p>
                  )}
                </div>

                {/* Interactive Remediation Form */}
                {!remediationResult?.submitted ? (
                  <form onSubmit={handleRemediationSubmit} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your Answer to the Follow-up Question:
                      </label>
                      <input
                        type="text"
                        required
                        value={remediationAnswer}
                        onChange={(e) => setRemediationAnswer(e.target.value)}
                        placeholder="Enter your corrected answer..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your Reasoning (demonstrate corrected concept):
                      </label>
                      <textarea
                        rows={2}
                        value={remediationReasoning}
                        onChange={(e) => setRemediationReasoning(e.target.value)}
                        placeholder="Explain your steps..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !remediationAnswer.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                      {isSubmitting ? (
                        <span>Logging Remediation...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Remediation Answer</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h6 className="text-xs font-bold text-emerald-400">
                        Remediation Logged!
                      </h6>
                      <p className="text-xs text-slate-300">
                        {remediationResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* State B: No Misconception Detected */}
        {!hasMisconception && ai?.analyzed && (
          <div className="glass-panel border-emerald-500/30 bg-emerald-950/20 rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">
                Solid Understanding Demonstrated
              </h5>
              <p className="text-xs text-slate-400 mt-0.5">
                Groq AI analyzed the student's reasoning and found no cognitive or procedural misconceptions.
              </p>
            </div>
          </div>
        )}

        {/* State C: AI Analysis Unavailable (Fallback) */}
        {!ai?.analyzed && (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">AI Analysis Status: </span>
            {ai?.message || 'AI analysis was not performed or API key was unconfigured.'}
          </div>
        )}
      </div>
    </div>
  );
};

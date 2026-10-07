"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import { Mic, MicOff, Video, VideoOff, Volume2, Settings, PhoneOff, User, Send, Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Message {
  type: "ai" | "user";
  text: string;
  topic?: string;
}

export default function LiveInterviewRoom({ params }: PageProps) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  // UI mock states
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!loading && !completed) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading, completed]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const initInterview = async () => {
      try {
        const response = await api.post(`/api/interviews/${interviewId}/start/`);
        setCurrentQuestionId(response.data.question_id);
        setConversation([
          {
            type: "ai",
            text: response.data.question,
            topic: response.data.topic,
          },
        ]);
        
        // Mock AI speaking when new question arrives
        setIsAiSpeaking(true);
        setTimeout(() => setIsAiSpeaking(false), 4000);
      } catch (err: unknown) {
        console.error("Failed to start question generation:", err);
        const detail = (err as any).response?.data?.detail || "";
        if (detail.includes("quota") || detail.includes("RESOURCE_EXHAUSTED") || detail.includes("429")) {
          setQuotaExhausted(true);
        }
      } finally {
        setLoading(false);
      }
    };

    initInterview();
  }, [interviewId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim() || !currentQuestionId || submitting) return;

    const answerText = typedAnswer.trim();
    setTypedAnswer("");
    setSubmitting(true);
    setIsUserSpeaking(false);
    setIsAiSpeaking(false);

    // Optimistically append user message
    setConversation((prev) => [...prev, { type: "user", text: answerText }]);

    try {
      const response = await api.post(`/api/interviews/${interviewId}/submit-answer/`, {
        question_id: currentQuestionId,
        answer: answerText,
      });

      const data = response.data;

      if (data.completed) {
        setCompleted(true);
        setConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: data.message || "Thank you. Your interview is complete!",
          },
        ]);
      } else {
        setCurrentQuestionId(data.next_question.question_id);
        setConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: data.next_question.question,
            topic: data.next_question.topic,
          },
        ]);
        setIsAiSpeaking(true);
        setTimeout(() => setIsAiSpeaking(false), 4000);
      }
    } catch (err: unknown) {
      console.error("Failed to submit answer:", err);
      const detail = (err as any).response?.data?.detail || "";
      if (detail.includes("quota") || detail.includes("RESOURCE_EXHAUSTED") || detail.includes("429")) {
        setQuotaExhausted(true);
      } else {
        alert(detail || "Failed to submit your response.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentAiMessage = [...conversation].reverse().find(msg => msg.type === "ai");
  
  const getStatusText = () => {
    if (completed) return "Completed";
    if (submitting) return "Thinking...";
    if (isAiSpeaking) return "AI Speaking";
    if (isUserSpeaking) return "Listening";
    return "LIVE";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="flex flex-col items-center gap-3">
           <Loader2 className="animate-spin text-brand-600" size={32} />
           <p className="text-lg font-medium">Connecting to interview room...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-paper text-ink overflow-hidden font-sans">
      
      {/* Top Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-4 sm:px-6 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">MockInterview</h1>
          <div className="hidden sm:flex items-center gap-2 border-l border-line pl-4">
            <span className="text-sm font-medium">Software Engineer Interview</span>
            <span className="rounded-full bg-surface border border-line px-2.5 py-0.5 text-xs font-medium text-ink-muted shadow-sm">
              Session #{interviewId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <span className={`h-2.5 w-2.5 rounded-full ${completed ? 'bg-ink-muted' : 'bg-red-500 animate-pulse'}`}></span>
             <span className="text-sm font-semibold tracking-wide text-ink-muted">
                {getStatusText()}
             </span>
          </div>
          <div className="text-sm font-mono font-medium tracking-widest bg-paper border border-line px-3 py-1 rounded-md">
            {formatTime(timerSeconds)}
          </div>
        </div>
      </header>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden relative">
        <div className="mx-auto w-full max-w-6xl flex-1 relative flex flex-col rounded-3xl bg-neutral-900 shadow-raised overflow-hidden">
          
          {/* AI Interviewer Background */}
          {/* TODO: Replace this placeholder with the final AI-generated human interviewer image */}
          <div className="absolute inset-0 bg-neutral-800">
             <div 
                className={`absolute inset-0 bg-[url('/images/ai-interviewer-placeholder.jpg')] bg-cover bg-center transition-all duration-700
                   ${isAiSpeaking ? 'scale-[1.02] brightness-110' : 'scale-100 brightness-100'}`}
             >
                {/* Fallback if image doesn't exist */}
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm -z-10">
                   <User className="text-white/20 w-48 h-48" />
                </div>
             </div>
             
             {/* Subtle overlay gradient for text legibility */}
             <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/20 to-transparent"></div>
          </div>

          {/* AI Speaking Indicator glow */}
          {isAiSpeaking && (
            <div className="absolute inset-0 border-4 border-brand-500/30 rounded-3xl animate-pulse pointer-events-none"></div>
          )}

          {/* Question Overlay (Bottom Left) */}
          <div className="absolute bottom-6 left-6 right-32 sm:right-64 z-20">
             {quotaExhausted ? (
                <div className="max-w-xl rounded-2xl bg-red-500/90 backdrop-blur-md p-5 border border-red-400/30 text-white shadow-xl animate-fade-in">
                  <h3 className="font-semibold mb-1">Service Unavailable</h3>
                  <p className="text-sm">The AI interview service has reached its free usage limit.</p>
                </div>
             ) : currentAiMessage && (
                <div className="max-w-2xl rounded-2xl bg-black/60 backdrop-blur-md p-5 sm:p-6 border border-white/10 text-white shadow-xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                     <span className="text-xs font-bold tracking-wider text-brand-200 uppercase">AI Interviewer</span>
                     {isAiSpeaking && (
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                          <span className="text-[10px] text-brand-200 uppercase tracking-widest">Speaking</span>
                        </div>
                     )}
                     {submitting && (
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 text-white/70 animate-spin" />
                          <span className="text-[10px] text-white/70 uppercase tracking-widest">Thinking</span>
                        </div>
                     )}
                  </div>
                  <p className="text-base sm:text-lg font-medium leading-relaxed whitespace-pre-wrap text-white/95">
                    {currentAiMessage.text}
                  </p>
                </div>
             )}
          </div>

          {/* Candidate Camera Preview (Bottom Right) */}
          <div className="absolute bottom-6 right-6 w-28 h-40 sm:w-48 sm:h-64 bg-neutral-800 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden z-20 flex items-center justify-center group cursor-pointer transition-transform hover:scale-105">
             {camOn ? (
               <div className="absolute inset-0 bg-neutral-700 flex flex-col items-center justify-center">
                  {/* Real video element will go here in the future */}
                  <User className="text-white/30 w-12 h-12 sm:w-16 sm:h-16 mb-2" />
                  <span className="text-white/40 text-xs font-medium">Camera Placeholder</span>
               </div>
             ) : (
               <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                  <User className="text-white/20 w-16 h-16" />
               </div>
             )}
             
             <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="text-xs text-white font-medium truncate">You</span>
                {micOn ? (
                  <Mic className={`w-3 h-3 text-white ${isUserSpeaking ? 'text-brand-400' : ''}`} />
                ) : (
                  <MicOff className="w-3 h-3 text-red-400" />
                )}
             </div>
          </div>
          
        </div>
      </div>

      {/* Voice-First Input Area & Testing Bar */}
      <div className="shrink-0 border-t border-line bg-surface p-4 pb-6 sm:px-8 z-10 flex flex-col items-center">
        
        {/* Voice status visualization */}
        {!completed && (
          <div className="mb-4 flex flex-col items-center justify-center h-8">
            {isUserSpeaking ? (
              <div className="flex items-center gap-2 text-brand-600 animate-fade-in">
                 <Mic className="w-4 h-4 animate-pulse" />
                 <span className="text-sm font-semibold">Listening...</span>
              </div>
            ) : submitting ? (
              <div className="flex items-center gap-2 text-ink-muted animate-fade-in">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm font-medium">Processing your answer...</span>
              </div>
            ) : (
              <div className="text-sm text-ink-faint font-medium">
                 Ready to speak
              </div>
            )}
          </div>
        )}

        {/* Controls & Testing Form */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
           
           {/* Fallback Text Input for Testing */}
           {!completed && (
             <form onSubmit={handleSubmitAnswer} className="w-full sm:flex-1 order-2 sm:order-1 relative">
               <input
                 type="text"
                 value={typedAnswer}
                 onChange={(e) => {
                    setTypedAnswer(e.target.value);
                    if (e.target.value.length > 0 && !isUserSpeaking) setIsUserSpeaking(true);
                    if (e.target.value.length === 0) setIsUserSpeaking(false);
                 }}
                 placeholder="Type your response here (for testing)..."
                 disabled={submitting}
                 className="w-full rounded-full border border-line bg-paper px-5 py-3 pr-12 text-sm outline-none transition-shadow focus:border-brand-400 focus:shadow-focus disabled:opacity-50"
               />
               <button
                 type="submit"
                 disabled={submitting || !typedAnswer.trim()}
                 className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                 aria-label="Submit Answer"
               >
                 <Send size={14} />
               </button>
             </form>
           )}
           {completed && <div className="flex-1 order-2 sm:order-1"></div>}

           {/* Call Controls */}
           <div className="flex items-center gap-3 order-1 sm:order-2 shrink-0 bg-paper p-1.5 rounded-full border border-line">
              <button 
                onClick={() => setMicOn(!micOn)} 
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${micOn ? 'bg-surface text-ink hover:bg-line-soft' : 'bg-red-500 text-white hover:bg-red-600'}`}
                aria-label="Toggle Microphone"
              >
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button 
                onClick={() => setCamOn(!camOn)}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${camOn ? 'bg-surface text-ink hover:bg-line-soft' : 'bg-red-500 text-white hover:bg-red-600'}`}
                aria-label="Toggle Camera"
              >
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button 
                className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink hover:bg-line-soft transition-all"
                aria-label="Audio Output"
              >
                <Volume2 size={20} />
              </button>
              <button 
                className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink hover:bg-line-soft transition-all"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
              
              <div className="w-px h-8 bg-line mx-1"></div>

              <button 
                onClick={() => setCompleted(true)}
                disabled={completed}
                className="flex h-12 w-16 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600 shadow-sm disabled:opacity-50"
                aria-label="End Interview"
              >
                <PhoneOff size={20} />
              </button>
           </div>
        </div>
      </div>
    </main>
  );
}

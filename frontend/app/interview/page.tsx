"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import {
  UploadCloud,
  FileText,
  FileWarning,
  X,
  Briefcase,
  ChevronDown,
  Check,
  Code2,
  MessagesSquare,
  Layers3,
  Gauge,
  GaugeCircle,
  Flame,
  Clock,
  Sparkles,
  IdCard,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ExperienceLevel = "0-1" | "1-2" | "2-5" | "5+";

type InterviewType = "technical" | "behavioral" | "both";

type Difficulty = "easy" | "medium" | "hard";

type Duration = 15 | 30 | 45;

interface JobRole {
  id: number;
  name: string;
  description?: string;
}

interface ResumeFile {
  id: number;
  name: string;
  sizeLabel: string;
  status: "uploaded" | "selected";
}

interface InterviewConfig {
  resume: ResumeFile | null;
  jobRole: JobRole | null;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: Difficulty;
  duration: Duration;
}

/* ------------------------------------------------------------------ */
/*  API                                                                */
/* ------------------------------------------------------------------ */
const API_BASE_URL = "http://localhost:8000/api/interviews";

/* ------------------------------------------------------------------ */
/*  Static configuration                                               */
/* ------------------------------------------------------------------ */

const EXPERIENCE_LEVELS: {
  value: ExperienceLevel;
  label: string;
  helper: string;
}[] = [
  {
    value: "0-1",
    label: "0–1 years",
    helper: "New to the field",
  },
  {
    value: "1-2",
    label: "1–2 years",
    helper: "Early career",
  },
  {
    value: "2-5",
    label: "2–5 years",
    helper: "Mid-level",
  },
  {
    value: "5+",
    label: "5+ years",
    helper: "Senior",
  },
];

const INTERVIEW_TYPES: {
  value: InterviewType;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    value: "technical",
    label: "Technical",
    description: "Assess technical knowledge and problem-solving.",
    icon: <Code2 size={17} strokeWidth={1.75} />,
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description:
      "Focus on communication, teamwork and workplace situations.",
    icon: <MessagesSquare size={17} strokeWidth={1.75} />,
  },
  {
    value: "both",
    label: "Technical + Behavioral",
    description: "A complete interview combining both.",
    icon: <Layers3 size={17} strokeWidth={1.75} />,
  },
];

const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    value: "easy",
    label: "Easy",
    description:
      "Fundamental concepts and straightforward questions.",
    icon: <Gauge size={17} strokeWidth={1.75} />,
  },
  {
    value: "medium",
    label: "Medium",
    description:
      "Practical and moderately challenging questions.",
    icon: <GaugeCircle size={17} strokeWidth={1.75} />,
  },
  {
    value: "hard",
    label: "Hard",
    description:
      "Advanced concepts, problem-solving and deeper technical questions.",
    icon: <Flame size={17} strokeWidth={1.75} />,
  },
];

const DURATIONS: {
  value: Duration;
  label: string;
  helper: string;
}[] = [
  {
    value: 15,
    label: "15 min",
    helper: "Quick practice round",
  },
  {
    value: 30,
    label: "30 min",
    helper: "Standard interview",
  },
  {
    value: 45,
    label: "45 min",
    helper: "In-depth session",
  },
];

/* ------------------------------------------------------------------ */
/*  Default configuration                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG: InterviewConfig = {
  resume: null,
  jobRole: null,
  experienceLevel: "1-2",
  interviewType: "both",
  difficulty: "medium",
  duration: 30,
};

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                  */
/* ------------------------------------------------------------------ */

function SetupSection({
  title,
  description,
  children,
  trailing,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
        <div>
          <h2 className="text-base font-semibold text-ink sm:text-[1.05rem]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-ink-muted">
              {description}
            </p>
          )}
        </div>

        {trailing}
      </div>

      {children}
    </section>
  );
}

function SelectionCard({
  selected,
  onSelect,
  title,
  description,
  helper,
  icon,
  layout = "stacked",
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  helper?: string;
  icon?: ReactNode;
  layout?: "stacked" | "compact";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "group relative w-full cursor-pointer rounded-xl border text-left transition-all duration-150 focus-visible:outline-none",
        layout === "compact"
          ? "px-4 py-3"
          : "px-4 py-4 sm:px-5 sm:py-4",
        selected
          ? "border-brand-500 bg-brand-50/60 shadow-card"
          : "border-line bg-surface hover:border-ink-faint hover:bg-paper",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={[
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
              selected
                ? "bg-brand-600 text-white"
                : "bg-paper text-ink-muted group-hover:text-ink",
            ].join(" ")}
          >
            {icon}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={[
                "text-[0.95rem] font-medium leading-snug",
                selected ? "text-brand-700" : "text-ink",
              ].join(" ")}
            >
              {title}
            </span>

            <span
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                selected
                  ? "border-brand-600 bg-brand-600"
                  : "border-ink-faint/40 bg-transparent",
              ].join(" ")}
            >
              {selected && (
                <span className="h-2 w-2 rounded-full bg-white" />
              )}
            </span>
          </div>

          {description && (
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          )}

          {helper && (
            <p className="mt-0.5 text-xs text-ink-faint">
              {helper}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Resume uploader                                                    */
/* ------------------------------------------------------------------ */

function ResumeUploader({
  resume,
  onChange,
}: {
  resume: ResumeFile | null;
  onChange: (resume: ResumeFile | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

 const handleFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return;

  const file = files[0];

  // Frontend validation
  if (file.type !== "application/pdf") {
    alert("Please upload a PDF file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Resume must be smaller than 5 MB.");
    return;
  }

  try {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      alert("Please login first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "http://localhost:8000/api/resumes/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Resume upload error:", data);

      alert(
        data.detail ||
          data.file?.[0] ||
          "Failed to upload resume."
      );

      return;
    }

    console.log("Resume uploaded successfully:", data);

    const sizeLabel =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const uploadedResume: ResumeFile = {
      id: data.resume_id,
      name: data.filename,
      sizeLabel,
      status: "uploaded",
    };

    onChange(uploadedResume);
  } catch (error) {
    console.error("Resume upload error:", error);

    alert("Something went wrong while uploading the resume.");
  }
};

  if (resume) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
            <FileText size={20} strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {resume.name}
            </p>

            <p className="text-xs text-ink-muted">
              PDF &nbsp;•&nbsp; {resume.sizeLabel} &nbsp;•&nbsp;
              <span className="text-brand-600">
                {resume.status === "uploaded"
                  ? " Uploaded"
                  : " Selected"}
              </span>
            </p>
          </div>

          <button
            type="button"
            aria-label="Remove resume"
            onClick={() => onChange(null)}
            className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-line-soft hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="whitespace-nowrap rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink-faint hover:bg-paper"
        >
          Change Resume
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            inputRef.current?.click();
          }
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150",
          isDragging
            ? "border-brand-500 bg-brand-50/60"
            : "border-line bg-paper hover:border-ink-faint hover:bg-line-soft/60",
        ].join(" ")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-brand-600 shadow-card">
          <UploadCloud size={22} strokeWidth={1.75} />
        </span>

        <div>
          <p className="text-sm font-medium text-ink">
            Drag and drop your resume here
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            PDF, up to 5 MB
          </p>
        </div>

        <span className="mt-1 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700">
          Upload Resume
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Job role dropdown                                                  */
/* ------------------------------------------------------------------ */

function JobRoleSelect({
  value,
  jobRoles,
  loading,
  error,
  onRetry,
  onChange,
}: {
  value: JobRole | null;
  jobRoles: JobRole[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onChange: (role: JobRole) => void;
}) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
          <Briefcase size={17} strokeWidth={1.75} />
        </span>

        <span className="text-sm text-ink-muted">
          Loading job roles...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-line bg-paper px-4 py-4">
        <p className="text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (jobRoles.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper px-4 py-4">
        <p className="text-sm text-ink-muted">
          No job roles are available right now.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3.5 text-left transition-colors",
          open
            ? "border-brand-500 shadow-focus"
            : "border-line hover:border-ink-faint",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
            <Briefcase size={17} strokeWidth={1.75} />
          </span>

          <span className="min-w-0 truncate text-[0.95rem] font-medium text-ink">
            {value?.name ?? "Select a job role"}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-faint transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="animate-fade-in absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface p-1.5 shadow-raised"
        >
          {jobRoles.map((role) => {
            const selected = role.id === value?.id;

            return (
              <li key={role.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(role);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-ink hover:bg-paper",
                  ].join(" ")}
                >
                  {role.name}

                  {selected && (
                    <Check
                      size={16}
                      className="text-brand-600"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary card                                                       */
/* ------------------------------------------------------------------ */

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-ink-muted">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

function InterviewSummary({
  config,
}: {
  config: InterviewConfig;
}) {
  const experienceLabel = EXPERIENCE_LEVELS.find(
    (e) => e.value === config.experienceLevel
  )?.label;

  const typeLabel = INTERVIEW_TYPES.find(
    (t) => t.value === config.interviewType
  )?.label;

  const difficultyLabel = DIFFICULTIES.find(
    (d) => d.value === config.difficulty
  )?.label;

  const durationLabel = DURATIONS.find(
    (d) => d.value === config.duration
  )?.label;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <h2 className="text-base font-semibold text-ink">
        Interview Summary
      </h2>

      <p className="mt-1 text-sm text-ink-muted">
        Review your settings before you begin.
      </p>

      <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              config.resume
                ? "bg-brand-600/10 text-brand-600"
                : "bg-line-soft text-ink-faint",
            ].join(" ")}
          >
            {config.resume ? (
              <FileText
                size={17}
                strokeWidth={1.75}
              />
            ) : (
              <FileWarning
                size={17}
                strokeWidth={1.75}
              />
            )}
          </span>

          <div className="min-w-0">
            <p className="text-xs text-ink-muted">
              Resume
            </p>

            <p className="truncate text-sm font-medium text-ink">
              {config.resume
                ? config.resume.name
                : "Not uploaded yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 divide-y divide-line-soft">
        <Row
          label="Job Role"
          value={config.jobRole?.name ?? "—"}
        />

        <Row
          label="Experience"
          value={experienceLabel ?? "—"}
        />

        <Row
          label="Interview"
          value={typeLabel ?? "—"}
        />

        <Row
          label="Difficulty"
          value={difficultyLabel ?? "—"}
        />

        <Row
          label="Duration"
          value={durationLabel ?? "—"}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function InterviewSetupPage() {
  const [config, setConfig] =
    useState<InterviewConfig>(DEFAULT_CONFIG);

  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);

  const [loadingJobRoles, setLoadingJobRoles] =
    useState(true);

  const [jobRoleError, setJobRoleError] =
    useState("");

  const [startingInterview, setStartingInterview] =
    useState(false);

  /* ---------------------------------------------------------------- */
  /* Fetch Job Roles                                                  */
  /* ---------------------------------------------------------------- */

  const fetchJobRoles = async () => {
    try {
      setLoadingJobRoles(true);
      setJobRoleError("");

      const accessToken =
        localStorage.getItem("access_token");

      if (!accessToken) {
        throw new Error(
          "Please login first."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/job-roles/`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to fetch job roles."
        );
      }

      setJobRoles(data);

      /*
       * Select the first role automatically.
       *
       * We use the actual object returned by Django,
       * including its database ID.
       */
      if (data.length > 0) {
        setConfig((current) => ({
          ...current,
          jobRole: data[0],
        }));
      }
    } catch (error) {
      console.error(
        "Job role fetch error:",
        error
      );

      setJobRoleError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading job roles."
      );
    } finally {
      setLoadingJobRoles(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchJobRoles();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Start Interview                                                  */
  /* ---------------------------------------------------------------- */

  const handleStartInterview = async () => {
    if (!config.resume) {
      alert("Please select a resume.");
      return;
    }

    if (!config.jobRole) {
      alert("Please select a job role.");
      return;
    }

    /*
     * At the moment our ResumeUploader only creates a
     * local file object, so its ID will be 0.
     *
     * Once Resume API integration is completed,
     * this will contain the real database ID.
     */
    if (!config.resume.id) {
      alert(
        "Please upload/select your resume from your account."
      );
      return;
    }

    try {
      setStartingInterview(true);

      const accessToken =
        localStorage.getItem("access_token");

      if (!accessToken) {
        alert("Please login first.");
        return;
      }

      /*
       * IMPORTANT:
       *
       * We send database IDs here.
       *
       * job_role = config.jobRole.id
       * resume   = config.resume.id
       */
      const payload = {
        resume: config.resume.id,
        job_role: config.jobRole.id,
        experience_level: config.experienceLevel,
        interview_type: config.interviewType,
        difficulty: config.difficulty,
        duration: config.duration,
      };

      console.log(
        "Starting interview with payload:",
        payload
      );

      const response = await fetch(
        `${API_BASE_URL}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Interview API error:",
          data
        );

        alert(
          data.detail ||
            "Failed to start interview."
        );

        return;
      }

      console.log(
        "Interview started successfully:",
        data
      );

      /*
       * Backend currently returns:
       *
       * {
       *   "message": "Interview started successfully.",
       *   "interview_id": 1
       * }
       *
       * Later we will navigate to:
       *
       * /interview/{interview_id}
       */

      alert(
        `Interview started successfully! Interview ID: ${data.interview_id}`
      );

      // Example for the next phase:
      // router.push(`/interview/${data.interview_id}`);
    } catch (error) {
      console.error(
        "Start interview error:",
        error
      );

      alert(
        "Something went wrong while starting the interview."
      );
    } finally {
      setStartingInterview(false);
    }
  };

  const canStart =
    Boolean(config.resume) &&
    Boolean(config.jobRole) &&
    !startingInterview;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            <Sparkles
              size={12}
              className="text-brand-600"
            />
            Interview Setup
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            Prepare for your interview
          </h1>

          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Customize your interview settings before you begin.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">

          {/* Main configuration column */}
          <div className="flex flex-col gap-6">

            {/* Resume */}
            <SetupSection
              title="Resume"
              description="Your interview questions will be tailored to your resume."
            >
              <ResumeUploader
                resume={config.resume}
                onChange={(resume) =>
                  setConfig((c) => ({
                    ...c,
                    resume,
                  }))
                }
              />
            </SetupSection>

            {/* Job Role */}
            <SetupSection
              title="Job Role"
              description="Select the role you're interviewing for."
              trailing={
                <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600 sm:flex">
                  <IdCard
                    size={17}
                    strokeWidth={1.75}
                  />
                </span>
              }
            >
              <JobRoleSelect
                value={config.jobRole}
                jobRoles={jobRoles}
                loading={loadingJobRoles}
                error={jobRoleError}
                onRetry={fetchJobRoles}
                onChange={(jobRole) =>
                  setConfig((c) => ({
                    ...c,
                    jobRole,
                  }))
                }
              />
            </SetupSection>

            {/* Experience Level */}
            <SetupSection
              title="Experience Level"
              description="How much experience do you have in this role?"
            >
              <div
                role="radiogroup"
                aria-label="Experience level"
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {EXPERIENCE_LEVELS.map(
                  (level) => (
                    <SelectionCard
                      key={level.value}
                      title={level.label}
                      helper={level.helper}
                      selected={
                        config.experienceLevel ===
                        level.value
                      }
                      onSelect={() =>
                        setConfig((c) => ({
                          ...c,
                          experienceLevel:
                            level.value,
                        }))
                      }
                      layout="compact"
                    />
                  )
                )}
              </div>
            </SetupSection>

            {/* Interview Type */}
            <SetupSection
              title="Interview Type"
              description="Choose what this session should focus on."
            >
              <div
                role="radiogroup"
                aria-label="Interview type"
                className="grid gap-3 sm:grid-cols-3"
              >
                {INTERVIEW_TYPES.map(
                  (type) => (
                    <SelectionCard
                      key={type.value}
                      title={type.label}
                      description={type.description}
                      icon={type.icon}
                      selected={
                        config.interviewType ===
                        type.value
                      }
                      onSelect={() =>
                        setConfig((c) => ({
                          ...c,
                          interviewType:
                            type.value,
                        }))
                      }
                    />
                  )
                )}
              </div>
            </SetupSection>

            {/* Difficulty */}
            <SetupSection
              title="Difficulty"
              description="Set how challenging the questions should be."
            >
              <div
                role="radiogroup"
                aria-label="Difficulty"
                className="grid gap-3 sm:grid-cols-3"
              >
                {DIFFICULTIES.map(
                  (difficulty) => (
                    <SelectionCard
                      key={difficulty.value}
                      title={difficulty.label}
                      description={
                        difficulty.description
                      }
                      icon={difficulty.icon}
                      selected={
                        config.difficulty ===
                        difficulty.value
                      }
                      onSelect={() =>
                        setConfig((c) => ({
                          ...c,
                          difficulty:
                            difficulty.value,
                        }))
                      }
                    />
                  )
                )}
              </div>
            </SetupSection>

            {/* Duration */}
            <SetupSection
              title="Interview Duration"
              description="Choose how long your session will run."
            >
              <div
                role="radiogroup"
                aria-label="Interview duration"
                className="grid grid-cols-3 gap-3"
              >
                {DURATIONS.map(
                  (duration) => (
                    <SelectionCard
                      key={duration.value}
                      title={duration.label}
                      helper={duration.helper}
                      icon={
                        <Clock
                          size={17}
                          strokeWidth={1.75}
                        />
                      }
                      selected={
                        config.duration ===
                        duration.value
                      }
                      onSelect={() =>
                        setConfig((c) => ({
                          ...c,
                          duration:
                            duration.value,
                        }))
                      }
                    />
                  )
                )}
              </div>
            </SetupSection>
          </div>

          {/* Summary + CTA */}
          <div className="lg:sticky lg:top-8">
            <div className="flex flex-col gap-4">

              <InterviewSummary
                config={config}
              />

              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
                <button
                  type="button"
                  onClick={
                    handleStartInterview
                  }
                  disabled={!canStart}
                  className={[
                    "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[0.95rem] font-medium text-white transition-all duration-150",
                    canStart
                      ? "bg-brand-600 shadow-raised hover:bg-brand-700 active:bg-brand-700"
                      : "cursor-not-allowed bg-ink-faint/50",
                  ].join(" ")}
                >
                  {startingInterview
                    ? "Starting..."
                    : "Start Interview"}

                  {!startingInterview && (
                    <ArrowRight
                      size={17}
                      strokeWidth={2}
                    />
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-ink-muted">
                  You can review your settings before starting.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
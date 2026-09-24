export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";
export type PomodoroStatus =
  | "idle"
  | "running"
  | "paused"
  | "phaseComplete"
  | "finished";

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cycles: number;
  autoStart: boolean;
  sound: boolean;
  notifications: boolean;
}

export interface PomodoroSession {
  status: PomodoroStatus;
  phase: PomodoroPhase;
  cycle: number;
  endsAt: number | null;
  remainingMs: number;
  nextPhase: PomodoroPhase | null;
  completedPhase: PomodoroPhase | null;
  completionId: number;
}

export interface PomodoroDailyStats {
  date: string;
  completedFocus: number;
  focusMinutes: number;
}

export interface PomodoroData {
  version: 1;
  settings: PomodoroSettings;
  session: PomodoroSession;
  daily: PomodoroDailyStats;
}

export const POMODORO_STORAGE_KEY = "iceaxing-tools-pomodoro-v1";

export const SETTING_LIMITS = {
  focusMinutes: { min: 1, max: 120 },
  shortBreakMinutes: { min: 1, max: 30 },
  longBreakMinutes: { min: 1, max: 60 },
  cycles: { min: 1, max: 12 },
} as const;

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cycles: 4,
  autoStart: false,
  sound: true,
  notifications: false,
};

export function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDefaultData(): PomodoroData {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    session: {
      status: "idle",
      phase: "focus",
      cycle: 1,
      endsAt: null,
      remainingMs: DEFAULT_SETTINGS.focusMinutes * 60_000,
      nextPhase: null,
      completedPhase: null,
      completionId: 0,
    },
    daily: {
      date: "",
      completedFocus: 0,
      focusMinutes: 0,
    },
  };
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampSetting(
  key: keyof typeof SETTING_LIMITS,
  value: number,
) {
  const limits = SETTING_LIMITS[key];
  return clampInteger(value, limits.min, limits.max, DEFAULT_SETTINGS[key]);
}

export function phaseDurationMs(
  settings: PomodoroSettings,
  phase: PomodoroPhase,
) {
  if (phase === "focus") return settings.focusMinutes * 60_000;
  if (phase === "shortBreak") return settings.shortBreakMinutes * 60_000;
  return settings.longBreakMinutes * 60_000;
}

function normalizeDaily(daily: PomodoroDailyStats, now: number) {
  const today = localDateKey(now);
  return daily.date === today
    ? daily
    : { date: today, completedFocus: 0, focusMinutes: 0 };
}

export function startNewSet(data: PomodoroData, now: number): PomodoroData {
  return {
    ...data,
    daily: normalizeDaily(data.daily, now),
    session: {
      ...data.session,
      status: "running",
      phase: "focus",
      cycle: 1,
      endsAt: now + phaseDurationMs(data.settings, "focus"),
      remainingMs: phaseDurationMs(data.settings, "focus"),
      nextPhase: null,
      completedPhase: null,
    },
  };
}

export function pauseSession(data: PomodoroData, now: number): PomodoroData {
  if (data.session.status !== "running" || data.session.endsAt === null) {
    return data;
  }

  return {
    ...data,
    session: {
      ...data.session,
      status: "paused",
      remainingMs: Math.max(0, data.session.endsAt - now),
      endsAt: null,
    },
  };
}

export function resumeSession(data: PomodoroData, now: number): PomodoroData {
  if (data.session.status !== "paused") return data;

  return {
    ...data,
    session: {
      ...data.session,
      status: "running",
      endsAt: now + data.session.remainingMs,
    },
  };
}

function getNextPhase(session: PomodoroSession, cycles: number) {
  if (session.phase === "focus") {
    return session.cycle >= cycles ? "longBreak" : "shortBreak";
  }
  if (session.phase === "shortBreak") return "focus";
  return null;
}

function beginNextPhase(data: PomodoroData, now: number): PomodoroData {
  const nextPhase = data.session.nextPhase;
  if (!nextPhase) return data;
  const nextCycle =
    data.session.phase === "shortBreak" && nextPhase === "focus"
      ? data.session.cycle + 1
      : data.session.cycle;
  const duration = phaseDurationMs(data.settings, nextPhase);

  return {
    ...data,
    session: {
      ...data.session,
      status: "running",
      phase: nextPhase,
      cycle: nextCycle,
      endsAt: now + duration,
      remainingMs: duration,
      nextPhase: null,
    },
  };
}

export function startNextPhase(data: PomodoroData, now: number) {
  if (data.session.status !== "phaseComplete") return data;
  return beginNextPhase(data, now);
}

export function completePhase(
  data: PomodoroData,
  now: number,
  countFocus = true,
): PomodoroData {
  const currentPhase = data.session.phase;
  const daily = normalizeDaily(data.daily, now);
  const updatedDaily =
    currentPhase === "focus" && countFocus
      ? {
          ...daily,
          completedFocus: daily.completedFocus + 1,
          focusMinutes: daily.focusMinutes + data.settings.focusMinutes,
        }
      : daily;

  if (currentPhase === "longBreak") {
    return {
      ...data,
      daily: updatedDaily,
      session: {
        ...data.session,
        status: "finished",
        endsAt: null,
        remainingMs: 0,
        nextPhase: null,
        completedPhase: currentPhase,
        completionId: data.session.completionId + 1,
      },
    };
  }

  const nextPhase = getNextPhase(data.session, data.settings.cycles);
  const completed: PomodoroData = {
    ...data,
    daily: updatedDaily,
    session: {
      ...data.session,
      status: "phaseComplete",
      endsAt: null,
      remainingMs: 0,
      nextPhase,
      completedPhase: currentPhase,
      completionId: data.session.completionId + 1,
    },
  };

  return data.settings.autoStart ? beginNextPhase(completed, now) : completed;
}

export function resetToClock(data: PomodoroData, now: number): PomodoroData {
  return {
    ...data,
    daily: normalizeDaily(data.daily, now),
    session: {
      ...data.session,
      status: "idle",
      phase: "focus",
      cycle: 1,
      endsAt: null,
      remainingMs: phaseDurationMs(data.settings, "focus"),
      nextPhase: null,
      completedPhase: null,
    },
  };
}

export function toggleSession(data: PomodoroData, now: number) {
  switch (data.session.status) {
    case "idle":
    case "finished":
      return startNewSet(data, now);
    case "running":
      return pauseSession(data, now);
    case "paused":
      return resumeSession(data, now);
    case "phaseComplete":
      return startNextPhase(data, now);
  }
}

export function tickData(data: PomodoroData, now: number): PomodoroData {
  const daily = normalizeDaily(data.daily, now);
  const normalized = daily === data.daily ? data : { ...data, daily };

  if (
    normalized.session.status === "running" &&
    normalized.session.endsAt !== null &&
    normalized.session.endsAt <= now
  ) {
    return completePhase(normalized, now);
  }

  return normalized;
}

export function remainingMilliseconds(data: PomodoroData, now: number) {
  if (data.session.status === "running" && data.session.endsAt !== null) {
    return Math.max(0, data.session.endsAt - now);
  }
  return Math.max(0, data.session.remainingMs);
}

function isPhase(value: unknown): value is PomodoroPhase {
  return value === "focus" || value === "shortBreak" || value === "longBreak";
}

function isStatus(value: unknown): value is PomodoroStatus {
  return (
    value === "idle" ||
    value === "running" ||
    value === "paused" ||
    value === "phaseComplete" ||
    value === "finished"
  );
}

export function restorePomodoroData(value: unknown, now: number): PomodoroData {
  const fallback = createDefaultData();
  if (!value || typeof value !== "object") return tickData(fallback, now);

  const saved = value as Partial<PomodoroData>;
  if (saved.version !== 1) return tickData(fallback, now);

  const settingsValue = saved.settings as Partial<PomodoroSettings> | undefined;
  const sessionValue = saved.session as Partial<PomodoroSession> | undefined;
  const dailyValue = saved.daily as Partial<PomodoroDailyStats> | undefined;

  const settings: PomodoroSettings = {
    focusMinutes: clampInteger(
      settingsValue?.focusMinutes,
      SETTING_LIMITS.focusMinutes.min,
      SETTING_LIMITS.focusMinutes.max,
      DEFAULT_SETTINGS.focusMinutes,
    ),
    shortBreakMinutes: clampInteger(
      settingsValue?.shortBreakMinutes,
      SETTING_LIMITS.shortBreakMinutes.min,
      SETTING_LIMITS.shortBreakMinutes.max,
      DEFAULT_SETTINGS.shortBreakMinutes,
    ),
    longBreakMinutes: clampInteger(
      settingsValue?.longBreakMinutes,
      SETTING_LIMITS.longBreakMinutes.min,
      SETTING_LIMITS.longBreakMinutes.max,
      DEFAULT_SETTINGS.longBreakMinutes,
    ),
    cycles: clampInteger(
      settingsValue?.cycles,
      SETTING_LIMITS.cycles.min,
      SETTING_LIMITS.cycles.max,
      DEFAULT_SETTINGS.cycles,
    ),
    autoStart: settingsValue?.autoStart === true,
    sound: settingsValue?.sound !== false,
    notifications: settingsValue?.notifications === true,
  };

  const status = isStatus(sessionValue?.status)
    ? sessionValue.status
    : fallback.session.status;
  const phase = isPhase(sessionValue?.phase)
    ? sessionValue.phase
    : fallback.session.phase;
  const nextPhase = isPhase(sessionValue?.nextPhase)
    ? sessionValue.nextPhase
    : null;
  const completedPhase = isPhase(sessionValue?.completedPhase)
    ? sessionValue.completedPhase
    : null;
  const endsAt =
    typeof sessionValue?.endsAt === "number" &&
    Number.isFinite(sessionValue.endsAt)
      ? sessionValue.endsAt
      : null;
  const remainingMs =
    typeof sessionValue?.remainingMs === "number" &&
    Number.isFinite(sessionValue.remainingMs)
      ? Math.max(0, sessionValue.remainingMs)
      : phaseDurationMs(settings, phase);

  const restored: PomodoroData = {
    version: 1,
    settings,
    session: {
      status: status === "running" && endsAt === null ? "paused" : status,
      phase,
      cycle: clampInteger(sessionValue?.cycle, 1, settings.cycles, 1),
      endsAt: status === "running" ? endsAt : null,
      remainingMs,
      nextPhase,
      completedPhase,
      completionId: clampInteger(
        sessionValue?.completionId,
        0,
        Number.MAX_SAFE_INTEGER,
        0,
      ),
    },
    daily: {
      date: typeof dailyValue?.date === "string" ? dailyValue.date : "",
      completedFocus: clampInteger(
        dailyValue?.completedFocus,
        0,
        Number.MAX_SAFE_INTEGER,
        0,
      ),
      focusMinutes: clampInteger(
        dailyValue?.focusMinutes,
        0,
        Number.MAX_SAFE_INTEGER,
        0,
      ),
    },
  };

  if (
    restored.session.status === "running" &&
    restored.session.endsAt !== null &&
    restored.session.endsAt <= now
  ) {
    const completed = completePhase(
      {
        ...restored,
        settings: { ...restored.settings, autoStart: false },
      },
      now,
    );
    return { ...completed, settings };
  }

  return tickData(restored, now);
}

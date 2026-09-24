"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  POMODORO_STORAGE_KEY,
  SETTING_LIMITS,
  clampSetting,
  completePhase,
  createDefaultData,
  phaseDurationMs,
  remainingMilliseconds,
  resetToClock,
  restorePomodoroData,
  tickData,
  toggleSession,
  type PomodoroData,
  type PomodoroPhase,
  type PomodoroSettings,
} from "./pomodoro-state";

type NumberSettingKey = keyof typeof SETTING_LIMITS;

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [totalMinutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function phaseKey(phase: PomodoroPhase) {
  if (phase === "shortBreak") return "shortBreak" as const;
  if (phase === "longBreak") return "longBreak" as const;
  return "focus" as const;
}

interface NumberSettingProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

function NumberSetting({
  id,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: NumberSettingProps) {
  return (
    <label className="pomodoro-number-setting" htmlFor={id}>
      <span>{label}</span>
      <span className="pomodoro-number-control">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

export function PomodoroTimer() {
  const t = useTranslations("pomodoro");
  const locale = useLocale();
  const [data, setData] = useState<PomodoroData>(createDefaultData);
  const [now, setNow] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [permissionNote, setPermissionNote] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertRef = useRef(0);
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const currentTime = Date.now();
      let restored = createDefaultData();

      try {
        const saved = window.localStorage.getItem(POMODORO_STORAGE_KEY);
        if (saved) restored = restorePomodoroData(JSON.parse(saved), currentTime);
      } catch {
        window.localStorage.removeItem(POMODORO_STORAGE_KEY);
      }

      if (
        restored.settings.notifications &&
        (!("Notification" in window) || Notification.permission !== "granted")
      ) {
        restored = {
          ...restored,
          settings: { ...restored.settings, notifications: false },
        };
      }

      lastAlertRef.current = restored.session.completionId;
      setData(restored);
      setNow(currentTime);
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // A blocked storage API must not stop the timer itself.
    }
  }, [data, storageReady]);

  useEffect(() => {
    const refresh = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      setData((current) => tickData(current, currentTime));
    };

    const interval = window.setInterval(refresh, 250);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const unlockAudio = useCallback(() => {
    if (!data.settings.sound || typeof AudioContext === "undefined") return;
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
    } catch {
      // Audio is an enhancement; unsupported browsers keep the core timer.
    }
  }, [data.settings.sound]);

  const playChime = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state === "closed") return;

    try {
      const start = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
      gain.connect(context.destination);

      [659.25, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(start + index * 0.16);
        oscillator.stop(start + 1.2);
      });
    } catch {
      // Ignore audio errors after a timer has already completed.
    }
  }, []);

  useEffect(() => {
    const completionId = data.session.completionId;
    if (!storageReady || completionId === lastAlertRef.current) return;
    lastAlertRef.current = completionId;

    const completedPhase = data.session.completedPhase;
    if (!completedPhase) return;
    const completedLabel = t(`phases.${phaseKey(completedPhase)}`);

    if (data.settings.sound) playChime();
    if (
      data.settings.notifications &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.visibilityState !== "visible"
    ) {
      new Notification(t("notification.title"), {
        body: t("notification.body", { phase: completedLabel }),
      });
    }
  }, [
    data.session.completedPhase,
    data.session.completionId,
    data.settings.notifications,
    data.settings.sound,
    playChime,
    storageReady,
    t,
  ]);

  useEffect(() => {
    originalTitleRef.current = document.title;
    return () => {
      if (originalTitleRef.current) document.title = originalTitleRef.current;
      const context = audioContextRef.current;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  const remaining = remainingMilliseconds(data, now);
  const timeDisplay = formatDuration(remaining);

  useEffect(() => {
    if (!originalTitleRef.current) return;
    if (data.session.status === "running" || data.session.status === "paused") {
      document.title = `${timeDisplay} · ${t(
        `phases.${phaseKey(data.session.phase)}`,
      )} · iceaxing`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [data.session.phase, data.session.status, t, timeDisplay]);

  const clock = useMemo(() => {
    if (!now) return { time: "--:--:--", date: "", zone: "" };
    const date = new Date(now);
    const time = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
    const formattedDate = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(date);
    const zone =
      new Intl.DateTimeFormat(locale, { timeZoneName: "short" })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value ?? "";
    return { time, date: formattedDate, zone };
  }, [locale, now]);

  const currentDuration = phaseDurationMs(data.settings, data.session.phase);
  const progress =
    data.session.status === "idle"
      ? 0
      : data.session.status === "phaseComplete" ||
          data.session.status === "finished"
        ? 1
        : Math.min(1, Math.max(0, 1 - remaining / currentDuration));
  const circumference = 2 * Math.PI * 132;
  const progressOffset = circumference * (1 - progress);
  const isClock = data.session.status === "idle";
  const mainTime = isClock ? clock.time : timeDisplay;
  const phaseLabel = t(`phases.${phaseKey(data.session.phase)}`);

  const statusLabel = (() => {
    if (data.session.status === "idle") return t("status.clock");
    if (data.session.status === "running") return t("status.running");
    if (data.session.status === "paused") return t("status.paused");
    if (data.session.status === "phaseComplete") return t("status.phaseComplete");
    return t("status.finished");
  })();

  const description = (() => {
    if (data.session.status === "idle") return t("descriptions.clock");
    if (data.session.status === "phaseComplete" && data.session.nextPhase) {
      return t("descriptions.next", {
        phase: t(`phases.${phaseKey(data.session.nextPhase)}`),
      });
    }
    if (data.session.status === "finished") return t("descriptions.finished");
    return t("descriptions.active", { phase: phaseLabel });
  })();

  const updateNumberSetting = (key: NumberSettingKey, value: number) => {
    if (!Number.isFinite(value)) return;
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: clampSetting(key, value),
      },
    }));
  };

  const updateBooleanSetting = (
    key: keyof Pick<PomodoroSettings, "autoStart" | "sound">,
    value: boolean,
  ) => {
    setData((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
  };

  const handleNotificationChange = async (enabled: boolean) => {
    setPermissionNote("");
    if (!enabled) {
      setData((current) => ({
        ...current,
        settings: { ...current.settings, notifications: false },
      }));
      return;
    }

    if (!("Notification" in window)) {
      setPermissionNote(t("notification.unsupported"));
      return;
    }

    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    const granted = permission === "granted";
    setData((current) => ({
      ...current,
      settings: { ...current.settings, notifications: granted },
    }));
    if (!granted) setPermissionNote(t("notification.denied"));
  };

  const handlePrimaryAction = useCallback(() => {
    unlockAudio();
    setData((current) => toggleSession(current, Date.now()));
  }, [unlockAudio]);

  const handleReset = useCallback(() => {
    setData((current) => resetToClock(current, Date.now()));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, button, select, textarea, [contenteditable='true']")) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handlePrimaryAction();
      }
      if (event.key.toLowerCase() === "r") handleReset();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrimaryAction, handleReset]);

  const primaryLabel = (() => {
    if (data.session.status === "idle") return t("actions.startFocus");
    if (data.session.status === "running") return t("actions.pause");
    if (data.session.status === "paused") return t("actions.resume");
    if (data.session.status === "finished") return t("actions.newSet");
    if (data.session.nextPhase) {
      return t("actions.startPhase", {
        phase: t(`phases.${phaseKey(data.session.nextPhase)}`),
      });
    }
    return t("actions.startFocus");
  })();

  const completedAnnouncement = data.session.completedPhase
    ? t("announcements.completed", {
        phase: t(`phases.${phaseKey(data.session.completedPhase)}`),
      })
    : "";

  return (
    <div
      className="pomodoro-workbench"
      data-ready={storageReady ? "true" : "false"}
      data-status={data.session.status}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {data.session.completionId > 0 ? (
          <span key={data.session.completionId}>{completedAnnouncement}</span>
        ) : null}
      </p>

      <section className="pomodoro-console" aria-label={t("timerAriaLabel")}>
        <div className="pomodoro-altimeter">
          <svg viewBox="0 0 320 320" aria-hidden="true">
            <circle className="pomodoro-orbit-outer" cx="160" cy="160" r="149" />
            <circle className="pomodoro-orbit-track" cx="160" cy="160" r="132" />
            <circle
              className="pomodoro-orbit-progress"
              cx="160"
              cy="160"
              r="132"
              pathLength={circumference}
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
            />
            <path className="pomodoro-altimeter-ridge" d="M51 223 98 174l28 25 42-78 101 102" />
            <path className="pomodoro-altimeter-route" d="M74 217c32-4 58-23 76-55 17-31 39-40 82-3" />
            <circle className="pomodoro-altimeter-marker" cx="171" cy="136" r="5" />
          </svg>

          <div className="pomodoro-time-face">
            <span className="pomodoro-status-label">{statusLabel}</span>
            <time
              className="pomodoro-time"
              dateTime={isClock ? undefined : `PT${Math.ceil(remaining / 1000)}S`}
            >
              {mainTime}
            </time>
            <span className="pomodoro-phase-label">
              {isClock
                ? [clock.date, clock.zone].filter(Boolean).join(" · ")
                : `${phaseLabel} · ${t("cyclePosition", {
                    current: data.session.cycle,
                    total: data.settings.cycles,
                  })}`}
            </span>
          </div>
        </div>

        <div className="pomodoro-console-copy">
          <p>{description}</p>
          <div className="pomodoro-actions">
            <button
              type="button"
              className="pomodoro-button pomodoro-button-primary"
              onClick={handlePrimaryAction}
            >
              {primaryLabel}
            </button>

            {data.session.status === "running" ? (
              <button
                type="button"
                className="pomodoro-button pomodoro-button-secondary"
                onClick={() =>
                  setData((current) => completePhase(current, Date.now(), false))
                }
              >
                {t("actions.skip")}
              </button>
            ) : null}

            {data.session.status !== "idle" ? (
              <button
                type="button"
                className="pomodoro-button pomodoro-button-quiet"
                onClick={handleReset}
              >
                {t("actions.returnClock")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="pomodoro-route" aria-label={t("routeAriaLabel")}>
          {Array.from({ length: data.settings.cycles }, (_, index) => {
            const cycleNumber = index + 1;
            const completed =
              data.session.status === "finished" ||
              cycleNumber < data.session.cycle ||
              (data.session.phase !== "focus" && cycleNumber <= data.session.cycle);
            const current =
              data.session.status !== "idle" &&
              data.session.status !== "finished" &&
              cycleNumber === data.session.cycle;
            return (
              <span
                className="pomodoro-route-stop"
                data-completed={completed ? "true" : "false"}
                data-current={current ? "true" : "false"}
                key={cycleNumber}
              >
                <i aria-hidden="true" />
                <span className="sr-only">
                  {t("cycleName", { cycle: cycleNumber })}
                </span>
              </span>
            );
          })}
        </div>
      </section>

      <aside className="pomodoro-sidebar">
        <section className="pomodoro-panel">
          <div className="pomodoro-panel-heading">
            <div>
              <span>CONFIG / 01</span>
              <h2>{t("settings.title")}</h2>
            </div>
            <span>{t("settings.localBadge")}</span>
          </div>

          <form className="pomodoro-settings" onSubmit={(event) => event.preventDefault()}>
            <div className="pomodoro-setting-grid">
              <NumberSetting
                id="pomodoro-focus-minutes"
                label={t("settings.focusMinutes")}
                value={data.settings.focusMinutes}
                min={SETTING_LIMITS.focusMinutes.min}
                max={SETTING_LIMITS.focusMinutes.max}
                unit={t("settings.minutesUnit")}
                onChange={(value) => updateNumberSetting("focusMinutes", value)}
              />
              <NumberSetting
                id="pomodoro-short-break-minutes"
                label={t("settings.shortBreakMinutes")}
                value={data.settings.shortBreakMinutes}
                min={SETTING_LIMITS.shortBreakMinutes.min}
                max={SETTING_LIMITS.shortBreakMinutes.max}
                unit={t("settings.minutesUnit")}
                onChange={(value) => updateNumberSetting("shortBreakMinutes", value)}
              />
              <NumberSetting
                id="pomodoro-long-break-minutes"
                label={t("settings.longBreakMinutes")}
                value={data.settings.longBreakMinutes}
                min={SETTING_LIMITS.longBreakMinutes.min}
                max={SETTING_LIMITS.longBreakMinutes.max}
                unit={t("settings.minutesUnit")}
                onChange={(value) => updateNumberSetting("longBreakMinutes", value)}
              />
              <NumberSetting
                id="pomodoro-cycles"
                label={t("settings.cycles")}
                value={data.settings.cycles}
                min={SETTING_LIMITS.cycles.min}
                max={SETTING_LIMITS.cycles.max}
                unit={t("settings.cyclesUnit")}
                onChange={(value) => updateNumberSetting("cycles", value)}
              />
            </div>

            <p className="pomodoro-settings-hint">{t("settings.nextPhaseHint")}</p>

            <div className="pomodoro-toggle-list">
              <label className="pomodoro-toggle">
                <span>
                  <strong>{t("settings.autoStart")}</strong>
                  <small>{t("settings.autoStartHint")}</small>
                </span>
                <input
                  type="checkbox"
                  checked={data.settings.autoStart}
                  onChange={(event) =>
                    updateBooleanSetting("autoStart", event.target.checked)
                  }
                />
                <i aria-hidden="true" />
              </label>

              <label className="pomodoro-toggle">
                <span>
                  <strong>{t("settings.sound")}</strong>
                  <small>{t("settings.soundHint")}</small>
                </span>
                <input
                  type="checkbox"
                  checked={data.settings.sound}
                  onChange={(event) => {
                    updateBooleanSetting("sound", event.target.checked);
                    if (event.target.checked) unlockAudio();
                  }}
                />
                <i aria-hidden="true" />
              </label>

              <label className="pomodoro-toggle">
                <span>
                  <strong>{t("settings.notifications")}</strong>
                  <small>{t("settings.notificationsHint")}</small>
                </span>
                <input
                  type="checkbox"
                  checked={data.settings.notifications}
                  onChange={(event) =>
                    void handleNotificationChange(event.target.checked)
                  }
                />
                <i aria-hidden="true" />
              </label>
            </div>

            {permissionNote ? (
              <p className="pomodoro-permission-note" role="status">
                {permissionNote}
              </p>
            ) : null}
          </form>
        </section>

        <section className="pomodoro-panel pomodoro-today">
          <div className="pomodoro-panel-heading">
            <div>
              <span>TRACE / TODAY</span>
              <h2>{t("today.title")}</h2>
            </div>
          </div>
          <div className="pomodoro-stat-grid">
            <div>
              <strong>{String(data.daily.completedFocus).padStart(2, "0")}</strong>
              <span>{t("today.completed")}</span>
            </div>
            <div>
              <strong>{String(data.daily.focusMinutes).padStart(2, "0")}</strong>
              <span>{t("today.minutes")}</span>
            </div>
          </div>
          <div className="pomodoro-shortcuts" aria-label={t("shortcuts.title")}>
            <span>{t("shortcuts.space")} <kbd>Space</kbd></span>
            <span>{t("shortcuts.reset")} <kbd>R</kbd></span>
          </div>
        </section>
      </aside>
    </div>
  );
}

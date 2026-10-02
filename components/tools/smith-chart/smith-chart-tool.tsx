"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  gammaToImpedance,
  impedanceToGamma,
  inputImpedance,
  magnitude,
  normalizeImpedance,
  reciprocal,
  seriesThenShuntLMatch,
  shuntStubSolutions,
  shuntThenSeriesLMatch,
  smithMetrics,
  susceptanceToComponent,
  reactanceToComponent,
  type Complex,
} from "./smith-math";

const VIEW_SIZE = 720;
const CENTER = VIEW_SIZE / 2;
const RADIUS = 286;
const MAJOR_VALUES = [0, 0.1, 0.2, 0.5, 1, 2, 5, 10];
const MINOR_VALUES = [0.05, 0.15, 0.3, 0.4, 0.7, 1.5, 3, 4, 7];
const MARKER_COLORS = ["#ef8354", "#55b8a6", "#d2a84a", "#8b83d8", "#5ba3d0"];

interface Marker {
  id: number;
  load: Complex;
  z0: number;
  label: string;
  color: string;
}

function finiteNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value: number, digits = 3) {
  if (!Number.isFinite(value)) return "∞";
  if (Math.abs(value) < 1e-12) return "0";
  if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(2);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

function formatComplex(value: Complex, unit = "") {
  const sign = value.im >= 0 ? "+" : "−";
  return `${formatNumber(value.re)} ${sign} j${formatNumber(Math.abs(value.im))}${unit ? ` ${unit}` : ""}`;
}

function formatEngineering(value: number, unit: string) {
  const scales = [
    { limit: 1e-12, factor: 1e-12, prefix: "p" },
    { limit: 1e-9, factor: 1e-9, prefix: "n" },
    { limit: 1e-6, factor: 1e-6, prefix: "µ" },
    { limit: 1e-3, factor: 1e-3, prefix: "m" },
    { limit: 1, factor: 1, prefix: "" },
  ];
  const absolute = Math.abs(value);
  const scale = scales.find((candidate, index) =>
    index === scales.length - 1 || absolute < scales[index + 1].limit,
  ) ?? scales[scales.length - 1];
  return `${formatNumber(value / scale.factor)} ${scale.prefix}${unit}`;
}

function wrapWavelength(value: number) {
  return ((value % 0.5) + 0.5) % 0.5;
}

function gammaPoint(gamma: Complex) {
  return {
    x: CENTER + gamma.re * RADIUS,
    y: CENTER - gamma.im * RADIUS,
  };
}

function impedancePoint(value: Complex) {
  return gammaPoint(impedanceToGamma(value));
}

function NumericField({
  id,
  label,
  value,
  unit,
  min,
  step = "any",
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit?: string;
  min?: number;
  step?: number | "any";
  onChange: (value: number) => void;
}) {
  return (
    <label className="smith-field" htmlFor={id}>
      <span>{label}</span>
      <span className="smith-field-control">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(finiteNumber(event.target.valueAsNumber))}
        />
        {unit ? <small>{unit}</small> : null}
      </span>
    </label>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="smith-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

function SmithGrid({
  showAdmittance,
  fineGrid,
  showLabels,
}: {
  showAdmittance: boolean;
  fineGrid: boolean;
  showLabels: boolean;
}) {
  const resistanceValues = fineGrid ? [...MAJOR_VALUES, ...MINOR_VALUES] : MAJOR_VALUES;
  const reactanceValues = fineGrid ? [...MAJOR_VALUES.slice(1), ...MINOR_VALUES] : MAJOR_VALUES.slice(1);

  return (
    <g className="smith-grid">
      <defs>
        <clipPath id="smith-unit-circle">
          <circle cx={CENTER} cy={CENTER} r={RADIUS} />
        </clipPath>
      </defs>

      <circle className="smith-chart-boundary" cx={CENTER} cy={CENTER} r={RADIUS} />
      <g clipPath="url(#smith-unit-circle)">
        <line
          className="smith-grid-axis"
          x1={CENTER - RADIUS}
          y1={CENTER}
          x2={CENTER + RADIUS}
          y2={CENTER}
        />
        {resistanceValues.filter((value) => value > 0).map((resistance) => (
          <circle
            key={`r-${resistance}`}
            className={MAJOR_VALUES.includes(resistance) ? "smith-grid-major" : "smith-grid-minor"}
            cx={CENTER + (RADIUS * resistance) / (1 + resistance)}
            cy={CENTER}
            r={RADIUS / (1 + resistance)}
          />
        ))}
        {reactanceValues.flatMap((reactance) => [reactance, -reactance]).map((reactance) => (
          <circle
            key={`x-${reactance}`}
            className={MAJOR_VALUES.includes(Math.abs(reactance)) ? "smith-grid-major" : "smith-grid-minor"}
            cx={CENTER + RADIUS}
            cy={CENTER - RADIUS / reactance}
            r={RADIUS / Math.abs(reactance)}
          />
        ))}

        {showAdmittance ? (
          <g className="smith-admittance-grid">
            {MAJOR_VALUES.filter((value) => value > 0).map((conductance) => (
              <circle
                key={`g-${conductance}`}
                cx={CENTER - (RADIUS * conductance) / (1 + conductance)}
                cy={CENTER}
                r={RADIUS / (1 + conductance)}
              />
            ))}
            {MAJOR_VALUES.slice(1).flatMap((value) => [value, -value]).map((susceptance) => (
              <circle
                key={`b-${susceptance}`}
                cx={CENTER - RADIUS}
                cy={CENTER + RADIUS / susceptance}
                r={RADIUS / Math.abs(susceptance)}
              />
            ))}
          </g>
        ) : null}
      </g>

      {showLabels ? (
        <g className="smith-grid-labels" aria-hidden="true">
          {MAJOR_VALUES.map((resistance) => {
            const point = impedancePoint({ re: resistance, im: 0 });
            return (
              <text key={`rl-${resistance}`} x={point.x} y={point.y + 14} textAnchor="middle">
                {resistance}
              </text>
            );
          })}
          {MAJOR_VALUES.slice(1, -1).flatMap((reactance) => [reactance, -reactance]).map((reactance) => {
            const point = impedancePoint({ re: 0, im: reactance });
            return (
              <text
                key={`xl-${reactance}`}
                x={point.x + (point.x < CENTER ? -8 : 8)}
                y={point.y + (reactance > 0 ? -5 : 11)}
                textAnchor={point.x < CENTER ? "end" : "start"}
              >
                {reactance > 0 ? "+" : "−"}{Math.abs(reactance)}j
              </text>
            );
          })}
        </g>
      ) : null}

      <g className="smith-perimeter-ticks" aria-hidden="true">
        {Array.from({ length: 100 }, (_, index) => {
          const angle = -Math.PI + (index / 100) * Math.PI * 2;
          const major = index % 5 === 0;
          const inner = RADIUS + (major ? 10 : 15);
          const outer = RADIUS + 20;
          return (
            <line
              key={index}
              x1={CENTER + Math.cos(angle) * inner}
              y1={CENTER + Math.sin(angle) * inner}
              x2={CENTER + Math.cos(angle) * outer}
              y2={CENTER + Math.sin(angle) * outer}
            />
          );
        })}
        {Array.from({ length: 10 }, (_, index) => {
          const wavelength = index * 0.05;
          const angle = -Math.PI + (index / 10) * Math.PI * 2;
          return (
            <text
              key={index}
              x={CENTER + Math.cos(angle) * (RADIUS + 35)}
              y={CENTER + Math.sin(angle) * (RADIUS + 35) + 4}
              textAnchor="middle"
            >
              {wavelength.toFixed(2)}
            </text>
          );
        })}
      </g>
    </g>
  );
}

export function SmithChartTool() {
  const t = useTranslations("smithChart");
  const [load, setLoad] = useState<Complex>({ re: 75, im: 25 });
  const [z0, setZ0] = useState(50);
  const [frequencyMhz, setFrequencyMhz] = useState(1000);
  const [velocityFactor, setVelocityFactor] = useState(0.66);
  const [distance, setDistance] = useState(0);
  const [towardGenerator, setTowardGenerator] = useState(true);
  const [entryMode, setEntryMode] = useState<"impedance" | "admittance">("impedance");
  const [showAdmittance, setShowAdmittance] = useState(false);
  const [fineGrid, setFineGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nextMarkerRef = useRef(1);

  const safeZ0 = Math.max(0.001, Math.abs(z0));
  const normalizedLoad = useMemo(() => normalizeImpedance(load, safeZ0), [load, safeZ0]);
  const displayedLoad = entryMode === "impedance" ? load : reciprocal(load);
  const transformed = useMemo(
    () => inputImpedance(load, safeZ0, distance, towardGenerator),
    [load, safeZ0, distance, towardGenerator],
  );
  const normalizedTransformed = useMemo(
    () => normalizeImpedance(transformed, safeZ0),
    [transformed, safeZ0],
  );
  const metrics = useMemo(() => smithMetrics(normalizedTransformed), [normalizedTransformed]);
  const admittance = useMemo(() => reciprocal(transformed), [transformed]);
  const loadMetrics = useMemo(() => smithMetrics(normalizedLoad), [normalizedLoad]);
  const currentPoint = gammaPoint(metrics.gamma);
  const loadPoint = gammaPoint(loadMetrics.gamma);
  const frequencyHz = Math.max(1, frequencyMhz * 1e6);
  const physicalLength = distance * (299_792_458 / frequencyHz) * velocityFactor;
  const gammaPhaseRadians = Math.atan2(metrics.gamma.im, metrics.gamma.re);
  const voltageMaximumDistance = wrapWavelength(gammaPhaseRadians / (4 * Math.PI));
  const voltageMinimumDistance = wrapWavelength((gammaPhaseRadians - Math.PI) / (4 * Math.PI));
  const stubSolutions = useMemo(() => shuntStubSolutions(normalizedLoad), [normalizedLoad]);
  const lMatches = useMemo(
    () => [
      ...seriesThenShuntLMatch(normalizedLoad).map((solution) => ({ ...solution, topology: "seriesFirst" as const })),
      ...shuntThenSeriesLMatch(normalizedLoad).map((solution) => ({ ...solution, topology: "shuntFirst" as const })),
    ],
    [normalizedLoad],
  );

  const trajectory = useMemo(() => {
    const points: string[] = [];
    const steps = Math.max(2, Math.ceil(Math.abs(distance) * 240));
    for (let index = 0; index <= steps; index += 1) {
      const currentDistance = (distance * index) / steps;
      const point = gammaPoint(
        smithMetrics(
          normalizeImpedance(
            inputImpedance(load, safeZ0, currentDistance, towardGenerator),
            safeZ0,
          ),
        ).gamma,
      );
      points.push(`${point.x},${point.y}`);
    }
    return points.join(" ");
  }, [distance, load, safeZ0, towardGenerator]);

  function updateEntry(part: "re" | "im", value: number) {
    if (entryMode === "impedance") {
      setLoad((current) => ({ ...current, [part]: value }));
      return;
    }
    const nextAdmittance = { ...displayedLoad, [part]: value };
    setLoad(reciprocal(nextAdmittance));
  }

  function setFromPointer(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const scale = VIEW_SIZE / Math.min(bounds.width, bounds.height);
    const offsetX = bounds.left + (bounds.width - Math.min(bounds.width, bounds.height)) / 2;
    const offsetY = bounds.top + (bounds.height - Math.min(bounds.width, bounds.height)) / 2;
    let gamma = {
      re: ((clientX - offsetX) * scale - CENTER) / RADIUS,
      im: -(((clientY - offsetY) * scale - CENTER) / RADIUS),
    };
    const radius = magnitude(gamma);
    if (radius >= 0.9995) {
      gamma = { re: (gamma.re / radius) * 0.9995, im: (gamma.im / radius) * 0.9995 };
    }
    const normalized = gammaToImpedance(gamma);
    setLoad({ re: normalized.re * safeZ0, im: normalized.im * safeZ0 });
    setDistance(0);
  }

  function saveMarker() {
    const number = nextMarkerRef.current;
    nextMarkerRef.current += 1;
    setMarkers((current) => [
      ...current,
      {
        id: Date.now(),
        load: transformed,
        z0: safeZ0,
        label: `M${number}`,
        color: MARKER_COLORS[current.length % MARKER_COLORS.length],
      },
    ]);
  }

  function exportSvg() {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const rootStyles = window.getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) =>
      rootStyles.getPropertyValue(name).trim() || fallback;
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    const panel = color("--color-panel", "#181a1d");
    const muted = color("--color-text-muted", "#9a9a94");
    const faint = color("--color-text-faint", "#6f716f");
    const accent = color("--accent", "#d1aa69");
    style.textContent = `
      .smith-chart-background{fill:${panel}}
      .smith-chart-boundary{fill:${panel};stroke:${muted};stroke-width:1.35}
      .smith-grid-major,.smith-grid-axis{fill:none;stroke:${muted};stroke-opacity:.56;stroke-width:.82}
      .smith-grid-minor{fill:none;stroke:${faint};stroke-opacity:.32;stroke-width:.55}
      .smith-admittance-grid circle{fill:none;stroke:#55b8a6;stroke-opacity:.48;stroke-width:.65;stroke-dasharray:3 4}
      .smith-grid-labels text,.smith-perimeter-ticks text,.smith-axis-caption,.smith-saved-marker text{fill:${faint};font:8px monospace}
      .smith-perimeter-ticks line{stroke:${faint};stroke-width:.65}
      .smith-vswr-circle{fill:none;stroke:${accent};stroke-opacity:.44;stroke-dasharray:4 5}
      .smith-line-trace{fill:none;stroke:${accent};stroke-width:2.2;stroke-linecap:round}
      .smith-load-marker{fill:${panel};stroke:${accent};stroke-width:1.5}
      .smith-marker-halo{fill:${accent};fill-opacity:.18;stroke:${accent};stroke-opacity:.42}
      .smith-marker-core{fill:${accent};stroke:${panel};stroke-width:2}
      .smith-active-marker path{fill:none;stroke:${accent};stroke-width:.8}
      .smith-saved-marker circle{stroke:${panel};stroke-width:2}
    `;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.insertBefore(style, clone.firstChild);
    const source = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "smith-chart.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const current = {
      id: 0,
      label: "CURRENT",
      load: transformed,
      z0: safeZ0,
      color: "",
    };
    const rows = [
      ["marker", "resistance_ohm", "reactance_ohm", "z0_ohm", "gamma_real", "gamma_imaginary", "vswr"],
      ...[current, ...markers].map((marker) => {
        const markerMetrics = smithMetrics(normalizeImpedance(marker.load, marker.z0));
        return [marker.label, marker.load.re, marker.load.im, marker.z0, markerMetrics.gamma.re, markerMetrics.gamma.im, markerMetrics.vswr];
      }),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "smith-chart-markers.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function describeLMatch(seriesReactance: number, shuntSusceptance: number) {
    const series = reactanceToComponent(seriesReactance * safeZ0, frequencyHz);
    const shunt = susceptanceToComponent(shuntSusceptance / safeZ0, frequencyHz);
    return `${t(`components.${series.kind}`)} ${formatEngineering(series.value, series.kind === "L" ? "H" : "F")} · ${t(`components.${shunt.kind}`)} ${formatEngineering(shunt.value, shunt.kind === "L" ? "H" : "F")}`;
  }

  return (
    <div className="smith-workbench">
      <section className="smith-chart-panel" aria-label={t("chartAriaLabel")}>
        <div className="smith-panel-toolbar">
          <div>
            <span className="smith-panel-index">RF / 01</span>
            <strong>{t("chartTitle")}</strong>
          </div>
          <div className="smith-toolbar-actions">
            <button type="button" onClick={() => { setLoad({ re: 50, im: 0 }); setZ0(50); setDistance(0); }}>{t("reset")}</button>
            <button type="button" onClick={saveMarker}>{t("saveMarker")}</button>
            <button type="button" onClick={exportSvg}>SVG</button>
            <button type="button" onClick={exportCsv}>CSV</button>
          </div>
        </div>

        <div className="smith-chart-stage">
          <svg
            ref={svgRef}
            className="smith-chart-svg"
            viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
            role="img"
            aria-label={t("chartAriaLabel")}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              setFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (dragging) setFromPointer(event.clientX, event.clientY);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          >
            <rect width={VIEW_SIZE} height={VIEW_SIZE} className="smith-chart-background" />
            <SmithGrid showAdmittance={showAdmittance} fineGrid={fineGrid} showLabels={showLabels} />
            <circle
              className="smith-vswr-circle"
              cx={CENTER}
              cy={CENTER}
              r={Math.min(loadMetrics.magnitude, 0.999) * RADIUS}
            />
            {distance > 0 ? <polyline className="smith-line-trace" points={trajectory} /> : null}
            {markers.map((marker) => {
              const point = gammaPoint(smithMetrics(normalizeImpedance(marker.load, marker.z0)).gamma);
              return (
                <g className="smith-saved-marker" key={marker.id} transform={`translate(${point.x} ${point.y})`}>
                  <circle r="7" style={{ fill: marker.color }} />
                  <text x="11" y="-10">{marker.label}</text>
                </g>
              );
            })}
            {distance > 0 ? <circle className="smith-load-marker" cx={loadPoint.x} cy={loadPoint.y} r="5" /> : null}
            <g className="smith-active-marker" transform={`translate(${currentPoint.x} ${currentPoint.y})`}>
              <circle className="smith-marker-halo" r="14" />
              <circle className="smith-marker-core" r="6" />
              <path d="M-19 0h10M9 0h10M0-19v10M0 9v10" />
            </g>
            <text className="smith-axis-caption" x={CENTER - RADIUS} y={CENTER - 9} textAnchor="start">0</text>
            <text className="smith-axis-caption" x={CENTER} y={CENTER - 9} textAnchor="middle">1</text>
            <text className="smith-axis-caption" x={CENTER + RADIUS} y={CENTER - 9} textAnchor="end">∞</text>
          </svg>
          <p className="smith-chart-hint">{t("dragHint")}</p>
        </div>

        <div className="smith-chart-options">
          <Toggle checked={fineGrid} label={t("fineGrid")} onChange={setFineGrid} />
          <Toggle checked={showLabels} label={t("scaleLabels")} onChange={setShowLabels} />
          <Toggle checked={showAdmittance} label={t("admittanceOverlay")} onChange={setShowAdmittance} />
        </div>
      </section>

      <aside className="smith-controls">
        <section className="smith-control-card">
          <div className="smith-card-heading">
            <div><span>PORT / INPUT</span><h2>{t("inputTitle")}</h2></div>
            <div className="smith-segmented">
              <button type="button" data-active={entryMode === "impedance"} onClick={() => setEntryMode("impedance")}>Z</button>
              <button type="button" data-active={entryMode === "admittance"} onClick={() => setEntryMode("admittance")}>Y</button>
            </div>
          </div>
          <div className="smith-field-grid">
            <NumericField id="smith-entry-real" label={entryMode === "impedance" ? t("resistance") : t("conductance")} value={finiteNumber(displayedLoad.re)} unit={entryMode === "impedance" ? "Ω" : "S"} onChange={(value) => updateEntry("re", value)} />
            <NumericField id="smith-entry-imag" label={entryMode === "impedance" ? t("reactance") : t("susceptance")} value={finiteNumber(displayedLoad.im)} unit={entryMode === "impedance" ? "Ω" : "S"} onChange={(value) => updateEntry("im", value)} />
            <NumericField id="smith-z0" label={t("lineImpedance")} value={z0} unit="Ω" min={0.001} onChange={(value) => setZ0(Math.max(0.001, value))} />
            <NumericField id="smith-frequency" label={t("frequency")} value={frequencyMhz} unit="MHz" min={0.000001} onChange={(value) => setFrequencyMhz(Math.max(0.000001, value))} />
          </div>
          <div className="smith-presets">
            {[25, 50, 75, 100].map((value) => <button type="button" key={value} onClick={() => setZ0(value)}>{value} Ω</button>)}
          </div>
        </section>

        <section className="smith-control-card">
          <div className="smith-card-heading">
            <div><span>TL / ROTATION</span><h2>{t("lineTitle")}</h2></div>
            <strong className="smith-readout">{distance.toFixed(3)} λ</strong>
          </div>
          <div className="smith-direction">
            <button type="button" data-active={towardGenerator} onClick={() => setTowardGenerator(true)}>{t("towardGenerator")}</button>
            <button type="button" data-active={!towardGenerator} onClick={() => setTowardGenerator(false)}>{t("towardLoad")}</button>
          </div>
          <label className="smith-range">
            <span><b>{t("electricalLength")}</b><output>{formatNumber(distance * 360, 1)}°</output></span>
            <input type="range" min="0" max="0.5" step="0.001" value={distance} onChange={(event) => setDistance(Number(event.target.value))} />
          </label>
          <div className="smith-field-grid smith-field-grid-compact">
            <NumericField id="smith-distance" label={t("wavelengths")} value={distance} unit="λ" min={0} step={0.001} onChange={(value) => setDistance(Math.min(0.5, Math.max(0, value)))} />
            <NumericField id="smith-vf" label={t("velocityFactor")} value={velocityFactor} min={0.01} step={0.01} onChange={(value) => setVelocityFactor(Math.min(1, Math.max(0.01, value)))} />
          </div>
          <p className="smith-physical-length">{t("physicalLength")}: <strong>{formatEngineering(physicalLength, "m")}</strong></p>
        </section>

        <section className="smith-control-card smith-results-card">
          <div className="smith-card-heading"><div><span>READOUT / LIVE</span><h2>{t("resultsTitle")}</h2></div></div>
          <dl className="smith-results">
            <div><dt>{t("normalizedImpedance")}</dt><dd>{formatComplex(normalizedTransformed)}</dd></div>
            <div><dt>{t("impedance")}</dt><dd>{formatComplex(transformed, "Ω")}</dd></div>
            <div><dt>{t("admittance")}</dt><dd>{formatComplex(admittance, "S")}</dd></div>
            <div><dt>Γ</dt><dd>{formatComplex(metrics.gamma)}</dd></div>
            <div><dt>|Γ| ∠ θ</dt><dd>{formatNumber(metrics.magnitude, 4)} ∠ {formatNumber(metrics.phaseDegrees, 1)}°</dd></div>
            <div><dt>VSWR</dt><dd>{formatNumber(metrics.vswr, 3)}</dd></div>
            <div><dt>{t("returnLoss")}</dt><dd>{formatNumber(metrics.returnLossDb, 2)} dB</dd></div>
            <div><dt>{t("mismatchLoss")}</dt><dd>{formatNumber(metrics.mismatchLossDb, 3)} dB</dd></div>
            <div><dt>{t("qualityFactor")}</dt><dd>{formatNumber(Math.abs(normalizedTransformed.im) / Math.max(normalizedTransformed.re, 1e-12), 3)}</dd></div>
            <div><dt>{t("reflectedPower")}</dt><dd>{formatNumber(metrics.magnitude * metrics.magnitude * 100, 2)}%</dd></div>
            <div><dt>{t("voltageMaximum")}</dt><dd>{formatNumber(voltageMaximumDistance, 4)} λ</dd></div>
            <div><dt>{t("voltageMinimum")}</dt><dd>{formatNumber(voltageMinimumDistance, 4)} λ</dd></div>
          </dl>
        </section>

        <section className="smith-control-card smith-match-card">
          <div className="smith-card-heading"><div><span>MATCH / SYNTHESIS</span><h2>{t("matchingTitle")}</h2></div></div>
          <h3>{t("stubMatching")}</h3>
          {stubSolutions.length ? (
            <div className="smith-solution-list">
              {stubSolutions.map((solution, index) => (
                <div key={index}>
                  <strong>{t("solution", { number: index + 1 })}</strong>
                  <span>{t("distanceFromLoad")}: {formatNumber(solution.distanceWavelengths, 4)} λ</span>
                  <span>{t("shortStub")}: {formatNumber(solution.shortStubWavelengths, 4)} λ</span>
                  <span>{t("openStub")}: {formatNumber(solution.openStubWavelengths, 4)} λ</span>
                </div>
              ))}
            </div>
          ) : <p className="smith-empty">{t("noPassiveMatch")}</p>}
          <h3>{t("lNetwork")}</h3>
          {lMatches.length ? (
            <div className="smith-solution-list">
              {lMatches.slice(0, 4).map((solution, index) => (
                <div key={`${solution.topology}-${index}`}>
                  <strong>{t(`topology.${solution.topology}`)}</strong>
                  <span>{describeLMatch(solution.seriesReactance, solution.shuntSusceptance)}</span>
                </div>
              ))}
            </div>
          ) : <p className="smith-empty">{t("noPassiveMatch")}</p>}
        </section>

        {markers.length ? (
          <section className="smith-control-card">
            <div className="smith-card-heading"><div><span>MEMORY / POINTS</span><h2>{t("markersTitle")}</h2></div><button className="smith-text-button" type="button" onClick={() => setMarkers([])}>{t("clear")}</button></div>
            <ul className="smith-marker-list">
              {markers.map((marker) => <li key={marker.id}><i style={{ background: marker.color }} /><button className="smith-marker-recall" type="button" title={t("recallMarker", { marker: marker.label })} onClick={() => { setLoad(marker.load); setZ0(marker.z0); setDistance(0); }}><strong>{marker.label}</strong>{formatComplex(marker.load, "Ω")}</button><button type="button" aria-label={t("deleteMarker", { marker: marker.label })} onClick={() => setMarkers((current) => current.filter((item) => item.id !== marker.id))}>×</button></li>)}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

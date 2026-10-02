export interface Complex {
  re: number;
  im: number;
}

export interface SmithMetrics {
  gamma: Complex;
  magnitude: number;
  phaseDegrees: number;
  vswr: number;
  returnLossDb: number;
  mismatchLossDb: number;
}

export interface StubSolution {
  distanceWavelengths: number;
  susceptance: number;
  shortStubWavelengths: number;
  openStubWavelengths: number;
}

export interface LMatchSolution {
  seriesReactance: number;
  shuntSusceptance: number;
}

const EPSILON = 1e-12;

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function multiply(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function divide(a: Complex, b: Complex): Complex {
  const denominator = b.re * b.re + b.im * b.im;
  if (denominator < EPSILON) {
    return { re: Number.POSITIVE_INFINITY, im: Number.POSITIVE_INFINITY };
  }
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator,
  };
}

export function reciprocal(value: Complex): Complex {
  return divide({ re: 1, im: 0 }, value);
}

export function magnitude(value: Complex) {
  return Math.hypot(value.re, value.im);
}

export function normalizeImpedance(load: Complex, z0: number): Complex {
  const safeZ0 = Math.max(EPSILON, Math.abs(z0));
  return { re: load.re / safeZ0, im: load.im / safeZ0 };
}

export function impedanceToGamma(normalized: Complex): Complex {
  return divide(
    { re: normalized.re - 1, im: normalized.im },
    { re: normalized.re + 1, im: normalized.im },
  );
}

export function gammaToImpedance(gamma: Complex): Complex {
  return divide(
    { re: 1 + gamma.re, im: gamma.im },
    { re: 1 - gamma.re, im: -gamma.im },
  );
}

export function rotateGamma(
  gamma: Complex,
  distanceWavelengths: number,
  towardGenerator = true,
): Complex {
  const angle = (towardGenerator ? -1 : 1) * 4 * Math.PI * distanceWavelengths;
  return multiply(gamma, { re: Math.cos(angle), im: Math.sin(angle) });
}

export function inputImpedance(
  load: Complex,
  z0: number,
  distanceWavelengths: number,
  towardGenerator = true,
): Complex {
  const normalized = normalizeImpedance(load, z0);
  const rotated = rotateGamma(
    impedanceToGamma(normalized),
    distanceWavelengths,
    towardGenerator,
  );
  const result = gammaToImpedance(rotated);
  return { re: result.re * z0, im: result.im * z0 };
}

export function smithMetrics(normalized: Complex): SmithMetrics {
  const gamma = impedanceToGamma(normalized);
  const rawMagnitude = magnitude(gamma);
  const boundedMagnitude = Math.min(rawMagnitude, 1 - EPSILON);
  return {
    gamma,
    magnitude: rawMagnitude,
    phaseDegrees: (Math.atan2(gamma.im, gamma.re) * 180) / Math.PI,
    vswr: rawMagnitude >= 1 ? Number.POSITIVE_INFINITY : (1 + rawMagnitude) / (1 - rawMagnitude),
    returnLossDb:
      rawMagnitude < EPSILON ? Number.POSITIVE_INFINITY : -20 * Math.log10(rawMagnitude),
    mismatchLossDb: -10 * Math.log10(1 - boundedMagnitude * boundedMagnitude),
  };
}

function wrapHalfWavelength(value: number) {
  return ((value % 0.5) + 0.5) % 0.5;
}

function findCrossings(
  normalizedLoad: Complex,
  selector: (impedance: Complex) => number,
): number[] {
  const samples = 4096;
  const roots: number[] = [];
  let previousDistance = 0;
  let previousValue = selector(
    gammaToImpedance(impedanceToGamma(normalizedLoad)),
  ) - 1;

  for (let index = 1; index <= samples; index += 1) {
    const distance = (0.5 * index) / samples;
    const impedance = gammaToImpedance(
      rotateGamma(impedanceToGamma(normalizedLoad), distance),
    );
    const value = selector(impedance) - 1;
    if (Number.isFinite(value) && previousValue * value <= 0) {
      let low = previousDistance;
      let high = distance;
      for (let iteration = 0; iteration < 48; iteration += 1) {
        const middle = (low + high) / 2;
        const middleImpedance = gammaToImpedance(
          rotateGamma(impedanceToGamma(normalizedLoad), middle),
        );
        const middleValue = selector(middleImpedance) - 1;
        if (previousValue * middleValue <= 0) high = middle;
        else low = middle;
      }
      const root = wrapHalfWavelength((low + high) / 2);
      if (!roots.some((candidate) => Math.abs(candidate - root) < 1e-5)) roots.push(root);
    }
    previousDistance = distance;
    previousValue = value;
  }

  return roots.slice(0, 2).sort((a, b) => a - b);
}

function stubLengthForTan(target: number) {
  return wrapHalfWavelength(Math.atan(target) / (2 * Math.PI));
}

function stubLengthForNegativeCot(target: number) {
  return wrapHalfWavelength(Math.atan2(1, -target) / (2 * Math.PI));
}

export function shuntStubSolutions(normalizedLoad: Complex): StubSolution[] {
  if (normalizedLoad.re < 0 || !Number.isFinite(normalizedLoad.re + normalizedLoad.im)) {
    return [];
  }

  return findCrossings(normalizedLoad, (impedance) => reciprocal(impedance).re)
    .map((distance) => {
      const impedance = gammaToImpedance(
        rotateGamma(impedanceToGamma(normalizedLoad), distance),
      );
      const admittance = reciprocal(impedance);
      const requiredSusceptance = -admittance.im;
      return {
        distanceWavelengths: distance,
        susceptance: requiredSusceptance,
        shortStubWavelengths: stubLengthForNegativeCot(requiredSusceptance),
        openStubWavelengths: stubLengthForTan(requiredSusceptance),
      };
    })
    .filter((solution) => Number.isFinite(solution.susceptance));
}

export function seriesThenShuntLMatch(normalizedLoad: Complex): LMatchSolution[] {
  const { re: resistance, im: reactance } = normalizedLoad;
  if (resistance <= 0 || resistance > 1) return [];
  const target = Math.sqrt(Math.max(0, resistance - resistance * resistance));
  return [target, -target].map((totalReactance) => ({
    seriesReactance: totalReactance - reactance,
    shuntSusceptance: totalReactance / resistance,
  }));
}

export function shuntThenSeriesLMatch(normalizedLoad: Complex): LMatchSolution[] {
  const admittance = reciprocal(normalizedLoad);
  if (admittance.re <= 0 || admittance.re > 1) return [];
  const target = Math.sqrt(
    Math.max(0, admittance.re - admittance.re * admittance.re),
  );
  return [target, -target].map((totalSusceptance) => {
    const adjustedAdmittance = {
      re: admittance.re,
      im: totalSusceptance,
    };
    const adjustedImpedance = reciprocal(adjustedAdmittance);
    return {
      seriesReactance: -adjustedImpedance.im,
      shuntSusceptance: totalSusceptance - admittance.im,
    };
  });
}

export function reactanceToComponent(
  reactanceOhms: number,
  frequencyHz: number,
) {
  const angularFrequency = 2 * Math.PI * Math.max(frequencyHz, EPSILON);
  if (reactanceOhms >= 0) {
    return { kind: "L" as const, value: reactanceOhms / angularFrequency };
  }
  return { kind: "C" as const, value: -1 / (angularFrequency * reactanceOhms) };
}

export function susceptanceToComponent(
  susceptanceSiemens: number,
  frequencyHz: number,
) {
  const angularFrequency = 2 * Math.PI * Math.max(frequencyHz, EPSILON);
  if (susceptanceSiemens >= 0) {
    return { kind: "C" as const, value: susceptanceSiemens / angularFrequency };
  }
  return { kind: "L" as const, value: -1 / (angularFrequency * susceptanceSiemens) };
}

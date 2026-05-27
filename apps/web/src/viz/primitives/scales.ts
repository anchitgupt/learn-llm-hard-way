import {
  scaleBand,
  scaleLinear,
  scaleSequential,
  type ScaleBand,
  type ScaleLinear,
  type ScaleSequential
} from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

export function linearScale(domain: [number, number], range: [number, number]): ScaleLinear<number, number> {
  return scaleLinear<number, number>().domain(domain).range(range);
}

export function bandScale(domain: string[], range: [number, number], padding = 0.08): ScaleBand<string> {
  return scaleBand<string>().domain(domain).range(range).padding(padding);
}

export function sequentialScale(domain: [number, number]): ScaleSequential<string> {
  let low = "#0b1220";
  let high = "#22d3ee";
  if (typeof window !== "undefined" && document?.documentElement) {
    const cs = getComputedStyle(document.documentElement);
    const v1 = cs.getPropertyValue("--bg-inset").trim();
    const v2 = cs.getPropertyValue("--accent").trim();
    if (v1) low = v1;
    if (v2) high = v2;
  }
  const interp = interpolateRgb(low, high);
  return scaleSequential<string>(interp).domain(domain);
}

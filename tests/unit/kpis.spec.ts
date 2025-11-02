import { describe, it, expect } from "vitest";
import { aov, repeatRate } from "@/kpis/calc";

describe("kpi calc", () => {
  it("computes AOV", () => {
    expect(aov([{ grossTotal: 50 }, { grossTotal: 150 }])).toBe(100);
    expect(aov([])).toBe(0);
  });

  it("computes repeat rate", () => {
    expect(repeatRate(80, 20)).toBeCloseTo(0.2);
    expect(repeatRate(0, 0)).toBe(0);
  });
});


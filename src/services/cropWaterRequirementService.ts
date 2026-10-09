import { CropAgronomicProfile, CropGrowthStage } from '../types/soilModule';

// ============================================================================
// CROP WATER REQUIREMENT & EVAPOTRANSPIRATION SERVICE (FAO-56 Dual Kc Model)
// ============================================================================

/**
 * Get the interpolated crop coefficient (Kc) for a specific day of the crop life cycle
 */
export function getDailyCropKc(crop: CropAgronomicProfile, dayAfterSowing: number): number {
  if (dayAfterSowing <= 0) return 0.35; // Bare moist soil coefficient

  const stages = crop.growthStages;
  let accumulatedDays = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const prevAccumulated = accumulatedDays;
    accumulatedDays += stage.durationDays;

    if (dayAfterSowing <= accumulatedDays) {
      // Inside this growth stage
      if (stage.stage === 'initial') {
        return stage.kc;
      } else if (stage.stage === 'development') {
        // Linear interpolation from initial Kc to mid-season Kc
        const initKc = stages[0].kc;
        const midKc = stages[2]?.kc || stage.kc;
        const progress = (dayAfterSowing - prevAccumulated) / stage.durationDays;
        return +(initKc + progress * (midKc - initKc)).toFixed(2);
      } else if (stage.stage === 'mid_season') {
        return stage.kc;
      } else if (stage.stage === 'late_season') {
        // Linear interpolation from mid-season Kc to harvest Kc
        const midKc = stages[2]?.kc || 1.1;
        const endKc = stage.kc;
        const progress = (dayAfterSowing - prevAccumulated) / stage.durationDays;
        return +(midKc - progress * (midKc - endKc)).toFixed(2);
      }
    }
  }

  // If day exceeds total duration, return end stage Kc
  return stages[stages.length - 1]?.kc || 0.45;
}

/**
 * Calculate FAO-56 Water Stress Coefficient (Ks)
 * When root-zone water S(t) is above RAW, Ks = 1.0 (no stress).
 * When S(t) falls below RAW, Ks reduces linearly to 0 at wilting point.
 */
export function calculateWaterStressFactor(
  storageMm: number,
  tawMm: number,
  rawMm: number
): number {
  if (tawMm <= 0) return 1.0;
  if (storageMm >= rawMm) {
    return 1.0; // No transpiration reduction
  }
  if (storageMm <= 0) {
    return 0.05; // Residual minimal evaporation
  }
  // Linear reduction: Ks = Storage / RAW
  const ks = storageMm / Math.max(1, rawMm);
  return +Math.min(1.0, Math.max(0.05, ks)).toFixed(3);
}

/**
 * Calculate daily potential crop evapotranspiration (ETc)
 * ETc = ET0 * Kc
 */
export function calculatePotentialETc(et0Mm: number, kc: number): number {
  return +(Math.max(0.5, et0Mm) * kc).toFixed(2);
}

/**
 * Calculate actual crop evapotranspiration (ETa) accounting for water stress
 * ETa = Ks * ETc
 */
export function calculateActualETa(potentialETc: number, ks: number): number {
  return +(potentialETc * ks).toFixed(2);
}

import {
  CropAgronomicProfile,
  SoilHydraulicProperties,
  IrrigationMethod,
  SowingRecommendation,
  RiskLevel,
} from '../types/soilModule';

// ============================================================================
// SOWING WINDOW RECOMMENDATION ENGINE (Multi-Factor Agronomic Model)
// ============================================================================

export function evaluateBestSowingWindow(
  crop: CropAgronomicProfile,
  soil: SoilHydraulicProperties,
  state: string,
  district: string,
  irrigationMethod: IrrigationMethod,
  availableWaterPercent: number,
  recentRainfallMm: number
): SowingRecommendation {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesHi = [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];

  // 1. Find regional sowing window from ICAR database
  const s = (state || '').toLowerCase();
  const d = (district || '').toLowerCase();
  
  let regionalWindow = crop.regionalSowingWindows[0];
  if (crop.regionalSowingWindows.length > 1) {
    const matched = crop.regionalSowingWindows.find((w) => {
      const reg = w.region.toLowerCase();
      return reg.includes(s) || (d && reg.includes(d));
    });
    if (matched) regionalWindow = matched;
  }

  const startMonthName = monthNames[regionalWindow.startMonth - 1];
  const endMonthName = monthNames[regionalWindow.endMonth - 1];
  const bestMonthName = monthNames[regionalWindow.peakMonth - 1];
  const bestMonthNameHi = monthNamesHi[regionalWindow.peakMonth - 1];

  const recStart = `${regionalWindow.startDay} ${startMonthName}`;
  const recEnd = `${regionalWindow.endDay} ${endMonthName}`;

  // 2. Score Sowing Suitability (0 - 100) based on Soil Moisture, Soil Texture, and Irrigation
  let suitabilityScore = 75; // baseline
  let riskLevel: RiskLevel = 'Low';

  // Seedbed moisture factor
  if (availableWaterPercent >= 50 && availableWaterPercent <= 85) {
    suitabilityScore += 15; // Optimal seedbed germination moisture
  } else if (availableWaterPercent < 35 && irrigationMethod === 'rainfed') {
    suitabilityScore -= 25; // Risk of poor emergence / seed death
    riskLevel = 'High';
  } else if (availableWaterPercent > 92 && soil.id === 'black_cotton') {
    suitabilityScore -= 15; // Risk of sticky seedbed / seed rotting
    riskLevel = 'Moderate';
  }

  // Soil texture suitability factor
  if (crop.suitableSoilTypes.includes(soil.id)) {
    suitabilityScore += 10;
  } else {
    suitabilityScore -= 10;
  }

  // Irrigation buffer
  if (irrigationMethod !== 'rainfed') {
    suitabilityScore += 10;
    if (riskLevel === 'High') riskLevel = 'Moderate';
  }

  suitabilityScore = Math.max(20, Math.min(98, suitabilityScore));
  if (suitabilityScore >= 75) riskLevel = 'Low';
  else if (suitabilityScore >= 50) riskLevel = 'Moderate';
  else riskLevel = 'High';

  // 3. Formulate Agronomic Rationale
  const isRainfed = irrigationMethod === 'rainfed';
  let primaryRationale = '';
  let primaryRationaleHi = '';

  if (crop.primarySeason === 'kharif') {
    if (isRainfed) {
      primaryRationale = `Sowing between ${recStart} and ${recEnd} coincides with steady South-West monsoon establishment in ${district || state}, ensuring ${soil.name} reaches 50-70% available root-zone moisture required for uniform seedling emergence.`;
      primaryRationaleHi = `${district || state} में ${recStart} से ${recEnd} के मध्य बुवाई दक्षिण-पश्चिम मानसून के आगमन के साथ मेल खाती है, जिससे ${soil.nameHi} में 50-70% नमी सुनिश्चित होती है।`;
    } else {
      primaryRationale = `Irrigated sowing from ${recStart} provides early crop vigor and canopy cover before peak monsoon downpours, maximizing yield potential.`;
      primaryRationaleHi = `सिंचित अवस्था में ${recStart} से बुवाई करने पर फसल को शुरुआती बढ़त मिलती है और मानसून की भारी बारिश से पहले फसल मजबूत हो जाती है।`;
    }
  } else if (crop.primarySeason === 'rabi') {
    primaryRationale = `Optimal sowing window is ${recStart} to ${recEnd} as soil temperatures decline to 18-22°C, facilitating strong crown root development in ${soil.name}.`;
    primaryRationaleHi = `${recStart} से ${recEnd} का समय सबसे उपयुक्त है क्योंकि मिट्टी का तापमान 18-22°C तक आ जाता है, जो ${soil.nameHi} में मजबूत जड़ों के विकास हेतु आदर्श है।`;
  } else {
    primaryRationale = `Recommended sowing from ${recStart} to ${recEnd} optimizes thermal heat units and sunlight availability in ${state}.`;
    primaryRationaleHi = `${state} में ${recStart} से ${recEnd} के बीच बुवाई धूप और तापमान का अधिकतम लाभ प्रदान करती है।`;
  }

  // 4. Alternative Window
  let altWindow = null;
  if (riskLevel !== 'Low') {
    const altStartMonth = ((regionalWindow.startMonth % 12) + 1);
    altWindow = {
      start: `1 ${monthNames[altStartMonth - 1]}`,
      end: `15 ${monthNames[altStartMonth - 1]}`,
      rationale: isRainfed
        ? 'Secondary window if monsoon onset is delayed or initial seedbed moisture is inadequate.'
        : 'Delayed sowing window with supplementary pre-sowing irrigation (Paleva).',
    };
  }

  // 5. Rainfed Viability Assessment
  const isRainfedViable = soil.availableWaterCapacity >= 0.12 && crop.totalWaterRequirementMm[0] <= 650;
  const irrigationRec = isRainfedViable
    ? 'Rainfed cultivation is feasible in this soil; 1-2 protective irrigations at critical flowering/pod setting stages will secure maximum yield.'
    : 'Supplementary irrigation (Drip/Sprinkler) is strongly recommended due to soil moisture percolation constraints.';

  return {
    cropName: crop.name,
    cropNameHi: crop.nameHi,
    recommendedWindowStart: recStart,
    recommendedWindowEnd: recEnd,
    bestSowingMonth: bestMonthName,
    bestSowingMonthHi: bestMonthNameHi,
    sowingSuitabilityScore: suitabilityScore,
    riskLevel,
    primaryRationale,
    primaryRationaleHi,
    waterAvailabilityStatus: availableWaterPercent > 50 ? 'Favorable Moisture' : 'Moderate / Dry',
    expectedEstablishmentRainfallMm: Math.round(recentRainfallMm * 1.2),
    alternativeWindow: altWindow,
    isRainfedViable,
    irrigationRecommendation: irrigationRec,
  };
}

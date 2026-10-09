import { CropAgronomicProfile, HarvestEstimation } from '../types/soilModule';

// ============================================================================
// HARVEST & RIPENING ESTIMATOR SERVICE
// ============================================================================

export function estimateHarvestPeriod(
  crop: CropAgronomicProfile,
  sowingMonth: number,
  sowingDay: number = 15,
  year: number = 2025
): HarvestEstimation {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Base Sowing Date
  const sowingDate = new Date(year, sowingMonth - 1, sowingDay);
  const duration = crop.defaultDurationDays;

  // Maturity Date = Sowing Date + Duration Days
  const maturityDate = new Date(sowingDate.getTime() + duration * 24 * 3600 * 1000);
  const harvestStart = new Date(maturityDate.getTime() - 5 * 24 * 3600 * 1000);
  const harvestEnd = new Date(maturityDate.getTime() + 10 * 24 * 3600 * 1000);

  const formatDate = (d: Date) => `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  // Build Growth Stage Timeline with exact dates
  let curDateMs = sowingDate.getTime();
  const stages = crop.growthStages;
  const growthStageTimeline = stages.map((stg) => {
    const stageStart = new Date(curDateMs);
    const stageEnd = new Date(curDateMs + stg.durationDays * 24 * 3600 * 1000);
    curDateMs = stageEnd.getTime();

    // Approximate stage water demand in mm
    const avgDemand = Math.round((crop.totalWaterRequirementMm[0] / duration) * stg.durationDays * stg.kc);

    return {
      stage: stg.name,
      stageHi: stg.nameHi,
      startDate: `${stageStart.getDate()} ${monthNames[stageStart.getMonth()]}`,
      endDate: `${stageEnd.getDate()} ${monthNames[stageEnd.getMonth()]}`,
      durationDays: stg.durationDays,
      waterDemandMm: avgDemand,
      criticality: stg.criticalMoistureSensitivity,
    };
  });

  // Identify Harvest Weather Risks
  const harvestMonth = maturityDate.getMonth() + 1;
  const potentialHarvestRisks: string[] = [];
  const potentialHarvestRisksHi: string[] = [];

  if (crop.primarySeason === 'kharif' && (harvestMonth === 9 || harvestMonth === 10)) {
    potentialHarvestRisks.push('Late retreating monsoon showers may cause grain discoloration and delayed threshing.');
    potentialHarvestRisksHi.push('मानसून की वापसी में बेमौसम बारिश से दाने का रंग खराब होने और कटाई में देरी का जोखिम।');
    potentialHarvestRisks.push('High morning relative humidity can delay field grain drying.');
    potentialHarvestRisksHi.push('सुबह की अधिक आर्द्रता से खेत में दाना सूखने में अतिरिक्त समय लग सकता है।');
  } else if (crop.primarySeason === 'rabi' && (harvestMonth === 3 || harvestMonth === 4)) {
    potentialHarvestRisks.push('Early spring heatwaves and sudden convective hail showers (Western Disturbance).');
    potentialHarvestRisksHi.push('मार्च-अप्रैल में अचानक तापमान वृद्धि (लू) एवं पश्चिमी विक्षोभ से ओलावृष्टि का जोखिम।');
    potentialHarvestRisks.push('Gusty dry winds causing seed shattering in over-mature standing crop.');
    potentialHarvestRisksHi.push('तेज शुष्क हवाओं से अधिक पकी फसल में दाने झड़ने की संभावना।');
  } else {
    potentialHarvestRisks.push('Pre-harvest unseasonal rain showers requiring safe covered storage arrangements.');
    potentialHarvestRisksHi.push('कटाई के समय अचानक वर्षा से बचाव हेतु तिरपाल व सुरक्षित भंडारण की व्यवस्था रखें।');
  }

  return {
    recommendedSowingDate: formatDate(sowingDate),
    estimatedMaturityDate: formatDate(maturityDate),
    harvestWindowStart: formatDate(harvestStart),
    harvestWindowEnd: formatDate(harvestEnd),
    cropDurationDays: duration,
    maturityTerm: crop.maturityTerminology,
    maturityTermHi: crop.maturityTerminologyHi,
    growthStageTimeline,
    potentialHarvestRisks,
    potentialHarvestRisksHi,
  };
}

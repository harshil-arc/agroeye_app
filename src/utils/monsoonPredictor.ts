import {
  HISTORIC_MONSOON_DATA,
  REGIONAL_MONSOON_DATA
} from '../data/historicMonsoonData';
import {
  PredictionParameters,
  PredictionResult,
  ImpactFactor,
  MonsoonYearRecord,
  StateRegionData
} from '../types/monsoon';

// Helper to convert day of year to "DD Month" string for non-leap years
export function dayOfYearToDateString(day: number, year: number = 2026): string {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
    'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];

  let remainingDays = Math.round(day);
  let monthIndex = 0;

  while (monthIndex < 12 && remainingDays > daysInMonths[monthIndex]) {
    remainingDays -= daysInMonths[monthIndex];
    monthIndex++;
  }

  const paddedDay = remainingDays < 10 ? `0${remainingDays}` : `${remainingDays}`;
  return `${paddedDay} ${monthNames[monthIndex] || 'June'}`;
}

// Convert "DD Month" or "YYYY-MM-DD" to Day of Year
export function dateStringToDayOfYear(dateStr: string, isLeap: boolean = false): number {
  const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthMap: { [key: string]: number } = {
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    oct: 9,
    sept: 8,
    sep: 8,
  };

  const parts = dateStr.trim().split(/[\s-]+/);
  if (parts.length >= 2) {
    let d = parseInt(parts[0], 10);
    let mName = parts[1].toLowerCase();
    
    // Check if YYYY-MM-DD format
    if (parts.length === 3 && parts[0].length === 4) {
      d = parseInt(parts[2], 10);
      const mNum = parseInt(parts[1], 10) - 1;
      let total = 0;
      for (let i = 0; i < mNum; i++) total += daysInMonths[i];
      return total + d;
    }

    const mIdx = monthMap[mName] ?? 5;
    let total = 0;
    for (let i = 0; i < mIdx; i++) total += daysInMonths[i];
    return total + d;
  }
  return 152;
}

// Calculate Historical Baseline Statistics
export function calculateHistoricalStats(records: MonsoonYearRecord[] = HISTORIC_MONSOON_DATA) {
  const n = records.length;
  if (n === 0) return { meanDay: 152, stdDev: 5, medianDay: 152, minDay: 139, maxDay: 170, earlyCount: 0, normalCount: 0, delayCount: 0 };

  const dayValues = records.map(r => r.dayOfYear);
  const sum = dayValues.reduce((acc, val) => acc + val, 0);
  const meanDay = sum / n;

  const variance = dayValues.reduce((acc, val) => acc + Math.pow(val - meanDay, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const sortedDays = [...dayValues].sort((a, b) => a - b);
  const medianDay = n % 2 === 0 ? (sortedDays[n / 2 - 1] + sortedDays[n / 2]) / 2 : sortedDays[Math.floor(n / 2)];

  const earlyCount = records.filter(r => r.category === 'Early').length;
  const normalCount = records.filter(r => r.category === 'Normal').length;
  const delayCount = records.filter(r => r.category === 'Delayed').length;

  const earliestRecord = [...records].sort((a, b) => a.dayOfYear - b.dayOfYear)[0];
  const latestRecord = [...records].sort((a, b) => b.dayOfYear - a.dayOfYear)[0];

  const avgRainfallLPA = records.reduce((acc, r) => acc + r.rainfallPercentOfLPA, 0) / n;

  return {
    totalYears: n,
    meanDay: Number(meanDay.toFixed(1)),
    meanDateFormatted: dayOfYearToDateString(meanDay),
    stdDev: Number(stdDev.toFixed(1)),
    medianDay,
    medianDateFormatted: dayOfYearToDateString(medianDay),
    minRecord: earliestRecord,
    maxRecord: latestRecord,
    earlyCount,
    normalCount,
    delayCount,
    earlyPercent: Math.round((earlyCount / n) * 100),
    normalPercent: Math.round((normalCount / n) * 100),
    delayPercent: Math.round((delayCount / n) * 100),
    avgRainfallLPA: Math.round(avgRainfallLPA)
  };
}

// Prediction Estimation Engine
export function estimateMonsoonOnset(params: PredictionParameters): PredictionResult {
  const isLeap = (params.targetYear % 4 === 0 && params.targetYear % 100 !== 0) || (params.targetYear % 400 === 0);
  const normalKeralaDay = isLeap ? 153 : 152; // June 1

  let deviation = 0;
  const factors: ImpactFactor[] = [];

  // 1. ENSO Weighting
  if (params.ensoForecast === 'La Niña') {
    deviation -= 3.2;
    factors.push({
      name: 'La Niña Teleconnection',
      nameHi: 'ला नीना दूरस्थ-संबंध',
      impact: 'Favorable equatorial cold pool enhances Walker circulation, advancing monsoon onset by ~3.2 days.',
      impactHi: 'प्रशांत महासागर में ला नीना वॉकर परिसंचरण को सक्रिय कर मानसून आगमन को ~3.2 दिन पहले करता है।',
      direction: 'early',
      weight: 0.35
    });
  } else if (params.ensoForecast === 'El Niño') {
    deviation += 4.8;
    factors.push({
      name: 'El Niño Teleconnection',
      nameHi: 'अल नीनो दूरस्थ-संबंध',
      impact: 'Tropical Pacific warming creates subsidence over Indian subcontinent, delaying onset by ~4.8 days.',
      impactHi: 'प्रशांत महासागर में असामान्य गर्माहट भारतीय उपमहाद्वीप पर दबाव बनाकर आगमन को ~4.8 दिन विलंबित करती है।',
      direction: 'delay',
      weight: 0.40
    });
  } else {
    factors.push({
      name: 'ENSO Neutral Baseline',
      nameHi: 'तटस्थ ईएनएसओ आधार रेखा',
      impact: 'Neutral Pacific conditions indicate near-climatological onset timing.',
      impactHi: 'तटस्थ प्रशांत स्थितियां औसत जलवायु समय के अनुरूप आगमन का संकेत देती हैं।',
      direction: 'neutral',
      weight: 0.20
    });
  }

  // 2. IOD (Indian Ocean Dipole) Weighting
  if (params.iodForecast === 'Positive') {
    deviation -= 1.8;
    factors.push({
      name: 'Positive Indian Ocean Dipole (+IOD)',
      nameHi: 'सकारात्मक हिंद महासागर द्विध्रुव (+IOD)',
      impact: 'Warm western Indian Ocean SST accelerates cross-equatorial southwesterly airflow by ~1.8 days.',
      impactHi: 'पश्चिमी हिंद महासागर में अधिक तापमान दक्षिण-पश्चिमी मानसूनी हवाओं को ~1.8 दिन पूर्व प्रेरित करता है।',
      direction: 'early',
      weight: 0.25
    });
  } else if (params.iodForecast === 'Negative') {
    deviation += 1.4;
    factors.push({
      name: 'Negative Indian Ocean Dipole (-IOD)',
      nameHi: 'नकारात्मक हिंद महासागर द्विध्रुव (-IOD)',
      impact: 'Cooler Arabian Sea waters reduce convective updrafts, causing a slight delay of ~1.4 days.',
      impactHi: 'अरब सागर का अपेक्षाकृत ठंडा जल संवहनी बादलों को धीमा कर ~1.4 दिन का विलंब करता है।',
      direction: 'delay',
      weight: 0.20
    });
  }

  // 3. Eurasian Snow Cover Impact
  if (params.eurasianSnowCover === 'Below Normal') {
    deviation -= 1.2;
    factors.push({
      name: 'Below Normal Eurasian Snow Cover',
      nameHi: 'यूरेशियन बर्फ आवरण (सामान्य से कम)',
      impact: 'Enhanced solar heating of Tibetan Plateau strengthens thermal gradient, pulling monsoon ~1.2 days early.',
      impactHi: 'तिब्बती पठार का तीव्र तापन तापीय दबाव प्रवणता बनाकर मानसून को ~1.2 दिन पूर्व खींचता है।',
      direction: 'early',
      weight: 0.15
    });
  } else if (params.eurasianSnowCover === 'Above Normal') {
    deviation += 1.6;
    factors.push({
      name: 'Heavy Eurasian Snow Cover',
      nameHi: 'यूरेशियन बर्फ आवरण (सामान्य से अधिक)',
      impact: 'Delayed snow melt slows down heating of subcontinent landmass, postponing onset by ~1.6 days.',
      impactHi: 'बर्फ पिघलने में देरी से भू-भाग का तापमान देर से बढ़ता है, जिससे ~1.6 दिन की देरी होती है।',
      direction: 'delay',
      weight: 0.15
    });
  }

  // 4. Sea Surface Temp Anomaly
  if (params.seaSurfaceTempAnomaly > 0.5) {
    const sstImpact = Math.min(2.0, (params.seaSurfaceTempAnomaly - 0.5) * 1.5);
    deviation -= sstImpact;
    factors.push({
      name: `SST Anomaly (+${params.seaSurfaceTempAnomaly.toFixed(1)}°C)`,
      nameHi: `समुद्र सतह तापमान विसंगति (+${params.seaSurfaceTempAnomaly.toFixed(1)}°C)`,
      impact: 'Warm ocean boundary layer energizes early pre-monsoon cyclogenesis & convective surges.',
      impactHi: 'गर्म समुद्री सतह प्री-मानसून चक्रवातों और मानसूनी धारा को गति प्रदान करती है।',
      direction: 'early',
      weight: 0.10
    });
  } else if (params.seaSurfaceTempAnomaly < -0.4) {
    deviation += 1.0;
    factors.push({
      name: `SST Anomaly (${params.seaSurfaceTempAnomaly.toFixed(1)}°C)`,
      nameHi: `समुद्र सतह तापमान विसंगति (${params.seaSurfaceTempAnomaly.toFixed(1)}°C)`,
      impact: 'Sub-surface cold anomalies slightly dampen initial moisture convergence.',
      impactHi: 'सतह के ठंडे पानी से प्रारंभिक नमी अभिसरण में आंशिक रुकावट।',
      direction: 'delay',
      weight: 0.10
    });
  }

  // 5. MJO Status
  if (params.mjoStatus === 'Active Bay of Bengal') {
    deviation -= 1.5;
    factors.push({
      name: 'Active MJO in Eastern Indian Ocean',
      nameHi: 'सक्रिय मैडेन-जूलियन ऑसिलेशन (MJO)',
      impact: 'Madden-Julian Oscillation convective envelope over Bay of Bengal accelerates onset pulse.',
      impactHi: 'बंगाल की खाड़ी के ऊपर एमजेओ बादलों का घेरा मानसून की दस्तक को तेज करता है।',
      direction: 'early',
      weight: 0.15
    });
  } else if (params.mjoStatus === 'Suppressed') {
    deviation += 1.5;
    factors.push({
      name: 'Suppressed MJO Phase',
      nameHi: 'दबा हुआ MJO चरण',
      impact: 'Suppressed convective phase over North Indian Ocean creates temporary monsoon hiatus.',
      impactHi: 'उत्तरी हिंद महासागर में संवहन की कमी से मानसूनी हवाओं में अस्थायी रुकावट।',
      direction: 'delay',
      weight: 0.15
    });
  }

  const estimatedDay = Math.round(normalKeralaDay + deviation);
  const estimatedDate = dayOfYearToDateString(estimatedDay, params.targetYear);

  // Confidence interval calculation based on customConfidence (e.g. 80%)
  const margin = Math.round((params.customConfidence / 100) * 4.5);
  const minDay = estimatedDay - margin;
  const maxDay = estimatedDay + margin;

  const confidenceIntervalMin = dayOfYearToDateString(minDay, params.targetYear);
  const confidenceIntervalMax = dayOfYearToDateString(maxDay, params.targetYear);

  // Probabilistic estimation
  let earlinessProb = 33;
  let normalProb = 34;
  let delayProb = 33;

  if (deviation <= -2) {
    earlinessProb = Math.min(82, 55 + Math.abs(deviation) * 5);
    normalProb = Math.max(12, 35 - Math.abs(deviation) * 3);
    delayProb = Math.max(6, 100 - (earlinessProb + normalProb));
  } else if (deviation >= 2) {
    delayProb = Math.min(80, 52 + deviation * 5);
    normalProb = Math.max(14, 38 - deviation * 3);
    earlinessProb = Math.max(6, 100 - (delayProb + normalProb));
  } else {
    normalProb = 58;
    earlinessProb = 22;
    delayProb = 20;
  }

  // Rainfall LPA estimation based on ENSO and IOD
  let estRainfall = 100;
  if (params.ensoForecast === 'La Niña') estRainfall += 6;
  if (params.ensoForecast === 'El Niño') estRainfall -= 11;
  if (params.iodForecast === 'Positive') estRainfall += 4;
  if (params.iodForecast === 'Negative') estRainfall -= 5;
  if (params.seaSurfaceTempAnomaly > 0.4) estRainfall += 2;

  // Find Top 3 Analog Historic Years
  const scoredYears = HISTORIC_MONSOON_DATA.map(r => {
    let score = 0;
    if (r.ensoPhase === params.ensoForecast) score += 40;
    if (r.iodPhase === params.iodForecast) score += 30;
    const devDiff = Math.abs(r.deviationDays - deviation);
    score += Math.max(0, 30 - devDiff * 4);
    return { year: r.year, score };
  });

  scoredYears.sort((a, b) => b.score - a.score);
  const analogYears = scoredYears.slice(0, 3).map(s => s.year);

  // Agronomic recommendations
  const prepDay = Math.max(1, minDay - 12);
  const prepDate = dayOfYearToDateString(prepDay, params.targetYear);

  const riskAssessment = deviation <= -3
    ? 'High probability of Early Onset. Farmers should expedite summer ploughing and keep inputs ready for early June sowing.'
    : deviation >= 3
    ? 'Moderate to High Risk of Delayed Onset. Recommended to arrange protective irrigation reserves and prepare short-duration seed contingencies.'
    : 'Near-Normal Onset Expected. Standard agricultural calendars and timely nursery preparation recommended.';

  const riskAssessmentHi = deviation <= -3
    ? 'समय से पहले मानसून आगमन की उच्च संभावना। किसान गर्मी की गहरी जुताई पूरी कर मई अंत तक बीज व खाद का भंडारण सुनिश्चित करें।'
    : deviation >= 3
    ? 'मानसून में देरी का मध्यम से उच्च जोखिम। वैकल्पिक सिंचाई की व्यवस्था रखें और कम अवधि वाली संकर किस्मों के बीज तैयार रखें।'
    : 'सामान्य समय पर मानसून आगमन का अनुमान। मानक कृषि कैलेंडर और समय पर धान नर्सरी व खरीफ बुवाई की तैयारी करें।';

  return {
    targetYear: params.targetYear,
    estimatedDate,
    estimatedDayOfYear: estimatedDay,
    confidenceIntervalMin,
    confidenceIntervalMax,
    deviationFromNormal: Number(deviation.toFixed(1)),
    earlinessProbability: Math.round(earlinessProb),
    normalProbability: Math.round(normalProb),
    delayProbability: Math.round(delayProb),
    estimatedRainfallLPA: Math.round(estRainfall),
    primaryFactors: factors,
    riskAssessment,
    riskAssessmentHi,
    recommendedSowingPrepDate: `${prepDate} (12 days prior to anticipated onset window)`,
    recommendedSowingPrepDateHi: `${prepDate} (अनुमानित आगमन खिड़की से 12 दिन पूर्व)`,
    analogYears
  };
}

// Calculate State-level predicted arrival given Kerala estimate
export function estimateStateArrival(state: StateRegionData, keralaEstimatedDay: number, targetYear: number = 2026): {
  estimatedDate: string;
  normalDate: string;
  deviation: number;
} {
  const keralaNormalDay = 152;
  const keralaDelta = keralaEstimatedDay - keralaNormalDay;
  // Regional damping factor (as monsoon moves north, regional synoptic systems adjust)
  const dampedDelta = Math.round(keralaDelta * 0.85);
  const stateEstimatedDay = state.normalDayOfYear + dampedDelta;

  return {
    estimatedDate: dayOfYearToDateString(stateEstimatedDay, targetYear),
    normalDate: state.normalOnsetDate,
    deviation: dampedDelta
  };
}

// Calculate City-level predicted arrival and agricultural recommendations
export function estimateCityArrival(
  city: import('../types/monsoon').CityMonsoonData,
  keralaEstimatedDay: number,
  targetYear: number = 2026
): import('../types/monsoon').CityOnsetEstimation {
  const keralaNormalDay = 152;
  const keralaDelta = keralaEstimatedDay - keralaNormalDay;
  const dampedDelta = Math.round(keralaDelta * 0.9);
  const cityEstimatedDay = city.normalDayOfYear + dampedDelta;

  const estimatedDate = dayOfYearToDateString(cityEstimatedDay, targetYear);
  const confidenceMin = dayOfYearToDateString(cityEstimatedDay - 4, targetYear);
  const confidenceMax = dayOfYearToDateString(cityEstimatedDay + 4, targetYear);
  const prepDate = dayOfYearToDateString(cityEstimatedDay - 10, targetYear);

  let status: 'Early' | 'Normal' | 'Delayed' = 'Normal';
  if (dampedDelta <= -3) status = 'Early';
  else if (dampedDelta >= 3) status = 'Delayed';

  const sowingPrepRecommendation =
    status === 'Early'
      ? `Early monsoon arrival anticipated around ${estimatedDate}. Complete land preparation by ${prepDate} and procure certified seeds of ${city.primaryCrops.join(', ')}.`
      : status === 'Delayed'
      ? `Possible delay in onset until ${estimatedDate}. Prepare staggered nursery or contingency short-duration varieties of ${city.primaryCrops.join(', ')}.`
      : `Timely arrival around ${estimatedDate}. Proceed with standard farm preparation and sow ${city.primaryCrops[0]} between ${city.sowingWindow}.`;

  const sowingPrepRecommendationHi =
    status === 'Early'
      ? `${estimatedDate} के आसपास समय पूर्व मानसून आगमन का अनुमान। ${prepDate} तक खेत तैयार करें और ${city.primaryCropsHi.join(', ')} के बीज जुटाएं।`
      : status === 'Delayed'
      ? `${estimatedDate} तक संभावित विलंब। वैकल्पिक सिंचाई रखें और ${city.primaryCropsHi.join(', ')} की कम अवधि वाली किस्मों की तैयारी करें।`
      : `${estimatedDate} के आसपास समय पर आगमन। ${city.sowingWindowHi} के बीच ${city.primaryCropsHi[0]} की बुवाई की सामान्य तैयारी रखें।`;

  return {
    city,
    estimatedDate,
    estimatedDayOfYear: cityEstimatedDay,
    deviationDays: dampedDelta,
    confidenceMin,
    confidenceMax,
    status,
    sowingPrepRecommendation,
    sowingPrepRecommendationHi,
  };
}


import { DataProvenance, CalculationTrace, WaterBalanceResult } from '../types/soilModule';

// ============================================================================
// DATA PROVENANCE & CALCULATION TRACE SERVICE
// ============================================================================

export function getDataProvenanceList(): DataProvenance[] {
  return [
    {
      provider: 'India Meteorological Department (IMD) / ECMWF ERA5-Land',
      datasetName: 'High-Resolution Gridded Daily Rainfall & Climatological Normals',
      period: '1981-2010 / 1991-2020 Long-Term Normals & Real Daily Archive',
      spatialResolution: '0.1° × 0.1° (~9 km × 9 km)',
      retrievalTimestamp: new Date().toISOString(),
      provenanceType: 'official_observation',
      citation: 'IMD Climatological Tables of Observatories & Open-Meteo Historical Meteorological Engine',
      limitations: 'Village-level micro-topography may experience localized rainfall variations not captured by gridded station interpolations.',
    },
    {
      provider: 'ICAR - National Bureau of Soil Survey & Land Use Planning (NBSS&LUP)',
      datasetName: 'Agro-Climatic Soil Classification & Pedotransfer Functions',
      period: 'Standard ICAR / ISRIC SoilGrids 2.0 Mapping',
      spatialResolution: 'District & Agro-Ecological Sub-Region Level',
      retrievalTimestamp: new Date().toISOString(),
      provenanceType: 'soil_map_estimate',
      citation: 'ICAR-NBSS&LUP Soil Resources of India & Saxton-Rawls Soil Water Characteristic Pedotransfer Model',
      limitations: 'Regional soil classification provides hydraulic estimates based on soil texture class. Laboratory core testing is required for farm-specific micro-variations.',
    },
    {
      provider: 'Food and Agriculture Organization (FAO)',
      datasetName: 'FAO Irrigation and Drainage Paper No. 56 (Crop Evapotranspiration)',
      period: 'Standard Global Agronomic Baseline',
      spatialResolution: 'Crop Species & Growth-Stage Level',
      retrievalTimestamp: new Date().toISOString(),
      provenanceType: 'model_estimate',
      citation: 'Allen, R.G., Pereira, L.S., Raes, D. and Smith, M. (1998) FAO-56',
      limitations: 'Standard single and dual Kc coefficients assume disease-free, well-managed field canopy.',
    },
    {
      provider: 'USDA Natural Resources Conservation Service (NRCS)',
      datasetName: 'SCS-CN Hydrologic Soil-Cover Complex Runoff Model',
      period: 'National Engineering Handbook Section 4',
      spatialResolution: 'Field Catchment Level',
      retrievalTimestamp: new Date().toISOString(),
      provenanceType: 'model_estimate',
      citation: 'USDA-NRCS Curve Number Hydrologic Model calibrated with Antecedent Moisture Conditions (AMC)',
      limitations: 'Runoff calculations assume average field bunding and standard agricultural contours.',
    },
  ];
}

export function generateCalculationTraces(result: WaterBalanceResult): CalculationTrace[] {
  const { soilProfile, cropProfile, effectiveRootDepthMm, TAW, RAW, totalRainfallMm, totalRunoffLossMm, totalInfiltratedMm, totalDeepDrainageMm, totalCropWaterUseMm, finalRootZoneStorageMm, finalAvailableWaterPercent } = result;

  return [
    {
      step: '1. Available Water Capacity (AWC)',
      formula: 'AWC = Field Capacity (θ_FC) - Permanent Wilting Point (θ_PWP)',
      inputs: {
        'Field Capacity (θ_FC)': `${(soilProfile.fieldCapacity * 100).toFixed(1)}% (${soilProfile.fieldCapacity} m³/m³)`,
        'Wilting Point (θ_PWP)': `${(soilProfile.permanentWiltingPoint * 100).toFixed(1)}% (${soilProfile.permanentWiltingPoint} m³/m³)`,
      },
      output: `${(soilProfile.availableWaterCapacity * 100).toFixed(1)}% (${soilProfile.availableWaterCapacity} m³/m³ or ${Math.round(soilProfile.availableWaterCapacity * 1000)} mm/m depth)`,
      notes: 'Standard volumetric fraction of plant-extractable water in the soil matrix.',
    },
    {
      step: '2. Total Available Water in Root Zone (TAW)',
      formula: 'TAW = AWC × Effective Root-Zone Depth',
      inputs: {
        'AWC': `${soilProfile.availableWaterCapacity} mm/mm`,
        'Effective Root Depth': `${effectiveRootDepthMm} mm`,
      },
      output: `${TAW} mm`,
      notes: 'Maximum volume of plant-available water that can be retained in the crop root zone.',
    },
    {
      step: '3. Readily Available Water (RAW)',
      formula: 'RAW = TAW × Crop Depletion Fraction (p)',
      inputs: {
        'TAW': `${TAW} mm`,
        'Depletion Fraction (p)': cropProfile.depletionFraction,
      },
      output: `${RAW} mm`,
      notes: 'Water that can be extracted without causing transpiration stress to the crop.',
    },
    {
      step: '4. Surface Runoff Partitioning (SCS-CN)',
      formula: 'Q = (P - Ia)² / (P - Ia + S_max) where S_max = (25400/CN) - 254 and Ia = 0.2 × S_max',
      inputs: {
        'Total Rainfall (P)': `${totalRainfallMm} mm`,
        'Soil Base Curve Number (CN)': soilProfile.curveNumberBase,
      },
      output: `Runoff: ${totalRunoffLossMm} mm | Infiltrated: ${totalInfiltratedMm} mm`,
      notes: 'Calculated dynamically for every daily rainfall event using antecedent soil moisture adjustment.',
    },
    {
      step: '5. Daily Root-Zone Water Budget',
      formula: 'S(t) = clamp[S(t-1) + P_eff(t) + I(t) - ETa(t) - Drainage(t), 0, TAW]',
      inputs: {
        'Total Infiltrated (P_eff)': `${totalInfiltratedMm} mm`,
        'Total Actual Crop Water Use (ETa)': `${totalCropWaterUseMm} mm`,
        'Total Deep Drainage': `${totalDeepDrainageMm} mm`,
      },
      output: `Final Storage: ${finalRootZoneStorageMm} mm (${finalAvailableWaterPercent}% of TAW)`,
      notes: 'Ensures conservation of mass; water cannot be simultaneously retained and lost.',
    },
  ];
}

import { SoilTextureType, SoilHydraulicProperties } from '../types/soilModule';

// ============================================================================
// SOIL HYDRAULIC PROPERTIES DATABASE (ICAR / NBSS&LUP & Saxton-Rawls Pedotransfer Model)
// ============================================================================

export const SOIL_PROFILES_DATABASE: Record<SoilTextureType, SoilHydraulicProperties> = {
  sandy: {
    id: 'sandy',
    name: 'Sandy Soil (बालुई मिट्टी)',
    nameHi: 'बालुई / रेतीली मिट्टी',
    description: 'Coarse-textured soil with rapid drainage and minimal water holding capacity.',
    sandPercent: 88,
    siltPercent: 7,
    clayPercent: 5,
    bulkDensity: 1.58,
    fieldCapacity: 0.12, // 12% volumetric
    permanentWiltingPoint: 0.04, // 4% volumetric
    saturationCapacity: 0.38,
    availableWaterCapacity: 0.08, // 80 mm per meter
    saturatedConductivity: 50.0, // mm/hr (very high)
    curveNumberBase: 68, // Hydrologic Soil Group A
    drainageRate: 0.65, // Fast drainage
    phRange: [6.5, 8.2],
    colorHex: '#D4B996',
    regionalClassification: 'Arid & Desert Soils of Western Rajasthan & Coastal tracts',
    notes: 'Low moisture retention. Frequent light irrigation or drip fertigation is essential.',
  },
  loamy_sand: {
    id: 'loamy_sand',
    name: 'Loamy Sand (दुमट बालू)',
    nameHi: 'दुमट रेतीली मिट्टी',
    description: 'Slightly higher silt content than pure sand, offering marginal water retention.',
    sandPercent: 80,
    siltPercent: 12,
    clayPercent: 8,
    bulkDensity: 1.52,
    fieldCapacity: 0.16,
    permanentWiltingPoint: 0.06,
    saturationCapacity: 0.40,
    availableWaterCapacity: 0.10, // 100 mm per meter
    saturatedConductivity: 35.0,
    curveNumberBase: 72,
    drainageRate: 0.50,
    phRange: [6.2, 7.8],
    colorHex: '#CBB28D',
    regionalClassification: 'Semi-Arid transition zones (North Gujarat, SW Haryana)',
    notes: 'Prone to rapid nutrient leaching and drought during dry spells.',
  },
  sandy_loam: {
    id: 'sandy_loam',
    name: 'Sandy Loam (बलुई दुमट)',
    nameHi: 'बलुई दोमट मिट्टी',
    description: 'Balanced mix of sand and loam, easy to till with moderate water retention.',
    sandPercent: 65,
    siltPercent: 25,
    clayPercent: 10,
    bulkDensity: 1.48,
    fieldCapacity: 0.22,
    permanentWiltingPoint: 0.09,
    saturationCapacity: 0.42,
    availableWaterCapacity: 0.13, // 130 mm per meter
    saturatedConductivity: 22.0,
    curveNumberBase: 77, // Hydrologic Soil Group B
    drainageRate: 0.38,
    phRange: [6.5, 7.5],
    colorHex: '#BFA588',
    regionalClassification: 'Alluvial plains of Punjab, Haryana, and West UP',
    notes: 'Ideal for most Kharif & Rabi crops; good seedbed aeration and root penetration.',
  },
  loam: {
    id: 'loam',
    name: 'Loam Soil (दोमट मिट्टी)',
    nameHi: 'आदर्श दोमट मिट्टी',
    description: 'Optimal agricultural soil with balanced sand, silt, and clay proportions.',
    sandPercent: 42,
    siltPercent: 38,
    clayPercent: 20,
    bulkDensity: 1.40,
    fieldCapacity: 0.28,
    permanentWiltingPoint: 0.12,
    saturationCapacity: 0.46,
    availableWaterCapacity: 0.16, // 160 mm per meter
    saturatedConductivity: 12.0,
    curveNumberBase: 80, // Hydrologic Soil Group B
    drainageRate: 0.25,
    phRange: [6.5, 7.5],
    colorHex: '#9E8262',
    regionalClassification: 'Fertile Indo-Gangetic Alluvial Basin (UP, Bihar, WB)',
    notes: 'Excellent water retention and aeration. High fertility and nutrient capacity.',
  },
  silt_loam: {
    id: 'silt_loam',
    name: 'Silt Loam (सिल्ट दोमट)',
    nameHi: 'गाद दोमट मिट्टी',
    description: 'Smooth, high silt fraction with superior available water capacity.',
    sandPercent: 20,
    siltPercent: 65,
    clayPercent: 15,
    bulkDensity: 1.35,
    fieldCapacity: 0.32,
    permanentWiltingPoint: 0.13,
    saturationCapacity: 0.48,
    availableWaterCapacity: 0.19, // 190 mm per meter
    saturatedConductivity: 8.5,
    curveNumberBase: 82,
    drainageRate: 0.20,
    phRange: [6.0, 7.2],
    colorHex: '#8E7356',
    regionalClassification: 'River valleys and floodplains of Northern & Eastern India',
    notes: 'Very high plant-available moisture; susceptible to surface crusting under heavy rains.',
  },
  clay_loam: {
    id: 'clay_loam',
    name: 'Clay Loam (मटियारी दोमट)',
    nameHi: 'मटियारी दोमट मिट्टी',
    description: 'Moderately heavy soil with good moisture and nutrient holding capability.',
    sandPercent: 32,
    siltPercent: 34,
    clayPercent: 34,
    bulkDensity: 1.32,
    fieldCapacity: 0.35,
    permanentWiltingPoint: 0.18,
    saturationCapacity: 0.49,
    availableWaterCapacity: 0.17, // 170 mm per meter
    saturatedConductivity: 4.5,
    curveNumberBase: 85, // Hydrologic Soil Group C
    drainageRate: 0.14,
    phRange: [6.8, 8.0],
    colorHex: '#7C6044',
    regionalClassification: 'Central India, MP, Vidarbha & parts of Karnataka',
    notes: 'Slow internal drainage; excellent for rainfed pulse, oilseed, and wheat crops.',
  },
  clay: {
    id: 'clay',
    name: 'Heavy Clay (भारी चिकनी मिट्टी)',
    nameHi: 'चिकनी / मटियारी मिट्टी',
    description: 'Fine-textured soil with high total water content but strong moisture binding.',
    sandPercent: 15,
    siltPercent: 25,
    clayPercent: 60,
    bulkDensity: 1.25,
    fieldCapacity: 0.42,
    permanentWiltingPoint: 0.26,
    saturationCapacity: 0.52,
    availableWaterCapacity: 0.16, // 160 mm per meter
    saturatedConductivity: 1.2,
    curveNumberBase: 89, // Hydrologic Soil Group D
    drainageRate: 0.06, // Very slow
    phRange: [7.2, 8.6],
    colorHex: '#644A32',
    regionalClassification: 'Deltaic and low-lying wetland tracts',
    notes: 'High risk of waterlogging and root asphyxiation during continuous rains.',
  },
  black_cotton: {
    id: 'black_cotton',
    name: 'Black Cotton Soil / Vertisol (काली मिट्टी)',
    nameHi: 'काली रेगुर / कपास मिट्टी (Vertisols)',
    description: 'Montmorillonite-rich swelling clay that cracks when dry and swells when wet.',
    sandPercent: 20,
    siltPercent: 30,
    clayPercent: 50,
    bulkDensity: 1.28,
    fieldCapacity: 0.44, // 44% volumetric
    permanentWiltingPoint: 0.24, // 24% volumetric
    saturationCapacity: 0.55,
    availableWaterCapacity: 0.20, // 200 mm per meter (Highest among Indian soils)
    saturatedConductivity: 2.0, // High when cracked, very low when swelled
    curveNumberBase: 88, // Hydrologic Soil Group D
    drainageRate: 0.08,
    phRange: [7.5, 8.5],
    colorHex: '#3D3126',
    regionalClassification: 'Deccan Trap region (Maharashtra, Malwa MP, Gujarat, North Karnataka)',
    notes: 'Tremendous moisture storage supporting deep-rooted crops (Cotton, Soybean, Gram) through post-monsoon dry spells.',
  },
  red_soil: {
    id: 'red_soil',
    name: 'Red Soil / Alfisol (लाल मिट्टी)',
    nameHi: 'लाल दोमट / बलुई मिट्टी (Alfisols)',
    description: 'Ferruginous red loam with porous crumb structure and moderate permeability.',
    sandPercent: 60,
    siltPercent: 20,
    clayPercent: 20,
    bulkDensity: 1.45,
    fieldCapacity: 0.24,
    permanentWiltingPoint: 0.11,
    saturationCapacity: 0.43,
    availableWaterCapacity: 0.13, // 130 mm per meter
    saturatedConductivity: 18.0,
    curveNumberBase: 78, // Hydrologic Soil Group B
    drainageRate: 0.32,
    phRange: [5.5, 6.8],
    colorHex: '#A04732',
    regionalClassification: 'Peninsular India (Tamil Nadu, Telangana, Odisha, Chhota Nagpur, SE Rajasthan)',
    notes: 'Good permeability; requires moisture conservation practices and phosphorus supplementation.',
  },
  alluvial: {
    id: 'alluvial',
    name: 'Alluvial Soil (जलोढ़ मिट्टी)',
    nameHi: 'उपजाऊ जलोढ़ मिट्टी (Inceptisols/Entisols)',
    description: 'Deep river-transported silt and loam mixture with exceptional agricultural fertility.',
    sandPercent: 40,
    siltPercent: 45,
    clayPercent: 15,
    bulkDensity: 1.38,
    fieldCapacity: 0.30,
    permanentWiltingPoint: 0.12,
    saturationCapacity: 0.47,
    availableWaterCapacity: 0.18, // 180 mm per meter
    saturatedConductivity: 15.0,
    curveNumberBase: 79, // Hydrologic Soil Group B
    drainageRate: 0.24,
    phRange: [6.8, 7.8],
    colorHex: '#A89278',
    regionalClassification: 'Great Plains of North India & Major River Deltas',
    notes: 'High water and nutrient buffering capacity; suited to intensive multi-cropping rotations.',
  },
  other: {
    id: 'other',
    name: 'Mixed / Unclassified Soil',
    nameHi: 'मिश्रित / अन्य मिट्टी',
    description: 'Regional default profile with average loamy hydraulic characteristics.',
    sandPercent: 45,
    siltPercent: 35,
    clayPercent: 20,
    bulkDensity: 1.42,
    fieldCapacity: 0.26,
    permanentWiltingPoint: 0.12,
    saturationCapacity: 0.44,
    availableWaterCapacity: 0.14,
    saturatedConductivity: 14.0,
    curveNumberBase: 80,
    drainageRate: 0.26,
    phRange: [6.5, 7.5],
    colorHex: '#8C7862',
    regionalClassification: 'General Indian Agro-Climatic default',
    notes: 'Standard representative agricultural estimate. Laboratory soil testing recommended for precise parameters.',
  },
};

import { DISTRICT_DATABASE } from './districtLocationService';

// Map-based geographic default classifier based on Indian State/District
export function estimateRegionalSoil(state: string, district?: string, lat?: number, lng?: number): SoilHydraulicProperties {
  if (state && district && DISTRICT_DATABASE[state]?.[district]) {
    const soilKey = DISTRICT_DATABASE[state][district].primarySoil;
    if (SOIL_PROFILES_DATABASE[soilKey]) {
      return SOIL_PROFILES_DATABASE[soilKey];
    }
  }

  const s = (state || '').toLowerCase();
  const d = (district || '').toLowerCase();

  // 1. Black Cotton Zone (Vertisols)
  if (
    s.includes('maharashtra') ||
    s.includes('madhya pradesh') ||
    d.includes('malwa') ||
    d.includes('vidarbha') ||
    d.includes('khandesh') ||
    d.includes('dharwad') ||
    d.includes('belagavi') ||
    d.includes('saurashtra') ||
    d.includes('rajkot') ||
    d.includes('amravati') ||
    d.includes('nagpur') ||
    d.includes('indore') ||
    d.includes('ujjain') ||
    d.includes('dewas')
  ) {
    return SOIL_PROFILES_DATABASE.black_cotton;
  }

  // 2. Sandy & Arid Zone
  if (
    s.includes('rajasthan') &&
    (d.includes('jaisalmer') ||
      d.includes('bikaner') ||
      d.includes('barmer') ||
      d.includes('jodhpur') ||
      d.includes('churu') ||
      d.includes('nagaur'))
  ) {
    return SOIL_PROFILES_DATABASE.sandy;
  }

  // 3. Sandy Loam / Semi-Arid (Jaipur, Ajmer, Udaipur, North Gujarat)
  if (
    s.includes('rajasthan') ||
    s.includes('haryana') ||
    d.includes('jaipur') ||
    d.includes('udaipur') ||
    d.includes('ajmer') ||
    d.includes('sikar') ||
    d.includes('alwar') ||
    d.includes('hisar') ||
    d.includes('karnal')
  ) {
    return SOIL_PROFILES_DATABASE.sandy_loam;
  }

  // 4. Red Soil Zone (Alfisols)
  if (
    s.includes('tamil nadu') ||
    s.includes('telangana') ||
    s.includes('andhra pradesh') ||
    s.includes('karnataka') ||
    s.includes('odisha') ||
    s.includes('jharkhand') ||
    d.includes('chittoor') ||
    d.includes('anantapur') ||
    d.includes('salem') ||
    d.includes('coimbatore') ||
    d.includes('mayurbhanj')
  ) {
    return SOIL_PROFILES_DATABASE.red_soil;
  }

  // 5. Alluvial Basin (Indo-Gangetic)
  if (
    s.includes('uttar pradesh') ||
    s.includes('bihar') ||
    s.includes('west bengal') ||
    s.includes('punjab') ||
    s.includes('assam')
  ) {
    return SOIL_PROFILES_DATABASE.alluvial;
  }

  // Coordinate-based boundary fallback if coordinates provided
  if (lat && lng) {
    if (lat >= 18.0 && lat <= 23.5 && lng >= 73.0 && lng <= 80.5) {
      return SOIL_PROFILES_DATABASE.black_cotton;
    }
    if (lat >= 25.0 && lat <= 29.5 && lng >= 69.5 && lng <= 75.0) {
      return SOIL_PROFILES_DATABASE.sandy;
    }
    if (lat >= 11.0 && lat <= 16.5 && lng >= 76.5 && lng <= 80.5) {
      return SOIL_PROFILES_DATABASE.red_soil;
    }
    if (lat >= 24.5 && lat <= 28.5 && lng >= 77.0 && lng <= 88.5) {
      return SOIL_PROFILES_DATABASE.alluvial;
    }
  }

  return SOIL_PROFILES_DATABASE.loam;
}

// Calculate Total Available Water (TAW in mm) for a specific root depth
export function calculateTAW(awc: number, rootDepthMm: number): number {
  return +(awc * rootDepthMm).toFixed(1);
}

// Calculate Readily Available Water (RAW in mm) before water stress occurs
export function calculateRAW(taw: number, depletionFraction: number): number {
  return +(taw * depletionFraction).toFixed(1);
}

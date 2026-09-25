// Real-time Meteorological & Natural Disaster Early-Warning Engine using Open-Meteo & Agronomic Physics

export interface LiveWeatherResult {
  locationName: string;
  latitude: number;
  longitude: number;
  elevation: number;
  current: {
    temperature: number;
    humidity: number;
    apparentTemperature: number;
    precipitation: number;
    weatherCode: number;
    weatherCondition: string;
    weatherIcon: string;
    surfacePressure: number;
    windSpeed: number;
    windDirection: string;
    windGusts: number;
    soilTemperature: number;
    soilMoisture: number; // m³/m³
    soilMoisturePercent: number; // 0-100%
    uvIndex: number;
    et0: number; // mm/day
    vpd: number; // kPa
    timestamp: string;
  };
  threatScores: {
    floodRisk: number; // 0-100%
    droughtRisk: number; // 0-100%
    stormRisk: number; // 0-100%
    diseaseRisk: number; // 0-100%
    heatRisk: number; // 0-100%
  };
  disasterAlerts: {
    type: 'rain_flood' | 'drought' | 'storm_wind' | 'fungal_spore' | 'heatwave';
    title: string;
    severity: 'Critical' | 'High' | 'Moderate' | 'Low';
    probability: number;
    onset: string;
    metricLabel: string;
    description: string;
    impactRisk: string;
    precautions: string[];
  }[];
  forecast: {
    day: string;
    date: string;
    condition: string;
    icon: string;
    tempMax: number;
    tempMin: number;
    rainChance: number;
    rainSum: number;
    windGustMax: number;
    uvMax: number;
    sprayCondition: 'Optimal Window' | 'Caution' | 'Do Not Spray';
  }[];
}

// Convert WMO Weather Code to human readable condition and icon
function decodeWMO(code: number): { condition: string; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', icon: 'wb_sunny' };
    case 1:
      return { condition: 'Mainly Clear', icon: 'wb_sunny' };
    case 2:
      return { condition: 'Partly Cloudy', icon: 'partly_cloudy_day' };
    case 3:
      return { condition: 'Overcast', icon: 'cloud' };
    case 45:
    case 48:
      return { condition: 'Fog & Dew', icon: 'foggy' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', icon: 'grain' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain Showers', icon: 'rainy' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snowfall', icon: 'ac_unit' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Heavy Rain Showers', icon: 'thunderstorm' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm & Hail', icon: 'thunderstorm' };
    default:
      return { condition: 'Partly Cloudy', icon: 'partly_cloudy_day' };
  }
}

// Convert wind direction degrees to compass heading
function getWindHeading(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx] || 'N';
}

// Vapor Pressure Deficit calculation (Magnus Formula)
function calculateVPD(temp: number, rh: number): number {
  if (!temp || !rh) return 1.2;
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = es * (rh / 100);
  return +(es - ea).toFixed(1);
}

export async function fetchRealWeatherData(
  lat: number,
  lng: number,
  locationLabel?: string
): Promise<LiveWeatherResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,soil_temperature_0cm,soil_moisture_0_to_1cm,uv_index,et0_fao_evapotranspiration&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,et0_fao_evapotranspiration,uv_index_max&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Open-Meteo API error: ${res.status}`);
  }

  const data = await res.json();
  const current = data.current || {};
  const daily = data.daily || {};

  const temp = current.temperature_2m ?? 28;
  const rh = current.relative_humidity_2m ?? 50;
  const windSpeed = current.wind_speed_10m ?? 10;
  const windGusts = current.wind_gusts_10m ?? 15;
  const windDir = getWindHeading(current.wind_direction_10m ?? 0);
  const pressure = current.surface_pressure ?? 1012;
  const soilTemp = current.soil_temperature_0cm ?? 26;
  const soilMoisM3 = current.soil_moisture_0_to_1cm ?? 0.22;
  const soilPercent = Math.min(100, Math.round((soilMoisM3 / 0.45) * 100)); // normalized 0-100%
  const uv = current.uv_index ?? 6;
  const et0 = current.et0_fao_evapotranspiration ?? 4.5;
  const vpd = calculateVPD(temp, rh);
  const wmo = decodeWMO(current.weather_code ?? 0);

  // Analyze 7-Day Forecast
  const daysList: LiveWeatherResult['forecast'] = [];
  const times = daily.time || [];
  let maxRainProb = 0;
  let maxRainSum = 0;
  let maxWindGust = windGusts;
  let maxUv = uv;
  let maxTemp = temp;
  let dryDaysCount = 0;

  for (let i = 0; i < times.length; i++) {
    const dDate = new Date(times[i]);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dateFormatted = dDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const code = daily.weather_code?.[i] ?? 0;
    const dayWmo = decodeWMO(code);
    const rainProb = daily.precipitation_probability_max?.[i] ?? 0;
    const rainSum = daily.precipitation_sum?.[i] ?? 0;
    const gust = daily.wind_gusts_10m_max?.[i] ?? 0;
    const tMax = daily.temperature_2m_max?.[i] ?? 32;
    const tMin = daily.temperature_2m_min?.[i] ?? 22;
    const uvVal = daily.uv_index_max?.[i] ?? 7;

    if (rainProb > maxRainProb) maxRainProb = rainProb;
    if (rainSum > maxRainSum) maxRainSum = rainSum;
    if (gust > maxWindGust) maxWindGust = gust;
    if (uvVal > maxUv) maxUv = uvVal;
    if (tMax > maxTemp) maxTemp = tMax;
    if (rainSum < 1) dryDaysCount++;

    let sprayCondition: 'Optimal Window' | 'Caution' | 'Do Not Spray' = 'Optimal Window';
    if (rainProb > 40 || rainSum > 5 || gust > 35) {
      sprayCondition = 'Do Not Spray';
    } else if (rainProb > 20 || gust > 22 || tMax > 36) {
      sprayCondition = 'Caution';
    }

    daysList.push({
      day: dayName,
      date: dateFormatted,
      condition: dayWmo.condition,
      icon: dayWmo.icon,
      tempMax: Math.round(tMax),
      tempMin: Math.round(tMin),
      rainChance: rainProb,
      rainSum: +rainSum.toFixed(1),
      windGustMax: Math.round(gust),
      uvMax: +uvVal.toFixed(1),
      sprayCondition,
    });
  }

  // SCIENTIFIC DISASTER THREAT SCORING
  // 1. Flash Flood & Heavy Rain Risk
  const floodRisk = Math.min(100, Math.round(maxRainProb * 0.6 + Math.min(40, maxRainSum * 1.5)));

  // 2. Drought & Moisture Deficit Risk
  const droughtRisk = Math.min(100, Math.round((1 - soilMoisM3 / 0.4) * 50 + (dryDaysCount / 7) * 40));

  // 3. Storm Squall & High Wind Lodging Risk
  const stormRisk = Math.min(100, Math.round((maxWindGust / 60) * 100));

  // 4. Canopy Fungal Spore Propagation Risk (High RH > 65% + Temp 22-33°C)
  const diseaseRisk = Math.min(100, Math.round((rh / 90) * 60 + (temp >= 22 && temp <= 33 ? 35 : 10)));

  // 5. Extreme Solar Heat Index Risk
  const heatRisk = Math.min(100, Math.round((maxTemp / 45) * 60 + (maxUv / 11) * 40));

  // COMPOSE REAL DISASTER EARLY-WARNING ALERTS
  const disasterAlerts: LiveWeatherResult['disasterAlerts'] = [];

  // Flash flood / heavy rain criteria
  if (floodRisk > 35 || maxRainSum > 10) {
    const isCritical = maxRainSum > 25 || floodRisk > 70;
    disasterAlerts.push({
      type: 'rain_flood',
      title: isCritical ? 'Severe Rainfall & Flash Waterlogging Warning' : 'Localized Precipitation & Drainage Advisory',
      severity: isCritical ? 'Critical' : 'High',
      probability: floodRisk,
      onset: maxRainSum > 0 ? `Upcoming 24-48 Hours • Expected Rain: ${maxRainSum} mm` : 'High Probability Window',
      metricLabel: `${maxRainSum} mm Expected Precipitation`,
      description: `Satellite radar models indicate ${maxRainSum} mm accumulated precipitation with ${maxRainProb}% confidence. Low-lying field furrows face standing water accumulation.`,
      impactRisk: 'Root zone oxygen starvation, nutrient leaching, and lodging in standing cereal/rice crops.',
      precautions: [
        'Open all farm drainage canal spillway gates to allow free water discharge.',
        'Clear silt, weeds, and sediment blockages from primary field boundary furrows.',
        'Suspend nitrogen top-dressing and chemical spray applications until soil stabilizes.',
        'Elevate portable water pump engines and electrical control switchboards above ground level.',
      ],
    });
  }

  // Fungal spore window criteria
  if (diseaseRisk > 50) {
    disasterAlerts.push({
      type: 'fungal_spore',
      title: 'High Pathogen & Spore Incubation Window',
      severity: diseaseRisk > 75 ? 'Critical' : 'High',
      probability: diseaseRisk,
      onset: `Active • Relative Humidity ${rh}% • Temp ${temp}°C`,
      metricLabel: `${rh}% Relative Humidity Window`,
      description: `Ambient relative humidity (${rh}%) paired with warm canopy temperature (${temp}°C) creates optimal thermal-moisture incubation for fungal blight, leaf mold, and powdery mildew.`,
      impactRisk: 'Rapid fungal zoospore germination across foliar canopy within 24-48 hours.',
      precautions: [
        'Apply prophylactic Copper Oxychloride (2.5g/L) or biological Trichoderma spray.',
        'Prune lower diseased foliage to maximize air circulation beneath the crop canopy.',
        'Avoid evening overhead sprinkler irrigation to reduce leaf wetness duration.',
      ],
    });
  }

  // Storm / Wind gust lodging criteria
  if (stormRisk > 45 || maxWindGust > 35) {
    disasterAlerts.push({
      type: 'storm_wind',
      title: 'High Wind Squall & Crop Lodging Hazard',
      severity: maxWindGust > 50 ? 'Critical' : 'Moderate',
      probability: stormRisk,
      onset: `Peak Gusts up to ${Math.round(maxWindGust)} km/h (${windDir} Direction)`,
      metricLabel: `${Math.round(maxWindGust)} km/h Peak Wind Gusts`,
      description: `Convective weather system generating strong turbulent wind corridors from ${windDir} heading. Open vegetative canopies are vulnerable to mechanical stem lodging.`,
      impactRisk: 'Stem snapping, foliar shredding, and trellis collapse in tall crops.',
      precautions: [
        'Inspect and tighten all shade-netting, polyhouse anchors, and boundary windbreak supports.',
        'Avoid heavy pre-storm irrigation to prevent soil softening around root anchoring zones.',
      ],
    });
  }

  // Drought / Soil deficit criteria
  if (droughtRisk > 55 || soilMoisM3 < 0.18) {
    disasterAlerts.push({
      type: 'drought',
      title: 'Soil Moisture Deficit & Dry Spell Hazard',
      severity: droughtRisk > 75 ? 'Critical' : 'High',
      probability: droughtRisk,
      onset: `Ongoing Dry Period • Soil Volumetric Water: ${soilPercent}%`,
      metricLabel: `${soilMoisM3} m³/m³ Soil Moisture Deficit`,
      description: `Low volumetric soil moisture (${soilMoisM3} m³/m³) and high evapotranspiration (${et0} mm/day) are depleting root-zone capillary water reserve.`,
      impactRisk: 'Permanent stomatal closure, leaf curling, and flower/boll abortion.',
      precautions: [
        'Schedule supplemental drip pulse irrigation during cool nighttime hours (10 PM - 4 AM).',
        'Apply organic straw, crop residue, or mulch to reduce direct soil surface evaporation.',
        'Spray potassium nitrate (1%) or anti-transpirant to increase plant drought resilience.',
      ],
    });
  }

  // Extreme heatwave criteria
  if (heatRisk > 60 || maxTemp > 36 || maxUv > 8) {
    disasterAlerts.push({
      type: 'heatwave',
      title: 'Extreme Solar Radiation & Thermal Scorch Warning',
      severity: maxTemp > 38 ? 'Critical' : 'High',
      probability: heatRisk,
      onset: `Daily Peak 12:00 PM - 04:00 PM • UV Index ${maxUv}`,
      metricLabel: `${maxTemp}°C Ambient Peak • UV ${maxUv}`,
      description: `Intense solar irradiance (UV Index ${maxUv}) creating severe thermal stress and foliar sunburn risk on exposed seedlings.`,
      impactRisk: 'Canopy sunscald, rapid moisture depletion, and pollen sterility.',
      precautions: [
        'Deploy 50% green agro-shade netting over high-value nursery and vegetable plots.',
        'Run micro-sprinklers for 10-minute cooling pulses during solar noon.',
      ],
    });
  }

  return {
    locationName: locationLabel || `Farm Coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
    latitude: lat,
    longitude: lng,
    elevation: data.elevation ?? 518,
    current: {
      temperature: temp,
      humidity: rh,
      apparentTemperature: current.apparent_temperature ?? temp,
      precipitation: current.precipitation ?? 0,
      weatherCode: current.weather_code ?? 0,
      weatherCondition: wmo.condition,
      weatherIcon: wmo.icon,
      surfacePressure: pressure,
      windSpeed,
      windDirection: windDir,
      windGusts,
      soilTemperature: soilTemp,
      soilMoisture: soilMoisM3,
      soilMoisturePercent: soilPercent,
      uvIndex: uv,
      et0,
      vpd,
      timestamp: current.time || new Date().toISOString(),
    },
    threatScores: {
      floodRisk,
      droughtRisk,
      stormRisk,
      diseaseRisk,
      heatRisk,
    },
    disasterAlerts,
    forecast: daysList,
  };
}

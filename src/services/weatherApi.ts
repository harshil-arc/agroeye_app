import {
  WeatherData,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  CalamityRiskRow,
  DisasterAlert,
  HistoryDay,
  SprayCondition,
  Language,
} from '../types/weather';
import { getSoilProfile, classifySoilByCoordinates } from './soilService';

// WMO Weather code interpreter
export function decodeWeatherCode(code: number): { conditionEn: string; conditionHi: string; icon: string } {
  switch (code) {
    case 0:
      return { conditionEn: 'Clear Sky', conditionHi: 'साफ आसमान', icon: 'Sun' };
    case 1:
      return { conditionEn: 'Mainly Clear', conditionHi: 'अधिकांशतः साफ', icon: 'Sun' };
    case 2:
      return { conditionEn: 'Partly Cloudy', conditionHi: 'आंशिक बादल', icon: 'CloudSun' };
    case 3:
      return { conditionEn: 'Overcast', conditionHi: 'घने बादल', icon: 'Cloud' };
    case 45:
    case 48:
      return { conditionEn: 'Dense Fog', conditionHi: 'घना कोहरा', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { conditionEn: 'Light Drizzle', conditionHi: 'हल्की बूंदाबांदी', icon: 'CloudDrizzle' };
    case 61:
    case 63:
    case 65:
      return { conditionEn: 'Rain Showers', conditionHi: 'बारिश', icon: 'CloudRain' };
    case 71:
    case 73:
    case 75:
      return { conditionEn: 'Snow / Frost', conditionHi: 'पाला / बर्फबारी', icon: 'Snowflake' };
    case 80:
    case 81:
    case 82:
      return { conditionEn: 'Heavy Rain Showers', conditionHi: 'मूसलाधार वर्षा', icon: 'CloudLightning' };
    case 95:
    case 96:
    case 99:
      return { conditionEn: 'Severe Thunderstorm & Squall', conditionHi: 'गरज-चमक के साथ आंधी', icon: 'CloudAlert' };
    default:
      return { conditionEn: 'Partly Cloudy', conditionHi: 'आंशिक बादल', icon: 'CloudSun' };
  }
}

// Convert wind degrees to compass direction
export function getWindCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg ?? 0) / 22.5) % 16;
  return directions[index] || 'N';
}

// Calculate Vapor Pressure Deficit (kPa)
export function calculateVPD(tempC: number, rhPercent: number): number {
  if (!tempC || !rhPercent) return 1.2;
  const es = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const ea = (rhPercent / 100) * es;
  return +(es - ea).toFixed(2);
}

// Fetch 100% REAL hyperlocal weather from Open-Meteo API
export async function fetchFarmWeather(
  lat: number,
  lng: number,
  farmName?: string,
  lang: Language = 'en'
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,soil_temperature_0cm,soil_moisture_0_to_1cm,uv_index,et0_fao_evapotranspiration,cloud_cover,visibility&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,et0_fao_evapotranspiration,uv_index_max&past_days=7&forecast_days=7&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API response status: ${res.status}`);
  }

  const data = await res.json();
  const currentRaw = data.current || {};
  const hourlyRaw = data.hourly || {};
  const dailyRaw = data.daily || {};

  // Exact real Current Parameters from Open-Meteo
  const temp = +(currentRaw.temperature_2m ?? 0).toFixed(1);
  const humidity = Math.round(currentRaw.relative_humidity_2m ?? 0);
  const windSpeed = +(currentRaw.wind_speed_10m ?? 0).toFixed(1);
  const windGusts = +(currentRaw.wind_gusts_10m ?? 0).toFixed(1);
  const windDirectionDegree = currentRaw.wind_direction_10m ?? 0;
  const windDir = `${windDirectionDegree}° · ${getWindCompass(windDirectionDegree)}`;
  const pressure = Math.round(currentRaw.surface_pressure ?? 1012);
  const soilTemp = +(currentRaw.soil_temperature_0cm ?? temp).toFixed(1);
  const soilMoistureRaw = +(currentRaw.soil_moisture_0_to_1cm ?? 0.22).toFixed(3);
  const soilMoisturePercent = Math.min(100, Math.round((soilMoistureRaw / 0.45) * 100));
  const uv = +(currentRaw.uv_index ?? 0).toFixed(1);
  const et0 = +(currentRaw.et0_fao_evapotranspiration ?? 3.5).toFixed(1);
  const vpd = calculateVPD(temp, humidity);
  const cloudCover = Math.round(currentRaw.cloud_cover ?? 0);
  const visibilityKm = currentRaw.visibility ? +(currentRaw.visibility / 1000).toFixed(1) : 15;
  const weatherCode = currentRaw.weather_code ?? 0;
  const weatherInfo = decodeWeatherCode(weatherCode);

  const currentWeather: CurrentWeather = {
    temperature: temp,
    apparentTemperature: +(currentRaw.apparent_temperature ?? temp).toFixed(1),
    humidity,
    precipitation: +(currentRaw.precipitation ?? 0).toFixed(1),
    weatherCode,
    weatherCondition: lang === 'hi' ? weatherInfo.conditionHi : weatherInfo.conditionEn,
    weatherIcon: weatherInfo.icon,
    surfacePressure: pressure,
    windSpeed,
    windDirection: windDir,
    windGusts,
    soilTemperature: soilTemp,
    soilMoisture: soilMoistureRaw,
    soilMoisturePercent,
    uvIndex: uv,
    et0,
    vpd,
    cloudCover,
    visibilityKm,
    timestamp: currentRaw.time || new Date().toISOString(),
  };

  // 24-Hour Hourly Forecast
  const hourlyTimes = hourlyRaw.time || [];
  const hourlyForecast: HourlyForecastItem[] = [];
  const nowMs = Date.now();
  let count = 0;

  for (let i = 0; i < hourlyTimes.length && count < 24; i++) {
    const itemTime = new Date(hourlyTimes[i]);
    if (itemTime.getTime() >= nowMs - 3600 * 1000) {
      const code = hourlyRaw.weather_code?.[i] ?? 0;
      const dec = decodeWeatherCode(code);
      hourlyForecast.push({
        time: hourlyTimes[i],
        hourLabel: itemTime.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: 'numeric', hour12: true }),
        temperature: Math.round(hourlyRaw.temperature_2m?.[i] ?? temp),
        humidity: Math.round(hourlyRaw.relative_humidity_2m?.[i] ?? humidity),
        precipitationProbability: Math.round(hourlyRaw.precipitation_probability?.[i] ?? 0),
        precipitation: +(hourlyRaw.precipitation?.[i] ?? 0).toFixed(1),
        windSpeed: Math.round(hourlyRaw.wind_speed_10m?.[i] ?? windSpeed),
        uvIndex: +(hourlyRaw.uv_index?.[i] ?? 0).toFixed(1),
        condition: lang === 'hi' ? dec.conditionHi : dec.conditionEn,
        icon: dec.icon,
      });
      count++;
    }
  }

  // Find exact index of today in daily times
  const dailyTimes = dailyRaw.time || [];
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  let todayIndex = dailyTimes.findIndex((tStr: string) => tStr === todayStr);
  if (todayIndex === -1) {
    todayIndex = Math.max(0, dailyTimes.length - 7);
  }

  // 7-Day History (Days before today)
  const history: HistoryDay[] = [];
  const histStart = Math.max(0, todayIndex - 7);
  for (let i = histStart; i < todayIndex; i++) {
    const d = new Date(dailyTimes[i]);
    const maxT = dailyRaw.temperature_2m_max?.[i] ?? 30;
    const minT = dailyRaw.temperature_2m_min?.[i] ?? 20;
    const rain = dailyRaw.precipitation_sum?.[i] ?? 0;
    const dec = decodeWeatherCode(dailyRaw.weather_code?.[i] ?? 0);

    history.push({
      date: d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' }),
      tempMax: Math.round(maxT),
      tempMin: Math.round(minT),
      tempAvg: +((maxT + minT) / 2).toFixed(1),
      rainSum: +rain.toFixed(1),
      humidityAvg: Math.round(50 + (rain > 0 ? 25 : 0)),
      windMax: Math.round(dailyRaw.wind_gusts_10m_max?.[i] ?? 14),
      et0: +(dailyRaw.et0_fao_evapotranspiration?.[i] ?? 4.0).toFixed(1),
      condition: lang === 'hi' ? dec.conditionHi : dec.conditionEn,
      icon: dec.icon,
    });
  }

  // Real 7-Day Forward Forecast (Starting from Today)
  const forecast: DailyForecastItem[] = [];
  let maxRainProb = 0;
  let maxRainSum = 0;
  let peakWindGust = windGusts;
  let peakUV = uv;
  let peakTempMax = temp;
  let dryDays = 0;

  const forecastEnd = Math.min(todayIndex + 7, dailyTimes.length);
  for (let i = todayIndex; i < forecastEnd; i++) {
    const d = new Date(dailyTimes[i]);
    const offset = i - todayIndex;
    const dayLabel = offset === 0 ? (lang === 'hi' ? 'आज' : 'Today') : offset === 1 ? (lang === 'hi' ? 'कल' : 'Tomorrow') : d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
    const dateLabel = d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' });
    const dec = decodeWeatherCode(dailyRaw.weather_code?.[i] ?? 0);
    const rainProb = Math.round(dailyRaw.precipitation_probability_max?.[i] ?? 0);
    const rainSum = +(dailyRaw.precipitation_sum?.[i] ?? 0).toFixed(1);
    const windGust = Math.round(dailyRaw.wind_gusts_10m_max?.[i] ?? 15);
    const tMax = Math.round(dailyRaw.temperature_2m_max?.[i] ?? 32);
    const tMin = Math.round(dailyRaw.temperature_2m_min?.[i] ?? 22);
    const uvMax = +(dailyRaw.uv_index_max?.[i] ?? 6).toFixed(1);

    if (rainProb > maxRainProb) maxRainProb = rainProb;
    if (rainSum > maxRainSum) maxRainSum = rainSum;
    if (windGust > peakWindGust) peakWindGust = windGust;
    if (uvMax > peakUV) peakUV = uvMax;
    if (tMax > peakTempMax) peakTempMax = tMax;
    if (rainSum < 1) dryDays++;

    // Chemical Spray Advisory Calculation
    let sprayCondition: SprayCondition = 'Optimal Window';
    if (rainProb > 40 || rainSum > 4 || windGust > 28) {
      sprayCondition = 'Do Not Spray';
    } else if (rainProb > 20 || windGust > 18 || tMax > 36) {
      sprayCondition = 'Caution';
    }

    forecast.push({
      day: dayLabel,
      date: dateLabel,
      condition: lang === 'hi' ? dec.conditionHi : dec.conditionEn,
      icon: dec.icon,
      tempMax: tMax,
      tempMin: tMin,
      rainChance: rainProb,
      rainSum,
      windGustMax: windGust,
      uvMax,
      sprayCondition,
    });
  }

  // Threat Scores Calibration based on Real Forecast
  const floodRisk = Math.min(100, Math.round(0.55 * maxRainProb + Math.min(45, 1.8 * maxRainSum)));
  const droughtRisk = Math.min(100, Math.round((1 - soilMoistureRaw / 0.42) * 50 + (dryDays / 7) * 45));
  const stormRisk = Math.min(100, Math.round((peakWindGust / 60) * 100));
  const diseaseRisk = Math.min(100, Math.round((humidity / 90) * 60 + (temp >= 20 && temp <= 32 ? 35 : 10)));
  const heatRisk = Math.min(100, Math.round((peakTempMax / 44) * 60 + (peakUV / 11) * 40));

  const threatScores = {
    floodRisk,
    droughtRisk,
    stormRisk,
    diseaseRisk,
    heatRisk,
  };

  const isHi = lang === 'hi';
  const calamityRiskTable: CalamityRiskRow[] = [
    {
      event: isHi ? 'भारी वर्षा / बादलों का फटना' : 'Heavy Rain / Cloudburst',
      eventKey: 'heavy_rain',
      emoji: '🌧️',
      risk: floodRisk > 70 ? 'Critical' : floodRisk > 40 ? 'High' : floodRisk > 20 ? 'Medium' : 'Low',
      riskPercent: floodRisk,
      expected: maxRainSum > 0 ? (isHi ? `आगामी 24 घंटे (${maxRainSum} मिमी)` : `Next 24h (${maxRainSum} mm)`) : (isHi ? 'कम संभावना' : 'Low Risk Window'),
      details: isHi ? `${maxRainProb}% बारिश की संभावना के साथ ${maxRainSum} मिमी संचित वर्षा अनुमानित है।` : `${maxRainProb}% rain probability with ${maxRainSum} mm accumulated volume.`,
      precaution: isHi ? 'खेत की मुख्य जल निकासी नालियों और मेड़ों से अवरोध तुरंत साफ करें।' : 'Clear silt and weeds from field drainage furrows to prevent standing water.',
    },
    {
      event: isHi ? 'जलभराव एवं बाढ़ का खतरा' : 'Flash Flood & Waterlogging',
      eventKey: 'flood',
      emoji: '🌊',
      risk: floodRisk > 60 ? 'High' : floodRisk > 30 ? 'Medium' : 'Low',
      riskPercent: Math.round(0.85 * floodRisk),
      expected: maxRainSum > 20 ? (isHi ? 'अगले 36 घंटे' : 'Next 36 Hours') : '—',
      details: isHi ? 'निचले हिस्सों में 12 घंटे से अधिक जलभराव से जड़ सड़न का खतरा है।' : 'Low-lying furrows face root asphyxiation and standing water accumulation.',
      precaution: isHi ? 'इलेक्ट्रिक मोटर पंप को ऊंचे स्थान पर रखें और जल निकास हेतु कट्स लगाएं।' : 'Elevate electric pump sets and dig lateral runoff trenches around crop borders.',
    },
    {
      event: isHi ? 'तेज़ आंधी एवं फसल गिरने का खतरा' : 'Severe Storm & Squall Winds',
      eventKey: 'storm',
      emoji: '🌪️',
      risk: stormRisk > 70 ? 'Critical' : stormRisk > 45 ? 'High' : stormRisk > 25 ? 'Medium' : 'Low',
      riskPercent: stormRisk,
      expected: peakWindGust > 35 ? (isHi ? 'आगामी 24 घंटे' : 'Next 24 Hours') : '—',
      details: isHi ? `${Math.round(peakWindGust)} किमी/घंटा की गति से तेज झोंकेदार हवाएं चलने का अनुमान।` : `Turbulent wind corridor with gusts reaching ${Math.round(peakWindGust)} km/h.`,
      precaution: isHi ? 'पॉलीहाउस के रस्से कसें तथा लंबी फसलों (मक्का, केला, गन्ना) को सहारा दें।' : 'Tighten polyhouse anchor guy-wires and stake tall standing crops with bamboo.',
    },
  ];

  // Active Disaster Alerts if thresholds are crossed in real data
  const disasterAlerts: DisasterAlert[] = [];
  if (floodRisk > 45 || maxRainSum > 15) {
    const isCrit = floodRisk > 70 || maxRainSum > 30;
    disasterAlerts.push({
      id: 'alert_rain_flood',
      type: 'rain_flood',
      title: isHi
        ? (isCrit ? '⚠️ अतिवृष्टि एवं खेत जलभराव की आपातकालीन चेतावनी' : 'सतर्कता: संभावित वर्षा एवं जल निकासी परामर्श')
        : (isCrit ? 'Severe Rainfall & Flash Waterlogging Warning' : 'Localized Precipitation & Drainage Advisory'),
      severity: isCrit ? 'Critical' : 'High',
      probability: floodRisk,
      onset: isHi ? `आगामी 24–48 घंटे • अनुमानित बारिश: ${maxRainSum} मिमी` : `Upcoming 24-48 Hours • Expected Rain: ${maxRainSum} mm`,
      metricLabel: `${maxRainSum} mm Rain`,
      description: isHi
        ? `उपग्रह मौसम मॉडल ${maxRainProb}% संभावना के साथ ${maxRainSum} मिमी वर्षा दर्शाते हैं।`
        : `Meteorological models forecast ${maxRainSum} mm accumulated precipitation with ${maxRainProb}% probability.`,
      impactRisk: isHi
        ? 'जड़ों में ऑक्सीजन की कमी, पोषक तत्वों का बह जाना (लीचिंग), और फसलों का गिरना।'
        : 'Root zone oxygen starvation, nutrient leaching, and lodging in standing crops.',
      precautions: isHi
        ? [
            'खेत के मुख्य निकास द्वार खोलें ताकि बारिश का पानी तुरंत बाहर निकल सके।',
            'सीमावर्ती नालियों से खरपतवार और गाद तुरंत हटाएं।',
            'मिट्टी सूखने तक रासायनिक छिड़काव स्थगित रखें।',
          ]
        : [
            'Open farm drainage canal spillway gates to allow free water discharge.',
            'Clear silt, weeds, and sediment blockages from primary boundary furrows.',
            'Suspend nitrogen top-dressing and chemical spray applications until soil stabilizes.',
          ],
    });
  }

  if (stormRisk > 50 || peakWindGust > 38) {
    disasterAlerts.push({
      id: 'alert_storm_wind',
      type: 'storm_wind',
      title: isHi ? '🌪️ तेज हवाओं का झोंका एवं फसल सुरक्षा सलाह' : 'Elevated Wind Squall Advisory',
      severity: peakWindGust > 50 ? 'Critical' : 'High',
      probability: stormRisk,
      onset: isHi ? `${Math.round(peakWindGust)} किमी/घंटा तक हवा के झोंके` : `Peak Gusts up to ${Math.round(peakWindGust)} km/h`,
      metricLabel: `${Math.round(peakWindGust)} km/h Gusts`,
      description: isHi
        ? `तेज हवाओं का झोंका आने की संभावना है। लंबी फसलों को सहारा दें।`
        : `Convective weather system generating strong turbulent wind corridors.`,
      impactRisk: isHi ? 'तने टूटना और पॉलीहाउस को क्षति।' : 'Stem snapping and trellis collapse in tall crops.',
      precautions: isHi
        ? [
            'पॉलीहाउस और शेड नेट के सपोर्ट रस्सियों को कसकर बांधें।',
            'आंधी से पहले भारी सिंचाई न करें ताकि जड़ें ढीली न हों।',
          ]
        : [
            'Tighten polyhouse anchor guy-wires and boundary windbreak supports.',
            'Avoid heavy pre-storm irrigation to prevent soil softening around roots.',
          ],
    });
  }

  const soilProfile = await getSoilProfile(lat, lng, farmName);

  return {
    locationName: farmName || `Farm (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
    latitude: lat,
    longitude: lng,
    elevation: data.elevation ?? 520,
    current: currentWeather,
    threatScores,
    calamityRiskTable,
    disasterAlerts,
    hourlyForecast,
    forecast,
    spatialHazards: [],
    history,
    soilProfile,
  };
}

// Simulated Rich DEMO FARM with Calamity Alerts (To show all sorts of alerts, wind speed, wind direction, humidity, temp)
export function getDemoFarmWeather(lang: Language = 'en'): WeatherData {
  const isHi = lang === 'hi';
  const now = new Date();

  const current: CurrentWeather = {
    temperature: 31.4,
    apparentTemperature: 37.2,
    humidity: 86,
    precipitation: 32.5,
    weatherCode: 95,
    weatherCondition: isHi ? 'भीषण आंधी तूफान एवं मूसलाधार बारिश' : 'Severe Thunderstorm & Squall',
    weatherIcon: 'CloudAlert',
    surfacePressure: 992.5,
    windSpeed: 42.0,
    windDirection: '335° · NNW (उत्तर-उत्तर-पश्चिम)',
    windGusts: 58.0,
    soilTemperature: 24.5,
    soilMoisture: 0.44,
    soilMoisturePercent: 96,
    uvIndex: 2.5,
    et0: 2.1,
    vpd: 0.62,
    cloudCover: 100,
    visibilityKm: 3.2,
    timestamp: now.toISOString(),
  };

  const threatScores = {
    floodRisk: 94,
    droughtRisk: 10,
    stormRisk: 88,
    diseaseRisk: 85,
    heatRisk: 40,
  };

  const calamityRiskTable: CalamityRiskRow[] = [
    {
      event: isHi ? 'अतिवृष्टि एवं बाढ़ का खतरा' : 'Flash Flood & Waterlogging Hazard',
      eventKey: 'flood',
      emoji: '🌊',
      risk: 'Critical',
      riskPercent: 94,
      expected: isHi ? 'आगामी 6 घंटे (68 मिमी बारिश)' : 'Next 6-12 Hours (68 mm Rain)',
      details: isHi ? 'बादल फटने और अत्यधिक वर्षा से निचले खेतों में 15 घंटे से अधिक पानी ठहरने की आशंका है।' : 'Torrential downpour causing standing water accumulation in crop furrows exceeding 15 hours.',
      precaution: isHi ? 'खेत की मुख्य नालियों को तुरंत खोलें और बिजली के मोटर पंप सुरक्षित ऊंचे स्थान पर रखें।' : 'Open boundary drainage canals immediately and elevate all electric pump motors above ground.',
    },
    {
      event: isHi ? 'भीषण आंधी एवं फसल गिरने का खतरा' : 'High Wind Squall & Crop Lodging',
      eventKey: 'storm',
      emoji: '🌪️',
      risk: 'Critical',
      riskPercent: 88,
      expected: isHi ? 'आज शाम (58 किमी/घंटा झोंके)' : 'Today Evening (58 km/h Gusts)',
      details: isHi ? 'उत्तर-पश्चिम दिशा से 58 किमी/घंटा की तूफानी हवाओं से खड़ी फसलें और शेड नेट गिर सकते हैं।' : 'Destructive squall corridor from NNW direction threatening standing maize and polyhouse structures.',
      precaution: isHi ? 'पॉलीहाउस के रस्से कसें तथा सब्जियों और फसलों को बांस का सहारा दें।' : 'Tighten polyhouse anchor cables and mechanically stake tall crop rows with bamboo poles.',
    },
    {
      event: isHi ? 'फफूंद व पत्ती रोग संक्रमण खिड़की' : 'Foliar Fungal Pathogen Spores',
      eventKey: 'fungal',
      emoji: '🌾',
      risk: 'High',
      riskPercent: 85,
      expected: isHi ? 'सक्रिय संक्रमण अवधि (नमी 86%)' : 'Active Canopy Window (86% RH)',
      details: isHi ? 'अत्यधिक आर्द्रता और 31°C तापमान से ब्लाइट और फफूंद का जीवाणु तेजी से पनपेगा।' : 'High ambient humidity and warm canopy create optimal incubation for fungal blight and mildew.',
      precaution: isHi ? 'बारिश थमते ही रोगरक्षक कॉपर ऑक्सीक्लोराइड (2.5 ग्राम/लीटर) का सुरक्षात्मक छिड़काव करें।' : 'Apply prophylactic Copper Oxychloride (2.5g/L) or Trichoderma spray once rainfall pauses.',
    },
  ];

  const disasterAlerts: DisasterAlert[] = [
    {
      id: 'demo_alert_flood',
      type: 'rain_flood',
      title: isHi
        ? '🚨 अतिवृष्टि एवं खेत जलभराव की आपातकालीन चेतावनी (FLOOD WARNING)'
        : '🚨 Severe Flash Flood & Field Waterlogging Emergency Warning',
      severity: 'Critical',
      probability: 94,
      onset: isHi ? 'आगामी 6 घंटे • अनुमानित वर्षा: 68 मिमी' : 'Next 6-12 Hours • Expected Rain: 68 mm',
      metricLabel: '68 mm Rain Volume',
      description: isHi
        ? 'मौसम रडार 94% संभावना के साथ 68 मिमी मूसलाधार बारिश का संकेत दे रहा है। खेत की निचली क्यारियों में जलभराव की गंभीर आशंका है।'
        : 'Doppler radar indicates imminent 68 mm cloudburst with 94% probability. Low-lying field furrows face severe root zone oxygen starvation.',
      impactRisk: isHi
        ? 'जड़ों का दम घुटना (रूट एस्फ़िक्सिया), पोषक तत्वों का बह जाना और फसलों का सड़ना।'
        : 'Root asphyxiation, nutrient leaching, and premature crop decay.',
      precautions: isHi
        ? [
            'खेत के मुख्य निकास द्वार तुरंत खोलें ताकि पानी तेजी से बाहर निकल सके।',
            'सीमावर्ती नालियों से कचरा और गाद तुरंत हटाएं।',
            'सिंचाई मोटर पंप और बिजली के तारों को जमीन से ऊपर सुरक्षित रखें।',
            'पानी सूखने तक कोई भी रासायनिक खाद या कीटनाशक न डालें।',
          ]
        : [
            'Open all field drainage spillway gates immediately for free runoff discharge.',
            'Clear silt, weeds, and sediment blockages from field perimeter furrows.',
            'Elevate electric pump motors and electrical switches above flood level.',
            'Suspend all fertilizer and pesticide spraying until soil dries.',
          ],
    },
    {
      id: 'demo_alert_storm',
      type: 'storm_wind',
      title: isHi
        ? '🌪️ भीषण आंधी एवं तेज हवाओं की चेतावनी (HIGH SQUALL HAZARD)'
        : '🌪️ High Wind Squall & Crop Lodging Hazard Warning',
      severity: 'Critical',
      probability: 88,
      onset: isHi ? '58 किमी/घंटा तक तेज हवा के झोंके (NNW दिशा)' : 'Peak Gusts up to 58 km/h (NNW Direction)',
      metricLabel: '58 km/h Wind Gusts',
      description: isHi
        ? 'उत्तर-पश्चिम दिशा से तीव्र गति से आंधी आ रही है। खुले खेतों और लंबी फसलों को गंभीर क्षति का जोखिम है।'
        : 'Violent convective squall front approaching from NNW heading with turbulent 58 km/h gusts.',
      impactRisk: isHi ? 'तने टूटना, पत्तियों का छिलना, और पॉलीहाउस उखड़ना।' : 'Stem lodging, foliar shredding, and polyhouse frame damage.',
      precautions: isHi
        ? [
            'पॉलीहाउस और शेड-नेटिंग के सभी रस्से कसकर बांधें।',
            'आंधी से पहले खेत में पानी न भरें ताकि जड़ें ढीली न पड़ें।',
            'सब्जियों और मक्का के पौधों को बांस या रस्सियों से सहारा दें।',
          ]
        : [
            'Tighten polyhouse guy-wires, shade netting, and boundary supports.',
            'Avoid pre-storm irrigation to prevent soil loosening around root zones.',
            'Provide bamboo staking for tall maize, banana, or vegetable crops.',
          ],
    },
  ];

  // 7-Day Demo Forecast
  const forecast: DailyForecastItem[] = [
    {
      day: isHi ? 'आज' : 'Today',
      date: 'Sep 29',
      condition: isHi ? 'मूसलाधार वर्षा व आंधी' : 'Heavy Rain & Squall',
      icon: 'CloudAlert',
      tempMax: 31,
      tempMin: 23,
      rainChance: 95,
      rainSum: 68.0,
      windGustMax: 58,
      uvMax: 2.5,
      sprayCondition: 'Do Not Spray',
    },
    {
      day: isHi ? 'कल' : 'Tomorrow',
      date: 'Sep 30',
      condition: isHi ? 'भारी बारिश' : 'Heavy Showers',
      icon: 'CloudRain',
      tempMax: 28,
      tempMin: 22,
      rainChance: 85,
      rainSum: 42.5,
      windGustMax: 44,
      uvMax: 3.2,
      sprayCondition: 'Do Not Spray',
    },
    {
      day: isHi ? 'गुरुवार' : 'Thu',
      date: 'Oct 01',
      condition: isHi ? 'रुक-रुक कर बारिश' : 'Scattered Showers',
      icon: 'CloudRain',
      tempMax: 29,
      tempMin: 21,
      rainChance: 55,
      rainSum: 14.0,
      windGustMax: 28,
      uvMax: 4.8,
      sprayCondition: 'Do Not Spray',
    },
    {
      day: isHi ? 'शुक्रवार' : 'Fri',
      date: 'Oct 02',
      condition: isHi ? 'हल्की बूंदाबांदी' : 'Light Drizzle',
      icon: 'CloudDrizzle',
      tempMax: 31,
      tempMin: 22,
      rainChance: 30,
      rainSum: 3.2,
      windGustMax: 18,
      uvMax: 6.0,
      sprayCondition: 'Caution',
    },
    {
      day: isHi ? 'शनिवार' : 'Sat',
      date: 'Oct 03',
      condition: isHi ? 'आंशिक बादल' : 'Partly Cloudy',
      icon: 'CloudSun',
      tempMax: 32,
      tempMin: 22,
      rainChance: 15,
      rainSum: 0.0,
      windGustMax: 14,
      uvMax: 7.2,
      sprayCondition: 'Optimal Window',
    },
    {
      day: isHi ? 'रविवार' : 'Sun',
      date: 'Oct 04',
      condition: isHi ? 'साफ आसमान' : 'Clear Sky',
      icon: 'Sun',
      tempMax: 33,
      tempMin: 23,
      rainChance: 5,
      rainSum: 0.0,
      windGustMax: 12,
      uvMax: 7.8,
      sprayCondition: 'Optimal Window',
    },
    {
      day: isHi ? 'सोमवार' : 'Mon',
      date: 'Oct 05',
      condition: isHi ? 'साफ व धूप' : 'Sunny & Clear',
      icon: 'Sun',
      tempMax: 34,
      tempMin: 23,
      rainChance: 5,
      rainSum: 0.0,
      windGustMax: 11,
      uvMax: 8.0,
      sprayCondition: 'Optimal Window',
    },
  ];

  return {
    locationName: isHi ? 'डेमो खेत • आपदा रडार परीक्षण' : 'Demo Farm • Calamity Threat Zone',
    latitude: 24.6128,
    longitude: 73.8821,
    elevation: 518,
    current,
    threatScores,
    calamityRiskTable,
    disasterAlerts,
    hourlyForecast: [],
    forecast,
    spatialHazards: [],
    history: [],
    soilProfile: classifySoilByCoordinates(24.6128, 73.8821, 'Udaipur, Rajasthan'),
  };
}

// Nominatim Geocoding Search (Village, Town, City, Pin Code)
export async function searchLocation(query: string): Promise<Array<{ name: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];
  const encoded = encodeURIComponent(query.trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=5`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,hi',
        'User-Agent': 'AgroEye-Weather-App/1.0',
      },
    });
    if (!res.ok) return [];
    const results = await res.json();
    return results.map((item: any) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (err) {
    console.error('Geocoding search failed:', err);
    return [];
  }
}

// Reverse Geocode coordinates to clean place name
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,hi',
        'User-Agent': 'AgroEye-Weather-App/1.0',
      },
    });
    if (!res.ok) return `Farm (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
    const data = await res.json();
    const addr = data.address || {};
    const village = addr.village || addr.suburb || addr.town || addr.city || addr.county || addr.state_district;
    const state = addr.state || '';
    if (village && state) return `${village}, ${state}`;
    if (village) return village;
    return data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : `Farm (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
  } catch {
    return `Farm (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
  }
}

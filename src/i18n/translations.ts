import { Language } from '../types/weather';

export const translations = {
  en: {
    // Header & Meta
    appName: 'AgroEye',
    appSubtitle: 'Weather & Farm Safety Radar',
    liveStation: 'Live meteorological station & spatial calamity vectors calibrated for your marked farm.',
    switchPlot: 'Switch Active Field Plot',
    selectPlot: 'Select Active Farm Field:',
    addPlot: '+ Mark New Farm Plot',
    toggleLang: 'HI (हिंदी)',
    alertsTitle: 'Threshold & Calamity Alerts',
    allNormal: 'No threats, farm is safe',
    allNormalSub: 'All meteorological and calamity parameters are within safe agricultural thresholds.',
    close: 'Close',
    dismiss: 'Dismiss',
    locateMe: 'Locate My Farm',
    markFarm: 'Mark Your Farm',
    tapToSave: 'Tap Map to Save Pin',
    searchPlaceholder: 'Search village, tehsil, city or pin code...',
    searchBtn: 'Search',
    searching: 'Searching...',
    farmSavedMsg: 'Farm location saved! All weather telemetry & spatial hazards are now anchored to your farm.',
    
    // Map Section
    mapTitle: 'Spatial Calamity & Environmental Hazard Radar',
    mapSub: 'Interactive spatial hazards relative to YOUR FARM',
    satelliteLayer: 'Satellite (Google)',
    streetLayer: 'Google Map',
    terrainLayer: 'Terrain',
    farmPinLabel: 'Your Farm Location',
    pinGuide: 'Drag red pin or tap anywhere on the map to set your farm location',
    bufferRadius: '5 km Threat Radar Perimeter',
    radarOverlay: 'Live Rain Radar',
    shareWhatsApp: 'Share WhatsApp Advisory',

    // Current Weather
    currentAtFarm: 'Live Current Weather at Your Farm',
    feelsLike: 'Feels like',
    cloudCover: 'Cloud Cover',
    visibility: 'Visibility',
    ambientAndSoil: 'Ambient & Soil Temp',
    humidityAndVpd: 'Humidity & VPD',
    rainfallRate: 'Rainfall Rate',
    rainfall24h: '24h Sum',
    windVelocity: 'Wind Velocity',
    heading: 'Heading',
    gusts: 'Gusts',
    cloudCoverage: 'Cloud Coverage',
    overcastLevel: 'Overcast Level',
    uvAndSun: 'UV Index & Sun',
    solarIrradiance: 'Solar Irradiance',
    fieldVisibility: 'Field Visibility',
    clearSight: 'Clear Sight Distance',
    soilAndEt0: 'Soil Moisture & ET₀',
    soilMoistureLoss: 'Capillary Water Reserve',

    // Forecasts
    next24Hours: 'Next 24 Hours Hourly Forecast',
    hourlyIngest: 'Hourly Open-Meteo Ingest',
    rainProb: 'rain',
    sevenDayForecast: '7-Day Regional Forecast & Spray Advisory',
    dailySprayIndex: 'Daily Agronomic Spray Window',
    optimalWindow: 'Optimal Window',
    caution: 'Caution',
    doNotSpray: 'Do Not Spray',
    sprayOptimalTip: 'Safe for herbicide/fungicide spray. Low drift risk.',
    sprayCautionTip: 'Spray with caution. Monitor rising winds.',
    sprayAvoidTip: 'Do not spray! Rain will wash chemicals or wind will cause severe drift.',

    // Calamity Risk Table
    calamityBoardTitle: 'Natural Calamity & Disaster Risk Board',
    calamityBoardSub: 'Calibrated threat probabilities for',
    monitoredRisks: 'Monitored Risks',
    naturalEvent: 'Natural Event',
    riskLevel: 'Risk Level',
    expectedOnset: 'Expected Onset',
    detailsAndPrecaution: 'Details & Farmer Precautions',
    
    // Calamity Event Names
    heavyRainEvent: 'Heavy Rain / Cloudburst',
    floodEvent: 'Flash Flood & Waterlogging',
    heatwaveEvent: 'Extreme Heatwave & Scorch',
    stormEvent: 'Severe Storm & Squall Winds',
    droughtEvent: 'Soil Moisture Drought Deficit',
    fungalEvent: 'Foliar Fungal Pathogen Spores',

    // Spatial Hazards
    surroundingCalamities: 'Surrounding Calamities Relative to Your Farm',
    spatialZonesDetected: 'Spatial Hazard Zones Detected',
    viewDetails: 'View Agronomic Advisory',

    // Weather History
    historyTitle: 'Weather History & Visual Trends',
    historySub: 'Real past 7-day meteorological curves for your farm coordinates',
    tempTab: '🌡️ Temperature',
    rainTab: '🌧️ Rainfall',
    humidityTab: '💧 Humidity & ET₀',

    // Bottom Navigation
    navHome: 'Home',
    navLive: 'Live GIS',
    navWeather: 'Weather',
    navDetections: 'Detections',
    navProfile: 'Profile',

    // Alert Banner
    activeWarning: 'ACTIVE DISASTER ADVISORY FOR YOUR FARM',
    recommendedAction: 'Mandatory Agronomic Action:',

    // Soil Section
    soilSectionTitle: 'Regional Soil Health & Composition Profile',
    soilTypeLabel: 'Soil Type in Selected Area',
    soilTextureLabel: 'Soil Texture',
    soilPhLabel: 'Soil Reaction (pH)',
    waterRetentionLabel: 'Water Retention',
    drainageLabel: 'Internal Drainage',
    organicMatterLabel: 'Organic Matter',
    fertilityLabel: 'Nutrient Status',
    suitableCropsLabel: 'Ideal Crops for this Soil',
    managementTipLabel: 'Agronomic Soil Management Advice',
    liveSoilMetrics: 'Live Surface Telemetry',
  },
  hi: {
    // Header & Meta
    appName: 'एग्रोआई',
    appSubtitle: 'मौसम एवं आपदा सुरक्षा रडार',
    liveStation: 'आपके चिह्नित खेत के अनुसार स्वचालित मौसम केंद्र एवं आपदा विश्लेषण।',
    switchPlot: 'सक्रिय खेत बदलें',
    selectPlot: 'सक्रिय खेत चुनें:',
    addPlot: '+ नया खेत जोड़ें',
    toggleLang: 'EN (English)',
    alertsTitle: 'सक्रिय चेतावनी एवं खतरे',
    allNormal: 'कोई खतरा नहीं, खेत सुरक्षित है',
    allNormalSub: 'सभी मौसमी मानक सामान्य और सुरक्षित कृषि सीमा के भीतर हैं।',
    close: 'बंद करें',
    dismiss: 'हटाएं',
    locateMe: 'मेरा खेत खोजें (GPS)',
    markFarm: 'खेत चिह्नित करें',
    tapToSave: 'पिन लगाने के लिए नक्शे पर टैप करें',
    searchPlaceholder: 'गाँव, तहसील, शहर या पिन कोड खोजें...',
    searchBtn: 'खोजें',
    searching: 'खोज जारी...',
    farmSavedMsg: 'खेत का स्थान सुरक्षित कर लिया गया है! संपूर्ण मौसम और आपदा रडार अब आपके खेत से जुड़ा है।',

    // Map Section
    mapTitle: 'स्थानिक आपदा एवं पर्यावरण जोखिम रडार',
    mapSub: 'आपके खेत के आसपास आने वाले जोखिम और मौसमी बदलाव',
    satelliteLayer: 'सैटेलाइट (गूगल)',
    streetLayer: 'गूगल मैप',
    terrainLayer: 'भूभाग (Terrain)',
    farmPinLabel: 'आपका खेत',
    pinGuide: 'लाल पिन को खींचें या खेत पर पिन लगाने के लिए नक्शे पर कहीं भी टैप करें',
    bufferRadius: '5 किमी आपदा रडार परिधि',
    radarOverlay: 'लाइव वर्षा रडार',
    shareWhatsApp: 'WhatsApp पर सलाह भेजें',

    // Current Weather
    currentAtFarm: 'आपके खेत पर वर्तमान मौसम स्थिति',
    feelsLike: 'महसूस होता है',
    cloudCover: 'बादल आवरण',
    visibility: 'दृश्यता',
    ambientAndSoil: 'तापमान व मृदा तापमान',
    humidityAndVpd: 'आर्द्रता व वाष्प दबाव',
    rainfallRate: 'वर्षा दर (वर्तमान)',
    rainfall24h: '24 घंटे कुल वर्षा',
    windVelocity: 'हवा की गति',
    heading: 'दिशा',
    gusts: 'झोंके',
    cloudCoverage: 'बादलों का घेराव',
    overcastLevel: 'धूप व बादल',
    uvAndSun: 'पराबैंगनी किरणें (UV)',
    solarIrradiance: 'धूप की तीव्रता',
    fieldVisibility: 'खेत दृश्यता',
    clearSight: 'साफ दृष्टि दूरी',
    soilAndEt0: 'मिट्टी नमी व वाष्पीकरण',
    soilMoistureLoss: 'जड़ क्षेत्र की नमी',

    // Forecasts
    next24Hours: 'अगले 24 घंटों का प्रति घंटा पूर्वानुमान',
    hourlyIngest: 'लाइव ओपन-मेटियो अपडेट',
    rainProb: 'बारिश संभावना',
    sevenDayForecast: '7-दिवसीय मौसम व कीटनाशक छिड़काव सलाह',
    dailySprayIndex: 'दैनिक छिड़काव अनुकूलता',
    optimalWindow: 'छिड़काव के लिए उत्तम',
    caution: 'सावधानीपूर्वक करें',
    doNotSpray: 'छिड़काव न करें',
    sprayOptimalTip: 'कीटनाशक/फफूंदनाशक छिड़काव हेतु आदर्श समय। हवा शांत है।',
    sprayCautionTip: 'सतर्क रहें। हवा की गति बढ़ सकती है।',
    sprayAvoidTip: 'छिड़काव कतई न करें! बारिश से दवा धुल जाएगी या तेज हवा से दवा उड़ जाएगी।',

    // Calamity Risk Table
    calamityBoardTitle: 'प्राकृतिक आपदा एवं आपातकालीन जोखिम बोर्ड',
    calamityBoardSub: 'खेत के निर्देशांकों पर आधारित खतरे की संभावना:',
    monitoredRisks: 'निगरानी अधीन खतरे',
    naturalEvent: 'प्राकृतिक घटना',
    riskLevel: 'जोखिम स्तर',
    expectedOnset: 'संभावित समय',
    detailsAndPrecaution: 'प्रभाव एवं किसान हेतु बचाव उपाय',

    // Calamity Event Names
    heavyRainEvent: 'भारी वर्षा / बादलों का फटना',
    floodEvent: 'जलभराव एवं बाढ़ का खतरा',
    heatwaveEvent: 'भीषण लू एवं धूप झुलसाव',
    stormEvent: 'तेज़ आंधी एवं फसल गिरने का खतरा',
    droughtEvent: 'सूखा एवं मृदा नमी संकट',
    fungalEvent: 'पत्ती फफूंद व रोगजनक कीटाणु',

    // Spatial Hazards
    surroundingCalamities: 'खेत के आसपास सक्रिय मौसमी खतरे',
    spatialZonesDetected: 'सक्रिय स्थानिक आपदा क्षेत्र',
    viewDetails: 'कृषि सलाह देखें',

    // Weather History
    historyTitle: 'विगत 7 दिनों का मौसम इतिहास',
    historySub: 'आपके खेत के लिए पिछले 7 दिनों के मौसम व तापमान के ग्राफ',
    tempTab: '🌡️ तापमान',
    rainTab: '🌧️ वर्षा रिकॉर्ड',
    humidityTab: '💧 आर्द्रता व वाष्पीकरण',

    // Bottom Navigation
    navHome: 'होम',
    navLive: 'लाइव रडार',
    navWeather: 'मौसम',
    navDetections: 'रोग निदान',
    navProfile: 'प्रोफ़ाइल',

    // Alert Banner
    activeWarning: 'आपके खेत के लिए गंभीर मौसमी चेतावनी',
    recommendedAction: 'अनिवार्य कृषि सुरक्षा उपाय:',

    // Soil Section
    soilSectionTitle: 'क्षेत्रीय मृदा स्वास्थ्य एवं संरचना कार्ड',
    soilTypeLabel: 'चयनित क्षेत्र का मृदा प्रकार',
    soilTextureLabel: 'मिट्टी की बनावट (Texture)',
    soilPhLabel: 'मृदा पीएच (pH मान)',
    waterRetentionLabel: 'जलधारण क्षमता',
    drainageLabel: 'आंतरिक जल निकास',
    organicMatterLabel: 'जैविक कार्बन',
    fertilityLabel: 'पोषक तत्व भंडार',
    suitableCropsLabel: 'इस मिट्टी हेतु उपयुक्त फसलें',
    managementTipLabel: 'किसान हेतु मृदा प्रबंधन सलाह',
    liveSoilMetrics: 'सक्रिय मृदा सेंसर डेटा',
  }
};

export const getTranslation = (lang: Language) => translations[lang] || translations.en;

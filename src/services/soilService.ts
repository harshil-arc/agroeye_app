import { SoilProfile } from '../types/weather';

interface SoilGridsPropertyLayer {
  name: string;
  depths: Array<{
    label: string;
    values: {
      mean?: number;
    };
  }>;
}

// 1. Core Agro-Ecological Profiles Database (ICAR & FAO Standards)
const SOIL_TEMPLATES = {
  blackCotton: {
    soilType: 'Black Cotton Soil (Regur / Vertisol)',
    soilTypeHi: 'काली मिट्टी (रेगुर / वर्टिसोल)',
    texture: 'Heavy Clay Loam (35–55% Montmorillonite Clay)',
    textureHi: 'गहरी चिकनी दोमट (35-55% मोंटमोरिलोनाइट क्ले)',
    colorHex: '#27272a',
    badgeBg: 'bg-stone-900',
    badgeText: 'text-stone-100',
    ph: '7.6 – 8.4 (Slightly Alkaline)',
    phValue: 7.9,
    phCategory: 'Alkaline' as const,
    drainage: 'Slow (Prone to surface waterlogging)',
    drainageHi: 'धीमी (जलभराव की संभावना)',
    waterRetention: 'Very High (High moisture holding capacity)',
    waterRetentionHi: 'अत्यधिक (लंबे समय तक नमी संजोने वाली)',
    organicMatter: 'Moderate (0.5 – 0.8%)',
    organicMatterHi: 'मध्यम (0.5 - 0.8%)',
    fertilityStatus: 'Rich in Lime, Iron, Magnesia & Potash; Low in Nitrogen & Phosphorus',
    fertilityStatusHi: 'चूना, लोहा, मैग्नीशियम और पोटाश प्रचुर; नाइट्रोजन व फास्फोरस की कमी',
    suitableCrops: ['Cotton', 'Soybean', 'Wheat', 'Chickpea (Gram)', 'Jowar', 'Onion', 'Citrus / Orange'],
    suitableCropsHi: ['कपास', 'सोयाबीन', 'गेहूं', 'चना', 'ज्वार', 'प्याज', 'संतरा'],
    managementTip: 'Clay expands when wet and cracks deeply when dry. Construct broad-bed furrows (BBF) to prevent root asphyxiation during heavy monsoon showers.',
    managementTipHi: 'गीली होने पर फूलती है और सूखने पर गहरी दरारें पड़ती हैं। भारी बारिश में जड़ों को सड़ने से बचाने के लिए रिज-एंड-फरो विधि अपनाएं।',
    clayPercent: 44,
    sandPercent: 24,
    siltPercent: 32,
  },

  alluvial: {
    soilType: 'Alluvial Loam (Indo-Gangetic Silt Loam)',
    soilTypeHi: 'जलोढ़ दोमट मिट्टी (इंडो-गैंगेटिक गाद दोमट)',
    texture: 'Fine Sandy to Silty Clay Loam',
    textureHi: 'बलुई दोमट से मटियार दोमट',
    colorHex: '#854d0e',
    badgeBg: 'bg-amber-900',
    badgeText: 'text-amber-100',
    ph: '6.8 – 7.8 (Neutral to Mildly Alkaline)',
    phValue: 7.3,
    phCategory: 'Neutral' as const,
    drainage: 'Well-Drained to Moderate',
    drainageHi: 'उत्तम एवं सुव्यवस्थित जल निकास',
    waterRetention: 'High (Optimal plant-available water)',
    waterRetentionHi: 'उच्च (पौधों के लिए आदर्श जलधारण)',
    organicMatter: 'Medium to High (0.6 – 1.0%)',
    organicMatterHi: 'मध्यम से उच्च (0.6 - 1.0%)',
    fertilityStatus: 'Highly Fertile; Abundant Potash & Lime; Moderate Nitrogen demand',
    fertilityStatusHi: 'अत्यंत उपजाऊ; पोटाश और चूना प्रचुर; संतुलित खाद आवश्यक',
    suitableCrops: ['Wheat', 'Paddy (Rice)', 'Sugarcane', 'Maize', 'Mustard', 'Potato', 'Vegetables'],
    suitableCropsHi: ['गेहूं', 'धान (चावल)', 'गन्ना', 'मक्का', 'सरसों', 'आलू', 'सब्जियां'],
    managementTip: 'Naturally highly fertile. Apply balanced NPK fertilizers and green manuring (Dhaincha/Moong) to sustain topsoil microbial organic carbon.',
    managementTipHi: 'प्राकृतिक रूप से अत्यधिक उपजाऊ। जैविक कार्बन बनाए रखने के लिए संतुलित NPK के साथ हरी खाद (ढैंचा/मूंग) का प्रयोग करें।',
    clayPercent: 28,
    sandPercent: 36,
    siltPercent: 36,
  },

  redYellow: {
    soilType: 'Red and Yellow Loam (Alfisol)',
    soilTypeHi: 'लाल एवं पीली दोमट मिट्टी (एल्फीसोल)',
    texture: 'Porous Sandy Loam with Ferruginous Gravel',
    textureHi: 'छिद्रयुक्त रेतीली दोमट व कंकरीली मिट्टी',
    colorHex: '#b45309',
    badgeBg: 'bg-amber-800',
    badgeText: 'text-amber-100',
    ph: '6.0 – 7.2 (Slightly Acidic to Neutral)',
    phValue: 6.6,
    phCategory: 'Neutral' as const,
    drainage: 'Rapid to Good (Free draining)',
    drainageHi: 'तेज एवं सुचारू जल निकास',
    waterRetention: 'Moderate to Low',
    waterRetentionHi: 'मध्यम से कम',
    organicMatter: 'Low to Medium (0.3 – 0.6%)',
    organicMatterHi: 'कम से मध्यम (0.3 - 0.6%)',
    fertilityStatus: 'Rich in Iron Oxides; Deficient in Nitrogen, Phosphorus & Humus',
    fertilityStatusHi: 'लौह तत्वों से समृद्ध; नाइट्रोजन, फास्फोरस व ह्यूमस की कमी',
    suitableCrops: ['Groundnut (Peanut)', 'Maize', 'Pigeon Pea (Arhar)', 'Finger Millet (Ragi)', 'Black Gram', 'Castor'],
    suitableCropsHi: ['मूंगफली', 'मक्का', 'अरहर (तुअर)', 'रागी', 'उड़द', 'अरंडी'],
    managementTip: 'Light porous texture with good aeration. Responds excellently to farmyard manure (FYM), phosphate bio-fertilizers, and zinc micronutrients.',
    managementTipHi: 'हल्की व हवादार बनावट। गोबर की खाद (FYM), फास्फोरस जैव-उर्वरक तथा जिंक सूक्ष्म पोषक तत्वों के प्रयोग से बेहतरीन पैदावार मिलती है।',
    clayPercent: 22,
    sandPercent: 54,
    siltPercent: 24,
  },

  aridDesert: {
    soilType: 'Arid Desert Sand / Sandy Loam (Aridisol)',
    soilTypeHi: 'रेतीली / शुष्क मरुस्थलीय मिट्टी (एरिडिसोल)',
    texture: 'Coarse Sand to Loamy Sand (Low Clay < 12%)',
    textureHi: 'मोटी रेत से बलुई दोमट (कम चिकनी मिट्टी < 12%)',
    colorHex: '#d97706',
    badgeBg: 'bg-yellow-700',
    badgeText: 'text-yellow-100',
    ph: '7.8 – 8.8 (Calcareous & Alkaline)',
    phValue: 8.2,
    phCategory: 'Alkaline' as const,
    drainage: 'Excessive / Very Rapid (High percolation loss)',
    drainageHi: 'अति-तीव्र (पानी जल्दी रिसता है)',
    waterRetention: 'Low (Dries out quickly under intense sun)',
    waterRetentionHi: 'कम (धूप में जल्दी सूख जाती है)',
    organicMatter: 'Very Low (< 0.3%)',
    organicMatterHi: 'बहुत कम (< 0.3%)',
    fertilityStatus: 'High Soluble Salts & Lime; Severely Deficient in Nitrogen & Moisture',
    fertilityStatusHi: 'लवण व कंकड़ प्रचुर; नाइट्रोजन और नमी का गंभीर अभाव',
    suitableCrops: ['Pearl Millet (Bajra)', 'Cluster Bean (Guar)', 'Moth Bean', 'Cumin (Jeera)', 'Mustard', 'Isabgol', 'Pomegranate'],
    suitableCropsHi: ['बाजरा', 'ग्वार', 'मोठ', 'जीरा', 'सरसों', 'इसबगोल', 'अनार'],
    managementTip: 'Adopt drip irrigation and plastic/straw mulching to curb evaporation. Incorporate vermicompost to build vital water-holding capacity.',
    managementTipHi: 'वाष्पीकरण रोकने के लिए ड्रिप सिंचाई और मल्चिंग अपनाएं। जलधारण क्षमता बढ़ाने हेतु वर्मीकम्पोस्ट या गोबर खाद अवश्य मिलाएं।',
    clayPercent: 11,
    sandPercent: 76,
    siltPercent: 13,
  },

  laterite: {
    soilType: 'Laterite Soil (Ferralsol)',
    soilTypeHi: 'लेटराइट मिट्टी (फेराल्सोल)',
    texture: 'Coarse Loamy with Iron/Alumina Nodules',
    textureHi: 'कंकरीली दोमट (लौह एवं बॉक्साइट मिश्रित)',
    colorHex: '#991b1b',
    badgeBg: 'bg-red-900',
    badgeText: 'text-red-100',
    ph: '4.8 – 5.8 (Strongly Acidic)',
    phValue: 5.3,
    phCategory: 'Acidic' as const,
    drainage: 'Rapid (Intensely leached by heavy rainfall)',
    drainageHi: 'तीव्र (भारी वर्षा से पोषक तत्व बहते हैं)',
    waterRetention: 'Low to Moderate',
    waterRetentionHi: 'कम से मध्यम',
    organicMatter: 'Low to Moderate (Leached)',
    organicMatterHi: 'कम से मध्यम',
    fertilityStatus: 'Rich in Iron & Aluminum; Deficient in Lime, Silica, Magnesia & Potash',
    fertilityStatusHi: 'लोहा व एल्युमिनियम प्रचुर; चूना, पोटाश व मैग्नीशियम की कमी',
    suitableCrops: ['Cashew Nut', 'Tea', 'Coffee', 'Rubber', 'Arecanut', 'Coconut', 'Black Pepper', 'Cardamom'],
    suitableCropsHi: ['काजू', 'चाय', 'कॉफी', 'रबर', 'सुपारी', 'नारियल', 'काली मिर्च', 'इलायची'],
    managementTip: 'Apply agricultural lime or dolomite every 2–3 seasons to correct soil acidity and unlock fixed phosphate for plantation roots.',
    managementTipHi: 'अम्लता कम करने के लिए कृषि चूना या डोलोमाइट का छिड़काव करें जिससे फास्फोरस का अवशोषण सुचारू हो सके।',
    clayPercent: 32,
    sandPercent: 48,
    siltPercent: 20,
  },

  mountainForest: {
    soilType: 'Mountain Forest Humus Soil (Inceptisol)',
    soilTypeHi: 'पर्वतीय एवं वन ह्यूमस मिट्टी (इनसेप्टिसोल)',
    texture: 'Rich Organic Silty Loam with Slate Gravel',
    textureHi: 'ह्यूमस युक्त गाद दोमट व पथरीली मिट्टी',
    colorHex: '#3f2c1d',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-100',
    ph: '5.4 – 6.6 (Mildly Acidic)',
    phValue: 6.0,
    phCategory: 'Acidic' as const,
    drainage: 'Good on Terraced Slopes',
    drainageHi: 'सीढ़ीदार खेतों पर उत्तम जल निकास',
    waterRetention: 'High in Topsoil (Spongy Humus Matrix)',
    waterRetentionHi: 'उच्च (स्पंज जैसी जैविक ह्यूमस परत)',
    organicMatter: 'High to Very High (1.2 – 2.8%)',
    organicMatterHi: 'उच्च से अति-उच्च (1.2 - 2.8%)',
    fertilityStatus: 'Rich in Forest Organic Humus; Deficient in Potash & Phosphates',
    fertilityStatusHi: 'जैविक ह्यूमस से भरपूर; पोटाश और फास्फेट की मध्यम कमी',
    suitableCrops: ['Apple', 'Walnut', 'Almond', 'Saffron', 'Off-season Vegetables', 'Barley', 'Temperate Herbs'],
    suitableCropsHi: ['सेब', 'अखरोट', 'बादाम', 'केसर', 'बेमौसमी सब्जियां', 'जौ', 'औषधीय पौधे'],
    managementTip: 'High risk of surface soil erosion during cloudbursts. Maintain contour stone bunds, permanent grass cover, and terracing.',
    managementTipHi: 'पहाड़ी ढलानों पर मिट्टी बहने का खतरा। मेड़बंदी, घास का आच्छादन (कवर क्रॉप्स) और सीढ़ीदार खेती बनाए रखें।',
    clayPercent: 22,
    sandPercent: 38,
    siltPercent: 40,
  },

  coastalSaline: {
    soilType: 'Coastal Saline & Marine Loam',
    soilTypeHi: 'तटीय लवणीय एवं समुद्री दोमट मिट्टी',
    texture: 'Silty Clay Loam with Marine Salt Crusts',
    textureHi: 'खारे लवण युक्त मटियार दोमट',
    colorHex: '#52525b',
    badgeBg: 'bg-zinc-800',
    badgeText: 'text-zinc-100',
    ph: '7.8 – 8.8 (Saline / Alkaline)',
    phValue: 8.3,
    phCategory: 'Alkaline' as const,
    drainage: 'Poor / High Groundwater Table',
    drainageHi: 'धीमी / उच्च भूजल स्तर',
    waterRetention: 'High',
    waterRetentionHi: 'उच्च',
    organicMatter: 'Medium',
    organicMatterHi: 'मध्यम',
    fertilityStatus: 'Excess Sodium Chlorides; Low Available Nitrogen',
    fertilityStatusHi: 'अत्यधिक सोडियम लवण; नाइट्रोजन की कमी',
    suitableCrops: ['Salt-tolerant Paddy (Pokkali)', 'Coconut', 'Date Palm', 'Casuarina', 'Betel Vine'],
    suitableCropsHi: ['लवण-सहिष्णु धान (पोक्काली)', 'नारियल', 'खजूर', 'कैजुअरीना', 'पान'],
    managementTip: 'Flush excess root-zone salts with sweet canal water and apply gypsum (calcium sulphate) to displace harmful exchangeable sodium.',
    managementTipHi: 'जड़ों से खारेपन को निकालने के लिए मीठे पानी से धोएं और सोडियम प्रभाव कम करने हेतु जिप्सम का प्रयोग करें।',
    clayPercent: 36,
    sandPercent: 28,
    siltPercent: 36,
  },

  temperateLoam: {
    soilType: 'Temperate Prairie Loam (Mollisol / Cambisol)',
    soilTypeHi: 'समशीतोष्ण उपजाऊ दोमट मिट्टी (मोलिसोल)',
    texture: 'Balanced Friable Loam (Ideal Sand-Silt-Clay)',
    textureHi: 'संतुलित भुरभुरी दोमट मिट्टी',
    colorHex: '#451a03',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-100',
    ph: '6.5 – 7.2 (Near Neutral / Prime Ag)',
    phValue: 6.8,
    phCategory: 'Neutral' as const,
    drainage: 'Optimal / Naturally Aerated',
    drainageHi: 'उत्तम एवं प्राकृतिक वायु संचार',
    waterRetention: 'High to Optimal',
    waterRetentionHi: 'उत्तम',
    organicMatter: 'High (1.0 – 2.0%)',
    organicMatterHi: 'उच्च (1.0 - 2.0%)',
    fertilityStatus: 'Balanced Cation Exchange Capacity; Prime Arable Farmland',
    fertilityStatusHi: 'संतुलित खनिज तत्व; विश्व की सबसे उर्वर कृषि भूमि',
    suitableCrops: ['Corn (Maize)', 'Soybean', 'Wheat', 'Canola / Mustard', 'Barley', 'Legumes'],
    suitableCropsHi: ['मक्का', 'सोयाबीन', 'गेहूं', 'कैनोला / सरसों', 'जौ', 'दलहन'],
    managementTip: 'Prime soil condition. Practice conservation tillage and crop rotation to sustain deep humus and nutrient cycles.',
    managementTipHi: 'उत्कृष्ट प्राकृतिक उर्वरता। जैविक चक्र बनाए रखने के लिए फसल चक्र अपनाएं।',
    clayPercent: 25,
    sandPercent: 40,
    siltPercent: 35,
  },
};

// 2. High-Precision Geographic Classifier (Instant, 0ms latency)
export function classifySoilByCoordinates(
  lat: number,
  lng: number,
  placeName?: string
): SoilProfile {
  const name = (placeName || '').toLowerCase();

  // Keyword overrides from reverse-geocoded place names
  // A. Thar / Western Rajasthan Desert
  if (
    name.includes('jaisalmer') ||
    name.includes('barmer') ||
    name.includes('bikaner') ||
    name.includes('jodhpur') ||
    name.includes('churu') ||
    name.includes('nagaur') ||
    name.includes('hanumangarh') ||
    name.includes('ganganagar') ||
    name.includes('kutch') ||
    name.includes('bhuj') ||
    name.includes('thar') ||
    name.includes('jalore')
  ) {
    return { ...SOIL_TEMPLATES.aridDesert };
  }

  // B. Black Cotton Soil (Deccan Lava, Malwa, Maharashtra, Saurashtra, Hadoti)
  if (
    name.includes('maharashtra') ||
    name.includes('vidarbha') ||
    name.includes('marathwada') ||
    name.includes('nagpur') ||
    name.includes('pune') ||
    name.includes('nashik') ||
    name.includes('aurangabad') ||
    name.includes('sambhajinagar') ||
    name.includes('solapur') ||
    name.includes('kolhapur') ||
    name.includes('amravati') ||
    name.includes('akola') ||
    name.includes('jalgaon') ||
    name.includes('nanded') ||
    name.includes('latur') ||
    name.includes('malwa') ||
    name.includes('indore') ||
    name.includes('ujjain') ||
    name.includes('dewas') ||
    name.includes('dhar') ||
    name.includes('khargone') ||
    name.includes('khandwa') ||
    name.includes('ratlam') ||
    name.includes('mandsaur') ||
    name.includes('bhopal') ||
    name.includes('hoshangabad') ||
    name.includes('narmadapuram') ||
    name.includes('jabalpur') ||
    name.includes('saurashtra') ||
    name.includes('rajkot') ||
    name.includes('jamnagar') ||
    name.includes('junagadh') ||
    name.includes('bhavnagar') ||
    name.includes('amreli') ||
    name.includes('bharuch') ||
    name.includes('kota') ||
    name.includes('bundi') ||
    name.includes('jhalawar') ||
    name.includes('baran') ||
    name.includes('chittorgarh') ||
    name.includes('belgaum') ||
    name.includes('belagavi') ||
    name.includes('dharwad') ||
    name.includes('bagalkot') ||
    name.includes('vijayapura') ||
    name.includes('kalaburagi') ||
    name.includes('gulbarga') ||
    name.includes('raichur')
  ) {
    return { ...SOIL_TEMPLATES.blackCotton };
  }

  // C. Mountain & Himalayan Region
  if (
    name.includes('himachal') ||
    name.includes('uttarakhand') ||
    name.includes('kashmir') ||
    name.includes('jammu') ||
    name.includes('ladakh') ||
    name.includes('shimla') ||
    name.includes('manali') ||
    name.includes('kullu') ||
    name.includes('dehradun') ||
    name.includes('nainital') ||
    name.includes('srinagar') ||
    name.includes('sikkim') ||
    name.includes('arunachal')
  ) {
    return { ...SOIL_TEMPLATES.mountainForest };
  }

  // D. Laterite Soils (Western Ghats & Meghalaya)
  if (
    name.includes('kerala') ||
    name.includes('goa') ||
    name.includes('konkan') ||
    name.includes('ratnagiri') ||
    name.includes('sindhudurg') ||
    name.includes('mangaluru') ||
    name.includes('mangalore') ||
    name.includes('udupi') ||
    name.includes('wayanad') ||
    name.includes('idukki') ||
    name.includes('kasaragod') ||
    name.includes('kannur') ||
    name.includes('palakkad') ||
    name.includes('kottayam') ||
    name.includes('meghalaya') ||
    name.includes('shillong')
  ) {
    return { ...SOIL_TEMPLATES.laterite };
  }

  // E. Alluvial Plains (Gangetic basin, Punjab, Haryana, UP, Bihar, WB, Assam)
  if (
    name.includes('punjab') ||
    name.includes('haryana') ||
    name.includes('uttar pradesh') ||
    name.includes('bihar') ||
    name.includes('west bengal') ||
    name.includes('assam') ||
    name.includes('delhi') ||
    name.includes('ludhiana') ||
    name.includes('amritsar') ||
    name.includes('jalandhar') ||
    name.includes('karnal') ||
    name.includes('kurukshetra') ||
    name.includes('panipat') ||
    name.includes('lucknow') ||
    name.includes('kanpur') ||
    name.includes('varanasi') ||
    name.includes('prayagraj') ||
    name.includes('agra') ||
    name.includes('meerut') ||
    name.includes('bareilly') ||
    name.includes('gorakhpur') ||
    name.includes('patna') ||
    name.includes('gaya') ||
    name.includes('muzaffarpur') ||
    name.includes('kolkata') ||
    name.includes('guwahati')
  ) {
    return { ...SOIL_TEMPLATES.alluvial };
  }

  // F. Red & Yellow Soil (Mewar, Southern Deccan, Odisha, Chhattisgarh)
  if (
    name.includes('udaipur') ||
    name.includes('bhilwara') ||
    name.includes('rajsamand') ||
    name.includes('banswara') ||
    name.includes('dungarpur') ||
    name.includes('tamil nadu') ||
    name.includes('odisha') ||
    name.includes('chhattisgarh') ||
    name.includes('jharkhand') ||
    name.includes('bengaluru') ||
    name.includes('mysuru') ||
    name.includes('hyderabad') ||
    name.includes('warangal') ||
    name.includes('ranchi') ||
    name.includes('raipur') ||
    name.includes('bhubaneswar')
  ) {
    return { ...SOIL_TEMPLATES.redYellow };
  }

  // --- Coordinate-based Spatial Bounding Boxes ---

  // Inside Indian Subcontinent (approx Lat 7° to 37°, Lng 68° to 98°)
  if (lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 98.0) {
    // 1. Himalayas / Northern Alpine
    if (lat >= 30.5 && lng <= 81.0) {
      return { ...SOIL_TEMPLATES.mountainForest };
    }

    // 2. Western Arid / Thar Desert
    if (lat >= 24.0 && lat <= 30.5 && lng <= 74.2) {
      return { ...SOIL_TEMPLATES.aridDesert };
    }

    // 3. Coastal Western Ghats Laterite Strip
    if (lat >= 8.5 && lat <= 17.5 && lng >= 73.0 && lng <= 75.8) {
      return { ...SOIL_TEMPLATES.laterite };
    }

    // 4. Deccan Black Cotton Plateau (Maharashtra, MP, Saurashtra, N. Karnataka)
    if (
      (lat >= 15.0 && lat <= 22.5 && lng >= 73.2 && lng <= 80.5) ||
      (lat >= 20.0 && lat <= 24.8 && lng >= 74.5 && lng <= 78.5) // Malwa MP & Hadoti SE Rajasthan
    ) {
      return { ...SOIL_TEMPLATES.blackCotton };
    }

    // 5. Indo-Gangetic Alluvial Belt
    if (lat >= 24.2 && lat <= 31.8 && lng >= 74.8 && lng <= 89.5) {
      return { ...SOIL_TEMPLATES.alluvial };
    }

    // 6. Coastal Deltas & River Mouths
    if (
      (lat >= 19.5 && lat <= 22.5 && lng >= 85.0 && lng <= 89.0) || // Mahanadi/Bengal
      (lat >= 15.5 && lat <= 17.5 && lng >= 80.5 && lng <= 82.5)    // Krishna-Godavari
    ) {
      return { ...SOIL_TEMPLATES.alluvial };
    }

    // 7. Eastern Rajasthan / Aravalli / Southern Deccan Red & Yellow Belt
    return { ...SOIL_TEMPLATES.redYellow };
  }

  // Global / Outside India fallback:
  if (lat >= 30.0 && lat <= 55.0) {
    return { ...SOIL_TEMPLATES.temperateLoam };
  } else if (lat < 23.5 && lat > -23.5) {
    return { ...SOIL_TEMPLATES.redYellow };
  } else {
    return { ...SOIL_TEMPLATES.alluvial };
  }
}

// 3. Complete Soil Profiler with Optional Live ISRIC SoilGrids Enrichment
export async function getSoilProfile(
  lat: number,
  lng: number,
  placeName?: string
): Promise<SoilProfile> {
  const baseProfile = classifySoilByCoordinates(lat, lng, placeName);

  // Attempt live ISRIC SoilGrids 2.0 query to fetch measured clay/sand/silt/pH
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1.0s fast timeout

    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng.toFixed(4)}&lat=${lat.toFixed(4)}&property=clay&property=sand&property=silt&property=phh2o&depth=0-5cm&value=mean`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const layers: SoilGridsPropertyLayer[] = data.properties?.layers || [];

      let measuredClay: number | undefined;
      let measuredSand: number | undefined;
      let measuredSilt: number | undefined;
      let measuredPh: number | undefined;

      layers.forEach((layer) => {
        const val = layer.depths?.[0]?.values?.mean;
        if (typeof val === 'number') {
          if (layer.name === 'clay') measuredClay = +(val / 10).toFixed(1); // g/kg to %
          if (layer.name === 'sand') measuredSand = +(val / 10).toFixed(1);
          if (layer.name === 'silt') measuredSilt = +(val / 10).toFixed(1);
          if (layer.name === 'phh2o') measuredPh = +(val / 10).toFixed(1); // pH*10 to pH
        }
      });

      if (measuredClay !== undefined && measuredSand !== undefined && measuredSilt !== undefined) {
        baseProfile.clayPercent = measuredClay;
        baseProfile.sandPercent = measuredSand;
        baseProfile.siltPercent = measuredSilt;

        // Determine textural class if measured
        if (measuredClay >= 38) {
          baseProfile.texture = `Heavy Clay (${measuredClay}% Clay, ${measuredSand}% Sand, ${measuredSilt}% Silt)`;
          baseProfile.textureHi = `भारी चिकनी मिट्टी (${measuredClay}% क्ले, ${measuredSand}% रेत, ${measuredSilt}% गाद)`;
        } else if (measuredSand >= 65) {
          baseProfile.texture = `Sandy Loam (${measuredSand}% Sand, ${measuredClay}% Clay, ${measuredSilt}% Silt)`;
          baseProfile.textureHi = `बलुई दोमट (${measuredSand}% रेत, ${measuredClay}% क्ले, ${measuredSilt}% गाद)`;
        } else if (measuredClay >= 25) {
          baseProfile.texture = `Clay Loam (${measuredClay}% Clay, ${measuredSand}% Sand, ${measuredSilt}% Silt)`;
          baseProfile.textureHi = `चिकनी दोमट (${measuredClay}% क्ले, ${measuredSand}% रेत, ${measuredSilt}% गाद)`;
        } else {
          baseProfile.texture = `Medium Loam (${measuredSand}% Sand, ${measuredSilt}% Silt, ${measuredClay}% Clay)`;
          baseProfile.textureHi = `मध्यम दोमट (${measuredSand}% रेत, ${measuredSilt}% गाद, ${measuredClay}% क्ले)`;
        }
      }

      if (measuredPh !== undefined && measuredPh > 3 && measuredPh < 11) {
        baseProfile.phValue = measuredPh;
        const cat = measuredPh < 6.5 ? 'Acidic' : measuredPh > 7.5 ? 'Alkaline' : 'Neutral';
        baseProfile.phCategory = cat;
        baseProfile.ph = `${measuredPh} (${cat})`;
      }
    }
  } catch {
    // Graceful fallback to baseline ICAR/FAO agro-ecological profile
  }

  return baseProfile;
}

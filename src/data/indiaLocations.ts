// Comprehensive Indian States and Districts with Agro-Climatic Zone & Coordinate Mapping

export interface DistrictLocation {
  name: string;
  lat: number;
  lng: number;
  imdSubdivision: string;
  agroZone: string;
  normalAnnualRainfallMm: number;
  monsoonOnsetNormalDate: string; // e.g. "01-Jul"
}

export interface StateLocation {
  state: string;
  code: string;
  districts: DistrictLocation[];
}

export const INDIAN_STATES_AND_DISTRICTS: StateLocation[] = [
  {
    state: 'Rajasthan',
    code: 'RJ',
    districts: [
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873, imdSubdivision: 'East Rajasthan', agroZone: 'Semi-Arid Eastern Plain', normalAnnualRainfallMm: 650, monsoonOnsetNormalDate: '01-Jul' },
      { name: 'Udaipur', lat: 24.5854, lng: 73.7125, imdSubdivision: 'East Rajasthan', agroZone: 'Sub-Humid Southern Plains', normalAnnualRainfallMm: 630, monsoonOnsetNormalDate: '25-Jun' },
      { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, imdSubdivision: 'West Rajasthan', agroZone: 'Arid Western Plain', normalAnnualRainfallMm: 360, monsoonOnsetNormalDate: '05-Jul' },
      { name: 'Kota', lat: 25.1825, lng: 75.8344, imdSubdivision: 'East Rajasthan', agroZone: 'Humid South Eastern Plain', normalAnnualRainfallMm: 780, monsoonOnsetNormalDate: '24-Jun' },
      { name: 'Bikaner', lat: 28.0229, lng: 73.3119, imdSubdivision: 'West Rajasthan', agroZone: 'Hyper Arid Western Plain', normalAnnualRainfallMm: 260, monsoonOnsetNormalDate: '08-Jul' },
      { name: 'Ajmer', lat: 26.4499, lng: 74.6399, imdSubdivision: 'East Rajasthan', agroZone: 'Semi-Arid Eastern Plain', normalAnnualRainfallMm: 520, monsoonOnsetNormalDate: '28-Jun' },
      { name: 'Alwar', lat: 27.5530, lng: 76.6346, imdSubdivision: 'East Rajasthan', agroZone: 'Flood Prone Eastern Plain', normalAnnualRainfallMm: 620, monsoonOnsetNormalDate: '30-Jun' },
      { name: 'Bharatpur', lat: 27.2152, lng: 77.5030, imdSubdivision: 'East Rajasthan', agroZone: 'Flood Prone Eastern Plain', normalAnnualRainfallMm: 660, monsoonOnsetNormalDate: '28-Jun' },
      { name: 'Bhilwara', lat: 25.3407, lng: 74.6313, imdSubdivision: 'East Rajasthan', agroZone: 'Sub-Humid Southern Plain', normalAnnualRainfallMm: 610, monsoonOnsetNormalDate: '26-Jun' },
      { name: 'Ganganagar', lat: 29.9038, lng: 73.8772, imdSubdivision: 'West Rajasthan', agroZone: 'Irrigated North Western Plain', normalAnnualRainfallMm: 240, monsoonOnsetNormalDate: '05-Jul' },
      { name: 'Sikar', lat: 27.6094, lng: 75.1398, imdSubdivision: 'East Rajasthan', agroZone: 'Transitional Plain of Inland Drainage', normalAnnualRainfallMm: 460, monsoonOnsetNormalDate: '02-Jul' },
      { name: 'Nagaur', lat: 27.1983, lng: 73.7493, imdSubdivision: 'West Rajasthan', agroZone: 'Transitional Plain of Inland Drainage', normalAnnualRainfallMm: 390, monsoonOnsetNormalDate: '03-Jul' },
      { name: 'Chittorgarh', lat: 24.8887, lng: 74.6269, imdSubdivision: 'East Rajasthan', agroZone: 'Sub-Humid Southern Plain', normalAnnualRainfallMm: 720, monsoonOnsetNormalDate: '24-Jun' },
      { name: 'Barmer', lat: 25.7521, lng: 71.3967, imdSubdivision: 'West Rajasthan', agroZone: 'Arid Western Plain', normalAnnualRainfallMm: 275, monsoonOnsetNormalDate: '06-Jul' },
      { name: 'Jaisalmer', lat: 26.9157, lng: 70.9083, imdSubdivision: 'West Rajasthan', agroZone: 'Hyper Arid Western Plain', normalAnnualRainfallMm: 165, monsoonOnsetNormalDate: '10-Jul' }
    ]
  },
  {
    state: 'Maharashtra',
    code: 'MH',
    districts: [
      { name: 'Pune', lat: 18.5204, lng: 73.8567, imdSubdivision: 'Madhya Maharashtra', agroZone: 'Western Ghat / Transition Zone', normalAnnualRainfallMm: 722, monsoonOnsetNormalDate: '10-Jun' },
      { name: 'Nagpur', lat: 21.1458, lng: 79.0882, imdSubdivision: 'Vidarbha', agroZone: 'Central Vidarbha Plateau', normalAnnualRainfallMm: 1080, monsoonOnsetNormalDate: '15-Jun' },
      { name: 'Nashik', lat: 19.9975, lng: 73.7898, imdSubdivision: 'Madhya Maharashtra', agroZone: 'Western Maharashtra Scarcity Zone', normalAnnualRainfallMm: 810, monsoonOnsetNormalDate: '11-Jun' },
      { name: 'Chhatrapati Sambhajinagar (Aurangabad)', lat: 19.8762, lng: 75.3433, imdSubdivision: 'Marathwada', agroZone: 'Central Maharashtra Plateau', normalAnnualRainfallMm: 734, monsoonOnsetNormalDate: '12-Jun' },
      { name: 'Amravati', lat: 20.9374, lng: 77.7796, imdSubdivision: 'Vidarbha', agroZone: 'Western Vidarbha', normalAnnualRainfallMm: 870, monsoonOnsetNormalDate: '14-Jun' },
      { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, imdSubdivision: 'Madhya Maharashtra', agroZone: 'Sub-Montane Zone', normalAnnualRainfallMm: 1050, monsoonOnsetNormalDate: '07-Jun' },
      { name: 'Solapur', lat: 17.6599, lng: 75.9064, imdSubdivision: 'Madhya Maharashtra', agroZone: 'Scarcity Zone', normalAnnualRainfallMm: 560, monsoonOnsetNormalDate: '09-Jun' },
      { name: 'Satara', lat: 17.6805, lng: 73.9930, imdSubdivision: 'Madhya Maharashtra', agroZone: 'Transition Zone', normalAnnualRainfallMm: 850, monsoonOnsetNormalDate: '08-Jun' },
      { name: 'Jalgaon', lat: 21.0077, lng: 75.5626, imdSubdivision: 'Madhya Maharashtra', agroZone: 'Khandesh Dryland', normalAnnualRainfallMm: 720, monsoonOnsetNormalDate: '13-Jun' },
      { name: 'Nanded', lat: 19.1383, lng: 77.3210, imdSubdivision: 'Marathwada', agroZone: 'Godavari Basin', normalAnnualRainfallMm: 910, monsoonOnsetNormalDate: '13-Jun' },
      { name: 'Latur', lat: 18.4088, lng: 76.5604, imdSubdivision: 'Marathwada', agroZone: 'Marathwada Plateau', normalAnnualRainfallMm: 800, monsoonOnsetNormalDate: '11-Jun' },
      { name: 'Yavatmal', lat: 20.3888, lng: 78.1204, imdSubdivision: 'Vidarbha', agroZone: 'Cotton Belt Vidarbha', normalAnnualRainfallMm: 950, monsoonOnsetNormalDate: '14-Jun' },
      { name: 'Thane', lat: 19.2183, lng: 72.9781, imdSubdivision: 'Konkan & Goa', agroZone: 'North Konkan Coastal', normalAnnualRainfallMm: 2400, monsoonOnsetNormalDate: '10-Jun' }
    ]
  },
  {
    state: 'Punjab',
    code: 'PB',
    districts: [
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, imdSubdivision: 'Punjab', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 680, monsoonOnsetNormalDate: '30-Jun' },
      { name: 'Amritsar', lat: 31.6340, lng: 74.8723, imdSubdivision: 'Punjab', agroZone: 'Undulating Plain Zone', normalAnnualRainfallMm: 650, monsoonOnsetNormalDate: '01-Jul' },
      { name: 'Jalandhar', lat: 31.3260, lng: 75.5762, imdSubdivision: 'Punjab', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 700, monsoonOnsetNormalDate: '01-Jul' },
      { name: 'Patiala', lat: 30.3398, lng: 76.3869, imdSubdivision: 'Punjab', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 690, monsoonOnsetNormalDate: '29-Jun' },
      { name: 'Bathinda', lat: 30.2110, lng: 74.9455, imdSubdivision: 'Punjab', agroZone: 'South-Western Zone', normalAnnualRainfallMm: 410, monsoonOnsetNormalDate: '03-Jul' },
      { name: 'Firozpur', lat: 30.9237, lng: 74.6065, imdSubdivision: 'Punjab', agroZone: 'South-Western Zone', normalAnnualRainfallMm: 440, monsoonOnsetNormalDate: '02-Jul' },
      { name: 'Hoshiarpur', lat: 31.5273, lng: 75.9149, imdSubdivision: 'Punjab', agroZone: 'Sub-Mountain Undulating Zone', normalAnnualRainfallMm: 850, monsoonOnsetNormalDate: '28-Jun' },
      { name: 'Sangrur', lat: 30.2447, lng: 75.8458, imdSubdivision: 'Punjab', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 550, monsoonOnsetNormalDate: '01-Jul' }
    ]
  },
  {
    state: 'Haryana',
    code: 'HR',
    districts: [
      { name: 'Karnal', lat: 29.6857, lng: 76.9905, imdSubdivision: 'Haryana, Chandigarh & Delhi', agroZone: 'Eastern Zone (Basmati Belt)', normalAnnualRainfallMm: 720, monsoonOnsetNormalDate: '28-Jun' },
      { name: 'Hisar', lat: 29.1492, lng: 75.7217, imdSubdivision: 'Haryana, Chandigarh & Delhi', agroZone: 'Western Zone (Semi-Arid)', normalAnnualRainfallMm: 430, monsoonOnsetNormalDate: '02-Jul' },
      { name: 'Ambala', lat: 30.3782, lng: 76.7767, imdSubdivision: 'Haryana, Chandigarh & Delhi', agroZone: 'Northern Plain Zone', normalAnnualRainfallMm: 950, monsoonOnsetNormalDate: '27-Jun' },
      { name: 'Rohtak', lat: 28.8955, lng: 76.6066, imdSubdivision: 'Haryana, Chandigarh & Delhi', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 560, monsoonOnsetNormalDate: '30-Jun' },
      { name: 'Sirsa', lat: 29.5349, lng: 75.0298, imdSubdivision: 'Haryana, Chandigarh & Delhi', agroZone: 'South-Western Arid', normalAnnualRainfallMm: 320, monsoonOnsetNormalDate: '04-Jul' },
      { name: 'Sonipat', lat: 28.9931, lng: 77.0151, imdSubdivision: 'Haryana, Chandigarh & Delhi', agroZone: 'Eastern Zone', normalAnnualRainfallMm: 610, monsoonOnsetNormalDate: '29-Jun' }
    ]
  },
  {
    state: 'Gujarat',
    code: 'GJ',
    districts: [
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, imdSubdivision: 'Gujarat Region', agroZone: 'North Gujarat / Bhal', normalAnnualRainfallMm: 750, monsoonOnsetNormalDate: '20-Jun' },
      { name: 'Surat', lat: 21.1702, lng: 72.8311, imdSubdivision: 'Gujarat Region', agroZone: 'South Gujarat Heavy Rainfall', normalAnnualRainfallMm: 1200, monsoonOnsetNormalDate: '15-Jun' },
      { name: 'Rajkot', lat: 22.3039, lng: 70.8022, imdSubdivision: 'Saurashtra & Kutch', agroZone: 'North Saurashtra Agro-Climatic', normalAnnualRainfallMm: 590, monsoonOnsetNormalDate: '20-Jun' },
      { name: 'Vadodara', lat: 22.3072, lng: 73.1812, imdSubdivision: 'Gujarat Region', agroZone: 'Middle Gujarat', normalAnnualRainfallMm: 880, monsoonOnsetNormalDate: '18-Jun' },
      { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519, imdSubdivision: 'Saurashtra & Kutch', agroZone: 'Bhal and Coastal Zone', normalAnnualRainfallMm: 620, monsoonOnsetNormalDate: '18-Jun' },
      { name: 'Junagadh', lat: 21.5222, lng: 70.4579, imdSubdivision: 'Saurashtra & Kutch', agroZone: 'South Saurashtra', normalAnnualRainfallMm: 840, monsoonOnsetNormalDate: '16-Jun' },
      { name: 'Bhuj (Kutch)', lat: 23.2420, lng: 69.6669, imdSubdivision: 'Saurashtra & Kutch', agroZone: 'Arid North-West Kutch', normalAnnualRainfallMm: 380, monsoonOnsetNormalDate: '25-Jun' },
      { name: 'Anand', lat: 22.5645, lng: 72.9289, imdSubdivision: 'Gujarat Region', agroZone: 'Middle Gujarat (Charotar)', normalAnnualRainfallMm: 850, monsoonOnsetNormalDate: '18-Jun' },
      { name: 'Mehsana', lat: 23.5880, lng: 72.3693, imdSubdivision: 'Gujarat Region', agroZone: 'North Gujarat', normalAnnualRainfallMm: 650, monsoonOnsetNormalDate: '22-Jun' }
    ]
  },
  {
    state: 'Madhya Pradesh',
    code: 'MP',
    districts: [
      { name: 'Bhopal', lat: 23.2599, lng: 77.4126, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Vindhya Plateau', normalAnnualRainfallMm: 1120, monsoonOnsetNormalDate: '18-Jun' },
      { name: 'Indore', lat: 22.7196, lng: 75.8577, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Malwa Plateau', normalAnnualRainfallMm: 950, monsoonOnsetNormalDate: '16-Jun' },
      { name: 'Jabalpur', lat: 23.1815, lng: 79.9864, imdSubdivision: 'East Madhya Pradesh', agroZone: 'Kymore Plateau & Satpura Hill', normalAnnualRainfallMm: 1280, monsoonOnsetNormalDate: '17-Jun' },
      { name: 'Gwalior', lat: 26.2183, lng: 78.1828, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Gird Zone', normalAnnualRainfallMm: 790, monsoonOnsetNormalDate: '25-Jun' },
      { name: 'Ujjain', lat: 23.1765, lng: 75.7885, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Malwa Plateau', normalAnnualRainfallMm: 900, monsoonOnsetNormalDate: '17-Jun' },
      { name: 'Sagar', lat: 23.8388, lng: 78.7378, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Bundelkhand', normalAnnualRainfallMm: 1100, monsoonOnsetNormalDate: '20-Jun' },
      { name: 'Chhindwara', lat: 22.0574, lng: 78.9382, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Satpura Plateau', normalAnnualRainfallMm: 1180, monsoonOnsetNormalDate: '15-Jun' },
      { name: 'Hoshangabad (Narmadapuram)', lat: 22.7519, lng: 77.7289, imdSubdivision: 'West Madhya Pradesh', agroZone: 'Central Narmada Valley', normalAnnualRainfallMm: 1250, monsoonOnsetNormalDate: '16-Jun' }
    ]
  },
  {
    state: 'Uttar Pradesh',
    code: 'UP',
    districts: [
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462, imdSubdivision: 'East Uttar Pradesh', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 980, monsoonOnsetNormalDate: '22-Jun' },
      { name: 'Varanasi', lat: 25.3176, lng: 82.9739, imdSubdivision: 'East Uttar Pradesh', agroZone: 'Eastern Plain Zone', normalAnnualRainfallMm: 1040, monsoonOnsetNormalDate: '18-Jun' },
      { name: 'Kanpur', lat: 26.4499, lng: 80.3319, imdSubdivision: 'East Uttar Pradesh', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 850, monsoonOnsetNormalDate: '24-Jun' },
      { name: 'Agra', lat: 27.1767, lng: 78.0081, imdSubdivision: 'West Uttar Pradesh', agroZone: 'South-Western Semi-Arid', normalAnnualRainfallMm: 680, monsoonOnsetNormalDate: '28-Jun' },
      { name: 'Prayagraj (Allahabad)', lat: 25.4358, lng: 81.8463, imdSubdivision: 'East Uttar Pradesh', agroZone: 'Central Plain Zone', normalAnnualRainfallMm: 970, monsoonOnsetNormalDate: '20-Jun' },
      { name: 'Meerut', lat: 28.9845, lng: 77.7064, imdSubdivision: 'West Uttar Pradesh', agroZone: 'Western Plain Zone', normalAnnualRainfallMm: 820, monsoonOnsetNormalDate: '29-Jun' },
      { name: 'Gorakhpur', lat: 26.7606, lng: 83.3732, imdSubdivision: 'East Uttar Pradesh', agroZone: 'North Eastern Plain Zone', normalAnnualRainfallMm: 1250, monsoonOnsetNormalDate: '15-Jun' },
      { name: 'Bareilly', lat: 28.3670, lng: 79.4304, imdSubdivision: 'West Uttar Pradesh', agroZone: 'Mid-Western Plain Zone', normalAnnualRainfallMm: 960, monsoonOnsetNormalDate: '26-Jun' },
      { name: 'Jhansi', lat: 25.4484, lng: 78.5685, imdSubdivision: 'West Uttar Pradesh', agroZone: 'Bundelkhand Zone', normalAnnualRainfallMm: 850, monsoonOnsetNormalDate: '24-Jun' }
    ]
  },
  {
    state: 'Karnataka',
    code: 'KA',
    districts: [
      { name: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, imdSubdivision: 'South Interior Karnataka', agroZone: 'Eastern Dry Zone', normalAnnualRainfallMm: 880, monsoonOnsetNormalDate: '05-Jun' },
      { name: 'Mysuru', lat: 12.2958, lng: 76.6394, imdSubdivision: 'South Interior Karnataka', agroZone: 'Southern Dry Zone', normalAnnualRainfallMm: 800, monsoonOnsetNormalDate: '04-Jun' },
      { name: 'Belagavi', lat: 15.8497, lng: 74.4977, imdSubdivision: 'North Interior Karnataka', agroZone: 'Northern Transition Zone', normalAnnualRainfallMm: 820, monsoonOnsetNormalDate: '07-Jun' },
      { name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240, imdSubdivision: 'North Interior Karnataka', agroZone: 'Northern Transition Zone', normalAnnualRainfallMm: 740, monsoonOnsetNormalDate: '08-Jun' },
      { name: 'Kalaburagi (Gulbarga)', lat: 17.3297, lng: 76.8343, imdSubdivision: 'North Interior Karnataka', agroZone: 'North Eastern Dry Zone', normalAnnualRainfallMm: 760, monsoonOnsetNormalDate: '10-Jun' },
      { name: 'Mangaluru', lat: 12.9141, lng: 74.8560, imdSubdivision: 'Coastal Karnataka', agroZone: 'Coastal Zone', normalAnnualRainfallMm: 3900, monsoonOnsetNormalDate: '02-Jun' },
      { name: 'Shivamogga', lat: 13.9299, lng: 75.5681, imdSubdivision: 'South Interior Karnataka', agroZone: 'Hilly Zone', normalAnnualRainfallMm: 1800, monsoonOnsetNormalDate: '04-Jun' },
      { name: 'Raichur', lat: 16.2076, lng: 77.3463, imdSubdivision: 'North Interior Karnataka', agroZone: 'North Eastern Dry Zone', normalAnnualRainfallMm: 620, monsoonOnsetNormalDate: '09-Jun' }
    ]
  },
  {
    state: 'Andhra Pradesh',
    code: 'AP',
    districts: [
      { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, imdSubdivision: 'Coastal Andhra Pradesh & Yanam', agroZone: 'North Coastal Zone', normalAnnualRainfallMm: 1100, monsoonOnsetNormalDate: '08-Jun' },
      { name: 'Vijayawada (NTR)', lat: 16.5062, lng: 80.6480, imdSubdivision: 'Coastal Andhra Pradesh & Yanam', agroZone: 'Krishna-Godavari Zone', normalAnnualRainfallMm: 980, monsoonOnsetNormalDate: '06-Jun' },
      { name: 'Guntur', lat: 16.3067, lng: 80.4365, imdSubdivision: 'Coastal Andhra Pradesh & Yanam', agroZone: 'Krishna-Godavari Zone', normalAnnualRainfallMm: 890, monsoonOnsetNormalDate: '06-Jun' },
      { name: 'Tirupati', lat: 13.6288, lng: 79.4192, imdSubdivision: 'Rayalaseema', agroZone: 'Southern Zone', normalAnnualRainfallMm: 930, monsoonOnsetNormalDate: '04-Jun' },
      { name: 'Kurnool', lat: 15.8281, lng: 78.0373, imdSubdivision: 'Rayalaseema', agroZone: 'Scarce Rainfall Zone', normalAnnualRainfallMm: 660, monsoonOnsetNormalDate: '07-Jun' },
      { name: 'Anantapur', lat: 14.6819, lng: 77.6006, imdSubdivision: 'Rayalaseema', agroZone: 'Scarce Rainfall Zone', normalAnnualRainfallMm: 550, monsoonOnsetNormalDate: '05-Jun' }
    ]
  },
  {
    state: 'Telangana',
    code: 'TS',
    districts: [
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, imdSubdivision: 'Telangana', agroZone: 'Southern Telangana Zone', normalAnnualRainfallMm: 850, monsoonOnsetNormalDate: '08-Jun' },
      { name: 'Warangal', lat: 17.9689, lng: 79.5941, imdSubdivision: 'Telangana', agroZone: 'Central Telangana Zone', normalAnnualRainfallMm: 990, monsoonOnsetNormalDate: '09-Jun' },
      { name: 'Nizamabad', lat: 18.6725, lng: 78.0941, imdSubdivision: 'Telangana', agroZone: 'Northern Telangana Zone', normalAnnualRainfallMm: 1040, monsoonOnsetNormalDate: '10-Jun' },
      { name: 'Karimnagar', lat: 18.4386, lng: 79.1288, imdSubdivision: 'Telangana', agroZone: 'Northern Telangana Zone', normalAnnualRainfallMm: 960, monsoonOnsetNormalDate: '10-Jun' },
      { name: 'Khammam', lat: 17.2473, lng: 80.1514, imdSubdivision: 'Telangana', agroZone: 'Southern Telangana Zone', normalAnnualRainfallMm: 1080, monsoonOnsetNormalDate: '08-Jun' }
    ]
  },
  {
    state: 'Tamil Nadu',
    code: 'TN',
    districts: [
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, imdSubdivision: 'Tamil Nadu, Puducherry & Karaikal', agroZone: 'North Eastern Zone', normalAnnualRainfallMm: 1400, monsoonOnsetNormalDate: '15-Oct' },
      { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, imdSubdivision: 'Tamil Nadu, Puducherry & Karaikal', agroZone: 'Western Zone', normalAnnualRainfallMm: 680, monsoonOnsetNormalDate: '05-Jun' },
      { name: 'Madurai', lat: 9.9252, lng: 78.1198, imdSubdivision: 'Tamil Nadu, Puducherry & Karaikal', agroZone: 'Southern Zone', normalAnnualRainfallMm: 840, monsoonOnsetNormalDate: '15-Oct' },
      { name: 'Thanjavur', lat: 10.7870, lng: 79.1378, imdSubdivision: 'Tamil Nadu, Puducherry & Karaikal', agroZone: 'Cauvery Delta Zone', normalAnnualRainfallMm: 1100, monsoonOnsetNormalDate: '15-Oct' },
      { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, imdSubdivision: 'Tamil Nadu, Puducherry & Karaikal', agroZone: 'Cauvery Delta Zone', normalAnnualRainfallMm: 820, monsoonOnsetNormalDate: '10-Oct' },
      { name: 'Salem', lat: 11.6643, lng: 78.1460, imdSubdivision: 'Tamil Nadu, Puducherry & Karaikal', agroZone: 'North Western Zone', normalAnnualRainfallMm: 950, monsoonOnsetNormalDate: '08-Jun' }
    ]
  },
  {
    state: 'Bihar',
    code: 'BR',
    districts: [
      { name: 'Patna', lat: 25.5941, lng: 85.1376, imdSubdivision: 'Bihar', agroZone: 'South Bihar Alluvial Plain', normalAnnualRainfallMm: 1100, monsoonOnsetNormalDate: '14-Jun' },
      { name: 'Gaya', lat: 24.7914, lng: 85.0002, imdSubdivision: 'Bihar', agroZone: 'South Bihar Alluvial Plain', normalAnnualRainfallMm: 1060, monsoonOnsetNormalDate: '15-Jun' },
      { name: 'Muzaffarpur', lat: 26.1209, lng: 85.3647, imdSubdivision: 'Bihar', agroZone: 'North West Alluvial Plain', normalAnnualRainfallMm: 1250, monsoonOnsetNormalDate: '12-Jun' },
      { name: 'Bhagalpur', lat: 25.2425, lng: 86.9842, imdSubdivision: 'Bihar', agroZone: 'South Bihar Alluvial Plain', normalAnnualRainfallMm: 1180, monsoonOnsetNormalDate: '12-Jun' },
      { name: 'Darbhanga', lat: 26.1542, lng: 85.8918, imdSubdivision: 'Bihar', agroZone: 'North East Alluvial Plain', normalAnnualRainfallMm: 1320, monsoonOnsetNormalDate: '10-Jun' }
    ]
  },
  {
    state: 'West Bengal',
    code: 'WB',
    districts: [
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639, imdSubdivision: 'Gangetic West Bengal', agroZone: 'Gangetic Alluvial Zone', normalAnnualRainfallMm: 1600, monsoonOnsetNormalDate: '10-Jun' },
      { name: 'Bardhaman (Purba/Paschim)', lat: 23.2324, lng: 87.8615, imdSubdivision: 'Gangetic West Bengal', agroZone: 'Vindhyan Alluvial Zone', normalAnnualRainfallMm: 1400, monsoonOnsetNormalDate: '11-Jun' },
      { name: 'Siliguri (Darjeeling/Jalpaiguri)', lat: 26.7271, lng: 88.3953, imdSubdivision: 'Sub-Himalayan West Bengal & Sikkim', agroZone: 'Terai-Teesta Alluvial Zone', normalAnnualRainfallMm: 3100, monsoonOnsetNormalDate: '05-Jun' },
      { name: 'Midnapore (Paschim Medinipur)', lat: 22.4257, lng: 87.3199, imdSubdivision: 'Gangetic West Bengal', agroZone: 'Laterite and Red Soil Zone', normalAnnualRainfallMm: 1520, monsoonOnsetNormalDate: '10-Jun' }
    ]
  },
  {
    state: 'Odisha',
    code: 'OD',
    districts: [
      { name: 'Bhubaneswar (Khurda)', lat: 20.2961, lng: 85.8245, imdSubdivision: 'Odisha', agroZone: 'East and South Eastern Coastal Plain', normalAnnualRainfallMm: 1480, monsoonOnsetNormalDate: '11-Jun' },
      { name: 'Cuttack', lat: 20.4625, lng: 85.8828, imdSubdivision: 'Odisha', agroZone: 'East and South Eastern Coastal Plain', normalAnnualRainfallMm: 1500, monsoonOnsetNormalDate: '11-Jun' },
      { name: 'Sambalpur', lat: 21.4669, lng: 83.9812, imdSubdivision: 'Odisha', agroZone: 'West Central Table Land', normalAnnualRainfallMm: 1420, monsoonOnsetNormalDate: '13-Jun' },
      { name: 'Balasore', lat: 21.4934, lng: 86.9135, imdSubdivision: 'Odisha', agroZone: 'North Eastern Coastal Plain', normalAnnualRainfallMm: 1580, monsoonOnsetNormalDate: '10-Jun' }
    ]
  },
  {
    state: 'Kerala',
    code: 'KL',
    districts: [
      { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, imdSubdivision: 'Kerala & Mahe', agroZone: 'Southern Coastal Plains', normalAnnualRainfallMm: 1800, monsoonOnsetNormalDate: '01-Jun' },
      { name: 'Kochi (Ernakulam)', lat: 9.9312, lng: 76.2673, imdSubdivision: 'Kerala & Mahe', agroZone: 'Central Alluvial Plain', normalAnnualRainfallMm: 3100, monsoonOnsetNormalDate: '01-Jun' },
      { name: 'Palakkad', lat: 10.7867, lng: 76.6548, imdSubdivision: 'Kerala & Mahe', agroZone: 'Palakkad Plains (Rice Bowl)', normalAnnualRainfallMm: 2200, monsoonOnsetNormalDate: '01-Jun' },
      { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, imdSubdivision: 'Kerala & Mahe', agroZone: 'Northern Coastal Plains', normalAnnualRainfallMm: 3300, monsoonOnsetNormalDate: '01-Jun' }
    ]
  },
  {
    state: 'Assam',
    code: 'AS',
    districts: [
      { name: 'Guwahati (Kamrup)', lat: 26.1445, lng: 91.7362, imdSubdivision: 'Assam & Meghalaya', agroZone: 'Lower Brahmaputra Valley', normalAnnualRainfallMm: 1850, monsoonOnsetNormalDate: '05-Jun' },
      { name: 'Dibrugarh', lat: 27.4728, lng: 94.9120, imdSubdivision: 'Assam & Meghalaya', agroZone: 'Upper Brahmaputra Valley', normalAnnualRainfallMm: 2700, monsoonOnsetNormalDate: '03-Jun' },
      { name: 'Jorhat', lat: 26.7509, lng: 94.2037, imdSubdivision: 'Assam & Meghalaya', agroZone: 'Upper Brahmaputra Valley', normalAnnualRainfallMm: 2100, monsoonOnsetNormalDate: '04-Jun' }
    ]
  }
];

// Helper to find location by names
export function findDistrict(stateName: string, districtName: string): { state: StateLocation; district: DistrictLocation } | null {
  const state = INDIAN_STATES_AND_DISTRICTS.find((s) => s.state.toLowerCase() === stateName.toLowerCase());
  if (!state) return null;
  const district = state.districts.find((d) => d.name.toLowerCase().includes(districtName.toLowerCase()) || districtName.toLowerCase().includes(d.name.toLowerCase()));
  if (!district) return null;
  return { state, district };
}

// Find closest Indian district to GPS coordinates
export function findClosestDistrict(lat: number, lng: number): { state: StateLocation; district: DistrictLocation; distanceKm: number } {
  let closestState = INDIAN_STATES_AND_DISTRICTS[0];
  let closestDistrict = INDIAN_STATES_AND_DISTRICTS[0].districts[0];
  let minDistance = Infinity;

  for (const st of INDIAN_STATES_AND_DISTRICTS) {
    for (const dist of st.districts) {
      const dLat = (dist.lat - lat) * 111.32;
      const dLng = (dist.lng - lng) * 111.32 * Math.cos((lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distKm < minDistance) {
        minDistance = distKm;
        closestState = st;
        closestDistrict = dist;
      }
    }
  }

  return {
    state: closestState,
    district: closestDistrict,
    distanceKm: Math.round(minDistance)
  };
}

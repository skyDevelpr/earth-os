import type { AirportDetails } from '@/types/earth-os'

export const GLOBAL_AIRPORTS: Record<string, AirportDetails> = {
  // Western Europe
  LHR: { iata: 'LHR', icao: 'EGLL', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', latitude: 51.4700, longitude: -0.4543, timezone: 'Europe/London' },
  LGW: { iata: 'LGW', icao: 'EGKK', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', latitude: 51.1537, longitude: -0.1821, timezone: 'Europe/London' },
  CDG: { iata: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', latitude: 49.0097, longitude: 2.5479, timezone: 'Europe/Paris' },
  ORY: { iata: 'ORY', icao: 'LFPO', name: 'Orly Airport', city: 'Paris', country: 'France', latitude: 48.7262, longitude: 2.3652, timezone: 'Europe/Paris' },
  FRA: { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', latitude: 50.0379, longitude: 8.5622, timezone: 'Europe/Berlin' },
  MUC: { iata: 'MUC', icao: 'EDDM', name: 'Munich Airport', city: 'Munich', country: 'Germany', latitude: 48.3537, longitude: 11.7860, timezone: 'Europe/Berlin' },
  AMS: { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', latitude: 52.3105, longitude: 4.7683, timezone: 'Europe/Amsterdam' },
  MAD: { iata: 'MAD', icao: 'LEMD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', latitude: 40.4839, longitude: -3.5680, timezone: 'Europe/Madrid' },
  BCN: { iata: 'BCN', icao: 'LEBL', name: 'Josep Tarradellas Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', latitude: 41.2974, longitude: 2.0833, timezone: 'Europe/Madrid' },
  FCO: { iata: 'FCO', icao: 'LIRF', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', latitude: 41.8003, longitude: 12.2389, timezone: 'Europe/Rome' },
  MXP: { iata: 'MXP', icao: 'LIMC', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', latitude: 45.6301, longitude: 8.7255, timezone: 'Europe/Rome' },
  ZRH: { iata: 'ZRH', icao: 'LSZH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', latitude: 47.4582, longitude: 8.5555, timezone: 'Europe/Zurich' },
  VIE: { iata: 'VIE', icao: 'LOWW', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', latitude: 48.1103, longitude: 16.5697, timezone: 'Europe/Vienna' },
  BRU: { iata: 'BRU', icao: 'EBBR', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', latitude: 50.9010, longitude: 4.4856, timezone: 'Europe/Brussels' },
  DUB: { iata: 'DUB', icao: 'EIDW', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', latitude: 53.4264, longitude: -6.2499, timezone: 'Europe/Dublin' },
  LIS: { iata: 'LIS', icao: 'LPPT', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', latitude: 38.7742, longitude: -9.1342, timezone: 'Europe/Lisbon' },
  ATH: { iata: 'ATH', icao: 'LGAV', name: 'Athens International Airport', city: 'Athens', country: 'Greece', latitude: 37.9364, longitude: 23.9445, timezone: 'Europe/Athens' },
  CPH: { iata: 'CPH', icao: 'EKCH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', latitude: 55.6180, longitude: 12.6508, timezone: 'Europe/Copenhagen' },
  ARN: { iata: 'ARN', icao: 'ESSA', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', latitude: 59.6498, longitude: 17.9238, timezone: 'Europe/Stockholm' },
  OSL: { iata: 'OSL', icao: 'ENGM', name: 'Oslo Airport, Gardermoen', city: 'Oslo', country: 'Norway', latitude: 60.1976, longitude: 11.1004, timezone: 'Europe/Oslo' },
  HEL: { iata: 'HEL', icao: 'EFHK', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', latitude: 60.3172, longitude: 24.9633, timezone: 'Europe/Helsinki' },
  IST: { iata: 'IST', icao: 'LTFM', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', latitude: 41.2753, longitude: 28.7519, timezone: 'Europe/Istanbul' },
  SAW: { iata: 'SAW', icao: 'LTFJ', name: 'Sabiha Gökçen International Airport', city: 'Istanbul', country: 'Turkey', latitude: 40.8986, longitude: 29.3092, timezone: 'Europe/Istanbul' },

  // North America
  JFK: { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', latitude: 40.6413, longitude: -73.7781, timezone: 'America/New_York' },
  EWR: { iata: 'EWR', icao: 'KEWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'United States', latitude: 40.6895, longitude: -74.1745, timezone: 'America/New_York' },
  LGA: { iata: 'LGA', icao: 'KLGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', latitude: 40.7769, longitude: -73.8740, timezone: 'America/New_York' },
  BOS: { iata: 'BOS', icao: 'KBOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', latitude: 42.3656, longitude: -71.0096, timezone: 'America/New_York' },
  IAD: { iata: 'IAD', icao: 'KIAD', name: 'Washington Dulles International Airport', city: 'Washington, D.C.', country: 'United States', latitude: 38.9531, longitude: -77.4565, timezone: 'America/New_York' },
  ORD: { iata: 'ORD', icao: 'KORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', latitude: 41.9742, longitude: -87.9073, timezone: 'America/Chicago' },
  ATL: { iata: 'ATL', icao: 'KATL', name: 'Hartsfield–Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', latitude: 33.6407, longitude: -84.4277, timezone: 'America/New_York' },
  MIA: { iata: 'MIA', icao: 'KMIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', latitude: 25.7959, longitude: -80.2870, timezone: 'America/New_York' },
  DFW: { iata: 'DFW', icao: 'KDFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', latitude: 32.8998, longitude: -97.0403, timezone: 'America/Chicago' },
  IAH: { iata: 'IAH', icao: 'KIAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'United States', latitude: 29.9902, longitude: -95.3368, timezone: 'America/Chicago' },
  DEN: { iata: 'DEN', icao: 'KDEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', latitude: 39.8561, longitude: -104.6737, timezone: 'America/Denver' },
  PHX: { iata: 'PHX', icao: 'KPHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States', latitude: 33.4342, longitude: -112.0080, timezone: 'America/Phoenix' },
  LAX: { iata: 'LAX', icao: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', latitude: 33.9416, longitude: -118.4085, timezone: 'America/Los_Angeles' },
  SFO: { iata: 'SFO', icao: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', latitude: 37.6213, longitude: -122.3790, timezone: 'America/Los_Angeles' },
  SEA: { iata: 'SEA', icao: 'KSEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', latitude: 47.4502, longitude: -122.3088, timezone: 'America/Los_Angeles' },
  LAS: { iata: 'LAS', icao: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States', latitude: 36.0840, longitude: -115.1537, timezone: 'America/Los_Angeles' },
  YYZ: { iata: 'YYZ', icao: 'CYYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', latitude: 43.6777, longitude: -79.6248, timezone: 'America/Toronto' },
  YVR: { iata: 'YVR', icao: 'CYVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', latitude: 49.1967, longitude: -123.1815, timezone: 'America/Vancouver' },
  YUL: { iata: 'YUL', icao: 'CYUL', name: 'Montréal–Trudeau International Airport', city: 'Montreal', country: 'Canada', latitude: 45.4657, longitude: -73.7455, timezone: 'America/Toronto' },
  MEX: { iata: 'MEX', icao: 'MMMX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', latitude: 19.4361, longitude: -99.0719, timezone: 'America/Mexico_City' },
  CUN: { iata: 'CUN', icao: 'MMUN', name: 'Cancún International Airport', city: 'Cancun', country: 'Mexico', latitude: 21.0365, longitude: -86.8771, timezone: 'America/Cancun' },

  // Middle East
  DXB: { iata: 'DXB', icao: 'OMDB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', latitude: 25.2532, longitude: 55.3657, timezone: 'Asia/Dubai' },
  DWC: { iata: 'DWC', icao: 'OMDW', name: 'Al Maktoum International Airport', city: 'Dubai', country: 'United Arab Emirates', latitude: 24.8960, longitude: 55.1614, timezone: 'Asia/Dubai' },
  AUH: { iata: 'AUH', icao: 'OMAA', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', latitude: 24.4330, longitude: 54.6511, timezone: 'Asia/Dubai' },
  DOH: { iata: 'DOH', icao: 'OTHH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', latitude: 25.2731, longitude: 51.6081, timezone: 'Asia/Qatar' },
  RUH: { iata: 'RUH', icao: 'OERK', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.9576, longitude: 46.6988, timezone: 'Asia/Riyadh' },
  JED: { iata: 'JED', icao: 'OEJN', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', latitude: 21.6796, longitude: 39.1565, timezone: 'Asia/Riyadh' },
  MCT: { iata: 'MCT', icao: 'OOMS', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', latitude: 23.5933, longitude: 58.2844, timezone: 'Asia/Muscat' },
  KWI: { iata: 'KWI', icao: 'OKBK', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', latitude: 29.2266, longitude: 47.9689, timezone: 'Asia/Kuwait' },
  BAH: { iata: 'BAH', icao: 'OBBI', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', latitude: 26.2708, longitude: 50.6336, timezone: 'Asia/Bahrain' },
  TLV: { iata: 'TLV', icao: 'LLBG', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', latitude: 32.0055, longitude: 34.8854, timezone: 'Asia/Jerusalem' },

  // South Asia
  DEL: { iata: 'DEL', icao: 'VIDP', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India', latitude: 28.5562, longitude: 77.1000, timezone: 'Asia/Kolkata' },
  BOM: { iata: 'BOM', icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', latitude: 19.0896, longitude: 72.8656, timezone: 'Asia/Kolkata' },
  BLR: { iata: 'BLR', icao: 'VOBL', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', latitude: 13.1986, longitude: 77.7066, timezone: 'Asia/Kolkata' },
  MAA: { iata: 'MAA', icao: 'VOMM', name: 'Chennai International Airport', city: 'Chennai', country: 'India', latitude: 12.9941, longitude: 80.1709, timezone: 'Asia/Kolkata' },
  HYD: { iata: 'HYD', icao: 'VOHS', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', latitude: 17.2403, longitude: 78.4294, timezone: 'Asia/Kolkata' },
  CCU: { iata: 'CCU', icao: 'VECC', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India', latitude: 22.6547, longitude: 88.4467, timezone: 'Asia/Kolkata' },
  COK: { iata: 'COK', icao: 'VOCI', name: 'Cochin International Airport', city: 'Kochi', country: 'India', latitude: 10.1520, longitude: 76.3922, timezone: 'Asia/Kolkata' },
  AMD: { iata: 'AMD', icao: 'VAAH', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', latitude: 23.0772, longitude: 72.6347, timezone: 'Asia/Kolkata' },
  CMB: { iata: 'CMB', icao: 'VCBI', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', latitude: 7.1808, longitude: 79.8841, timezone: 'Asia/Colombo' },
  DAC: { iata: 'DAC', icao: 'VGHS', name: 'Hazrat Shahjalal International Airport', city: 'Dhaka', country: 'Bangladesh', latitude: 23.8433, longitude: 90.3978, timezone: 'Asia/Dhaka' },
  ISB: { iata: 'ISB', icao: 'OPIS', name: 'Islamabad International Airport', city: 'Islamabad', country: 'Pakistan', latitude: 33.5492, longitude: 72.8294, timezone: 'Asia/Karachi' },

  // East Asia & Southeast Asia
  HND: { iata: 'HND', icao: 'RJTT', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', latitude: 35.5494, longitude: 139.7798, timezone: 'Asia/Tokyo' },
  NRT: { iata: 'NRT', icao: 'RJAA', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', latitude: 35.7720, longitude: 140.3929, timezone: 'Asia/Tokyo' },
  KIX: { iata: 'KIX', icao: 'RJBB', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', latitude: 34.4320, longitude: 135.2304, timezone: 'Asia/Tokyo' },
  ICN: { iata: 'ICN', icao: 'RKSI', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', latitude: 37.4602, longitude: 126.4407, timezone: 'Asia/Seoul' },
  PEK: { iata: 'PEK', icao: 'ZBAA', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', latitude: 40.0799, longitude: 116.6031, timezone: 'Asia/Shanghai' },
  PKX: { iata: 'PKX', icao: 'ZBAD', name: 'Beijing Daxing International Airport', city: 'Beijing', country: 'China', latitude: 39.5098, longitude: 116.4105, timezone: 'Asia/Shanghai' },
  PVG: { iata: 'PVG', icao: 'ZSPD', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', latitude: 31.1443, longitude: 121.8083, timezone: 'Asia/Shanghai' },
  CAN: { iata: 'CAN', icao: 'ZGGG', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', latitude: 23.3924, longitude: 113.2988, timezone: 'Asia/Shanghai' },
  HKG: { iata: 'HKG', icao: 'VHHH', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', latitude: 22.3080, longitude: 113.9185, timezone: 'Asia/Hong_Kong' },
  TPE: { iata: 'TPE', icao: 'RCTP', name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', latitude: 25.0797, longitude: 121.2342, timezone: 'Asia/Taipei' },
  SIN: { iata: 'SIN', icao: 'WSSS', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', latitude: 1.3644, longitude: 103.9915, timezone: 'Asia/Singapore' },
  BKK: { iata: 'BKK', icao: 'VTBS', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', latitude: 13.6900, longitude: 100.7501, timezone: 'Asia/Bangkok' },
  KUL: { iata: 'KUL', icao: 'WMKK', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', latitude: 2.7456, longitude: 101.7099, timezone: 'Asia/Kuala_Lumpur' },
  CGK: { iata: 'CGK', icao: 'WIII', name: 'Soekarno–Hatta International Airport', city: 'Jakarta', country: 'Indonesia', latitude: -6.1275, longitude: 106.6537, timezone: 'Asia/Jakarta' },
  MNL: { iata: 'MNL', icao: 'RPLL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', latitude: 14.5086, longitude: 121.0194, timezone: 'Asia/Manila' },
  SGN: { iata: 'SGN', icao: 'VVTS', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', latitude: 10.8188, longitude: 106.6519, timezone: 'Asia/Ho_Chi_Minh' },

  // Oceania
  SYD: { iata: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', latitude: -33.9461, longitude: 151.1772, timezone: 'Australia/Sydney' },
  MEL: { iata: 'MEL', icao: 'YMML', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', latitude: -37.6690, longitude: 144.8410, timezone: 'Australia/Melbourne' },
  BNE: { iata: 'BNE', icao: 'YBBN', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', latitude: -27.3842, longitude: 153.1175, timezone: 'Australia/Brisbane' },
  AKL: { iata: 'AKL', icao: 'NZAA', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', latitude: -37.0082, longitude: 174.7850, timezone: 'Pacific/Auckland' },

  // South America
  GRU: { iata: 'GRU', icao: 'SBGR', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', latitude: -23.4356, longitude: -46.4731, timezone: 'America/Sao_Paulo' },
  GIG: { iata: 'GIG', icao: 'SBGL', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', latitude: -22.8134, longitude: -43.2494, timezone: 'America/Sao_Paulo' },
  BOG: { iata: 'BOG', icao: 'SKBO', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', latitude: 4.7016, longitude: -74.1469, timezone: 'America/Bogota' },
  EZE: { iata: 'EZE', icao: 'SAEZ', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', latitude: -34.8222, longitude: -58.5358, timezone: 'America/Argentina/Buenos_Aires' },
  SCL: { iata: 'SCL', icao: 'SCEL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', latitude: -33.3930, longitude: -70.7858, timezone: 'America/Santiago' },
  LIM: { iata: 'LIM', icao: 'SPJC', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', latitude: -12.0219, longitude: -77.1143, timezone: 'America/Lima' },

  // Africa
  JNB: { iata: 'JNB', icao: 'FAOR', name: 'O. R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', latitude: -26.1367, longitude: 28.2411, timezone: 'Africa/Johannesburg' },
  CPT: { iata: 'CPT', icao: 'FACT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', latitude: -33.9715, longitude: 18.6021, timezone: 'Africa/Johannesburg' },
  CAI: { iata: 'CAI', icao: 'HECA', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', latitude: 30.1219, longitude: 31.4056, timezone: 'Africa/Cairo' },
  ADD: { iata: 'ADD', icao: 'HAAB', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', latitude: 8.9779, longitude: 38.7993, timezone: 'Africa/Addis_Ababa' },
  NBO: { iata: 'NBO', icao: 'HKJK', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', latitude: -1.3192, longitude: 36.9275, timezone: 'Africa/Nairobi' },
  CMN: { iata: 'CMN', icao: 'GMMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', latitude: 33.3675, longitude: -7.5899, timezone: 'Africa/Casablanca' },
}

export function lookupAirport(code?: string | null): AirportDetails | null {
  if (!code) return null
  const clean = code.trim().toUpperCase()
  if (GLOBAL_AIRPORTS[clean]) return GLOBAL_AIRPORTS[clean]

  // Try matching ICAO code
  for (const apt of Object.values(GLOBAL_AIRPORTS)) {
    if (apt.icao === clean) return apt
  }
  return null
}

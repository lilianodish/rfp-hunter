/**
 * Utility for calculating distances between locations
 */

interface Coordinates {
  lat: number;
  lng: number;
}

// Simple US ZIP code to coordinates mapping (sample for major cities)
// In production, use a complete database or geocoding API
const ZIP_COORDINATES: Record<string, Coordinates> = {
  // California - Los Angeles area
  '91201': { lat: 34.1689, lng: -118.2452 }, // Glendale
  '91202': { lat: 34.1633, lng: -118.2582 },
  '91203': { lat: 34.1494, lng: -118.2508 },
  '91204': { lat: 34.1422, lng: -118.2653 },
  '91205': { lat: 34.1425, lng: -118.2372 },
  '91206': { lat: 34.1308, lng: -118.2556 },
  '91207': { lat: 34.1550, lng: -118.2333 },
  '91208': { lat: 34.1611, lng: -118.2711 },
  '90001': { lat: 33.9731, lng: -118.2479 }, // Los Angeles
  '90210': { lat: 34.0901, lng: -118.4065 }, // Beverly Hills
  '91101': { lat: 34.1478, lng: -118.1445 }, // Pasadena
  '91801': { lat: 34.1064, lng: -118.1280 }, // Alhambra
  '91001': { lat: 34.0966, lng: -118.0356 }, // Altadena
  '90245': { lat: 33.9425, lng: -118.3956 }, // El Segundo
  '90266': { lat: 33.8894, lng: -118.3966 }, // Manhattan Beach
  '90401': { lat: 34.0195, lng: -118.4912 }, // Santa Monica
  '90028': { lat: 34.0928, lng: -118.3287 }, // Hollywood
  '91401': { lat: 34.1814, lng: -118.4481 }, // Van Nuys
  '91301': { lat: 34.1683, lng: -118.6059 }, // Agoura Hills
  '91501': { lat: 34.1808, lng: -118.3090 }, // Burbank
  '91601': { lat: 34.1688, lng: -118.3760 }, // North Hollywood
  '90250': { lat: 33.8755, lng: -118.3287 }, // Hawthorne
  '90260': { lat: 33.9880, lng: -118.1596 }, // Lawndale
  '90301': { lat: 33.9164, lng: -118.3526 }, // Inglewood
  '90501': { lat: 33.8358, lng: -118.3406 }, // Torrance
  '90601': { lat: 33.9464, lng: -118.0838 }, // Whittier
  '90650': { lat: 33.9802, lng: -118.0647 }, // Norwalk
  
  // Add more ZIP codes as needed
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract ZIP code from an address string
 */
function extractZipCode(address: string): string | null {
  const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
  return zipMatch ? zipMatch[0].substring(0, 5) : null;
}

/**
 * Get coordinates for a ZIP code
 */
function getCoordinatesFromZip(zip: string): Coordinates | null {
  return ZIP_COORDINATES[zip] || null;
}

/**
 * Parse location string and extract city/state/zip information
 */
function parseLocation(location: string): { city?: string; state?: string; zip?: string } {
  const parts = location.split(',').map(s => s.trim());
  const result: { city?: string; state?: string; zip?: string } = {};
  
  // Try to find ZIP code
  const zipCode = extractZipCode(location);
  if (zipCode) {
    result.zip = zipCode;
  }
  
  // Simple parsing for city, state
  if (parts.length >= 2) {
    result.city = parts[0];
    // Extract state from second part (might be "CA 91201" or just "CA")
    const statePart = parts[1].replace(/\d{5}(-\d{4})?/, '').trim();
    if (statePart.length === 2) {
      result.state = statePart;
    }
  }
  
  return result;
}

/**
 * Calculate distance between two locations
 * @param location1 First location (address, city/state, or ZIP)
 * @param location2 Second location (address, city/state, or ZIP)
 * @returns Distance in miles, or null if unable to calculate
 */
export function calculateDistance(location1: string, location2: string): number | null {
  if (!location1 || !location2) return null;
  
  // Extract ZIP codes
  const zip1 = extractZipCode(location1);
  const zip2 = extractZipCode(location2);
  
  if (!zip1 || !zip2) return null;
  
  // Get coordinates
  const coords1 = getCoordinatesFromZip(zip1);
  const coords2 = getCoordinatesFromZip(zip2);
  
  if (!coords1 || !coords2) {
    // If we don't have coordinates for these ZIP codes, 
    // return null (in production, use geocoding API)
    return null;
  }
  
  // Calculate distance
  return haversineDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
}

/**
 * Check if a location is within service radius
 * @param rfpLocation RFP location
 * @param companyLocation Company location  
 * @param serviceRadius Service radius in miles
 * @returns true if within radius, false otherwise
 */
export function isWithinServiceRadius(
  rfpLocation: string,
  companyLocation: string,
  serviceRadius: number
): boolean {
  const distance = calculateDistance(rfpLocation, companyLocation);
  if (distance === null) {
    // If we can't calculate distance, be conservative and return false
    // In production, you might want to handle this differently
    return false;
  }
  
  return distance <= serviceRadius;
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return 'Less than 1 mile';
  } else if (miles === 1) {
    return '1 mile';
  } else {
    return `${Math.round(miles)} miles`;
  }
}

/**
 * Get a rough estimate of driving time based on distance
 * Assumes average speed of 30 mph in urban areas
 */
export function estimateDrivingTime(miles: number): string {
  const hours = miles / 30;
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  } else {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
      return `${wholeHours} hr`;
    } else {
      return `${wholeHours} hr ${minutes} min`;
    }
  }
}
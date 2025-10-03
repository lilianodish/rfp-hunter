export interface TestCase {
  id: string;
  name: string;
  content: string;
  expectedScore: { min: number; max: number };
  expectedDecision: 'GO' | 'MAYBE' | 'NO-GO';
  expectedGeographic?: number;
  expectedServices?: number;
  expectedInsurance?: number;
  expectedCertifications?: number;
  location: { city: string; distance: number };
  notes?: string;
}

// Use actual HydroJet Pros capabilities
const HYDROJET_PROFILE = {
  serviceRadius: 40,
  insurance: {
    generalLiability: 2000000, // $2M minimum, up to $4M
    workersComp: true,
    commercialAuto: 1000000
  },
  services: [
    'building exteriors', 'parking structures', 'drive-thrus', 
    'sidewalks', 'dumpster areas', 'grease trap areas',
    'gum removal', 'oil stain treatment', 'graffiti removal',
    'bus shelter cleaning', 'emergency spill cleanup', 
    'exhaust hood cleaning'
  ],
  certifications: {
    cslbD38: true, // pending but count as yes
    nfpa96: true,
    smallBusiness: true,
    epaCompliant: false, // working on it
    osha10: false, // working on it
    waterRecovery: false // doesn't have
  }
};

export const realCaliforniaRFPs: TestCase[] = [
  // SHOULD SCORE HIGH (Local, matches capabilities)
  {
    id: 'glendale-city-hall',
    name: 'Glendale City Hall - Perfect Match',
    content: `
      RFP #GLN-2025-001
      Location: 613 E Broadway, Glendale, CA 91206
      Services: Monthly pressure washing of building exterior, sidewalks, parking structure
      Requirements: 
      - $1M General Liability Insurance minimum
      - Hot water equipment 3000+ PSI
      - Within 20 miles of Glendale
      - 1+ years experience
      Budget: $5,000/month
    `,
    expectedScore: { min: 85, max: 100 },
    expectedDecision: 'GO',
    expectedGeographic: 100, // In Glendale!
    expectedServices: 100, // All services offered
    expectedInsurance: 100, // Exceeds $1M requirement
    expectedCertifications: 75, // Some certs but not all
    location: { city: 'Glendale', distance: 0 },
    notes: 'Should score highest - local and perfect match'
  },
  
  {
    id: 'burbank-airport',
    name: 'Burbank Airport - Nearby',
    content: `
      RFP #BUR-2025-APT
      Location: 2627 N Hollywood Way, Burbank, CA 91505
      Services: Quarterly pressure washing of terminal exterior, sidewalks, parking areas
      Requirements:
      - $2M General Liability
      - Commercial experience required
      - EPA compliant operations
      - Night work capability
    `,
    expectedScore: { min: 70, max: 85 },
    expectedDecision: 'GO',
    expectedGeographic: 100, // 7 miles away
    expectedServices: 100,
    expectedInsurance: 100, // Has $2M
    expectedCertifications: 50, // Missing EPA currently
    location: { city: 'Burbank', distance: 7 }
  },
  
  {
    id: 'pasadena-shopping',
    name: 'Pasadena Shopping Center',
    content: `
      Location: Old Town Pasadena, CA 91101 (10 miles from Glendale)
      Services: Weekly sidewalk cleaning, monthly building wash, graffiti removal
      Requirements:
      - $2M insurance
      - Hot water equipment
      - Graffiti removal capability
      - Weekend availability
    `,
    expectedScore: { min: 80, max: 95 },
    expectedDecision: 'GO',
    expectedGeographic: 100, // 10 miles
    expectedServices: 100, // Has all these services
    expectedInsurance: 100,
    location: { city: 'Pasadena', distance: 10 }
  },
  
  // SHOULD SCORE MEDIUM (Some gaps)
  {
    id: 'dtla-high-rise',
    name: 'Downtown LA High-Rise',
    content: `
      RFP #LA-2025-HR
      Location: 555 S Flower St, Los Angeles, CA 90071
      Services: Building exterior cleaning for 20-story building
      Requirements:
      - $5M General Liability (exceeds our $2-4M)
      - Aerial lift equipment required
      - OSHA certified operators
      - Prevailing wage compliance
    `,
    expectedScore: { min: 40, max: 60 },
    expectedDecision: 'MAYBE',
    expectedGeographic: 100, // 13 miles, within range
    expectedServices: 50, // Can do but only up to 7 stories
    expectedInsurance: 0, // Don't have $5M
    expectedCertifications: 25, // Missing OSHA, prevailing wage
    location: { city: 'Los Angeles', distance: 13 }
  },
  
  {
    id: 'long-beach-port',
    name: 'Long Beach Port Facility',
    content: `
      Location: Port of Long Beach, CA 90802 (30 miles)
      Services: Industrial equipment washing, container cleaning
      Requirements:
      - Water recovery system mandatory
      - EPA compliance required
      - Prevailing wage
      - $3M insurance
    `,
    expectedScore: { min: 30, max: 50 },
    expectedDecision: 'NO-GO',
    expectedGeographic: 100, // 30 miles, still in range
    expectedServices: 50, // Not really industrial focused
    expectedInsurance: 75, // Have $2-4M, close to $3M
    expectedCertifications: 0, // Missing water recovery, EPA, prevailing wage
    location: { city: 'Long Beach', distance: 30 }
  },
  
  // SHOULD FAIL (Too far or wrong service)
  {
    id: 'san-francisco-fail',
    name: 'San Francisco - Too Far',
    content: `
      Location: San Francisco, CA 94102
      Services: Pressure washing services
      Requirements: Standard
    `,
    expectedScore: { min: 0, max: 30 },
    expectedDecision: 'NO-GO',
    expectedGeographic: 0, // 350 miles, way outside range
    location: { city: 'San Francisco', distance: 350 }
  },
  
  {
    id: 'monterey-park-janitorial',
    name: 'Monterey Park Janitorial (Wrong Service)',
    content: `
      Location: Monterey Park, CA 90754 (15 miles)
      Services: Janitorial services, office cleaning, restroom maintenance
      Requirements: 
      - Janitorial bond
      - Indoor cleaning equipment
      - California Labor Code compliance
    `,
    expectedScore: { min: 0, max: 40 },
    expectedDecision: 'NO-GO',
    expectedGeographic: 100, // 15 miles is in range!
    expectedServices: 0, // Wrong service type entirely
    expectedCertifications: 0, // Don't have janitorial certs
    location: { city: 'Monterey Park', distance: 15 },
    notes: 'Should fail on service mismatch despite good location'
  },
  
  {
    id: 'santa-monica-borderline',
    name: 'Santa Monica - Edge of Range',
    content: `
      Location: Santa Monica Pier, CA 90401 (25 miles)
      Services: Pier and boardwalk pressure washing
      Requirements:
      - $2M insurance
      - Salt water resistant equipment
      - Marine environment experience
    `,
    expectedScore: { min: 50, max: 70 },
    expectedDecision: 'MAYBE',
    expectedGeographic: 100, // 25 miles, within 40
    expectedServices: 75, // Can do but not specialized for marine
    expectedInsurance: 100,
    location: { city: 'Santa Monica', distance: 25 }
  },
  
  // EDGE CASES TO TEST
  {
    id: 'exactly-40-miles',
    name: 'Anaheim - Exactly at 40 mile boundary',
    content: `
      Location: Anaheim, CA 92805 (40 miles exactly)
      Services: Pressure washing
      Requirements: $1M insurance
    `,
    expectedScore: { min: 70, max: 90 },
    expectedDecision: 'GO',
    expectedGeographic: 100, // Should still be 100% at exactly 40
    location: { city: 'Anaheim', distance: 40 }
  },
  
  {
    id: 'just-over-40-miles',
    name: 'Riverside - Just Outside Range',
    content: `
      Location: Riverside, CA 92501 (45 miles)
      Services: Pressure washing
      Requirements: Standard
    `,
    expectedScore: { min: 0, max: 40 },
    expectedDecision: 'NO-GO',
    expectedGeographic: 0, // Should be 0% at 45 miles
    location: { city: 'Riverside', distance: 45 }
  }
];

// Specific tests for the distance calculation bug
export const distanceBugTests: TestCase[] = [
  {
    id: 'monterey-park-distance-bug',
    name: 'Monterey Park Distance Bug Test',
    content: `
      Location: Monterey Park, CA
      Services: Pressure washing of shopping center
      Requirements: $1M insurance
    `,
    expectedScore: { min: 70, max: 90 },
    expectedDecision: 'GO',
    expectedGeographic: 100, // MUST be 100%, not 50%!
    location: { city: 'Monterey Park', distance: 15 },
    notes: 'This was scoring 50% geographic when it should be 100%'
  }
];
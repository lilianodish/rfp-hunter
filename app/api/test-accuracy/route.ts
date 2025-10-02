import { NextRequest, NextResponse } from 'next/server';
import { CompanyProfile } from '@/lib/types/profile';
import { calculateDistance } from '@/lib/utils/distance';
import {
  calculateInsuranceMatch,
  calculateServicesMatch,
  calculateCertsMatch,
  calculateEquipmentMatch,
  calculateOperationalMatch,
} from '@/lib/utils/scoring';

interface TestRequest {
  rfpContent: string;
  profile?: CompanyProfile;
}

interface ExtractedRequirement {
  category: string;
  requirement: string;
  value?: string | number;
  found: boolean;
}

interface ProfileMatch {
  category: string;
  requirement: string;
  profileValue?: string | number | boolean;
  matches: boolean;
  reason?: string;
}

interface ScoreCalculation {
  category: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  details: string;
}

interface TestResponse {
  extractedRequirements: ExtractedRequirement[];
  profileMatches: ProfileMatch[];
  scoreCalculation: ScoreCalculation[];
  totalScore: number;
  debugInfo: {
    profileCompleteness: number;
    missingProfileFields: string[];
    rfpComplexity: 'simple' | 'moderate' | 'complex';
  };
}

export async function POST(request: NextRequest) {
  try {
    const { rfpContent, profile }: TestRequest = await request.json();

    if (!rfpContent) {
      return NextResponse.json(
        { error: 'RFP content is required' },
        { status: 400 }
      );
    }

    // Use provided profile or generate a test profile
    const testProfile: CompanyProfile = profile || generateTestProfile();

    // Extract requirements from RFP
    const extractedRequirements = extractTestRequirements(rfpContent);

    // Match against profile
    const profileMatches = matchProfileToRequirements(extractedRequirements, testProfile);

    // Calculate scores
    const scoreCalculation = calculateDetailedScores(extractedRequirements, profileMatches, testProfile);

    // Calculate total score
    const totalScore = scoreCalculation.reduce((sum, calc) => sum + calc.weightedScore, 0);

    // Debug information
    const debugInfo = generateDebugInfo(testProfile, rfpContent);

    const response: TestResponse = {
      extractedRequirements,
      profileMatches,
      scoreCalculation,
      totalScore: Math.round(totalScore),
      debugInfo,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Test accuracy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTestProfile(): CompanyProfile {
  return {
    basics: {
      companyName: 'Test Pressure Washing Co',
      dbaName: 'Test Pro Wash',
      address: '123 Test St',
      city: 'Glendale',
      state: 'CA',
      zip: '91201',
      yearEstablished: 2015,
      entityType: 'LLC',
      ein: '12-3456789',
      employees: 15,
      crews: 4,
      serviceRadius: 50,
    },
    insurance: {
      generalLiability: { amount: 2000000, carrier: 'Test Insurance', expiry: '2025-12-31' },
      workersComp: { hasIt: true, carrier: 'State Fund', expiry: '2025-12-31' },
      commercialAuto: { amount: 1000000, carrier: 'Test Auto' },
      umbrella: { amount: 5000000 },
      professional: { amount: 1000000 },
    },
    services: {
      buildingExterior: true,
      concrete: true,
      parkingStructure: true,
      graffiti: true,
      emergency247: true,
      oilStain: true,
      gumRemoval: true,
      driveThrough: true,
      awnings: true,
      dumpsterAreas: true,
      sidewalks: true,
      brickCleaning: true,
      graffitiRemoval: true,
      rustRemoval: false,
      fleetWashing: false,
      solarPanels: false,
      windows: false,
      roofCleaning: false,
      deckCleaning: false,
      fenceCleaning: false,
    },
    equipment: {
      hotWater: { capable: true, maxTemp: 200, psi: 3500 },
      coldWater: { capable: true, psi: 4000 },
      numberOfTrucks: 5,
      waterRecovery: true,
      aerialLift: false,
      surfaceCleaners: true,
      chemicalSystem: true,
      epaApprovedChemicals: true,
    },
    certifications: {
      businessLicense: true,
      contractorLicense: true,
      epaCompliant: true,
      oshaLevel: '10-hour',
      prevailingWage: false,
      samRegistration: true,
      cageCode: '12345',
      dunsNumber: '123456789',
      smallBusiness: true,
      minorityOwned: false,
      womanOwned: false,
      veteranOwned: false,
      hubZone: false,
    },
    operational: {
      nightWork: true,
      weekendWork: true,
      holidayWork: false,
      minimumContract: 500,
      maxSimultaneousJobs: 10,
      emergencyResponseTime: 2,
      paymentTermsRequired: 'Net 30',
    },
  };
}

function extractTestRequirements(rfpContent: string): ExtractedRequirement[] {
  const requirements: ExtractedRequirement[] = [];
  const text = rfpContent.toLowerCase();

  // Geographic requirements
  const zipMatch = text.match(/\b\d{5}(-\d{4})?\b/);
  if (zipMatch) {
    requirements.push({
      category: 'geographic',
      requirement: 'Location/Service Area',
      value: zipMatch[0],
      found: true,
    });
  }

  const radiusMatch = text.match(/within (\d+) miles/i);
  if (radiusMatch) {
    requirements.push({
      category: 'geographic',
      requirement: 'Service Radius',
      value: parseInt(radiusMatch[1]),
      found: true,
    });
  }

  // Insurance requirements
  const glMatch = text.match(/general liability.*?\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|m)?/i);
  if (glMatch) {
    const amount = parseFloat(glMatch[1].replace(/,/g, ''));
    const multiplier = glMatch[2]?.toLowerCase().startsWith('m') ? 1000000 : 1;
    requirements.push({
      category: 'insurance',
      requirement: 'General Liability',
      value: amount * multiplier,
      found: true,
    });
  }

  if (text.includes('workers comp') || text.includes("workers' comp")) {
    requirements.push({
      category: 'insurance',
      requirement: 'Workers Compensation',
      value: 'Required',
      found: true,
    });
  }

  // Service requirements
  const serviceKeywords = [
    'building exterior', 'sidewalk', 'parking', 'graffiti', 'emergency',
    'terminal', 'runway', 'bridge', 'cable', 'tower'
  ];

  serviceKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      requirements.push({
        category: 'services',
        requirement: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        found: true,
      });
    }
  });

  // Certification requirements
  const certKeywords = [
    { search: 'epa', display: 'EPA Compliance' },
    { search: 'osha', display: 'OSHA Certification' },
    { search: 'prevailing wage', display: 'Prevailing Wage' },
    { search: 'airport security', display: 'Airport Security Clearance' },
    { search: 'tsa', display: 'TSA Background Check' },
    { search: 'union', display: 'Union Labor' },
  ];

  certKeywords.forEach(cert => {
    if (text.includes(cert.search)) {
      requirements.push({
        category: 'certifications',
        requirement: cert.display,
        found: true,
      });
    }
  });

  // Equipment requirements
  const psiMatch = text.match(/(\d{3,4})\s*psi/i);
  if (psiMatch) {
    requirements.push({
      category: 'equipment',
      requirement: 'Minimum PSI',
      value: parseInt(psiMatch[1]),
      found: true,
    });
  }

  if (text.includes('hot water')) {
    requirements.push({
      category: 'equipment',
      requirement: 'Hot Water Capability',
      found: true,
    });
  }

  if (text.includes('water recovery')) {
    requirements.push({
      category: 'equipment',
      requirement: 'Water Recovery System',
      found: true,
    });
  }

  return requirements;
}

function matchProfileToRequirements(
  requirements: ExtractedRequirement[],
  profile: CompanyProfile
): ProfileMatch[] {
  const matches: ProfileMatch[] = [];

  requirements.forEach(req => {
    let match: ProfileMatch = {
      category: req.category,
      requirement: req.requirement,
      matches: false,
    };

    switch (req.category) {
      case 'geographic':
        if (req.requirement === 'Service Radius' && req.value) {
          const serviceRadius = profile.basics.serviceRadius || 0;
          match.profileValue = serviceRadius;
          match.matches = serviceRadius >= (req.value as number);
          match.reason = match.matches 
            ? 'Within service area' 
            : `Service radius too small (${serviceRadius} vs ${req.value} miles required)`;
        }
        break;

      case 'insurance':
        if (req.requirement === 'General Liability' && req.value) {
          match.profileValue = profile.insurance.generalLiability?.amount || 0;
          match.matches = (profile.insurance.generalLiability?.amount || 0) >= (req.value as number);
          match.reason = match.matches
            ? 'Coverage meets requirement'
            : `Insufficient coverage ($${match.profileValue?.toLocaleString()} vs $${(req.value as number).toLocaleString()} required)`;
        }
        if (req.requirement === 'Workers Compensation') {
          match.profileValue = profile.insurance.workersComp?.hasIt ? 'Yes' : 'No';
          match.matches = profile.insurance.workersComp?.hasIt || false;
          match.reason = match.matches ? 'Has coverage' : 'Missing required coverage';
        }
        break;

      case 'services':
        const serviceMap: Record<string, keyof typeof profile.services> = {
          'building exterior': 'buildingExterior',
          'sidewalk': 'sidewalks',
          'parking': 'parkingStructure',
          'graffiti': 'graffiti',
          'emergency': 'emergency247',
        };
        
        const serviceKey = serviceMap[req.requirement.toLowerCase()];
        if (serviceKey) {
          match.profileValue = profile.services[serviceKey] ? 'Offered' : 'Not offered';
          match.matches = profile.services[serviceKey] || false;
          match.reason = match.matches ? 'Service offered' : 'Service not in portfolio';
        }
        break;

      case 'certifications':
        if (req.requirement === 'EPA Compliance') {
          match.profileValue = profile.certifications.epaCompliant ? 'Yes' : 'No';
          match.matches = profile.certifications.epaCompliant || false;
        }
        if (req.requirement === 'OSHA Certification') {
          match.profileValue = profile.certifications.oshaLevel || 'None';
          match.matches = !!profile.certifications.oshaLevel;
        }
        break;

      case 'equipment':
        if (req.requirement === 'Minimum PSI' && req.value) {
          const maxPSI = Math.max(
            profile.equipment.hotWater?.psi || 0,
            profile.equipment.coldWater?.psi || 0
          );
          match.profileValue = maxPSI;
          match.matches = maxPSI >= (req.value as number);
          match.reason = match.matches
            ? 'Equipment meets requirement'
            : `PSI too low (${maxPSI} vs ${req.value} required)`;
        }
        if (req.requirement === 'Hot Water Capability') {
          match.profileValue = profile.equipment.hotWater?.capable ? 'Yes' : 'No';
          match.matches = profile.equipment.hotWater?.capable || false;
        }
        break;
    }

    matches.push(match);
  });

  return matches;
}

function calculateDetailedScores(
  requirements: ExtractedRequirement[],
  matches: ProfileMatch[],
  profile: CompanyProfile
): ScoreCalculation[] {
  const calculations: ScoreCalculation[] = [];

  // Geographic Score (25%)
  const geoRequirements = requirements.filter(r => r.category === 'geographic');
  const geoMatches = matches.filter(m => m.category === 'geographic');
  const geoScore = geoMatches.length > 0
    ? (geoMatches.filter(m => m.matches).length / geoMatches.length) * 100
    : 100; // No geographic requirements = perfect score

  calculations.push({
    category: 'Geographic',
    weight: 25,
    rawScore: geoScore,
    weightedScore: geoScore * 0.25,
    details: geoMatches.length > 0 
      ? `${geoMatches.filter(m => m.matches).length}/${geoMatches.length} geographic requirements met`
      : 'No specific geographic requirements',
  });

  // Insurance Score (25%)
  const insRequirements = requirements.filter(r => r.category === 'insurance');
  const insMatches = matches.filter(m => m.category === 'insurance');
  const insScore = insMatches.length > 0
    ? (insMatches.filter(m => m.matches).length / insMatches.length) * 100
    : 100;

  calculations.push({
    category: 'Insurance',
    weight: 25,
    rawScore: insScore,
    weightedScore: insScore * 0.25,
    details: insMatches.length > 0
      ? `${insMatches.filter(m => m.matches).length}/${insMatches.length} insurance requirements met`
      : 'No specific insurance requirements',
  });

  // Services Score (25%)
  const svcRequirements = requirements.filter(r => r.category === 'services');
  const svcMatches = matches.filter(m => m.category === 'services');
  const svcScore = svcMatches.length > 0
    ? (svcMatches.filter(m => m.matches).length / svcMatches.length) * 100
    : 100;

  calculations.push({
    category: 'Services',
    weight: 25,
    rawScore: svcScore,
    weightedScore: svcScore * 0.25,
    details: svcMatches.length > 0
      ? `${svcMatches.filter(m => m.matches).length}/${svcMatches.length} required services offered`
      : 'No specific service requirements',
  });

  // Certifications Score (25%)
  const certRequirements = requirements.filter(r => r.category === 'certifications');
  const certMatches = matches.filter(m => m.category === 'certifications');
  const certScore = certMatches.length > 0
    ? (certMatches.filter(m => m.matches).length / certMatches.length) * 100
    : 100;

  calculations.push({
    category: 'Certifications',
    weight: 25,
    rawScore: certScore,
    weightedScore: certScore * 0.25,
    details: certMatches.length > 0
      ? `${certMatches.filter(m => m.matches).length}/${certMatches.length} required certifications held`
      : 'No specific certification requirements',
  });

  return calculations;
}

function generateDebugInfo(profile: CompanyProfile, rfpContent: string): TestResponse['debugInfo'] {
  const missingProfileFields: string[] = [];

  // Check for missing critical fields
  if (!profile.basics.companyName) missingProfileFields.push('Company Name');
  if (!profile.basics.serviceRadius) missingProfileFields.push('Service Radius');
  if (!profile.insurance.generalLiability?.amount) missingProfileFields.push('General Liability Insurance');
  if (!profile.certifications.businessLicense) missingProfileFields.push('Business License');

  // Calculate profile completeness
  const totalFields = 50; // Approximate total fields
  const filledFields = totalFields - missingProfileFields.length;
  const profileCompleteness = Math.round((filledFields / totalFields) * 100);

  // Determine RFP complexity
  const wordCount = rfpContent.split(/\s+/).length;
  const complexity = wordCount < 200 ? 'simple' : wordCount < 500 ? 'moderate' : 'complex';

  return {
    profileCompleteness,
    missingProfileFields,
    rfpComplexity: complexity,
  };
}
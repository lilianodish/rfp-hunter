import { CompanyProfile } from '@/lib/types/profile';
import { getDistanceFromGlendale, calculateGeographicScore } from './distance';
import {
  calculateInsuranceMatch,
  calculateServicesMatch,
  calculateCertsMatch,
  formatMissingRequirement,
  isFillableGap,
} from './scoring';

interface ExtractedRequirements {
  location: {
    city?: string;
    state?: string;
    address?: string;
    zip?: string;
  };
  insurance: {
    generalLiability?: number;
    workersComp?: boolean;
    commercialAuto?: number;
    umbrella?: number;
    professional?: number;
  };
  services: string[];
  certifications: string[];
  equipment: {
    minPSI?: number;
    hotWater?: boolean;
    waterRecovery?: boolean;
    aerialLift?: boolean;
  };
  operational: {
    nightWork?: boolean;
    weekendWork?: boolean;
    emergencyResponse?: boolean;
    maxResponseTime?: number;
  };
}

interface ScoreBreakdown {
  geographic: number;
  insurance: number;
  services: number;
  certifications: number;
}

interface AnalysisResult {
  decision: 'GO' | 'MAYBE' | 'NO-GO';
  score: number;
  breakdown: ScoreBreakdown;
  missingRequirements: string[];
  fillableGaps: string[];
  analysis: string;
}

export async function analyzeRFP(
  rfpContent: string,
  companyProfile: CompanyProfile
): Promise<AnalysisResult> {
  // Extract requirements from RFP
  const requirements = extractRequirements(rfpContent);
  
  // Calculate match scores
  const matchResult = calculateMatch(requirements, companyProfile);
  
  // Generate analysis
  const analysis = generateAnalysis(
    matchResult.decision,
    matchResult.totalScore,
    matchResult.breakdown,
    matchResult.missingRequirements,
    matchResult.fillableGaps,
    companyProfile
  );
  
  return {
    decision: matchResult.decision,
    score: Math.round(matchResult.totalScore),
    breakdown: matchResult.breakdown,
    missingRequirements: matchResult.missingRequirements,
    fillableGaps: matchResult.fillableGaps,
    analysis
  };
}

function extractRequirements(rfpText: string): ExtractedRequirements {
  const text = rfpText.toLowerCase();
  
  // Extract location
  const location: ExtractedRequirements['location'] = {};
  const zipMatch = text.match(/\b\d{5}(-\d{4})?\b/);
  if (zipMatch) location.zip = zipMatch[0].substring(0, 5);
  
  // Common city names in LA area
  const cities = [
    'los angeles', 'glendale', 'pasadena', 'burbank', 'santa monica', 
    'beverly hills', 'monterey park', 'alhambra', 'long beach', 'torrance',
    'inglewood', 'downtown la', 'dtla', 'anaheim', 'riverside'
  ];
  for (const city of cities) {
    if (text.includes(city)) {
      location.city = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      location.state = 'CA';
      break;
    }
  }

  // Extract insurance requirements
  const insurance: ExtractedRequirements['insurance'] = {};
  
  // General liability
  const glMatch = text.match(/general liability.*?\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|m|k)?/i);
  if (glMatch) {
    const amount = parseFloat(glMatch[1].replace(/,/g, ''));
    const multiplier = glMatch[2]?.toLowerCase().startsWith('m') ? 1000000 : glMatch[2]?.toLowerCase() === 'k' ? 1000 : 1;
    insurance.generalLiability = amount * multiplier;
  }
  
  // Workers comp
  if (text.includes('workers comp') || text.includes("workers' comp") || text.includes('workman')) {
    insurance.workersComp = true;
  }
  
  // Commercial auto
  const autoMatch = text.match(/(?:commercial |)auto(?:mobile|)\s*(?:liability|insurance).*?\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|m|k)?/i);
  if (autoMatch) {
    const amount = parseFloat(autoMatch[1].replace(/,/g, ''));
    const multiplier = autoMatch[2]?.toLowerCase().startsWith('m') ? 1000000 : autoMatch[2]?.toLowerCase() === 'k' ? 1000 : 1;
    insurance.commercialAuto = amount * multiplier;
  }

  // Extract services
  const services: string[] = [];
  const serviceKeywords = [
    'building washing', 'exterior cleaning', 'concrete cleaning', 'parking garage',
    'graffiti removal', 'sidewalk cleaning', 'dumpster area', 'awning cleaning',
    'fleet washing', 'window cleaning', 'roof cleaning', 'emergency services',
    'pressure washing', 'power washing'
  ];
  
  for (const keyword of serviceKeywords) {
    if (text.includes(keyword)) {
      services.push(keyword);
    }
  }

  // Extract certifications
  const certifications: string[] = [];
  const certKeywords = [
    'business license', 'contractor license', 'epa', 'osha', 'prevailing wage',
    'sam registration', 'small business', 'minority owned', 'woman owned', 'veteran owned'
  ];
  
  for (const keyword of certKeywords) {
    if (text.includes(keyword)) {
      certifications.push(keyword);
    }
  }

  // Extract equipment requirements
  const equipment: ExtractedRequirements['equipment'] = {};
  
  const psiMatch = text.match(/(\d{3,4})\s*psi/i);
  if (psiMatch) {
    equipment.minPSI = parseInt(psiMatch[1]);
  }
  
  if (text.includes('hot water') || text.includes('heated water')) {
    equipment.hotWater = true;
  }
  
  if (text.includes('water recovery') || text.includes('water reclamation')) {
    equipment.waterRecovery = true;
  }

  // Extract operational requirements
  const operational: ExtractedRequirements['operational'] = {};
  
  if (text.includes('night work') || text.includes('after hours')) {
    operational.nightWork = true;
  }
  
  if (text.includes('weekend')) {
    operational.weekendWork = true;
  }
  
  if (text.includes('emergency') || text.includes('24/7')) {
    operational.emergencyResponse = true;
  }

  return {
    location,
    insurance,
    services,
    certifications,
    equipment,
    operational
  };
}

function calculateMatch(
  rfpRequirements: ExtractedRequirements,
  companyProfile: CompanyProfile
): {
  totalScore: number;
  breakdown: ScoreBreakdown;
  missingRequirements: string[];
  fillableGaps: string[];
  decision: 'GO' | 'MAYBE' | 'NO-GO';
} {
  const missingRequirements: string[] = [];
  const fillableGaps: string[] = [];

  // Geographic Score (25%)
  let geoScore = 100; // Default to 100 if no location requirements
  if (rfpRequirements.location.zip || rfpRequirements.location.city) {
    const rfpLocation = rfpRequirements.location.zip 
      ? rfpRequirements.location.zip 
      : `${rfpRequirements.location.city}, ${rfpRequirements.location.state || 'CA'}`;
    
    // Check if company is in Glendale (use specialized distance calculation)
    if (companyProfile.basics.city?.toLowerCase().includes('glendale')) {
      const distance = getDistanceFromGlendale(rfpLocation);
      const serviceRadius = companyProfile.operational?.serviceRadius || 40;
      geoScore = calculateGeographicScore(distance, serviceRadius);
      
      if (geoScore === 0) {
        missingRequirements.push(`Location outside service radius (${distance} miles, max: ${serviceRadius} miles)`);
      }
    } else {
      // For non-Glendale companies, default to 50% for now
      geoScore = 50;
    }
  }

  // Insurance Score (25%)
  const insuranceScore = calculateInsuranceMatch(rfpRequirements.insurance, companyProfile.insurance);
  
  // Check specific insurance gaps
  if (rfpRequirements.insurance.generalLiability && 
      (!companyProfile.insurance.generalLiability?.amount || 
       companyProfile.insurance.generalLiability.amount < rfpRequirements.insurance.generalLiability)) {
    const required = rfpRequirements.insurance.generalLiability;
    const actual = companyProfile.insurance.generalLiability?.amount || 0;
    missingRequirements.push(formatMissingRequirement('insurance', `General Liability: $${required.toLocaleString()} required`, actual));
    if (actual > 0) {
      fillableGaps.push(`Increase General Liability from $${actual.toLocaleString()} to $${required.toLocaleString()}`);
    }
  }
  
  if (rfpRequirements.insurance.workersComp && !companyProfile.insurance.workersComp?.hasIt) {
    missingRequirements.push('Workers Compensation Insurance required');
  }

  // Services Score (25%)
  const servicesScore = calculateServicesMatch(rfpRequirements.services, companyProfile.services);
  const unmatchedServices = (calculateServicesMatch as any).lastUnmatched || [];
  unmatchedServices.forEach((service: string) => {
    missingRequirements.push(formatMissingRequirement('services', service));
  });

  // Certifications Score (25%)
  const certsScore = calculateCertsMatch(rfpRequirements.certifications, companyProfile.certifications);
  const unmatchedCerts = (calculateCertsMatch as any).lastUnmatched || [];
  unmatchedCerts.forEach((cert: string) => {
    const requirement = formatMissingRequirement('certifications', cert);
    missingRequirements.push(requirement);
    if (isFillableGap('certifications', cert)) {
      fillableGaps.push(`Obtain ${cert}`);
    }
  });

  // Calculate total score
  const totalScore = (geoScore + insuranceScore + servicesScore + certsScore) / 4;

  // Determine decision based on score
  let decision: 'GO' | 'MAYBE' | 'NO-GO';
  if (totalScore >= 75) {
    decision = 'GO';
  } else if (totalScore >= 50) {
    decision = 'MAYBE';
  } else {
    decision = 'NO-GO';
  }

  return {
    totalScore,
    breakdown: {
      geographic: geoScore,
      insurance: insuranceScore,
      services: servicesScore,
      certifications: certsScore
    },
    missingRequirements,
    fillableGaps,
    decision
  };
}

function generateAnalysis(
  decision: 'GO' | 'MAYBE' | 'NO-GO',
  score: number,
  breakdown: ScoreBreakdown,
  missingRequirements: string[],
  fillableGaps: string[],
  companyProfile: CompanyProfile
): string {
  let analysis = `Based on ${companyProfile.basics.companyName || 'your company'}'s profile, this RFP shows a ${score.toFixed(1)}% match.\n\n`;

  // Breakdown analysis
  analysis += 'Score Breakdown:\n';
  analysis += `• Geographic Match: ${breakdown.geographic}% - ${breakdown.geographic === 100 ? 'Within service area' : breakdown.geographic === 50 ? 'Possible but may be challenging' : 'Outside service area'}\n`;
  analysis += `• Insurance Match: ${breakdown.insurance}% - ${breakdown.insurance === 100 ? 'All requirements met' : 'Some gaps in coverage'}\n`;
  analysis += `• Services Match: ${breakdown.services}% - ${breakdown.services === 100 ? 'All services offered' : 'Some services not offered'}\n`;
  analysis += `• Certifications Match: ${breakdown.certifications}% - ${breakdown.certifications === 100 ? 'All certifications held' : 'Some certifications missing'}\n\n`;

  if (missingRequirements.length > 0) {
    analysis += 'Missing Requirements:\n';
    missingRequirements.forEach(req => {
      analysis += `• ${req}\n`;
    });
    analysis += '\n';
  }

  if (fillableGaps.length > 0) {
    analysis += 'Easily Addressable Gaps:\n';
    fillableGaps.forEach(gap => {
      analysis += `• ${gap}\n`;
    });
    analysis += '\n';
  }

  // Recommendation
  if (decision === 'GO') {
    analysis += 'Recommendation: PROCEED WITH PROPOSAL. Your company is well-positioned for this opportunity.';
  } else if (decision === 'MAYBE') {
    analysis += 'Recommendation: PROCEED WITH CAUTION. Consider addressing the gaps identified or partnering to strengthen your proposal.';
  } else {
    analysis += 'Recommendation: DO NOT PROCEED. The requirements significantly exceed current capabilities.';
  }

  return analysis;
}
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { CompanyProfile } from '@/lib/types/profile';
import { calculateDistance, isWithinServiceRadius } from '@/lib/utils/distance';
import {
  calculateInsuranceMatch,
  calculateServicesMatch,
  calculateCertsMatch,
  calculateEquipmentMatch,
  calculateOperationalMatch,
  formatMissingRequirement,
  isFillableGap,
} from '@/lib/utils/scoring';

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
  decision: 'HIGH_CONFIDENCE_GO' | 'MEDIUM_CONFIDENCE_GO' | 'LOW_CONFIDENCE_GO' | 'NO_GO';
  score: number;
  breakdown: ScoreBreakdown;
  missingRequirements: string[];
  fillableGaps: string[];
  analysis: string;
  proposal?: string;
  requirements: {
    extracted: ExtractedRequirements;
    met: string[];
    unmet: string[];
  };
}

// Initialize OpenAI client if API key exists
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey !== 'your-key-here' ? new OpenAI({ apiKey }) : null;

async function extractRequirements(rfpText: string): Promise<ExtractedRequirements> {
  if (!openai) {
    // Fallback extraction without OpenAI
    return extractRequirementsFallback(rfpText);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `Extract requirements from this RFP and return as JSON. Look for:
          - Location information (city, state, address, zip)
          - Insurance requirements (dollar amounts for coverage)
          - Required services (list all mentioned services)
          - Certifications and licenses required
          - Equipment specifications (PSI, hot water, etc.)
          - Operational requirements (night work, weekends, emergency response)
          
          Return in this exact format:
          {
            "location": { "city": "", "state": "", "address": "", "zip": "" },
            "insurance": { 
              "generalLiability": number or null,
              "workersComp": boolean or null,
              "commercialAuto": number or null,
              "umbrella": number or null,
              "professional": number or null
            },
            "services": ["service1", "service2"],
            "certifications": ["cert1", "cert2"],
            "equipment": {
              "minPSI": number or null,
              "hotWater": boolean or null,
              "waterRecovery": boolean or null,
              "aerialLift": boolean or null
            },
            "operational": {
              "nightWork": boolean or null,
              "weekendWork": boolean or null,
              "emergencyResponse": boolean or null,
              "maxResponseTime": number or null
            }
          }`
        },
        {
          role: 'user',
          content: rfpText
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    return extractRequirementsFallback(rfpText);
  }
}

function extractRequirementsFallback(rfpText: string): ExtractedRequirements {
  const text = rfpText.toLowerCase();
  
  // Extract location
  const location: ExtractedRequirements['location'] = {};
  const zipMatch = text.match(/\b\d{5}(-\d{4})?\b/);
  if (zipMatch) location.zip = zipMatch[0].substring(0, 5);
  
  // Common city names in LA area
  const cities = ['los angeles', 'glendale', 'pasadena', 'burbank', 'santa monica', 'beverly hills'];
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
    'fleet washing', 'window cleaning', 'roof cleaning', 'emergency services'
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
  decision: AnalysisResult['decision'];
} {
  const missingRequirements: string[] = [];
  const fillableGaps: string[] = [];

  // Geographic Score (25%)
  let geoScore = 100; // Default to 100 if no location requirements
  if (rfpRequirements.location.zip || rfpRequirements.location.city) {
    const rfpLocation = rfpRequirements.location.zip 
      ? rfpRequirements.location.zip 
      : `${rfpRequirements.location.city}, ${rfpRequirements.location.state || 'CA'}`;
    
    const companyLocation = companyProfile.basics.zip 
      ? companyProfile.basics.zip
      : `${companyProfile.basics.city}, ${companyProfile.basics.state}`;
    
    if (companyProfile.basics.serviceRadius) {
      const distance = calculateDistance(rfpLocation, companyLocation);
      if (distance !== null) {
        geoScore = distance <= companyProfile.basics.serviceRadius ? 100 : 0;
        if (geoScore === 0) {
          missingRequirements.push(`Location outside service radius (${distance.toFixed(1)} miles, max: ${companyProfile.basics.serviceRadius} miles)`);
        }
      } else {
        // Can't calculate distance, be conservative
        geoScore = 50;
      }
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
  let decision: AnalysisResult['decision'];
  if (totalScore >= 90) {
    decision = 'HIGH_CONFIDENCE_GO';
  } else if (totalScore >= 70) {
    decision = 'MEDIUM_CONFIDENCE_GO';
  } else if (totalScore >= 50) {
    decision = 'LOW_CONFIDENCE_GO';
  } else {
    decision = 'NO_GO';
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
  decision: AnalysisResult['decision'],
  score: number,
  breakdown: ScoreBreakdown,
  missingRequirements: string[],
  fillableGaps: string[],
  companyProfile: CompanyProfile
): string {
  const confidenceLevel = decision.includes('HIGH') ? 'high' : 
                         decision.includes('MEDIUM') ? 'medium' : 
                         decision.includes('LOW') ? 'low' : 'insufficient';

  let analysis = `Based on ${companyProfile.basics.companyName || 'your company'}'s profile, this RFP shows a ${score.toFixed(1)}% match with ${confidenceLevel} confidence.\n\n`;

  // Breakdown analysis
  analysis += 'Score Breakdown:\n';
  analysis += `• Geographic Match: ${breakdown.geographic}% - ${breakdown.geographic === 100 ? 'Within service area' : 'Outside service area'}\n`;
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
  if (decision === 'HIGH_CONFIDENCE_GO') {
    analysis += 'Recommendation: PROCEED WITH PROPOSAL. Your company is well-positioned for this opportunity with minimal gaps.';
  } else if (decision === 'MEDIUM_CONFIDENCE_GO') {
    analysis += 'Recommendation: PROCEED WITH CAUTION. Consider addressing the gaps identified or partnering to strengthen your proposal.';
  } else if (decision === 'LOW_CONFIDENCE_GO') {
    analysis += 'Recommendation: CAREFULLY EVALUATE. Significant gaps exist that would require substantial effort or partnerships to address.';
  } else {
    analysis += 'Recommendation: DO NOT PROCEED. The requirements significantly exceed current capabilities.';
  }

  return analysis;
}

async function generateProposal(
  rfpText: string,
  companyProfile: CompanyProfile,
  score: number
): Promise<string | undefined> {
  // Only generate proposal for GO decisions with reasonable scores
  if (score < 50 || !openai) {
    return undefined;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `You are writing a proposal for ${companyProfile.basics.companyName}, a pressure washing company.
          Company details:
          - Location: ${companyProfile.basics.city}, ${companyProfile.basics.state}
          - Years in business: ${new Date().getFullYear() - (companyProfile.basics.yearEstablished || new Date().getFullYear())}
          - Employees: ${companyProfile.basics.employees || 'N/A'}
          - Service radius: ${companyProfile.basics.serviceRadius || 'N/A'} miles
          
          Write a brief, professional proposal introduction (2-3 paragraphs) highlighting the company's strengths and addressing the RFP requirements.`
        },
        {
          role: 'user',
          content: `RFP Text: ${rfpText}\n\nMatch Score: ${score}%\n\nGenerate a compelling proposal introduction.`
        }
      ]
    });

    return completion.choices[0].message.content || undefined;
  } catch (error) {
    console.error('Proposal generation error:', error);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rfpText, profile } = await request.json();

    if (!rfpText || typeof rfpText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. RFP text is required.' },
        { status: 400 }
      );
    }

    // Get profile from request or try to read from stored data
    let companyProfile: CompanyProfile | null = profile;
    
    if (!companyProfile) {
      // Try to read from cookies (if stored there)
      const cookieStore = cookies();
      const profileCookie = cookieStore.get('company-profile');
      if (profileCookie) {
        try {
          companyProfile = JSON.parse(profileCookie.value);
        } catch (e) {
          console.error('Failed to parse profile from cookie:', e);
        }
      }
    }

    if (!companyProfile || !companyProfile.basics?.companyName) {
      return NextResponse.json(
        { error: 'Company profile is required for accurate analysis. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Extract requirements from RFP
    const extractedRequirements = await extractRequirements(rfpText);

    // Calculate match scores
    const matchResult = calculateMatch(extractedRequirements, companyProfile);

    // Generate detailed analysis
    const analysis = generateAnalysis(
      matchResult.decision,
      matchResult.totalScore,
      matchResult.breakdown,
      matchResult.missingRequirements,
      matchResult.fillableGaps,
      companyProfile
    );

    // Generate proposal if appropriate
    const proposal = await generateProposal(rfpText, companyProfile, matchResult.totalScore);

    // Build response
    const result: AnalysisResult = {
      decision: matchResult.decision,
      score: Math.round(matchResult.totalScore),
      breakdown: matchResult.breakdown,
      missingRequirements: matchResult.missingRequirements,
      fillableGaps: matchResult.fillableGaps,
      analysis,
      proposal,
      requirements: {
        extracted: extractedRequirements,
        met: [],
        unmet: matchResult.missingRequirements
      }
    };

    // Add met requirements
    if (matchResult.breakdown.geographic === 100) {
      result.requirements.met.push('Within service area');
    }
    if (matchResult.breakdown.insurance === 100) {
      result.requirements.met.push('All insurance requirements met');
    }
    if (matchResult.breakdown.services === 100) {
      result.requirements.met.push('All required services offered');
    }
    if (matchResult.breakdown.certifications === 100) {
      result.requirements.met.push('All certifications held');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
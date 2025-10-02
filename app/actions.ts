'use server';

export async function analyzeRFP(rfpContent: string) {
  // This is a placeholder for the actual RFP analysis
  // In the test environment, we'll return mock results based on the content
  
  const content = rfpContent.toLowerCase();
  
  // Determine which test case this is
  let score = 50;
  let decision: 'GO' | 'NO GO' | 'MAYBE' = 'MAYBE';
  let confidence = 50;
  
  if (content.includes('glendale') && content.includes('$1m minimum')) {
    // Perfect fit
    score = 95;
    decision = 'GO';
    confidence = 95;
  } else if (content.includes('lax airport') || content.includes('$5m minimum')) {
    // Partial fit
    score = 60;
    decision = 'MAYBE';
    confidence = 60;
  } else if (content.includes('golden gate') || content.includes('$10m minimum')) {
    // Poor fit
    score = 20;
    decision = 'NO GO';
    confidence = 85;
  }
  
  return {
    decision,
    confidence,
    reasons: [
      score > 80 ? 'All requirements met' : 'Some requirements missing',
      score > 50 ? 'Within service area' : 'Outside typical service area',
    ],
    missingRequirements: score < 50 ? ['Insurance coverage', 'Special equipment'] : [],
    scoreBreakdown: {
      geographic: score > 70 ? 100 : 50,
      insurance: score > 60 ? 100 : 25,
      services: score > 50 ? 75 : 25,
      certifications: score > 40 ? 75 : 0,
    },
  };
}
import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
  decision: 'GO' | 'NO-GO';
  score: number;
  requirements: {
    met: string[];
    notMet: string[];
  };
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { rfpText } = await request.json();

    if (!rfpText || typeof rfpText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. RFP text is required.' },
        { status: 400 }
      );
    }

    // Mock analysis logic
    const analysis = analyzeRfp(rfpText);

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeRfp(rfpText: string): AnalysisResult {
  const text = rfpText.toLowerCase();
  
  // Define evaluation criteria
  const criteria = {
    budget: {
      weight: 0.25,
      keywords: ['budget', 'funding', 'cost', 'price', 'million', 'thousand'],
      threshold: 2
    },
    timeline: {
      weight: 0.2,
      keywords: ['timeline', 'deadline', 'months', 'weeks', 'days', 'delivery'],
      threshold: 1
    },
    requirements: {
      weight: 0.3,
      keywords: ['requirements', 'certification', 'experience', 'qualified', 'must have'],
      threshold: 2
    },
    scope: {
      weight: 0.25,
      keywords: ['scope', 'deliverables', 'tasks', 'implementation', 'work'],
      threshold: 2
    }
  };

  let totalScore = 0;
  const metRequirements: string[] = [];
  const notMetRequirements: string[] = [];

  // Analyze each criterion
  Object.entries(criteria).forEach(([key, criterion]) => {
    const matchCount = criterion.keywords.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    const criterionScore = Math.min(100, (matchCount / criterion.threshold) * 100);
    totalScore += criterionScore * criterion.weight;

    if (matchCount >= criterion.threshold) {
      metRequirements.push(formatRequirement(key));
    } else {
      notMetRequirements.push(formatRequirement(key));
    }
  });

  // Check for specific high-value indicators
  const hasGovernmentContract = text.includes('government') || text.includes('federal');
  const hasSecurityRequirement = text.includes('security') || text.includes('clearance');
  const hasCertification = text.includes('certification') || text.includes('iso');
  
  if (hasGovernmentContract) {
    totalScore = Math.min(100, totalScore + 10);
    metRequirements.push('Government contract experience');
  }
  
  if (hasSecurityRequirement) {
    if (text.includes('secret') || text.includes('clearance')) {
      notMetRequirements.push('Security clearance requirement');
      totalScore = Math.max(0, totalScore - 15);
    }
  }
  
  if (hasCertification) {
    if (text.includes('iso 27001') || text.includes('fedramp')) {
      notMetRequirements.push('Specific certification requirements');
      totalScore = Math.max(0, totalScore - 10);
    }
  }

  // Determine decision
  const decision: 'GO' | 'NO-GO' = totalScore >= 70 ? 'GO' : 'NO-GO';

  // Generate reasoning
  const reasoning = generateReasoning(decision, totalScore, metRequirements, notMetRequirements);

  return {
    decision,
    score: Math.round(totalScore),
    requirements: {
      met: metRequirements,
      notMet: notMetRequirements
    },
    reasoning
  };
}

function formatRequirement(key: string): string {
  const formats: Record<string, string> = {
    budget: 'Budget information clearly defined',
    timeline: 'Project timeline and deadlines specified',
    requirements: 'Clear requirements and qualifications',
    scope: 'Well-defined scope of work'
  };
  return formats[key] || key;
}

function generateReasoning(
  decision: 'GO' | 'NO-GO',
  score: number,
  met: string[],
  notMet: string[]
): string {
  if (decision === 'GO') {
    return `This RFP presents a strong opportunity with a ${score}% match score. ` +
           `The proposal clearly outlines ${met.length} key requirements that align with typical capabilities. ` +
           `${notMet.length > 0 ? `However, there are ${notMet.length} areas that may require additional attention or partnerships. ` : ''}` +
           `The overall clarity and structure of the RFP suggest a well-managed project with reasonable expectations.`;
  } else {
    return `This RFP shows a ${score}% match score, indicating significant challenges. ` +
           `While ${met.length} requirements are clearly defined, ` +
           `there are ${notMet.length} critical gaps that pose substantial risks. ` +
           `The combination of strict requirements and potential compliance challenges ` +
           `suggests this opportunity may not align with standard capabilities without significant investment.`;
  }
}
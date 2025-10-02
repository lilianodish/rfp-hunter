import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface AnalysisResult {
  decision: 'GO' | 'NO-GO';
  score: number;
  requirements: {
    met: string[];
    unmet: string[];
  };
  reasoning: string;
  nextSteps: string[];
}

// Initialize OpenAI client if API key exists
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey !== 'your-key-here' ? new OpenAI({ apiKey }) : null;

export async function POST(request: NextRequest) {
  try {
    const { rfpText } = await request.json();

    if (!rfpText || typeof rfpText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. RFP text is required.' },
        { status: 400 }
      );
    }

    let analysis: AnalysisResult;

    if (openai) {
      // Use OpenAI API
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: `You are analyzing RFPs for a pressure washing company in Glendale, CA. 
              Analyze the provided RFP and return a JSON response with the following structure:
              {
                "decision": "GO" or "NO-GO",
                "score": number between 0-100,
                "requirements": {
                  "met": ["list of requirements the company meets"],
                  "unmet": ["list of requirements the company doesn't meet"]
                },
                "reasoning": "brief explanation of the decision",
                "nextSteps": ["array of recommended next actions"]
              }
              
              Consider factors like budget size, timeline feasibility, certification requirements, 
              location preferences, and scope alignment with pressure washing services.`
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

        analysis = JSON.parse(content);
        
        // Ensure the response has the correct structure
        if (!analysis.decision || !analysis.score || !analysis.requirements || !analysis.reasoning || !analysis.nextSteps) {
          throw new Error('Invalid response structure from OpenAI');
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall back to mock analysis
        analysis = analyzeRfpMock(rfpText);
      }
    } else {
      // Use mock analysis when no API key
      analysis = analyzeRfpMock(rfpText);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeRfpMock(rfpText: string): AnalysisResult {
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

  // Generate next steps
  const nextSteps = generateNextSteps(decision, metRequirements, notMetRequirements);

  return {
    decision,
    score: Math.round(totalScore),
    requirements: {
      met: metRequirements,
      unmet: notMetRequirements
    },
    reasoning,
    nextSteps
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

function generateNextSteps(
  decision: 'GO' | 'NO-GO',
  met: string[],
  unmet: string[]
): string[] {
  if (decision === 'GO') {
    const steps = [
      'Review RFP requirements in detail',
      'Prepare a comprehensive proposal outline',
      'Gather relevant past project examples and case studies'
    ];
    
    if (unmet.length > 0) {
      steps.push('Identify partners or subcontractors for gap areas');
      steps.push('Develop mitigation strategies for unmet requirements');
    }
    
    steps.push('Schedule internal proposal review meeting');
    steps.push('Begin drafting executive summary');
    
    return steps;
  } else {
    return [
      'Document reasons for no-bid decision',
      'Archive RFP for future reference',
      'Consider partnership opportunities if requirements change',
      'Monitor for similar opportunities with better alignment',
      'Share learnings with business development team'
    ];
  }
}
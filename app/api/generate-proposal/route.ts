import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ProposalRequest {
  rfpText: string;
  analysisResult: {
    decision: string;
    score: number;
    requirements: {
      met: string[];
      unmet: string[];
    };
    reasoning: string;
    nextSteps: string[];
  };
}

interface ProposalResponse {
  coverLetter: string;
  executiveSummary: string;
  technicalApproach: string;
  pricing: string;
  whyChooseUs: string;
}

// Initialize OpenAI client if API key exists
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey !== 'your-key-here' ? new OpenAI({ apiKey }) : null;

export async function POST(request: NextRequest) {
  try {
    const { rfpText, analysisResult }: ProposalRequest = await request.json();

    if (!rfpText || !analysisResult || typeof rfpText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. RFP text and analysis results are required.' },
        { status: 400 }
      );
    }

    let proposal: ProposalResponse;

    if (openai) {
      // Use OpenAI API
      try {
        const systemPrompt = `You are a professional proposal writer for a pressure washing company in Glendale, CA. 
        Create compelling, business-focused proposal sections based on the RFP and analysis provided.
        Use clear, professional language and emphasize the company's strengths in pressure washing services.
        
        The company specializes in:
        - Commercial and residential pressure washing
        - Building exterior cleaning
        - Parking lot and driveway cleaning
        - Graffiti removal
        - Environmental compliance
        - 24/7 emergency response
        
        Return a JSON object with these sections:
        {
          "coverLetter": "Professional cover letter (2-3 paragraphs)",
          "executiveSummary": "Concise executive summary highlighting key value propositions",
          "technicalApproach": "Detailed technical approach to the project",
          "pricing": "Pricing structure and value proposition",
          "whyChooseUs": "Compelling reasons to select our company"
        }`;

        const userPrompt = `RFP Text: ${rfpText}
        
        Analysis Results:
        Decision: ${analysisResult.decision}
        Score: ${analysisResult.score}
        Met Requirements: ${analysisResult.requirements.met.join(', ')}
        Unmet Requirements: ${analysisResult.requirements.unmet.join(', ')}
        Reasoning: ${analysisResult.reasoning}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message.content;
        if (!content) {
          throw new Error('No response from OpenAI');
        }

        proposal = JSON.parse(content);
        
        // Ensure the response has the correct structure
        if (!proposal.coverLetter || !proposal.executiveSummary || !proposal.technicalApproach || !proposal.pricing || !proposal.whyChooseUs) {
          throw new Error('Invalid response structure from OpenAI');
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall back to mock proposal
        proposal = generateMockProposal(rfpText, analysisResult);
      }
    } else {
      // Use mock proposal when no API key
      proposal = generateMockProposal(rfpText, analysisResult);
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Proposal generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockProposal(rfpText: string, analysisResult: any): ProposalResponse {
  const companyName = "Premier Pressure Washing Solutions";
  
  return {
    coverLetter: `Dear Selection Committee,

${companyName} is pleased to submit our proposal for your pressure washing requirements. With over 15 years of experience serving the greater Glendale area, we have established ourselves as the region's premier pressure washing service provider.

Our team has carefully reviewed your RFP and we are confident in our ability to exceed your expectations. We bring a combination of state-of-the-art equipment, environmentally responsible practices, and a commitment to excellence that sets us apart in the industry.

We look forward to the opportunity to demonstrate our capabilities and build a long-term partnership with your organization.`,

    executiveSummary: `${companyName} offers comprehensive pressure washing services tailored to meet your specific needs. Our proposal highlights:

• Proven Track Record: 15+ years serving commercial and residential clients in Glendale
• Advanced Technology: Latest eco-friendly pressure washing equipment and techniques
• Certified Professionals: Fully licensed, bonded, and insured team members
• Competitive Pricing: Transparent, value-based pricing with no hidden costs
• Quality Guarantee: 100% satisfaction guarantee on all services

Based on our analysis (${analysisResult.score}% match), we are well-positioned to deliver exceptional results for your project.`,

    technicalApproach: `Our technical approach encompasses:

1. Initial Assessment
   - Comprehensive site survey and condition evaluation
   - Identification of specific cleaning requirements
   - Environmental impact assessment

2. Customized Solution Design
   - Selection of appropriate pressure levels and cleaning agents
   - Development of project-specific cleaning protocols
   - Scheduling to minimize operational disruption

3. Execution
   - Deployment of trained, certified technicians
   - Use of commercial-grade equipment (3000-4000 PSI capability)
   - Real-time quality monitoring and adjustment

4. Quality Assurance
   - Multi-point inspection process
   - Photo documentation of before/after conditions
   - Client walkthrough and sign-off`,

    pricing: `Our competitive pricing structure offers excellent value:

Base Service Rates:
• Commercial Properties: $0.15 - $0.25 per sq ft
• Parking Lots/Driveways: $0.10 - $0.18 per sq ft
• Building Exteriors: $0.20 - $0.35 per sq ft

Volume Discounts:
• 10,000+ sq ft: 10% discount
• 25,000+ sq ft: 15% discount
• Annual contracts: 20% discount

All pricing includes:
✓ Labor and equipment
✓ Eco-friendly cleaning solutions
✓ Waste water recovery and disposal
✓ Comprehensive insurance coverage
✓ Satisfaction guarantee`,

    whyChooseUs: `Why ${companyName} is Your Best Choice:

🏆 Local Expertise: Deep understanding of Glendale's climate and environmental regulations
🌱 Environmental Commitment: EPA-compliant practices and biodegradable cleaning solutions
⚡ Rapid Response: 24/7 emergency services with 2-hour response time
👥 Professional Team: Background-checked, uniformed, and courteous staff
📊 Transparent Reporting: Detailed service documentation and progress updates
💰 Best Value: Competitive pricing without compromising quality
🛡️ Risk-Free: Comprehensive insurance and satisfaction guarantee

Choose ${companyName} for reliability, quality, and peace of mind.`
  };
}
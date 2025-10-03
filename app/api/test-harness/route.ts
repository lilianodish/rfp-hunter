import { NextRequest, NextResponse } from 'next/server';
import { analyzeRFP } from '@/lib/utils/rfpAnalyzer';
import { CompanyProfile } from '@/lib/types/profile';
import { TestCase } from '@/lib/testing/realTestCases';

interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  score: number;
  expectedScore: { min: number; max: number };
  decision: string;
  expectedDecision: string;
  breakdown?: {
    geographic?: number;
    services?: number;
    insurance?: number;
    certifications?: number;
  };
  failures: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testCases, testProfile } = body as { 
      testCases: TestCase[]; 
      testProfile: CompanyProfile;
    };

    if (!testCases || !testProfile) {
      return NextResponse.json(
        { error: 'Missing test cases or profile' },
        { status: 400 }
      );
    }

    const results: TestResult[] = [];
    let passedCount = 0;

    // Run each test case
    for (const testCase of testCases) {
      try {
        // Analyze the RFP
        const analysis = await analyzeRFP(testCase.content, testProfile);
        
        // Check if score is within expected range
        const scoreInRange = 
          analysis.score >= testCase.expectedScore.min && 
          analysis.score <= testCase.expectedScore.max;
        
        // Collect failures
        const failures: string[] = [];
        
        if (!scoreInRange) {
          failures.push(
            `Score ${analysis.score}% outside expected range ${testCase.expectedScore.min}-${testCase.expectedScore.max}%`
          );
        }
        
        if (testCase.expectedDecision && analysis.decision !== testCase.expectedDecision) {
          failures.push(
            `Decision '${analysis.decision}' != expected '${testCase.expectedDecision}'`
          );
        }
        
        // Check specific breakdown expectations
        if (testCase.expectedGeographic !== undefined && 
            analysis.breakdown.geographic !== testCase.expectedGeographic) {
          failures.push(
            `Geographic score ${analysis.breakdown.geographic}% != expected ${testCase.expectedGeographic}%`
          );
        }
        
        if (testCase.expectedServices !== undefined && 
            analysis.breakdown.services !== testCase.expectedServices) {
          failures.push(
            `Services score ${analysis.breakdown.services}% != expected ${testCase.expectedServices}%`
          );
        }
        
        if (testCase.expectedInsurance !== undefined && 
            analysis.breakdown.insurance !== testCase.expectedInsurance) {
          failures.push(
            `Insurance score ${analysis.breakdown.insurance}% != expected ${testCase.expectedInsurance}%`
          );
        }
        
        if (testCase.expectedCertifications !== undefined && 
            analysis.breakdown.certifications !== testCase.expectedCertifications) {
          failures.push(
            `Certifications score ${analysis.breakdown.certifications}% != expected ${testCase.expectedCertifications}%`
          );
        }
        
        const passed = failures.length === 0;
        if (passed) passedCount++;
        
        results.push({
          testId: testCase.id,
          testName: testCase.name,
          passed,
          score: analysis.score,
          expectedScore: testCase.expectedScore,
          decision: analysis.decision,
          expectedDecision: testCase.expectedDecision || '',
          breakdown: analysis.breakdown,
          failures
        });
        
      } catch (error) {
        // Test execution error
        results.push({
          testId: testCase.id,
          testName: testCase.name,
          passed: false,
          score: 0,
          expectedScore: testCase.expectedScore,
          decision: 'ERROR',
          expectedDecision: testCase.expectedDecision || '',
          failures: [`Test execution error: ${error}`]
        });
      }
    }
    
    // Calculate summary
    const summary = {
      total: testCases.length,
      passed: passedCount,
      failed: testCases.length - passedCount,
      passRate: `${Math.round((passedCount / testCases.length) * 100)}%`
    };
    
    // Get failed tests for easy review
    const failedTests = results.filter(r => !r.passed);
    
    return NextResponse.json({
      summary,
      testResults: results,
      failedTests
    });
    
  } catch (error) {
    console.error('Test harness error:', error);
    return NextResponse.json(
      { error: 'Failed to run test harness', details: error },
      { status: 500 }
    );
  }
}
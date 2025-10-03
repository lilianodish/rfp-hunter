'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useProfileStore } from '@/lib/stores/profileStore';
import { realCaliforniaRFPs, distanceBugTests } from '@/lib/testing/realTestCases';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Play, PlayCircle } from 'lucide-react';

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

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: string;
}

export default function TestHarness() {
  const [results, setResults] = useState<{
    summary: TestSummary;
    testResults: TestResult[];
    failedTests: TestResult[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const profile = useProfileStore(state => state.profile);
  const completeness = useProfileStore(state => state.getCompleteness());
  
  useEffect(() => {
    useProfileStore.persist.rehydrate();
  }, []);
  
  const runAllTests = async () => {
    setLoading(true);
    const testCases = [...realCaliforniaRFPs, ...distanceBugTests];
    
    try {
      const response = await fetch('/api/test-harness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testCases,
          testProfile: profile 
        })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Test harness error:', error);
      alert('Error running tests. Check console for details.');
    }
    setLoading(false);
  };
  
  const runSingleTest = async (testCase: any) => {
    setRunningTest(testCase.id);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rfpContent: testCase.content,
          profile 
        })
      });
      const data = await response.json();
      
      // Compare with expected
      const passed = 
        data.score >= testCase.expectedScore.min && 
        data.score <= testCase.expectedScore.max;
      
      const failures: string[] = [];
      if (!passed) {
        failures.push(`Score ${data.score}% outside expected range ${testCase.expectedScore.min}-${testCase.expectedScore.max}%`);
      }
      
      if (testCase.expectedGeographic !== undefined && data.breakdown?.geographic !== testCase.expectedGeographic) {
        failures.push(`Geographic score ${data.breakdown?.geographic}% != expected ${testCase.expectedGeographic}%`);
      }
      
      alert(`
Test: ${testCase.name}
Expected Score: ${testCase.expectedScore.min}-${testCase.expectedScore.max}%
Actual Score: ${data.score}%
Decision: ${data.decision}
Geographic: ${data.breakdown?.geographic}%
Services: ${data.breakdown?.services}%
Insurance: ${data.breakdown?.insurance}%
Certifications: ${data.breakdown?.certifications}%
Status: ${passed && failures.length === 0 ? '✅ PASSED' : '❌ FAILED'}
${failures.join('\n')}
${testCase.notes || ''}
      `);
    } catch (error) {
      console.error('Test error:', error);
      alert('Error running test. Check console for details.');
    }
    setRunningTest(null);
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">RFP Analysis Test Harness</h1>
      
      {/* Profile Status */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">HydroJet Pros Test Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Company:</span> {profile.basics.companyName || 'Not Set'}
          </div>
          <div>
            <span className="font-medium">Location:</span> {profile.basics.city}, {profile.basics.state}
          </div>
          <div>
            <span className="font-medium">Profile Completeness:</span> {Math.round(completeness.overall)}%
          </div>
          <div>
            <span className="font-medium">Service Radius:</span> {profile.operational.serviceRadius || 0} miles
          </div>
          <div className="col-span-2">
            <span className="font-medium">Insurance:</span> GL ${(profile.insurance.generalLiability?.amount || 0).toLocaleString()}, 
            WC {profile.insurance.workersComp?.hasIt ? 'Yes' : 'No'}, 
            Auto ${(profile.insurance.commercialAuto?.amount || 0).toLocaleString()}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Equipment:</span> {profile.equipment.maxPSI || 0} PSI @ {profile.equipment.maxGPM || 0} GPM
          </div>
        </div>
        
        {(!profile.basics.companyName || profile.basics.companyName !== 'HydroJet Pros') && (
          <Alert className="mt-4 border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Profile Not Set to HydroJet Pros</p>
              <p className="text-sm">Tests are designed for HydroJet Pros data. Results may be inaccurate.</p>
            </div>
          </Alert>
        )}
        
        <div className="mt-4 flex gap-4">
          <Button onClick={runAllTests} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </Card>
      
      {/* Individual Test Cases */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">California RFP Test Cases</h2>
        <div className="space-y-2">
          {realCaliforniaRFPs.map(test => (
            <div key={test.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex-1">
                <p className="font-medium">{test.name}</p>
                <p className="text-sm text-gray-600">
                  {test.location.city} ({test.location.distance} mi) • 
                  Expected: {test.expectedScore.min}-{test.expectedScore.max}% • 
                  Decision: {test.expectedDecision}
                </p>
                {test.notes && (
                  <p className="text-xs text-gray-500 mt-1">{test.notes}</p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runSingleTest(test)}
                disabled={loading || runningTest === test.id}
              >
                {runningTest === test.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Test
              </Button>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Distance Bug Specific Tests */}
      <Card className="p-6 mb-8 border-red-500">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Distance Bug Tests</h2>
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div>
            <p className="font-medium">Testing Monterey Park Distance Bug</p>
            <p className="text-sm">These tests specifically check the Monterey Park distance calculation bug where 
            15 miles was scoring as "outside service area" when it should be 100% in range.</p>
          </div>
        </Alert>
        {distanceBugTests.map(test => (
          <div key={test.id} className="flex items-center justify-between p-3 border border-red-200 rounded mb-2 bg-red-50">
            <div className="flex-1">
              <p className="font-medium">{test.name}</p>
              <p className="text-sm text-red-600">{test.notes}</p>
              <p className="text-xs text-gray-600 mt-1">
                Expected Geographic Score: {test.expectedGeographic}%
              </p>
            </div>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => runSingleTest(test)}
              disabled={loading || runningTest === test.id}
            >
              {runningTest === test.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test Bug'
              )}
            </Button>
          </div>
        ))}
      </Card>
      
      {/* Results Display */}
      {results && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-3xl font-bold">{results.summary?.total || 0}</p>
              <p className="text-sm text-gray-600">Total Tests</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-3xl font-bold text-green-600">{results.summary?.passed || 0}</p>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-3xl font-bold text-red-600">{results.summary?.failed || 0}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-3xl font-bold text-blue-600">{results.summary?.passRate || '0%'}</p>
              <p className="text-sm text-gray-600">Pass Rate</p>
            </div>
          </div>
          
          {results.failedTests?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Failed Tests:
              </h3>
              {results.failedTests.map((test: TestResult) => (
                <div key={test.testId} className="p-4 bg-red-50 rounded mb-2 border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{test.testName}</p>
                    <span className="text-sm text-red-600">
                      Score: {test.score}% (Expected: {test.expectedScore.min}-{test.expectedScore.max}%)
                    </span>
                  </div>
                  {test.failures.map((failure: string, i: number) => (
                    <p key={i} className="text-sm text-red-600 ml-4">• {failure}</p>
                  ))}
                  {test.breakdown && (
                    <div className="mt-2 text-sm text-gray-600 ml-4">
                      Breakdown: Geographic {test.breakdown.geographic}%, 
                      Services {test.breakdown.services}%, 
                      Insurance {test.breakdown.insurance}%, 
                      Certifications {test.breakdown.certifications}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {results.testResults?.filter(t => t.passed).length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Passed Tests:
              </h3>
              <div className="grid gap-2">
                {results.testResults.filter(t => t.passed).map((test: TestResult) => (
                  <div key={test.testId} className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-green-800">{test.testName}</p>
                      <span className="text-sm text-green-600">
                        Score: {test.score}% ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, FileText, Building, MapPin, DollarSign, Calendar, Shield, Wrench } from 'lucide-react';
import { analyzeRFP } from '@/app/actions';
import { motion } from 'framer-motion';

const testRFPs = [
  {
    id: 'perfect',
    name: 'PERFECT FIT',
    expectedScore: '90-100%',
    color: 'bg-green-500',
    content: `City of Glendale Pressure Washing Services
Location: Glendale Civic Center, 613 E Broadway, Glendale, CA
Requirements:
- General Liability: $1M minimum
- Service radius: Within 20 miles
- Hot water pressure washing capability
- Monthly service schedule
- EPA compliant operations
Services: Building exterior, sidewalks, parking structure
Budget: $5,000/month
Contact: facilities@glendale.gov
Deadline: 30 days from posting`,
  },
  {
    id: 'partial',
    name: 'PARTIAL FIT',
    expectedScore: '50-70%',
    color: 'bg-yellow-500',
    content: `Los Angeles Airport Facility Cleaning
Location: LAX Airport, Los Angeles, CA  
Requirements:
- General Liability: $5M minimum
- Specialized runway cleaning equipment
- 24/7 emergency response
- Prevailing wage certified
- Airport security clearance
Services: Terminal exterior, runway marks removal
Budget: $25,000/month
Contact: procurement@lawa.org
Special Requirements: TSA background checks required`,
  },
  {
    id: 'poor',
    name: 'POOR FIT',
    expectedScore: '<30%',
    color: 'bg-red-500',
    content: `San Francisco Bridge Maintenance
Location: Golden Gate Bridge, San Francisco, CA
Requirements:
- General Liability: $10M minimum
- Specialized bridge equipment
- Working at heights certification
- Marine equipment for under-bridge
- Union labor required
Services: Bridge cable cleaning, tower maintenance
Budget: $100,000/month
Contact: maintenance@goldengate.org
Special Requirements: Coast Guard certification for marine operations`,
  },
];

interface AnalysisResult {
  decision: 'GO' | 'NO GO' | 'MAYBE';
  confidence: number;
  reasons: string[];
  improvements?: string[];
  missingRequirements?: string[];
  scoreBreakdown?: {
    geographic: number;
    insurance: number;
    services: number;
    certifications: number;
  };
}

export default function TestPage() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AnalysisResult>>({});
  const [loading, setLoading] = useState(false);

  const runTest = async (rfp: typeof testRFPs[0]) => {
    setLoading(true);
    setActiveTest(rfp.id);
    
    try {
      const result = await analyzeRFP(rfp.content);
      setResults(prev => ({
        ...prev,
        [rfp.id]: result as AnalysisResult,
      }));
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'GO':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'NO GO':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">RFP Accuracy Testing</h1>
        <p className="text-gray-600">Test the accuracy system with pre-loaded RFP examples</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {testRFPs.map((rfp, index) => (
          <motion.div
            key={rfp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${rfp.color} text-white`}>
                    {rfp.name}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Expected: {rfp.expectedScore}
                  </span>
                </div>
                <CardTitle className="text-lg">
                  {rfp.content.split('\n')[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {rfp.content.match(/Location: (.+)/)?.[1]}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    {rfp.content.match(/Budget: (.+)/)?.[1]}
                  </div>
                </div>

                <Button
                  onClick={() => runTest(rfp)}
                  disabled={loading && activeTest === rfp.id}
                  className="w-full"
                >
                  {loading && activeTest === rfp.id ? 'Analyzing...' : 'Run Test'}
                </Button>

                {results[rfp.id] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getDecisionIcon(results[rfp.id].decision)}
                        <span className="font-semibold">{results[rfp.id].decision}</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(results[rfp.id].confidence)}`}>
                        {results[rfp.id].confidence}%
                      </span>
                    </div>

                    {results[rfp.id].scoreBreakdown && (
                      <div className="space-y-2 mb-3">
                        <div className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Geographic</span>
                            <span>{results[rfp.id].scoreBreakdown!.geographic}%</span>
                          </div>
                          <Progress value={results[rfp.id].scoreBreakdown!.geographic} className="h-2" />
                        </div>
                        <div className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Insurance</span>
                            <span>{results[rfp.id].scoreBreakdown!.insurance}%</span>
                          </div>
                          <Progress value={results[rfp.id].scoreBreakdown!.insurance} className="h-2" />
                        </div>
                        <div className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Services</span>
                            <span>{results[rfp.id].scoreBreakdown!.services}%</span>
                          </div>
                          <Progress value={results[rfp.id].scoreBreakdown!.services} className="h-2" />
                        </div>
                        <div className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Certifications</span>
                            <span>{results[rfp.id].scoreBreakdown!.certifications}%</span>
                          </div>
                          <Progress value={results[rfp.id].scoreBreakdown!.certifications} className="h-2" />
                        </div>
                      </div>
                    )}

                    {results[rfp.id].missingRequirements && results[rfp.id].missingRequirements!.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Missing Requirements:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {results[rfp.id].missingRequirements!.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Methodology</CardTitle>
          <CardDescription>How we calculate accuracy scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Geographic Match</h3>
              <p className="text-2xl font-bold text-blue-600">25%</p>
              <p className="text-sm text-gray-600">Location & service radius</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">Insurance Match</h3>
              <p className="text-2xl font-bold text-green-600">25%</p>
              <p className="text-sm text-gray-600">Coverage requirements</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Wrench className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Services Match</h3>
              <p className="text-2xl font-bold text-purple-600">25%</p>
              <p className="text-sm text-gray-600">Capabilities & equipment</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold">Certifications</h3>
              <p className="text-2xl font-bold text-orange-600">25%</p>
              <p className="text-sm text-gray-600">Required credentials</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
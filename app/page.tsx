'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/lib/stores/profileStore';
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness';
import { AnalysisResult } from '@/components/AnalysisResult';
import { DemoMode } from '@/components/DemoMode';
import { analyzeRFP } from '@/app/actions';
// import { GapDetectionModal } from '@/components/profile/GapDetectionModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface AnalysisResultData {
  decision: 'HIGH_CONFIDENCE_GO' | 'MEDIUM_CONFIDENCE_GO' | 'LOW_CONFIDENCE_GO' | 'NO_GO';
  score: number;
  breakdown: {
    geographic: number;
    insurance: number;
    services: number;
    certifications: number;
  };
  missingRequirements: string[];
  fillableGaps: string[];
  analysis: string;
  proposal?: string;
  requirements: {
    met: string[];
    unmet: string[];
  };
}

interface ProposalData {
  coverLetter: string;
  executiveSummary: string;
  technicalApproach: string;
  pricing: string;
  whyChooseUs: string;
}

export default function Home() {
  const router = useRouter();
  const [rfpText, setRfpText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [error, setError] = useState('');
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showGapModal, setShowGapModal] = useState(false);
  const [gapData, setGapData] = useState<any>(null);

  const profile = useProfileStore(state => state.profile);
  const getCompleteness = useProfileStore(state => state.getCompleteness);
  const isHydrated = useProfileStore(state => state.isHydrated);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isHydrated && (!profile?.basics?.companyName || getCompleteness().overall < 30)) {
      setShowOnboardingPrompt(true);
    }
  }, [profile, getCompleteness, mounted, isHydrated]);

  const sampleRfp = `REQUEST FOR PROPOSAL
City of Glendale - Municipal Building Pressure Washing Services

PROJECT OVERVIEW:
The City of Glendale seeks qualified contractors for comprehensive pressure washing services for multiple municipal buildings and parking structures. This contract includes quarterly cleaning of building exteriors, monthly parking garage maintenance, and on-call emergency cleaning services.

SCOPE OF WORK:
- Pressure wash building exteriors (5 buildings, approx. 50,000 sq ft total)
- Clean and maintain 3 parking structures (800 spaces total)
- Remove graffiti within 24 hours of notification
- Clean sidewalks and entryways weekly
- Provide emergency cleaning services as needed

REQUIREMENTS:
- Minimum $2 million general liability insurance
- Workers compensation insurance required
- Valid California contractor's license
- EPA compliant cleaning practices
- Minimum 3,500 PSI hot water equipment
- Water recovery and filtration capabilities
- Must be located within 25 miles of Glendale, CA 91203

OPERATIONAL REQUIREMENTS:
- Available for night and weekend work
- 24/7 emergency response within 4 hours
- Minimum 5 years experience
- At least 10 employees

CERTIFICATIONS:
- Business license in City of Glendale
- OSHA 10-hour certification for all workers
- EPA certification for water discharge

CONTRACT DETAILS:
- Duration: 3 years with two 1-year options
- Estimated value: $500,000 - $750,000 annually
- Payment terms: Net 30

SUBMISSION DEADLINE: 30 days from publication`;

  const analyzeRfp = async () => {
    if (!rfpText.trim()) {
      setError('Please enter RFP text to analyze');
      return;
    }

    const completeness = getCompleteness();
    if (completeness.overall < 30) {
      setShowOnboardingPrompt(true);
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);
    setProposalData(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rfpText,
          profile // Include the profile in the request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      
      // Check if there are fillable gaps and show modal
      if (data.fillableGaps && data.fillableGaps.length > 0) {
        setGapData({
          gaps: data.fillableGaps,
          currentScore: data.score,
          potentialScore: Math.min(data.score + (data.fillableGaps.length * 5), 100)
        });
        setShowGapModal(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleRfp = () => {
    setRfpText(sampleRfp);
    setResult(null);
    setError('');
    setProposalData(null);
  };

  const generateProposal = async () => {
    if (!result || !result.decision.includes('GO')) return;

    setIsGeneratingProposal(true);
    setError('');

    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfpText, analysisResult: result }),
      });

      if (!response.ok) {
        throw new Error('Proposal generation failed');
      }

      const data = await response.json();
      setProposalData(data);
    } catch (err) {
      setError('An error occurred during proposal generation. Please try again.');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const copyProposal = async () => {
    if (!proposalData) return;

    const proposalText = `PROPOSAL

COVER LETTER
${proposalData.coverLetter}

EXECUTIVE SUMMARY
${proposalData.executiveSummary}

TECHNICAL APPROACH
${proposalData.technicalApproach}

PRICING
${proposalData.pricing}

WHY CHOOSE US
${proposalData.whyChooseUs}`;

    try {
      await navigator.clipboard.writeText(proposalText);
      toast.success('Proposal copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy proposal');
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      handler: () => {
        const textarea = document.getElementById('rfp-input') as HTMLTextAreaElement;
        textarea?.focus();
      },
      description: 'Focus RFP input',
    },
    {
      key: 'Enter',
      metaKey: true,
      ctrlKey: true,
      handler: () => {
        if (rfpText.trim() && !isAnalyzing) {
          analyzeRfp();
        }
      },
      description: 'Analyze RFP',
    },
  ]);

  const downloadProposal = () => {
    if (!proposalData) return;

    const proposalText = `PROPOSAL

COVER LETTER
${proposalData.coverLetter}

EXECUTIVE SUMMARY
${proposalData.executiveSummary}

TECHNICAL APPROACH
${proposalData.technicalApproach}

PRICING
${proposalData.pricing}

WHY CHOOSE US
${proposalData.whyChooseUs}`;

    const blob = new Blob([proposalText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proposal.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Demo Mode Banner */}
      <AnimatePresence>
        {mounted && <DemoMode className="fixed top-0 left-0 right-0 z-40" />}
      </AnimatePresence>
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 mt-16"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-black">RFP Hunter AI</h1>
              <p className="text-gray-500 mt-2">AI-Powered RFP Analysis with Profile Matching</p>
            </div>
            
            {/* Profile Completeness Indicator */}
            {mounted && (
              <div className="flex items-center gap-4">
                <ProfileCompleteness size="sm" />
                <button
                  onClick={() => router.push('/profile')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {getCompleteness().overall < 50 ? 'Complete Profile' : 'Edit Profile'}
                </button>
              </div>
            )}
          </div>
          
          {/* Low completeness warning */}
          {mounted && getCompleteness().overall < 50 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Profile {Math.round(getCompleteness().overall)}% complete.</span>
                {' '}Complete your profile to get accurate RFP matching and scoring.
              </p>
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <div>
              <label htmlFor="rfp-input" className="block text-sm font-medium text-gray-700 mb-2">
                RFP Text
              </label>
              <textarea
                id="rfp-input"
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                placeholder="Paste your RFP text here..."
                className="w-full h-96 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={analyzeRfp}
                disabled={isAnalyzing || !rfpText.trim()}
                className="flex-1 bg-[#10b981] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#0ea471] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze RFP'}
              </button>
              <button
                onClick={loadSampleRfp}
                className="px-6 py-3 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Try Sample RFP
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            {result ? (
              <AnalysisResult 
                result={result} 
                onGenerateProposal={generateProposal}
                isGeneratingProposal={isGeneratingProposal}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Analysis results will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Proposal Section */}
        <AnimatePresence>
          {proposalData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 space-y-6"
            >
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Generated Proposal</h2>
                <div className="flex gap-4">
                  <button
                    onClick={copyProposal}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={downloadProposal}
                    className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#0ea471] transition-all duration-200"
                  >
                    Download Proposal
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Cover Letter */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Cover Letter</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{proposalData.coverLetter}</p>
              </div>

              {/* Executive Summary */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{proposalData.executiveSummary}</p>
              </div>

              {/* Technical Approach */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Technical Approach</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{proposalData.technicalApproach}</p>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{proposalData.pricing}</p>
              </div>

              {/* Why Choose Us */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Why Choose Us</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{proposalData.whyChooseUs}</p>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Gap Detection Modal - TODO: Integrate properly */}
      {/* {showGapModal && gapData && (
        <GapDetectionModal
          isOpen={showGapModal}
          onClose={() => setShowGapModal(false)}
          missingField={null}
          onUpdate={async (section, field, value) => {
            // Re-analyze after updating profile
            await analyzeRfp();
          }}
        />
      )} */}

      {/* Onboarding Prompt Modal */}
      {showOnboardingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-3">Complete Your Profile for Accurate Analysis</h3>
            <p className="text-gray-600 mb-6">
              To provide accurate RFP matching and scoring, we need information about your company's capabilities, 
              insurance coverage, and certifications. This takes just 5 minutes and dramatically improves accuracy.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/profile')}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Set Up Profile
              </button>
              <button
                onClick={() => setShowOnboardingPrompt(false)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Skip for Now
              </button>
            </div>
            {getCompleteness().overall < 30 && (
              <p className="text-xs text-gray-500 mt-3">
                Note: Analysis accuracy will be limited without a complete profile.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
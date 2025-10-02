'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ScoreBreakdown {
  geographic: number;
  insurance: number;
  services: number;
  certifications: number;
}

interface AnalysisResultData {
  decision: 'HIGH_CONFIDENCE_GO' | 'MEDIUM_CONFIDENCE_GO' | 'LOW_CONFIDENCE_GO' | 'NO_GO';
  score: number;
  breakdown: ScoreBreakdown;
  missingRequirements: string[];
  fillableGaps: string[];
  analysis: string;
  proposal?: string;
  requirements: {
    met: string[];
    unmet: string[];
  };
}

interface AnalysisResultProps {
  result: AnalysisResultData;
  onGenerateProposal?: () => void;
  isGeneratingProposal?: boolean;
}

export function AnalysisResult({ result, onGenerateProposal, isGeneratingProposal }: AnalysisResultProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showMissingReqs, setShowMissingReqs] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const router = useRouter();

  const getDecisionColor = (decision: string) => {
    if (decision.includes('HIGH')) return 'bg-green-500';
    if (decision.includes('MEDIUM')) return 'bg-yellow-500';
    if (decision.includes('LOW')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDecisionText = (decision: string) => {
    if (decision.includes('HIGH')) return 'HIGH CONFIDENCE';
    if (decision.includes('MEDIUM')) return 'MEDIUM CONFIDENCE';
    if (decision.includes('LOW')) return 'LOW CONFIDENCE';
    return 'NO GO';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const copyAnalysis = async () => {
    const analysisText = `
RFP Analysis Results
Match Score: ${result.score}%
Decision: ${getDecisionText(result.decision)}

${result.analysis}

Score Breakdown:
- Geographic Match: ${result.breakdown.geographic}%
- Insurance Match: ${result.breakdown.insurance}%
- Services Match: ${result.breakdown.services}%
- Certifications Match: ${result.breakdown.certifications}%

${result.missingRequirements.length > 0 ? `Missing Requirements:\n${result.missingRequirements.map(r => `• ${r}`).join('\n')}` : ''}
`.trim();

    try {
      await navigator.clipboard.writeText(analysisText);
      setCopiedAnalysis(true);
      setTimeout(() => setCopiedAnalysis(false), 2000);
    } catch (err) {
      console.error('Failed to copy analysis:', err);
    }
  };

  const handleImproveScore = () => {
    // Navigate to profile page with specific section to improve
    const lowestScore = Object.entries(result.breakdown).reduce((lowest, [key, value]) => 
      value < lowest.value ? { key, value } : lowest
    , { key: 'geographic', value: 100 });
    
    router.push(`/profile?section=${lowestScore.key}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Decision Badge and Score */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                'px-4 py-2 rounded-full text-white font-medium text-sm',
                getDecisionColor(result.decision)
              )}
            >
              {getDecisionText(result.decision)}
            </span>
            <span className="text-sm text-gray-500">
              {result.decision.includes('GO') ? 'Proceed with proposal' : 'Do not proceed'}
            </span>
          </div>
        </div>
        
        {/* Circular Progress Score */}
        <div className="relative h-24 w-24">
          <svg
            className="h-24 w-24 transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200"
            />
            
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - result.score / 100)}`}
              strokeLinecap="round"
              className={cn(getScoreColor(result.score), 'transition-all duration-500 ease-out')}
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className={cn('text-2xl font-bold', getScoreColor(result.score))}>
                {result.score}%
              </span>
              <p className="text-xs text-gray-500">Match</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-semibold">Score Breakdown</h3>
          <span className="text-gray-400">
            {showBreakdown ? '−' : '+'}
          </span>
        </button>
        
        {showBreakdown && (
          <div className="mt-4 space-y-3">
            {Object.entries(result.breakdown).map(([category, score]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="capitalize text-sm text-gray-600">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        score >= 90 ? 'bg-green-500' :
                        score >= 70 ? 'bg-yellow-500' :
                        score >= 50 ? 'bg-orange-500' :
                        'bg-red-500'
                      )}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Summary */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold mb-3">Analysis Summary</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.analysis}</p>
      </div>

      {/* Missing Requirements */}
      {result.missingRequirements.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => setShowMissingReqs(!showMissingReqs)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold">
              Missing Requirements ({result.missingRequirements.length})
            </h3>
            <span className="text-gray-400">
              {showMissingReqs ? '−' : '+'}
            </span>
          </button>
          
          {showMissingReqs && (
            <div className="mt-4 space-y-2">
              {result.missingRequirements.map((req, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-700 text-sm">{req}</span>
                  {result.fillableGaps.some(gap => gap.includes(req.split(':')[0])) && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Easily fillable
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Met Requirements */}
      {result.requirements.met.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold mb-3">Met Requirements</h3>
          <div className="space-y-2">
            {result.requirements.met.map((req, index) => (
              <div key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700 text-sm">{req}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-3">
        {result.decision.includes('GO') && onGenerateProposal && (
          <button
            onClick={onGenerateProposal}
            disabled={isGeneratingProposal}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isGeneratingProposal ? 'Generating...' : 'Generate Proposal'}
          </button>
        )}
        
        <button
          onClick={copyAnalysis}
          className="px-6 py-3 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
        >
          {copiedAnalysis ? 'Copied!' : 'Copy Analysis'}
        </button>
        
        {result.score < 90 && (
          <button
            onClick={handleImproveScore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
          >
            Improve Score
          </button>
        )}
      </div>

      {/* Proposal Section */}
      {result.proposal && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold mb-3">Generated Proposal Introduction</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.proposal}</p>
          </div>
        </div>
      )}
    </div>
  );
}
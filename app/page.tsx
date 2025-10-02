'use client';

import { useState } from 'react';

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

interface ProposalData {
  coverLetter: string;
  executiveSummary: string;
  technicalApproach: string;
  pricing: string;
  whyChooseUs: string;
}

export default function Home() {
  const [rfpText, setRfpText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  const sampleRfp = `REQUEST FOR PROPOSAL
Federal Infrastructure Modernization Project

PROJECT OVERVIEW:
The Department of Transportation seeks qualified vendors to modernize legacy infrastructure management systems. This includes migrating from on-premises solutions to cloud-based platforms, implementing real-time monitoring capabilities, and ensuring compliance with federal security standards.

SCOPE OF WORK:
- System architecture design and implementation
- Data migration from legacy databases
- Integration with existing federal systems
- Security compliance (FedRAMP, FISMA)
- Training for government personnel
- 24/7 support and maintenance

REQUIREMENTS:
- Minimum 10 years experience with government contracts
- Active security clearance (Secret or above)
- Demonstrated expertise in cloud migrations
- ISO 27001 certification
- Past performance on similar federal projects

TIMELINE: 18 months from contract award
BUDGET: $15-20 million

SUBMISSION DEADLINE: 30 days from publication`;

  const analyzeRfp = async () => {
    if (!rfpText.trim()) {
      setError('Please enter RFP text to analyze');
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
        body: JSON.stringify({ rfpText }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('An error occurred during analysis. Please try again.');
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
    if (!result || result.decision !== 'GO') return;

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
      // Show success feedback (you could add a toast here)
      alert('Proposal copied to clipboard!');
    } catch (err) {
      alert('Failed to copy proposal');
    }
  };

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
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-semibold text-black">RFP Hunter AI</h1>
          <p className="text-gray-500 mt-2">AI-Powered RFP Analysis</p>
        </div>
      </header>

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
              <p className="text-gray-500 text-sm">{error}</p>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            {result ? (
              <div className="space-y-6">
                {/* Decision Badge */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Analysis Results</h2>
                  <span
                    className={`px-4 py-2 rounded-full text-white font-medium ${
                      result.decision === 'GO' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                    }`}
                  >
                    {result.decision}
                  </span>
                </div>

                {/* Score */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-gray-500 text-sm mb-1">Match Score</p>
                  <p className="text-3xl font-semibold">{result.score}%</p>
                </div>

                {/* Requirements */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold mb-4">Requirements Analysis</h3>
                  
                  {result.requirements.met.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Met Requirements</p>
                      <ul className="space-y-2">
                        {result.requirements.met.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">✓</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {result.requirements.unmet.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Unmet Requirements</p>
                    <ul className="space-y-2">
                      {result.requirements.unmet.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">✗</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Reasoning */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold mb-2">Analysis Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Next Steps */}
                {result.nextSteps && result.nextSteps.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold mb-2">Next Steps</h3>
                    <ul className="space-y-2">
                      {result.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Generate Proposal Button */}
                {result.decision === 'GO' && (
                  <div className="border-t border-gray-200 pt-6">
                    <button
                      onClick={generateProposal}
                      disabled={isGeneratingProposal}
                      className="w-full bg-[#10b981] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#0ea471] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isGeneratingProposal ? 'Generating...' : 'Generate Proposal'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Analysis results will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Proposal Section */}
        {proposalData && (
          <div className="mt-8 space-y-6">
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
          </div>
        )}
      </main>
    </div>
  );
}

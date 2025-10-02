"use client";

import { useState } from "react";

export default function RfpHunterPage() {
  const [rfpText, setRfpText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);

  function handleAnalyze() {
    if (!rfpText.trim()) {
      setResultText("Please paste an RFP to analyze.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const wordCount = rfpText.trim().split(/\s+/).filter(Boolean).length;
      const characterCount = rfpText.length;
      setResultText(
        `Analysis complete.\n\nSummary\n- Words: ${wordCount}\n- Characters: ${characterCount}\n\nThis is a placeholder. Hook this up to your analyzer backend to see real insights.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            RFP Hunter
          </h1>
          <p className="text-gray-600 mt-2">
            Paste an RFP on the left, then analyze and view results on the
            right.
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <section className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold">RFP Input</h2>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <label htmlFor="rfpText" className="sr-only">
                RFP Text
              </label>
              <textarea
                id="rfpText"
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                placeholder="Paste the RFP text here..."
                className="w-full h-72 md:h-[28rem] min-h-[18rem] resize-y rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {rfpText.length.toLocaleString()} characters
                </span>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            </div>
          </section>

          <section className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold">Results</h2>
            </div>
            <div className="p-4">
              {resultText ? (
                <div className="whitespace-pre-wrap text-sm text-gray-800">
                  {resultText}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No analysis yet. Paste your RFP and click{" "}
                  <span className="font-medium text-gray-700">Analyze</span> to
                  see insights here.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

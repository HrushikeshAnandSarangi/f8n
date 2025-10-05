"use client";
import React, { useState } from "react";

interface Recommendation {
  symbol: string;
  score: number;
  description: string;
}

const StockRecommender: React.FC = () => {
  const [stockInput, setStockInput] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputSymbol = stockInput.trim().toUpperCase();

    if (!inputSymbol) {
      setError("Please enter a stock symbol");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
          `http://127.0.0.1:8000/recommendations/recommendations/?top_n=3&alpha=0.7`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ticker: inputSymbol }),
          }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      const formattedRecs = (data.recommendations || []).map((rec: any) => ({
        symbol: rec.ticker,
        score: rec.similarity_score,
        description: rec.description,
      }));

      setRecommendations(formattedRecs);
    } catch (err) {
      setError(
          err instanceof Error ? err.message : "Failed to fetch recommendations"
      );
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };


  return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden md:max-w-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-violet-400 mb-2">
                Stock Recommendation Engine
              </h1>
              <p className="text-sm text-gray-300">
                Find similar stocks based on market behavior
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    placeholder="Enter stock symbol (e.g., AAPL)"
                    className="flex-grow px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium text-white ${
                        loading
                            ? "bg-violet-400 cursor-not-allowed"
                            : "bg-violet-600 hover:bg-violet-700 active:bg-violet-800"
                    } transition-colors duration-200`}
                >
                  {loading ? (
                      <span className="flex items-center justify-center">
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                      <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                      ></circle>
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Searching...
                  </span>
                  ) : (
                      "Get Recommendations"
                  )}
                </button>
              </div>
            </form>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                      >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-violet-300 mb-4">
                    Recommended Stocks
                  </h2>
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                        <div
                            key={index}
                            className="flex flex-col p-3 bg-gray-800 rounded-lg border border-gray-600 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-medium text-white">
                        {rec.symbol}
                      </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-200 text-violet-900">
                        {(rec.score * 100).toFixed(1)}% match
                      </span>
                          </div>
                          <p className="text-sm text-gray-300">{rec.description}</p>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {recommendations.length === 0 && !loading && !error && (
                <div className="text-center py-10 text-gray-400">
                  <svg
                      className="mx-auto h-12 w-12 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-white">
                    No recommendations yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Enter a stock symbol to get recommendations
                  </p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default StockRecommender;
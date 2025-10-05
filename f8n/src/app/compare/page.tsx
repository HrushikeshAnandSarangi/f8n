"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartJSTooltip, Legend } from 'chart.js';
import { Bar as ChartBar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartJSTooltip,
    Legend
);

// --- Interfaces ---
interface StockMetrics {
    forwardPE: number;
    trailingPE: number;
    dividendYield: number;
    beta: number;
    marketCap: number;
}

interface ComparisonResult {
    stock1: string;
    stock2: string;
    metrics: {
        [key: string]: StockMetrics;
    };
    better_stock: string;
    reasoning: string;
}

// --- TradingView Widget Component ---
const TradingViewWidget: React.FC<{ symbol: string; exchange: string }> = ({ symbol, exchange }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current || !symbol || !exchange) return;

        // Clear the container before appending a new script
        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        
        // Construct the configuration for the widget
        const widgetConfig = {
            "height": "650",
            "autosize": true,
            "symbol": `${exchange}:${symbol.replace('.NS', '')}`, // Remove .NS suffix for TradingView
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "light",
            "style": "0",
            "locale": "en",
            "allow_symbol_change": true,
            "support_host": "https://www.tradingview.com"
        };
        
        script.innerHTML = JSON.stringify(widgetConfig);
        containerRef.current.appendChild(script);

    }, [symbol, exchange]); // Rerun effect when symbol or exchange changes

    return (
        <div className="tradingview-widget-container w-full" ref={containerRef} style={{ height: "650px" }}>
            <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
        </div>
    );
};


// --- Main Comparison Page Component ---
export default function ComparisonPage() {
    const [comparisonStock1, setComparisonStock1] = useState('');
    const [comparisonStock2, setComparisonStock2] = useState('');
    const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
    const [comparisonError, setComparisonError] = useState('');
    const [isComparing, setIsComparing] = useState(false);
    const [activeChart, setActiveChart] = useState<string | null>(null);

    const compareStocks = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comparisonStock1.trim() || !comparisonStock2.trim()) {
            setComparisonError('Please enter both stock symbols');
            return;
        }

        setIsComparing(true);
        setComparisonError('');
        setComparisonData(null); // Reset previous data
        setActiveChart(null); // Reset active chart

        try {
            // NOTE: Replace with your actual API endpoint
            const response = await axios.post('http://127.0.0.1:8000/compare/compare/', {
                stock1: comparisonStock1,
                stock2: comparisonStock2
            });

            setComparisonData(response.data);
            // Set the first stock's chart as active by default
            setActiveChart(response.data.stock1);
        } catch (err) {
            setComparisonError('Error comparing stocks. Please check the symbols and try again.');
            console.error('API Error:', err);
        } finally {
            setIsComparing(false);
        }
    };
    
    // --- Helper functions for charts and formatting ---

    const getExchangeForSymbol = (symbol: string): string => {
        if (symbol.endsWith('.NS')) {
            return 'NSE';
        }
        // Default to NASDAQ for US stocks or others without a specific suffix
        // This can be expanded with more logic for other exchanges (e.g., .BO for BSE)
        return 'NASDAQ';
    };
    
    const getChartData = (metric: keyof StockMetrics) => {
        if (!comparisonData) return { labels: [], datasets: [] };

        return {
            labels: [comparisonData.stock1, comparisonData.stock2],
            datasets: [
                {
                    label: metric.replace(/([A-Z])/g, ' $1').trim(), // Add space before capital letters
                    data: [
                        comparisonData.metrics[comparisonData.stock1][metric],
                        comparisonData.metrics[comparisonData.stock2][metric]
                    ],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        };
    };

    const chartOptions = (title: string) => ({
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: title,
            },
        },
    });

    const formatMarketCap = (value: number) => {
        if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        return `${value}`;
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 sm:px-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock Comparison</h1>
                        <p className="text-gray-500 dark:text-gray-400">Compare any two stocks side by side with fundamental analysis and live charts.</p>

                        {/* Stock Comparator Section */}
                        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <form onSubmit={compareStocks} className="mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="stock1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            First Stock Symbol
                                        </label>
                                        <input
                                            id="stock1"
                                            type="text"
                                            value={comparisonStock1}
                                            onChange={(e) => setComparisonStock1(e.target.value.toUpperCase())}
                                            className="w-full p-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g. AAPL, GOOGL, RELIANCE.NS"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">For NSE use .NS suffix. For NYSE/NASDAQ no suffix needed.</p>
                                    </div>
                                    <div>
                                        <label htmlFor="stock2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Second Stock Symbol
                                        </label>
                                        <input
                                            id="stock2"
                                            type="text"
                                            value={comparisonStock2}
                                            onChange={(e) => setComparisonStock2(e.target.value.toUpperCase())}
                                            className="w-full p-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g. MSFT, AMZN, TCS.NS"
                                        />
                                         <p className="text-xs text-gray-500 mt-1">For NSE use .NS suffix. For NYSE/NASDAQ no suffix needed.</p>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isComparing}
                                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {isComparing ? 'Comparing...' : 'Compare Stocks'}
                                </button>
                            </form>

                            {comparisonError && (
                                <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    <p>{comparisonError}</p>
                                </div>
                            )}

                            {isComparing && <div className="text-center p-4">Loading analysis...</div>}

                            {comparisonData && (
                                <div className="mt-6 space-y-8">
                                    {/* --- Analysis Section --- */}
                                    <div>
                                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comparison Analysis</h2>
                                       {/* Comparison Result */}
                                       <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <p className="font-semibold dark:text-white">
                                                Better Stock: <span className="font-bold text-lg text-blue-700 dark:text-blue-400">{comparisonData.better_stock}</span>
                                            </p>
                                            <p className="mt-2 text-gray-700 dark:text-gray-300">{comparisonData.reasoning}</p>
                                        </div>

                                        {/* Key Metrics Charts */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                                                <div className="h-64">
                                                    <ChartBar
                                                        data={getChartData('forwardPE')}
                                                        options={chartOptions('Forward P/E Ratio Comparison')}
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                                                <div className="h-64">
                                                    <ChartBar
                                                        data={getChartData('trailingPE')}
                                                        options={chartOptions('Trailing P/E Ratio Comparison')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Metrics Table */}
                                        <div className="overflow-x-auto mt-6">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Metric</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{comparisonData.stock1}</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{comparisonData.stock2}</th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                                {Object.keys(comparisonData.metrics[comparisonData.stock1]).map((metric) => (
                                                    <tr key={metric}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{metric.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {metric === 'marketCap' ? formatMarketCap(comparisonData.metrics[comparisonData.stock1][metric as keyof StockMetrics]) :
                                                             metric === 'dividendYield' ? `${(comparisonData.metrics[comparisonData.stock1][metric as keyof StockMetrics] * 100).toFixed(2)}%` :
                                                             comparisonData.metrics[comparisonData.stock1][metric as keyof StockMetrics].toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                             {metric === 'marketCap' ? formatMarketCap(comparisonData.metrics[comparisonData.stock2][metric as keyof StockMetrics]) :
                                                              metric === 'dividendYield' ? `${(comparisonData.metrics[comparisonData.stock2][metric as keyof StockMetrics] * 100).toFixed(2)}%` :
                                                              comparisonData.metrics[comparisonData.stock2][metric as keyof StockMetrics].toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* --- Live Chart Section --- */}
                                    <div className="mt-8">
                                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Live Technical Charts</h2>
                                         <div className="flex border-b border-gray-200 dark:border-gray-700">
                                             <button
                                                 onClick={() => setActiveChart(comparisonData.stock1)}
                                                 className={`px-4 py-2 text-sm font-medium transition-colors ${activeChart === comparisonData.stock1 ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                             >
                                                 {comparisonData.stock1}
                                             </button>
                                             <button
                                                 onClick={() => setActiveChart(comparisonData.stock2)}
                                                 className={`px-4 py-2 text-sm font-medium transition-colors ${activeChart === comparisonData.stock2 ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                             >
                                                 {comparisonData.stock2}
                                             </button>
                                         </div>
                                         {activeChart && (
                                             <div className="mt-4">
                                                 <TradingViewWidget
                                                     key={activeChart} // Use key to force re-mount on change
                                                     symbol={activeChart}
                                                     exchange={getExchangeForSymbol(activeChart)}
                                                 />
                                             </div>
                                         )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

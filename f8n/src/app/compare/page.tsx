"use client";

import { useState } from 'react';
import axios from 'axios';
import { BarChart3, Menu, AlertCircle } from 'lucide-react';
import Link from "next/link";
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

export default function ComparisonPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [comparisonStock1, setComparisonStock1] = useState('');
    const [comparisonStock2, setComparisonStock2] = useState('');
    const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
    const [comparisonError, setComparisonError] = useState('');
    const [isComparing, setIsComparing] = useState(false);

    const compareStocks = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comparisonStock1.trim() || !comparisonStock2.trim()) {
            setComparisonError('Please enter both stock symbols');
            return;
        }

        setIsComparing(true);
        setComparisonError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/compare/compare/', {
                stock1: comparisonStock1,
                stock2: comparisonStock2
            });

            setComparisonData(response.data);
        } catch (err) {
            setComparisonError('Error comparing stocks. Please try again.');
            console.error('API Error:', err);
        } finally {
            setIsComparing(false);
        }
    };

    const getChartData = (metric: keyof StockMetrics) => {
        if (!comparisonData) return { labels: [], datasets: [] };

        return {
            labels: [comparisonData.stock1, comparisonData.stock2],
            datasets: [
                {
                    label: metric,
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
            <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900">
                <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-6">
                        <Link href="#" className="flex items-center gap-2 font-semibold">
                            <BarChart3 className="h-6 w-6" />
                            <span>Stock Comparison</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                            Sign In
                        </button>
                        <button
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white shadow hover:bg-blue-600/90 h-9 px-4 py-2"
                        >
                            Sign Up
                        </button>
                        <button
                            className="inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 lg:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 sm:px-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔍 Stock Comparison</h1>
                        <p className="text-gray-500 dark:text-gray-400">Compare any two stocks side by side</p>

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
                                        <p className="text-xs text-gray-500 mt-1">Enter stock symbol with suffix if needed (.NS for NSE, no suffix for NYSE/NASDAQ)</p>
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
                                        <p className="text-xs text-gray-500 mt-1">Enter stock symbol with suffix if needed (.NS for NSE, no suffix for NYSE/NASDAQ)</p>
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

                            {comparisonData && (
                                <div className="mt-6 space-y-6">
                                    {/* Comparison Result */}
                                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                        <p className="font-semibold dark:text-white">
                                            Better Stock: <span className="font-bold">{comparisonData.better_stock}</span>
                                        </p>
                                        <p className="mt-2 text-gray-700 dark:text-gray-300">{comparisonData.reasoning}</p>
                                    </div>

                                    {/* Key Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                                            <h3 className="font-semibold mb-2 dark:text-white">Forward P/E Ratio</h3>
                                            <div className="h-64">
                                                <ChartBar
                                                    data={getChartData('forwardPE')}
                                                    options={chartOptions('Forward P/E Ratio Comparison')}
                                                />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                                            <h3 className="font-semibold mb-2 dark:text-white">Trailing P/E Ratio</h3>
                                            <div className="h-64">
                                                <ChartBar
                                                    data={getChartData('trailingPE')}
                                                    options={chartOptions('Trailing P/E Ratio Comparison')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Metrics */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Metric</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{comparisonData.stock1}</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{comparisonData.stock2}</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Forward P/E</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {comparisonData.metrics[comparisonData.stock1].forwardPE.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {comparisonData.metrics[comparisonData.stock2].forwardPE.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Trailing P/E</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {comparisonData.metrics[comparisonData.stock1].trailingPE.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {comparisonData.metrics[comparisonData.stock2].trailingPE.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Dividend Yield</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {(comparisonData.metrics[comparisonData.stock1].dividendYield * 100).toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {(comparisonData.metrics[comparisonData.stock2].dividendYield * 100).toFixed(2)}%
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Beta</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {comparisonData.metrics[comparisonData.stock1].beta.toFixed(3)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {comparisonData.metrics[comparisonData.stock2].beta.toFixed(3)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Market Cap</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {formatMarketCap(comparisonData.metrics[comparisonData.stock1].marketCap)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {formatMarketCap(comparisonData.metrics[comparisonData.stock2].marketCap)}
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-gray-200 py-6 dark:border-gray-700">
                <div className="container px-4 sm:px-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-4">
                            <Link href="#" className="flex items-center gap-2 font-semibold">
                                <BarChart3 className="h-6 w-6" />
                                <span>Stock Comparison</span>
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                © {new Date().getFullYear()} Stock Comparison. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
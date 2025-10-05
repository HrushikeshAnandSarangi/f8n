"use client";

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ArrowDown, ArrowUp, BarChart3, ChevronDown, LineChart, Menu, Search, AlertCircle } from 'lucide-react';
import Link from "next/link";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const topGainers = [
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 890.34, change: 5.67 },
    { symbol: "META", name: "Meta Platforms", price: 485.12, change: 4.23 },
    { symbol: "AMD", name: "Advanced Micro Devices", price: 165.78, change: 3.89 }
];

const topLosers = [
    { symbol: "INTC", name: "Intel Corp.", price: 42.56, change: -3.45 },
    { symbol: "WMT", name: "Walmart Inc.", price: 60.34, change: -2.12 },
    { symbol: "DIS", name: "Walt Disney Co.", price: 110.45, change: -1.78 }
];

const mostTradedMTF = [
    { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 520.34, volume: "45.2M" },
    { symbol: "QQQ", name: "Invesco QQQ Trust", price: 440.56, volume: "32.1M" },
    { symbol: "IWM", name: "iShares Russell 2000 ETF", price: 205.23, volume: "28.7M" }
];

const popularETFs = [
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 480.45, aum: 400.5 },
    { symbol: "IVV", name: "iShares Core S&P 500 ETF", price: 485.67, aum: 350.2 },
    { symbol: "VTI", name: "Vanguard Total Stock Market ETF", price: 250.89, aum: 380.7 }
];

interface Stock {
    name: string;
    symbol: string;
    price: number;
    changesPercentage: number;
    change?: number;
    volume?: string;
}

interface StockAnalysis {
    ticker: string;
    latest_close: number;
    daily_return: number;
    volatility: number;
    ma_50: number;
    ma_200: number;
    rsi: number;
    macd: number;
    bb_upper: number;
    bb_middle: number;
    bb_lower: number;
    sharpe_ratio: number;
    risk_classification: string;
    summary: string;
}

interface StockData {
    symbol: string;
    price: number;
    change: number;
    chart: any[];
    analysis?: StockAnalysis;
}

const priceHistory = [
    { time: '9:30', price: 180 },
    { time: '10:00', price: 185 },
    { time: '10:30', price: 182 },
    { time: '11:00', price: 190 },
    { time: '11:30', price: 188 },
];

const sectorDistribution = [
    { name: 'Tech', value: 40 },
    { name: 'Energy', value: 25 },
    { name: 'Finance', value: 20 },
    { name: 'Health', value: 15 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState("gainers");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [topIntradayStocks, setTopIntradayStocks] = useState<Stock[]>([]);
    const [visibleStocks, setVisibleStocks] = useState(5);
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const stockListRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (stockListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = stockListRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20 && visibleStocks < topIntradayStocks.length) {
                setVisibleStocks(prev => Math.min(prev + 5, topIntradayStocks.length));
            }
        }
    };

    const handleAnalyze = async (symbol: string) => {
        setIsLoading(true);
        setSelectedSymbol(symbol);
        setAnalysisError(null);

        try {
            const mockChartData = Array.from({ length: 30 }, (_, i) => ({
                datetime: new Date(Date.now() - i * 5 * 60000).toLocaleTimeString(),
                close: 180 + (Math.random() * 20 - 10)
            })).reverse();

            const response = await axios.post('https://f8n-23401246568.europe-west1.run.app/analysis/analyse/', {
                ticker: symbol
            });

            setStockData({
                symbol: symbol,
                price: response.data.latest_close,
                change: (response.data.daily_return ?? 0) * 100,
                chart: mockChartData,
                analysis: response.data
            });

        } catch (error) {
            console.error("Error fetching stock data:", error);
            setAnalysisError("Failed to fetch stock analysis. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const getRiskColor = (risk: string) => {
        switch(risk) {
            case 'Low':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'High':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    useEffect(() => {
        const fetchTopIntradayStocks = async () => {
            try {
                const response = await fetch("https://financialmodelingprep.com/stable/most-actives?apikey=STz1y1UAFDtZZzuGVtAsoUJpnLwWRFAb");
                const data = await response.json();
                // Filter out stocks with missing price
                interface StockDataResponse {
                    price: number | undefined | null;
                    [key: string]: any;
                }
                const validStocks = data.filter((stock: StockDataResponse) => stock.price !== undefined && stock.price !== null);
                setTopIntradayStocks(validStocks);
            } catch (error) {
                console.error("Error fetching top intraday stocks:", error);
            }
        };

        fetchTopIntradayStocks();
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">


            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 sm:px-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white"> Stock Analysis</h1>
                        <p className="text-gray-500 dark:text-gray-400">In-depth technical analysis for any stock</p>

                        {/* Stock Data Display with Analysis */}
                        {stockData && (
                            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {stockData.symbol} Stock Analysis
                                    </h3>
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        (stockData.change ?? 0) >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {(stockData.change ?? 0) >= 0 ? '+' : ''}{(stockData.change ?? 0).toFixed(2)}%
                                    </span>
                                </div>

                                {analysisError ? (
                                    <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                        {analysisError}
                                    </div>
                                ) : (
                                    <>
                                        {/* Technical Indicators */}
                                        {stockData.analysis && (
                                            <div className="mb-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">${(stockData.analysis.latest_close ?? 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Daily Return</p>
                                                        <p className={`text-xl font-bold ${(stockData.analysis.daily_return ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {((stockData.analysis.daily_return ?? 0) * 100).toFixed(2)}%
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">RSI (14)</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{(stockData.analysis.rsi ?? 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Risk Level</p>
                                                        <p className={`inline-block px-2 py-1 rounded text-sm font-medium ${getRiskColor(stockData.analysis.risk_classification)}`}>
                                                            {stockData.analysis.risk_classification}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">MACD</p>
                                                        <p className={`text-lg font-bold ${(stockData.analysis.macd ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {(stockData.analysis.macd ?? 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">50-Day MA</p>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${(stockData.analysis.ma_50 ?? 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">200-Day MA</p>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${(stockData.analysis.ma_200 ?? 0).toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 p-4 rounded dark:bg-gray-700 mb-4">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Summary</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stockData.analysis.summary}</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Bollinger Bands</p>
                                                        <div className="mt-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span>Upper</span>
                                                                <span className="font-medium">${(stockData.analysis.bb_upper ?? 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs mt-1">
                                                                <span>Middle</span>
                                                                <span className="font-medium">${(stockData.analysis.bb_middle ?? 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs mt-1">
                                                                <span>Lower</span>
                                                                <span className="font-medium">${(stockData.analysis.bb_lower ?? 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Volatility</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{((stockData.analysis.volatility ?? 0) * 100).toFixed(2)}%</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded dark:bg-gray-700">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{(stockData.analysis.sharpe_ratio ?? 0).toFixed(4)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Price Chart */}
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsLineChart data={stockData.chart}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="datetime" />
                                                    <YAxis domain={['auto', 'auto']} />
                                                    <Tooltip />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="close"
                                                        stroke="#3B82F6"
                                                        strokeWidth={2}
                                                    />
                                                </RechartsLineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Price Trend Chart */}
                        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Live Price Movement (Last 5 Hours)
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsLineChart data={priceHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                        />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Most Traded Stocks */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 w-full max-w-md">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white"> Hot Stocks</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Most traded today</p>
                                </div>
                                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    Today
                                </button>
                            </div>
                            <div
                                ref={stockListRef}
                                className="p-6 overflow-y-auto max-h-96"
                                onScroll={handleScroll}
                            >
                                {topIntradayStocks.length > 0 ? (
                                    topIntradayStocks.slice(0, visibleStocks).map((stock) => (
                                        <div key={stock.symbol} className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                        {stock.symbol.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="font-medium text-gray-900 dark:text-white">${stock.price ? stock.price.toFixed(2) : 'N/A'}</div>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className={`flex items-center text-sm ${(stock.changesPercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {(stock.changesPercentage || 0) >= 0 ? (
                                                            <ArrowUp className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <ArrowDown className="mr-1 h-3 w-3" />
                                                        )}
                                                        {stock.changesPercentage != null ? Math.abs(stock.changesPercentage).toFixed(2) : 'N/A'}%
                                                    </div>
                                                    <button
                                                        onClick={() => handleAnalyze(stock.symbol)}
                                                        disabled={isLoading}
                                                        className="ml-3 text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                                                    >
                                                        {isLoading && selectedSymbol === stock.symbol ? 'Loading...' : 'Analyze'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                        Loading stocks...
                                    </div>
                                )}
                                {visibleStocks < topIntradayStocks.length && (
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Scroll for more stocks
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Gainers & Losers */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-1">
                            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white"> Top Movers</h2>
                                    <div className="inline-flex rounded-md shadow-sm">
                                        <button
                                            onClick={() => setActiveTab("gainers")}
                                            className={`rounded-l-lg px-3 py-1 text-sm font-medium ${
                                                activeTab === "gainers"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            Gainers
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("losers")}
                                            className={`rounded-r-lg px-3 py-1 text-sm font-medium ${
                                                activeTab === "losers"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            Losers
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Biggest {activeTab === "gainers" ? "gainers" : "losers"} today
                                </p>
                            </div>
                            <div className="p-6">
                                {(activeTab === "gainers" ? topGainers : topLosers).map((stock) => (
                                    <div key={stock.symbol} className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                                activeTab === "gainers" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                                            }`}>
                                                <span className={`text-sm font-medium ${
                                                    activeTab === "gainers" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                                }`}>
                                                    {stock.symbol.substring(0, 2)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">${stock.price.toFixed(2)}</div>
                                            <div className={`flex items-center text-sm ${
                                                activeTab === "gainers" ? "text-green-500" : "text-red-500"
                                            }`}>
                                                {activeTab === "gainers" ? (
                                                    <ArrowUp className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <ArrowDown className="mr-1 h-3 w-3" />
                                                )}
                                                {Math.abs(stock.change).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Most Traded MTF */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-1">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white"> Leveraged ETFs</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">High-volume margin trading</p>
                                </div>
                                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    View All
                                </button>
                            </div>
                            <div className="p-6">
                                {mostTradedMTF.map((stock) => (
                                    <div key={stock.symbol} className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                                    {stock.symbol.substring(0, 2)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">${stock.price.toFixed(2)}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Vol: {stock.volume}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Popular ETFs for SIP */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-1">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white"> Long-Term ETFs</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Popular SIP investments</p>
                                </div>
                                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    Start SIP
                                </button>
                            </div>
                            <div className="p-6">
                                {popularETFs.map((etf) => (
                                    <div key={etf.symbol} className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                                                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                                    {etf.symbol.substring(0, 2)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{etf.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{etf.symbol}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">${etf.price.toFixed(2)}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">AUM: ${etf.aum}B</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sector Distribution */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-1">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white"> Sector Distribution</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Market sector allocation</p>
                                </div>
                            </div>
                            <div className="p-6 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sectorDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {sectorDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface Trade {
    id: number;
    trade_type: string;
    asset_type: string;
    asset_name: string;
    quantity: string;
    price: string;
    total_amount: string;
    timestamp: string;
    status: string;
    order_type: string;
    user: number;
}

interface TradeVisualizationProps {
    trades: Trade[];
    startDate?: string;
    endDate?: string;
}

const TradeVisualization: React.FC<TradeVisualizationProps> = ({
                                                                   trades,
                                                                   startDate,
                                                                   endDate,
                                                               }) => {
    const [buyTrades, setBuyTrades] = useState<number[]>([]);
    const [sellTrades, setSellTrades] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<string>('');

    useEffect(() => {
        if (!trades || trades.length === 0) return;

        // Process data for visualization
        const processedData = processTrades(trades);
        setBuyTrades(processedData.buyAmounts);
        setSellTrades(processedData.sellAmounts);
        setLabels(processedData.dates);

        // Set date range
        if (startDate && endDate) {
            setDateRange(`${formatDate(startDate)} - ${formatDate(endDate)}`);
        } else {
            // Default to last 7 days if no date range provided
            const today = new Date();
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            setDateRange(`${formatDate(lastWeek.toISOString())} - ${formatDate(today.toISOString())}`);
        }
    }, [trades, startDate, endDate]);

    const processTrades = (tradeData: Trade[]) => {
        // Group trades by date
        const dateMap = new Map<string, { buyAmount: number; sellAmount: number }>();

        // Sort trades by timestamp
        const sortedTrades = [...tradeData].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        sortedTrades.forEach(trade => {
            const date = new Date(trade.timestamp).toISOString().split('T')[0];
            const amount = parseFloat(trade.total_amount);

            if (!dateMap.has(date)) {
                dateMap.set(date, { buyAmount: 0, sellAmount: 0 });
            }

            const currentData = dateMap.get(date)!;
            if (trade.trade_type === 'BUY') {
                currentData.buyAmount += amount;
            } else {
                currentData.sellAmount += amount;
            }

            dateMap.set(date, currentData);
        });

        // Extract data for chart
        const dates: string[] = [];
        const buyAmounts: number[] = [];
        const sellAmounts: number[] = [];

        // Fill in the arrays
        Array.from(dateMap.entries()).forEach(([date, data]) => {
            dates.push(formatDateShort(date));
            buyAmounts.push(data.buyAmount);
            sellAmounts.push(data.sellAmount);
        });

        return { dates, buyAmounts, sellAmounts };
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateShort = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const totalBuyAmount = buyTrades.reduce((sum, amount) => sum + amount, 0);
    const totalSellAmount = sellTrades.reduce((sum, amount) => sum + amount, 0);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Sell Amount',
                data: sellTrades,
                backgroundColor: '#36A2EB',
                stack: 'Stack 0',
            },
            {
                label: 'Buy Amount',
                data: buyTrades,
                backgroundColor: '#12CEFB',
                stack: 'Stack 0',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false,
                    color: '#333',
                },
                ticks: {
                    color: '#888',
                },
            },
            y: {
                grid: {
                    color: '#333',
                },
                ticks: {
                    color: '#888',
                },
                beginAtZero: true,
            },
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#ccc',
                },
            },
            title: {
                display: false,
            },
        },
    };

    return (
        <div className="bg-gray-900 p-6 rounded-lg text-white">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <div className="text-blue-400 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold">Trade Amounts</h2>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-md">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{dateRange}</span>
                    </div>
                </div>
            </div>

            <div className="flex space-x-12 mb-6">
                <div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-300 mr-2"></div>
                        <span className="text-gray-400">Avg. Buy Amount</span>
                    </div>
                    <p className="text-2xl font-bold">${(totalBuyAmount / Math.max(buyTrades.length, 1)).toFixed(2)}</p>
                </div>
                <div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                        <span className="text-gray-400">Avg. Sell Amount</span>
                    </div>
                    <p className="text-2xl font-bold">${(totalSellAmount / Math.max(sellTrades.length, 1)).toFixed(2)}</p>
                </div>
            </div>

            <div className="h-64">
                {labels.length > 0 ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        No trade data available for the selected period
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradeVisualization;
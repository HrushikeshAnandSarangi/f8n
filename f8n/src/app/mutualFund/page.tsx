"use client"
import { useState, useEffect } from "react"
import { ArrowUpDown, BarChart, Calculator, GitCompareArrows, HelpCircle, Star } from 'lucide-react'

const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || 'demo'
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3'

interface Fund {
  id: string;
  name: string;
  category: TooltipTerm;
  rating: number;
  returns: string;
  risk: string;
  minSip: number;
  price: number;
}

// Tooltip data for financial terms
const tooltipData = {
  "SIP": "Systematic Investment Plan - A method to invest fixed amounts at regular intervals in mutual funds.",
  "ETF": "Exchange-Traded Fund - A type of investment fund that trades on stock exchanges, similar to stocks.",
  "Returns": "The profit or loss on an investment, usually expressed as a percentage of the initial investment.",
  "Risk": "The potential for financial loss on an investment. Higher risk often correlates with potentially higher returns.",
  "Large Cap": "Companies with a market capitalization of $10 billion or more, typically established and stable businesses.",
  "Technology": "Sector focused on technology companies including software, hardware, internet services, and more.",
  "Diversified": "Investment strategy that allocates assets across various financial instruments to reduce risk.",
  "Volatility": "A measure of how much the price of an asset fluctuates over time. Higher volatility indicates higher risk.",
  "Compounded": "The process where the value of an investment increases because the earnings on an investment earn interest as time passes.",
  "Market Categories": "Classifications of stocks based on market capitalization or sector focus.",
  "Rating": "An evaluation of a mutual fund's past performance and future potential, often on a scale of 1-5 stars.",
  "Min SIP": "The minimum amount required to start a Systematic Investment Plan in a particular fund."
};

// Custom Tooltip component
type TooltipTerm = keyof typeof tooltipData;

interface TooltipProps {
  term: TooltipTerm;
  children: React.ReactNode;
}

const Tooltip = ({ term, children }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
      <div className="relative inline-flex items-center group">
        {children}
        <HelpCircle
            className="ml-1 h-4 w-4 text-gray-400 cursor-help"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        />
        {isVisible && (
            <div className="absolute z-10 w-64 p-3 text-sm bg-white border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 top-full left-0 mt-1">
              {tooltipData[term] || `Definition for ${term}`}
            </div>
        )}
      </div>
  );
};

const fetchFundList = async (): Promise<Fund[]> => {
  try {
    const response = await fetch(`${FMP_BASE_URL}/etf/list?apikey=${FMP_API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch ETFs');
    const etfList = await response.json();

    return await Promise.all(
        etfList.slice(0, 10).map(async (etf: any) => {
          try {
            const performanceRes = await fetch(
                `${FMP_BASE_URL}/historical-price-full/${etf.symbol}?serietype=line&apikey=${FMP_API_KEY}`
            );
            const performanceData = await performanceRes.json();
            const historical = performanceData.historical?.slice(-365) || [];

            const latestPrice = historical.length > 0 ? historical[historical.length - 1].close : etf.price;
            const minSip = Math.max(500, Math.ceil(latestPrice / 100) * 100); // Round up to nearest 100, min 500

            const startPrice = historical.length > 0 ? historical[0].close : latestPrice;
            const returns = ((latestPrice - startPrice) / startPrice * 100).toFixed(1);

            return {
              id: etf.symbol,
              name: etf.name,
              category: etf.sector || 'Diversified',
              rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Simulated rating
              returns: `${returns}%`,
              risk: etf.volatility > 0.2 ? 'High' : etf.volatility > 0.1 ? 'Medium' : 'Low',
              minSip,
              price: latestPrice
            };
          } catch (error) {
            console.error(`Error processing ${etf.symbol}:`, error);
            return null;
          }
        })
    ).then(results => results.filter(Boolean) as Fund[]);

  } catch (error) {
    console.error("Error fetching ETF list:", error);
    return [];
  }
};

export default function MutualFunds() {
  const [sipAmount, setSipAmount] = useState(5000);
  const [duration, setDuration] = useState(5);
  const [sortedBy, setSortedBy] = useState('rating');
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [funds, setFunds] = useState<Fund[]>([]);
  const [topFunds, setTopFunds] = useState<Fund[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const etfData = await fetchFundList();
        if (etfData.length > 0) {
          setFunds(etfData);
          setTopFunds([...etfData].sort((a, b) =>
              parseFloat(b.returns) - parseFloat(a.returns)).slice(0, 3));
          setCategories([...new Set(etfData.map(f => f.category))].slice(0, 3));
        } else {
          throw new Error("No ETF data available");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        // Fallback data with proper minSip calculation
        const fallbackData: Fund[] = [
          {
            id: 'SPY',
            name: 'SPDR S&P 500 ETF',
            category: 'Large Cap',
            rating: 4.8,
            returns: '10.2%',
            risk: 'Medium',
            minSip: Math.max(500, Math.ceil(450.25 / 100) * 100),
            price: 450.25
          },
          {
            id: 'QQQ',
            name: 'Invesco QQQ Trust',
            category: 'Technology',
            rating: 4.5,
            returns: '15.7%',
            risk: 'High',
            minSip: Math.max(500, Math.ceil(350.60 / 100) * 100),
            price: 350.60
          }
        ];
        setFunds(fallbackData);
        setTopFunds(fallbackData.slice(0, 3));
        setCategories(['Large Cap', 'Technology']);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateSip = () => {
    const monthlyRate = 0.1 / 12;
    const months = duration * 12;
    const futureValue = sipAmount * (
        (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
    ) * (1 + monthlyRate);
    return futureValue.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const RiskIndicator = ({ risk }: { risk: string }) => {
    const levels = {
      'Low': { color: 'bg-green-500', width: 'w-1/4' },
      'Medium': { color: 'bg-yellow-500', width: 'w-2/4' },
      'High': { color: 'bg-red-500', width: 'w-full' }
    };

    const { color, width } = levels[risk as keyof typeof levels] || levels.Medium;

    return (
        <div className="flex items-center">
          <div className="mr-2 h-2 w-16 rounded-full bg-gray-200">
            <div className={`h-full rounded-full ${color} ${width}`} />
          </div>
          <span className="text-sm">{risk}</span>
        </div>
    );
  };

  return (
      <div className="space-y-8 p-6">
        {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto" />
                <p>Loading Mutual Funds data...</p>
              </div>
            </div>
        ) : error ? (
            <div className="rounded-lg border bg-red-50 p-6 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <h3 className="font-semibold">Notice</h3>
              <p>{error}</p>
            </div>
        ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Top Funds Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 flex items-center text-xl font-semibold">
                    <Star className="mr-2 h-5 w-5 text-yellow-500" />
                    Top Performing Mutual Funds
                  </h2>
                  <div className="space-y-4">
                    {topFunds.map(fund => (
                        <div key={fund.id} className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div>
                            <div className="font-medium">{fund.name}</div>
                            <div className="text-sm text-gray-500">
                              <Tooltip term={fund.category}>{fund.category}</Tooltip>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <Tooltip term="Returns">{fund.returns}</Tooltip>
                      </span>
                            <div className="text-right">
                              <div className="text-sm">₹{fund.price.toFixed(2)}</div>
                              <div className="text-xs text-gray-500">
                                <Tooltip term="Min SIP">Min: ₹{fund.minSip}</Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Categories Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 flex items-center text-xl font-semibold">
                    <BarChart className="mr-2 h-5 w-5 text-blue-500" />
                    <Tooltip term="Market Categories">Market Categories</Tooltip>
                  </h2>
                  <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category} className="rounded-lg border p-4 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                      <span className="font-medium">
                        <Tooltip term={category as TooltipTerm}>{category}</Tooltip>
                      </span>
                            <button className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
                              View Mutual Funds
                            </button>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            {category === 'Large Cap' && 'Blue-chip companies with market leadership'}
                            {category === 'Technology' && 'Innovative tech companies and startups'}
                            {category === 'Diversified' && 'Broad market exposure across sectors'}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* SIP Calculator Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 flex items-center text-xl font-semibold">
                    <Calculator className="mr-2 h-5 w-5 text-purple-500" />
                    <Tooltip term="SIP">SIP Calculator</Tooltip>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm">Monthly Investment (₹)</label>
                      <input
                          type="number"
                          value={sipAmount}
                          onChange={(e) => setSipAmount(Math.max(500, Number(e.target.value)))}
                          className="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900"
                          min="500"
                          step="100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Duration (years)</label>
                      <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(Math.max(1, Math.min(30, Number(e.target.value))))}
                          className="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900"
                          min="1"
                          max="30"
                      />
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="text-sm text-blue-800 dark:text-blue-400">
                        Estimated Value: ₹{calculateSip()}
                      </div>
                      <div className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                        Assuming 10% annual returns, <Tooltip term="Compounded">compounded monthly</Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* All ETFs Table */}
              <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between p-6">
                  <h2 className="text-xl font-semibold">Available Mutual Funds</h2>
                  <div className="flex gap-2">
                    <button
                        onClick={() => setSortedBy('rating')}
                        className={`flex items-center rounded-full px-3 py-1 text-sm ${
                            sortedBy === 'rating' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600'
                        }`}
                    >
                      <ArrowUpDown className="mr-1 h-4 w-4" /> <Tooltip term="Rating">Rating</Tooltip>
                    </button>
                    <button
                        onClick={() => setSortedBy('risk')}
                        className={`flex items-center rounded-full px-3 py-1 text-sm ${
                            sortedBy === 'risk' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600'
                        }`}
                    >
                      <ArrowUpDown className="mr-1 h-4 w-4" /> <Tooltip term="Risk">Risk</Tooltip>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-t bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm">Mutual Funds Name</th>
                      <th className="px-6 py-3 text-left text-sm">Category</th>
                      <th className="px-6 py-3 text-left text-sm">
                        <Tooltip term="Rating">Rating</Tooltip>
                      </th>
                      <th className="px-6 py-3 text-left text-sm">
                        <Tooltip term="Returns">Returns</Tooltip>
                      </th>
                      <th className="px-6 py-3 text-left text-sm">
                        <Tooltip term="Risk">Risk</Tooltip>
                      </th>
                      <th className="px-6 py-3 text-left text-sm">Price</th>
                      <th className="px-6 py-3 text-left text-sm">
                        <Tooltip term="Min SIP">Min SIP</Tooltip>
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {[...funds]
                        .sort((a, b) => sortedBy === 'rating' ?
                            b.rating - a.rating :
                            a.risk.localeCompare(b.risk))
                        .map(fund => (
                            <tr key={fund.id} className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                              <td className="px-6 py-4">{fund.name}</td>
                              <td className="px-6 py-4">
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-sm text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                            <Tooltip term={fund.category}>{fund.category}</Tooltip>
                          </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <Star className="mr-1 h-4 w-4 text-yellow-500" />
                                  {fund.rating.toFixed(1)}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-green-600 dark:text-green-400">
                                {fund.returns}
                              </td>
                              <td className="px-6 py-4">
                                <RiskIndicator risk={fund.risk} />
                              </td>
                              <td className="px-6 py-4">₹{fund.price.toFixed(2)}</td>
                              <td className="px-6 py-4">₹{fund.minSip}</td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}
      </div>
  );
}
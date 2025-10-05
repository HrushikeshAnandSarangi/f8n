"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Download,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import toast from "react-hot-toast"

// Hardcoded portfolio data (historical data)
const portfolioData = [
  { date: "Jan", value: 45000 },
  { date: "Feb", value: 47500 },
  { date: "Mar", value: 46800 },
  { date: "Apr", value: 52000 },
  { date: "May", value: 54200 },
  { date: "Jun", value: 58500 },
]

// TypeScript interfaces for API responses
interface Instrument {
  instrument_token: string
  tradingsymbol: string
  instrument_type: string
}

interface Holding {
  instrument_token: string
  tradingsymbol: string
  company_name?: string
  quantity: number
  average_price: number
}

interface Position {
  instrument_token: string
  quantity: number
}

interface MarketData {
  last_price: number
  close: number
}

interface Order {
  transaction_type: string
  tradingsymbol: string
  quantity: number
  average_price: number
  order_timestamp: string
  status: string
}

interface AssetAllocation {
  name: string
  value: number
  amount: number
  color: string
}

interface TopHolding {
  symbol: string
  name: string
  shares: number
  price: number
  change: number
  changePercent: number
  value: number
}

interface Transaction {
  type: string
  symbol: string
  shares: number
  price: number
  date: string
  total: number
}

interface MarketMover {
  symbol: string
  change: number
  changePercent: number
}

export default function PortfolioDashboard() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState<"transactions" | "movers">("transactions")
  const [tokenInput, setTokenInput] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [isRealData, setIsRealData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // State variables initialized with hardcoded values
  const [totalValue, setTotalValue] = useState(58500)
  const [totalGain, setTotalGain] = useState(8500)
  const [totalGainPercent, setTotalGainPercent] = useState(17.0)
  const [dayChange, setDayChange] = useState(245.67)
  const [dayChangePercent, setDayChangePercent] = useState(0.42)
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([
    { name: "Stocks", value: 65, amount: 38025, color: "#3b82f6" },
    { name: "Bonds", value: 20, amount: 11700, color: "#10b981" },
    { name: "ETFs", value: 10, amount: 5850, color: "#f59e0b" },
    { name: "Cash", value: 5, amount: 2925, color: "#6b7280" },
  ])
  const [topHoldings, setTopHoldings] = useState<TopHolding[]>([
    { symbol: "AAPL", name: "Apple Inc.", shares: 50, price: 175.43, change: 2.34, changePercent: 1.35, value: 8771.5 },
    { symbol: "MSFT", name: "Microsoft Corp.", shares: 30, price: 378.85, change: -1.23, changePercent: -0.32, value: 11365.5 },
    { symbol: "GOOGL", name: "Alphabet Inc.", shares: 25, price: 142.56, change: 3.45, changePercent: 2.48, value: 3564 },
    { symbol: "TSLA", name: "Tesla Inc.", shares: 15, price: 248.42, change: -5.67, changePercent: -2.23, value: 3726.3 },
    { symbol: "NVDA", name: "NVIDIA Corp.", shares: 20, price: 875.28, change: 12.45, changePercent: 1.44, value: 17505.6 },
  ])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    { type: "BUY", symbol: "AAPL", shares: 10, price: 175.43, date: "2024-01-15", total: 1754.3 },
    { type: "SELL", symbol: "MSFT", shares: 5, price: 378.85, date: "2024-01-14", total: 1894.25 },
    { type: "BUY", symbol: "GOOGL", shares: 15, price: 142.56, date: "2024-01-13", total: 2138.4 },
    { type: "DIVIDEND", symbol: "AAPL", shares: 40, price: 0.24, date: "2024-01-12", total: 9.6 },
  ])
  const [marketMovers, setMarketMovers] = useState<MarketMover[]>([
    { symbol: "NVDA", change: 12.45, changePercent: 1.44 },
    { symbol: "GOOGL", change: 3.45, changePercent: 2.48 },
    { symbol: "AAPL", change: 2.34, changePercent: 1.35 },
    { symbol: "MSFT", change: -1.23, changePercent: -0.32 },
    { symbol: "TSLA", change: -5.67, changePercent: -2.23 },
  ])

  // Function to map API category to display name
  const mapCategoryName = (category: string): string => {
    switch (category) {
      case "EQUITY":
        return "Stocks"
      case "DEBT":
        return "Bonds"
      case "ETF":
        return "ETFs"
      case "CASH":
        return "Cash"
      default:
        return category
    }
  }

  // Generic API fetch with retry logic
  const fetchWithRetry = useCallback(
    async (url: string, options: RequestInit, retries: number = 3): Promise<unknown> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, options)
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          return await response.json()
        } catch (error) {
          if (i === retries - 1) throw error
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)))
        }
      }
      throw new Error("Max retries reached")
    },
    [],
  )

  // Fetch portfolio data
  const fetchData = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    const toastId = toast.loading("Fetching portfolio data...")

    try {
      const baseUrl = process.env.NEXT_PUBLIC_UPSTOX_API_URL || "https://api.upstox.com/v2"
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      }

      // Fetch instruments list
      const instrumentsData = await fetchWithRetry(`${baseUrl}/market/instruments`, { headers }) as { data: Instrument[] }
      const instrumentMap: { [key: string]: { tradingsymbol: string; category: string } } = {}
      instrumentsData.data.forEach((inst: Instrument) => {
        instrumentMap[inst.instrument_token] = {
          tradingsymbol: inst.tradingsymbol,
          category: inst.instrument_type || "Other",
        }
      })

      // Fetch holdings
      const holdingsData = await fetchWithRetry(`${baseUrl}/portfolio/long-term-holdings`, { headers }) as { data: Holding[] }
      const holdings: Holding[] = holdingsData.data

      // Fetch positions
      const positionsData = await fetchWithRetry(`${baseUrl}/portfolio/short-term-positions`, { headers }) as { data: Position[] }
      const positions: Position[] = positionsData.data

      // Fetch funds
      const fundsData = await fetchWithRetry(`${baseUrl}/user/get-funds-and-margin`, { headers }) as { data: { equity: { available_margin: number } } }
      const cash: number = fundsData.data.equity.available_margin

      // Get all instrument keys
      const instrumentKeys: string[] = [
        ...holdings.map((h) => h.instrument_token),
        ...positions.map((p) => p.instrument_token),
      ]

      // Fetch market data
      const marketDataRes = await fetchWithRetry(
        `${baseUrl}/market-quote/quotes?instrument_key=${instrumentKeys.join(",")}`,
        { headers },
      ) as { data: { [key: string]: MarketData } }
      const marketData: { [key: string]: MarketData } = marketDataRes.data

      // Calculate totalValue and asset allocation
      let totalValue = cash
      let totalInvested = 0
      const assetGroups: { [key: string]: number } = {}

      holdings.forEach((h) => {
        const md = marketData[h.instrument_token]
        const inst = instrumentMap[h.instrument_token]
        const category = inst ? inst.category : "Other"
        if (!assetGroups[category]) assetGroups[category] = 0
        if (md) {
          const currentPrice = md.last_price
          const value = h.quantity * currentPrice
          totalValue += value
          assetGroups[category] += value
          totalInvested += h.quantity * h.average_price
        }
      })

      positions.forEach((p) => {
        const md = marketData[p.instrument_token]
        const inst = instrumentMap[p.instrument_token]
        const category = inst ? inst.category : "Other"
        if (!assetGroups[category]) assetGroups[category] = 0
        if (md) {
          const currentPrice = md.last_price
          const value = p.quantity * currentPrice
          totalValue += value
          assetGroups[category] += value
        }
      })

      assetGroups["CASH"] = cash
      setTotalValue(totalValue)

      // Calculate totalGain (for holdings only)
      const totalGain = totalValue - totalInvested - cash
      const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
      setTotalGain(totalGain)
      setTotalGainPercent(totalGainPercent)

      // Calculate dayChange
      let dayChange = 0
      holdings.forEach((h) => {
        const md = marketData[h.instrument_token]
        if (md) {
          dayChange += h.quantity * (md.last_price - md.close)
        }
      })
      positions.forEach((p) => {
        const md = marketData[p.instrument_token]
        if (md) {
          dayChange += p.quantity * (md.last_price - md.close)
        }
      })
      setDayChange(dayChange)
      const previousValue = totalValue - dayChange
      const dayChangePercent = previousValue > 0 ? (dayChange / previousValue) * 100 : 0
      setDayChangePercent(dayChangePercent)

      // Asset Allocation
      const assetAllocationData = Object.entries(assetGroups).map(([name, value]) => {
        const percent = (value / totalValue) * 100
        let color
        switch (name) {
          case "EQUITY":
            color = "#3b82f6"
            break
          case "DEBT":
            color = "#10b981"
            break
          case "ETF":
            color = "#f59e0b"
            break
          case "CASH":
            color = "#6b7280"
            break
          default:
            color = "#d1d5db"
        }
        return { name: mapCategoryName(name), value: percent, amount: value, color }
      })
      setAssetAllocation(assetAllocationData)

      // Top Holdings
      const topHoldingsData = holdings
        .map((h: Holding) => {
          const md = marketData[h.instrument_token]
          if (!md) return null
          const currentPrice = md.last_price
          const value = h.quantity * currentPrice
          const change = currentPrice - md.close
          const changePercent = (change / md.close) * 100
          return {
            symbol: h.tradingsymbol,
            name: h.company_name || h.tradingsymbol,
            shares: h.quantity,
            price: currentPrice,
            change,
            changePercent,
            value,
          }
        })
        .filter((h): h is TopHolding => h !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
      setTopHoldings(topHoldingsData)

      // Recent Transactions
      const ordersData = await fetchWithRetry(`${baseUrl}/order/retrieve-all`, { headers }) as { data: Order[] }
      const recentOrders = ordersData.data
        .filter((o: Order) => o.status === "complete")
        .slice(0, 5)
        .map((o: Order) => ({
          type: o.transaction_type,
          symbol: o.tradingsymbol,
          shares: o.quantity,
          price: o.average_price,
          date: o.order_timestamp,
          total: o.quantity * o.average_price,
        }))
      setRecentTransactions(recentOrders)

      // Market Movers
      const allWithChange: MarketMover[] = []
      holdings.forEach((h: Holding) => {
        const md = marketData[h.instrument_token]
        if (md && md.last_price && md.close) {
          const change = md.last_price - md.close
          const changePercent = (change / md.close) * 100
          allWithChange.push({
            symbol: h.tradingsymbol,
            change,
            changePercent,
          })
        }
      })
      positions.forEach((p: Position) => {
        const md = marketData[p.instrument_token]
        if (md && md.last_price && md.close) {
          const inst = instrumentMap[p.instrument_token]
          const symbol = inst ? inst.tradingsymbol : p.instrument_token
          const change = md.last_price - md.close
          const changePercent = (change / md.close) * 100
          allWithChange.push({
            symbol,
            change,
            changePercent,
          })
        }
      })
      const sortedMovers = allWithChange
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 5)
      setMarketMovers(sortedMovers)

      setIsRealData(true)
      toast.success("Portfolio data loaded successfully", { id: toastId })
    } catch (error: unknown) {
      console.error('Portfolio data fetch error:', error);
      toast.error("Failed to fetch portfolio data. Using sample data.", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, fetchWithRetry])

  useEffect(() => {
    if (accessToken) {
      fetchData()
    }
  }, [accessToken, fetchData])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Portfolio Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your investments and market performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            disabled={isLoading}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Token Input */}
      <div className="mt-4">
        <p className="text-gray-600 dark:text-gray-400">
          Enter your Upstox access token to fetch real-time data.{" "}
          <a
            href="https://upstox.com/developer/api-documentation/authentication/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400"
          >
            Learn how to get your access token
          </a>
          . Otherwise, sample data is displayed.
        </p>
        <div className="flex gap-2 mt-2">
          <input
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2"
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter access token"
            disabled={isLoading}
          />
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            onClick={() => setAccessToken(tokenInput)}
            disabled={isLoading}
          >
            Fetch Data
          </button>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Total Portfolio Value</h3>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              disabled={isLoading}
            >
              {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-2xl font-bold text-gray-900 dark:text-white animate-pulse">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {balanceVisible ? `$${totalValue.toLocaleString()}` : "••••••"}
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+{totalGainPercent.toFixed(2)}% all time
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{isRealData ? "Real-time data" : "Sample data"}</p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Total Gain/Loss</h3>
            <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-2xl font-bold text-green-600 animate-pulse">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">+${totalGain.toLocaleString()}</div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />+{totalGainPercent.toFixed(2)}% return
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Today&apos;s Change</h3>
            <BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-2xl font-bold text-green-600 animate-pulse">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">+${dayChange.toFixed(2)}</div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+{dayChangePercent.toFixed(2)}% today
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Asset Allocation</h3>
            <PieChart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-2xl font-bold text-gray-900 dark:text-white animate-pulse">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{assetAllocation.length} Assets</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Diversified portfolio</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Portfolio Performance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your portfolio value over the last 6 months</p>
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400 animate-pulse">Loading chart...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#374151" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Asset Allocation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Distribution of your investments</p>
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400 animate-pulse">Loading chart...</div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie data={assetAllocation} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {assetAllocation.map((asset) => (
                    <div key={asset.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                        <span className="text-sm text-gray-900 dark:text-white">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{asset.value.toFixed(2)}%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">${asset.amount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Holdings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Top Holdings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your largest positions</p>
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {topHoldings.map((holding) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                        <span className="flex h-full w-full items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{holding.symbol}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{holding.shares} shares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">${holding.price.toFixed(2)}</div>
                      <div
                        className={`text-sm flex items-center ${holding.change >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {holding.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {holding.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest transactions and updates</p>
          </div>
          <div className="p-6 pt-0">
            <div className="w-full">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 p-1 text-gray-500 dark:text-gray-400 w-full">
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                    activeTab === "transactions"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  disabled={isLoading}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab("movers")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                    activeTab === "movers"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  disabled={isLoading}
                >
                  Market Movers
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-4 mt-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {activeTab === "transactions" && (
                    <div className="space-y-4 mt-4">
                      {recentTransactions.map((transaction, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                transaction.type === "BUY"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : transaction.type === "SELL"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {transaction.type}
                            </span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{transaction.symbol}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">${transaction.total.toFixed(2)}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{transaction.shares} shares</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "movers" && (
                    <div className="space-y-4 mt-4">
                      {marketMovers.map((mover, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{mover.symbol}</div>
                          <div className={`flex items-center ${mover.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {mover.change >= 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            <span className="font-medium">{mover.changePercent.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
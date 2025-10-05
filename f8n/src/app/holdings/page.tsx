"use client"
import { PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowUp, ArrowDown, BarChart, Briefcase, DollarSign, Layers, Percent, TrendingUp } from 'lucide-react'

const holdingsData = {
  totalValue: 1245325,
  dailyChange: +1.2,
  annualReturn: +18.4,
  allocation: [
    { name: 'Stocks', value: 750000, color: '#3B82F6' },
    { name: 'Mutual Funds', value: 350000, color: '#10B981' },
    { name: 'ETFs', value: 120000, color: '#F59E0B' },
    { name: 'Bonds', value: 25325, color: '#EF4444' },
  ],
  holdings: [
    {
      type: 'stock',
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      value: 450000,
      quantity: 150,
      change: +1.25,
      sector: 'Energy'
    },
    {
      type: 'mf',
      symbol: 'BCGF',
      name: 'BlueChip Growth Fund',
      value: 220000,
      units: 1452.36,
      change: +0.85,
      category: 'Large Cap'
    },
    {
      type: 'etf',
      symbol: 'NIFBEES',
      name: 'Nifty 50 ETF',
      value: 120000,
      quantity: 850,
      change: +0.65,
      category: 'Index'
    },
    {
      type: 'bond',
      symbol: 'G-SEC',
      name: 'Govt. Security Bond',
      value: 25325,
      quantity: 25,
      change: +0.25,
      maturity: '2030'
    }
  ]
}

export default function PortfolioHoldings() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Portfolio Holdings
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Total Value: ₹{(holdingsData.totalValue / 100000).toFixed(1)} Lakhs
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg flex items-center">
                <TrendingUp className="mr-2" /> Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                <div className="text-xl font-bold">₹{(holdingsData.totalValue / 100000).toFixed(1)}L</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Percent className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Daily Change</div>
                <div className={`text-xl font-bold ${
                  holdingsData.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {holdingsData.dailyChange >= 0 ? '+' : ''}{holdingsData.dailyChange}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Annual Return</div>
                <div className="text-xl font-bold text-green-600">+{holdingsData.annualReturn}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="grid lg:grid-cols-2 gap-8 p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Asset Allocation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdingsData.allocation}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={100}
                  >
                    {holdingsData.allocation.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {holdingsData.allocation.map((item, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ₹{(item.value / 100000).toFixed(1)} Lakhs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings List */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Your Investments</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Asset</th>
                    <th className="px-4 py-3 text-left">Value</th>
                    <th className="px-4 py-3 text-left">Change</th>
                    <th className="px-4 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsData.holdings.map((item, index) => (
                    <tr key={index} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.symbol}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{item.name}</div>
                        <div className={`text-xs mt-1 ${
                          item.type === 'stock' ? 'text-blue-600' :
                          item.type === 'mf' ? 'text-green-600' :
                          item.type === 'etf' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {item.type.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        ₹{(item.value / 100000).toFixed(1)}L
                      </td>
                      <td className={`px-4 py-4 ${
                        item.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="flex items-center">
                          {item.change >= 0 ? '+' : ''}{item.change}%
                          {item.change >= 0 ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowUp className="ml-2 h-4 w-4 transform rotate-180" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.type === 'stock' && `Sector: ${item.sector}`}
                          {item.type === 'mf' && `Category: ${item.category}`}
                          {item.type === 'etf' && `Index: ${item.category}`}
                          {item.type === 'bond' && `Matures: ${item.maturity}`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"
import { useState } from "react"
import { ArrowUp, Briefcase, Calculator, Lock, PiggyBank, TrendingUp, Wallet, Zap } from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts'

const portfolioData = {
  holdings: [
    { name: 'Stocks', value: 450000, color: '#3B82F6' },
    { name: 'ETFs', value: 320000, color: '#10B981' },
    { name: 'Funds', value: 285000, color: '#F59E0B' },
    { name: 'Bonds', value: 190325, color: '#EF4444' },
  ],
  performance: [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 105 },
    { month: 'Mar', value: 115 },
    { month: 'Apr', value: 120 },
    { month: 'May', value: 125 },
    { month: 'Jun', value: 130 },
  ]
}

const watchlist = [
  { name: 'RELIANCE', price: 2456, change: +2.4, volume: '2.5M' },
  { name: 'TCS', price: 3456, change: -1.2, volume: '1.8M' },
  { name: 'HDFC', price: 1654, change: +1.8, volume: '1.2M' },
  { name: 'INFY', price: 1452, change: +0.9, volume: '900K' },
]

export default function DematPage() {
  const [investment, setInvestment] = useState(5000)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-20 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <Zap className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">Smart Investing Made Simple</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Manage stocks, ETFs, and funds in one modern platform with zero commission trades
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-yellow-300 flex items-center text-lg transition-all hover:scale-105">
              <Wallet className="mr-2" /> Start Free
            </button>
            <button className="border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-white/10 flex items-center text-lg transition-all">
              Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Nifty 50', value: '22,124.35', change: +0.85 },
            { label: 'Sensex', value: '73,128.45', change: +0.72 },
            { label: 'Gold', value: '₹6,312/g', change: -0.15 },
            { label: 'USD/INR', value: '83.24', change: +0.22 },
          ].map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
              <div className="text-xl font-bold mt-1">{item.value}</div>
              <div className={`flex items-center text-sm mt-2 ${
                item.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.change >= 0 ? '+' : ''}{item.change}%
                <ArrowUp className={`ml-2 h-4 w-4 ${
                  item.change < 0 ? 'transform rotate-180' : ''
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-blue-600" />
                Portfolio Summary
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Total Value: ₹12,45,325</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg flex items-center">
                <TrendingUp className="mr-2" /> Analytics
              </button>
              <button className="border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg">
                Add Funds
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Asset Allocation */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Asset Allocation</h3>
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData.holdings}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={100}
                    >
                      {portfolioData.holdings.map((entry, index) => (
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
                {portfolioData.holdings.map((item, index) => (
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

            {/* Performance Chart */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioData.performance}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">YTD Return</div>
                  <div className="text-xl font-bold text-green-600">+18.4%</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Risk Level</div>
                  <div className="text-xl font-bold text-yellow-600">Medium</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Diversity</div>
                  <div className="text-xl font-bold text-blue-600">85%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Watchlist */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BarChart className="w-6 h-6 text-green-600" />
              Market Watchlist
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">Symbol</th>
                  <th className="px-6 py-4 text-left">Price</th>
                  <th className="px-6 py-4 text-left">Change</th>
                  <th className="px-6 py-4 text-left">Volume</th>
                  <th className="px-6 py-4 text-left">1Y Chart</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item, index) => (
                  <tr key={index} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">₹{item.price.toLocaleString()}</td>
                    <td className={`px-6 py-4 ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="flex items-center">
                        {item.change > 0 ? '+' : ''}{item.change}%
                        <ArrowUp className={`ml-2 h-4 w-4 ${item.change < 0 ? 'transform rotate-180' : ''}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.volume}</td>
                    <td className="px-6 py-4 w-32">
                      <div className="h-8 bg-gray-100 dark:bg-gray-600 rounded-sm animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fee Calculator */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Calculator className="w-6 h-6 text-purple-600" />
                Fee Calculator
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Investment</label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    value={investment}
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-2 text-3xl font-bold text-blue-600">
                    ₹{investment.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Annual Fees</div>
                    <div className="text-2xl font-bold">₹{(investment * 0.02).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <div className="text-sm text-gray-600 dark:text-gray-400">You Save</div>
                    <div className="text-2xl font-bold text-green-600">₹{(investment * 0.03).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Savings Comparison</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Us', value: investment * 0.02 },
                    { name: 'Others', value: investment * 0.05 }
                  ]}>
                    <Bar dataKey="value" fill="#ffffff" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm">
                *Based on average brokerage fees of 0.05% in traditional platforms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-gray-100 dark:bg-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: 'Safe & Secure', color: 'bg-purple-100', darkColor: 'dark:bg-purple-900/20' },
            { icon: Zap, title: 'Mobile App', color: 'bg-green-100', darkColor: 'dark:bg-green-900/20' },
            { icon: PiggyBank, title: 'Low Fees', color: 'bg-yellow-100', darkColor: 'dark:bg-yellow-900/20' },
          ].map((item, index) => {
            const IconComponent = item.icon
            return (
              <div key={index} className="bg-white p-6 rounded-xl dark:bg-gray-700">
                <div className={`${item.color} ${item.darkColor} w-fit p-3 rounded-full mb-4`}>
                  <IconComponent className="w-6 h-6 text-current" />
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {index === 0 && 'Bank-grade security for your investments'}
                  {index === 1 && 'Manage money from anywhere, anytime'}
                  {index === 2 && 'Pay 90% less than traditional brokers'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 dark:text-white">Ready to Start?</h2>
        <p className="text-gray-600 mb-8 dark:text-gray-300">Join millions who trust us with their investments</p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 flex items-center mx-auto">
          <Wallet className="mr-2" /> Get Started Free
        </button>
      </div>
    </div>
  )
}
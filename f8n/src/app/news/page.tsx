"use client"
import React from 'react'

import { Bookmark, Clock, Share2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StockNews {
  title: string;
  summary: string;
}

interface StockData {
  status: string;
  source: string;
  tickers: string[];
  data: {
    [ticker: string]: StockNews;
  };
}

export default function StockNewsSection() {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch(' http://127.0.0.1:8000/news/news/')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setStockData(data)
      } catch (err) {
        setError('Failed to fetch stock data. Please try again later.')
        console.error('Error fetching stock data:', err)
        
        // Fallback to sample data in case of error
        setStockData({
          "status": "success",
          "source": "default",
          "tickers": ["AAPL", "MSFT", "GOOG", "AMZN", "TSLA"],
          "data": {
            "AAPL": {
              "title": "Apple (AAPL) Stock Trades Down, Here Is Why",
              "summary": "Apple (AAPL) stock experienced a significant drop, closing down 7.2% at $188.40, due to escalating trade war tensions between the U.S. and China."
            },
            "MSFT": {
              "title": "Bill Gates Shares Original Code That Started It All As Microsoft Celebrates 50 Years",
              "summary": "Microsoft founder Bill Gates is reminiscing about the foundational computer code he wrote 50 years ago, which was instrumental in the creation of the tech giant."
            },
            "GOOG": {
              "title": "Here is What to Know Beyond Why Alphabet Inc. (GOOG) is a Trending Stock",
              "summary": "Alphabet (GOOG) is attracting significant investor attention, prompting an analysis of its near-term stock performance."
            },
            "AMZN": {
              "title": "Is Amazon.com, Inc. (AMZN) the Top Stock to Buy According to Think Investments?",
              "summary": "Think Investments, founded in 2013 by Shashin Shah, a seasoned global investor, manages approximately $454.51 million in 13F securities as of Q4 2024."
            },
            "TSLA": {
              "title": "Tesla (TSLA) Faces Skepticism as AI-Driven Autonomy Hits Roadblocks",
              "summary": "The article assesses Tesla's position relative to other leading AI companies. A European Central Bank study reveals that early AI adoption in manufacturing initially decreases productivity."
            }
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-6">
        <p>Loading stock news...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Section Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Stock Market News
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Latest news for top market movers
            </p>
          </div>
          <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Stock News List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {stockData && stockData.tickers.map(ticker => (
          <div key={ticker} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  {ticker}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Today
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {stockData.data[ticker].title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {stockData.data[ticker].summary}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
          View All Stock News →
        </button>
      </div>

      {/* Error message if exists */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

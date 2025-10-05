"use client"
import { useState } from 'react'
import { BarChart, PlusCircle, ArrowUp, ArrowDown } from 'lucide-react'

export default function PortfolioWatchlist() {
  const [watchlistItems, setWatchlistItems] = useState([
    {
      id: 1,
      type: 'stock',
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      price: 2456.75,
      change: +1.25,
      volume: '2.5M',
      sector: 'Energy'
    },
    {
      id: 2,
      type: 'mf',
      symbol: 'BCGF',
      name: 'BlueChip Growth Fund',
      nav: 150.45,
      change: +0.85,
      category: 'Large Cap',
      risk: 'Medium'
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    type: 'stock',
    symbol: '',
    name: '',
    price: '',
    change: '',
    detail: ''
  })

  const handleAddItem = () => {
    const newId = Math.max(...watchlistItems.map(item => item.id), 0) + 1
    
    const itemToAdd = {
      id: newId,
      type: newItem.type,
      symbol: newItem.symbol,
      name: newItem.name,
      ...(newItem.type === 'stock' ? {
        price: parseFloat(newItem.price),
        change: parseFloat(newItem.change),
        sector: newItem.detail,
        volume: '0' // Default volume for stock items
      } : {
        nav: parseFloat(newItem.price),
        change: parseFloat(newItem.change),
        category: newItem.detail.split(' · ')[0],
        risk: newItem.detail.split(' · ')[1] || 'Medium'
      })
    }

    setWatchlistItems([...watchlistItems, itemToAdd])
    setNewItem({
      type: 'stock',
      symbol: '',
      name: '',
      price: '',
      change: '',
      detail: ''
    })
    setShowAddForm(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BarChart className="w-6 h-6 text-green-600" />
              My Watchlist
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your favorite stocks and mutual funds
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Add New Item Form */}
        {showAddForm && (
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <h3 className="text-lg font-semibold mb-4">Add to Watchlist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                >
                  <option value="stock">Stock</option>
                  <option value="mf">Mutual Fund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <input
                  type="text"
                  value={newItem.symbol}
                  onChange={(e) => setNewItem({...newItem, symbol: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  placeholder="e.g. RELIANCE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  placeholder="Company/Fund Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {newItem.type === 'stock' ? 'Price' : 'NAV'}
                </label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  placeholder={newItem.type === 'stock' ? 'Current price' : 'Net Asset Value'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Change (%)</label>
                <input
                  type="number"
                  value={newItem.change}
                  onChange={(e) => setNewItem({...newItem, change: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  placeholder="Daily change percentage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {newItem.type === 'stock' ? 'Sector' : 'Category · Risk'}
                </label>
                <input
                  type="text"
                  value={newItem.detail}
                  onChange={(e) => setNewItem({...newItem, detail: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  placeholder={newItem.type === 'stock' ? 'Industry sector' : 'Large Cap · Medium Risk'}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!newItem.symbol || !newItem.name}
              >
                Add to Watchlist
              </button>
            </div>
          </div>
        )}

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Symbol/Name</th>
                <th className="px-6 py-4 text-left">Price/NAV</th>
                <th className="px-6 py-4 text-left">Change</th>
                <th className="px-6 py-4 text-left">Details</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {watchlistItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className={`w-fit px-2 py-1 rounded-full text-sm ${
                      item.type === 'stock' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                    }`}>
                      {item.type === 'stock' ? 'Stock' : 'Mutual Fund'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.symbol}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    ₹{item.type === 'stock' ? (item.price ?? 0).toLocaleString() : (item.nav ?? 0).toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 ${
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
                  <td className="px-6 py-4">
                    {item.type === 'stock' ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sector: {item.sector}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category} · {item.risk} Risk
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30">
                      {item.type === 'stock' ? 'Trade' : 'Invest'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
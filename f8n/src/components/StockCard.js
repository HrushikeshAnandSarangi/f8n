import React from 'react';

export default function StockCard({ symbol, price, change }) {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-md w-60">
      <h2 className="text-xl font-bold">{symbol}</h2>
      <p className="text-2xl mt-2">${price}</p>
      <p className={`mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change >= 0 ? '+' : ''}{change}%
      </p>
    </div>
  );
}

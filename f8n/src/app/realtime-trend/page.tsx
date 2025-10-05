'use client';

import React, { useEffect, useRef, useState } from 'react';

const TradingViewWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [category, setCategory] = useState("BINANCE");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [loadChart, setLoadChart] = useState(false);

  useEffect(() => {
    if (!loadChart || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "height": "650",
        "autosize": true,
        "symbol": "${category}:${symbol}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "0",
        "locale": "en",
        "allow_symbol_change": true,
        "support_host": "https://www.tradingview.com"
      }`;

    containerRef.current.appendChild(script);
  }, [category, symbol, loadChart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadChart(true); // triggers chart load
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-2xl">
        <input
          type="text"
          placeholder="Enter Category (e.g., BINANCE)"
          value={category}
          onChange={(e) => setCategory(e.target.value.toUpperCase())}
          className="border border-gray-300 p-2 rounded-md w-full"
          required
        />
        <input
          type="text"
          placeholder="Enter Symbol (e.g., BTCUSDT)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="border border-gray-300 p-2 rounded-md w-full"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Load
        </button>
      </form>

      <div
        className="tradingview-widget-container w-full"
        ref={containerRef}
        style={{ height: "800px" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "100%", width: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default TradingViewWidget;

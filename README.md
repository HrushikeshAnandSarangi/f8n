# f8n: AI-Powered Investment Analytics & Portfolio Agent Suite 📈🤖

<p align="center">
  <img src="https://f8n.vercel.app/f8n.svg" alt="f8n Logo" width="100"/>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed with Vercel](https://vercel.com/button)](https://f8n.vercel.app/)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=flat&logo=next.js)](https://nextjs.org/)
[![API Integration](https://img.shields.io/badge/Data%20Source-Upstox%20API-blue)](https://upstox.com/developer/api-documentation/)

---

## ⭐️ Overview

**f8n** is a sophisticated, agent-driven platform providing **AI-enhanced investment analytics** and a comprehensive **Portfolio Dashboard**. It is designed for modern investors who require deep insights, real-time tracking, and specialized analysis across their holdings.

A key feature is its seamless integration with brokerage APIs, particularly **Upstox**, allowing users to fetch and display their real-time portfolio data, performance metrics, and transaction history by simply providing an access token.

---

## ✨ Core Features & Agent Suite

The application is structured around a powerful dashboard and a suite of dedicated analytical agents:

### 📊 Portfolio Dashboard
* **Real-time Tracking:** Display of Total Portfolio Value, Total Gain/Loss, and Today's Change.
* **Asset Allocation:** Detailed breakdown of investments across asset classes (Stocks, Bonds, ETFs, Cash).
* **Performance Metrics:** Visualization of portfolio value over time (e.g., 6 months).
* **Holdings & Activity:** Lists Top Holdings and recent transactions (BUY/SELL/DIVIDEND).

### 🤖 Specialized AI Agents
The navigation includes dedicated modules for deep-dive analysis and actionable insights:
* **Mutual Funds Agent:** Focused analysis and tracking for mutual fund investments.
* **Analysis Agent (Stock):** Provides in-depth financial analysis for individual stocks.
* **Comparison Agent:** Tool for benchmarking the performance of multiple assets.
* **Watchlist Agent:** Management module for tracking and monitoring potential investments.
* **Sentiment Agent:** Gauges market mood and sentiment from news and data sources.
* **Recommendations Agent:** AI-driven suggestions for portfolio optimization.
* **News Agent:** Curated financial news aggregated by relevance.

---

## 🛠 Tech Stack

f8n leverages a robust and modern development stack:

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Data Integration:** REST APIs (Primary integration example: **Upstox API**)
* **Deployment:** [Vercel](https://vercel.com/)

---

## ⚙️ Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

* Node.js (LTS version)
* Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [Your-Repo-URL]
    cd f8n
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Environment Variables:**

    Create a file named `.env.local` in the root directory and add the necessary configuration.

    ```env
    # Required for real-time portfolio data integration (e.g., Upstox)
    # The application specifically prompts for this token.
    UPSTOX_ACCESS_TOKEN="YOUR_UPSTOX_API_TOKEN"

    # Optional: For powering the AI Agent functionality
    OPENAI_API_KEY="YOUR_GPT_MODEL_KEY" 
    ```
    ***Note:** If the access token is not provided, the dashboard will gracefully display sample data.*

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 📊 Dashboard Overview

| Section          | Description                          |
|------------------|--------------------------------------|
| **Portfolio Value** | Current total value and 24h change. |
| **Gains/Losses** | Overall P&L with pie chart breakdown. |
| **Asset Allocation** | Bar chart showing stocks, bonds, etc. |
| **Top Holdings** | Table of your largest positions.    |
| **Recent Transactions** | List of buys/sells with timestamps. |

---


## 🤝 Contributing

We welcome contributions to enhance the f8n platform. Please follow the standard workflow:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/NewAgent`)
3.  Commit your Changes (`git commit -m 'Feat: Added new Market Agent'`)
4.  Push to the Branch (`git push origin feature/NewAgent`)
5.  Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

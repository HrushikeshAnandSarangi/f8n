from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from yahooquery import Ticker
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)



class recommendations(APIView):
    stocks = {
        "AAPL": "Apple is a technology company that designs and sells smartphones, laptops, and software.",
        "MSFT": "Microsoft develops software, services, devices, and solutions worldwide.",
        "GOOGL": "Google is known for its search engine, cloud computing, and online advertising technologies.",
        "AMZN": "Amazon is an e-commerce and cloud computing company with a strong logistics network.",
        "TSLA": "Tesla designs, develops, and manufactures electric vehicles and energy storage products.",
        "META": "Meta Platforms develops social media technologies and virtual reality platforms.",
        "NFLX": "Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more.",
        "DIS": "Disney is a diversified international family entertainment and media enterprise.",
        "NVDA": "NVIDIA is a technology company that designs graphics processing units for gaming and professional markets.",
        "INTC": "Intel is a semiconductor chip manufacturer that develops advanced integrated digital technology products.",
        "AMD": "Advanced Micro Devices is a semiconductor company that develops computer processors and related technologies.",
        "PYPL": "PayPal is a financial technology company operating an online payments system.",
        "CSCO": "Cisco Systems develops networking hardware, software, and telecommunications equipment.",
        "ORCL": "Oracle Corporation offers database software and technology, cloud engineered systems, and enterprise software products.",
        "TCS.NS": "Tata Consultancy Services is an IT services, consulting, and business solutions organization.",
        "INFY.NS": "Infosys is a global leader in next-generation digital services and consulting.",
        "HDFCBANK.NS": "HDFC Bank is a leading private sector bank in India offering a wide range of financial services.",
        "ICICIBANK.NS": "ICICI Bank is a leading private sector bank in India providing a wide range of banking products and financial services.",
        "HINDUNILVR.NS": "Hindustan Unilever is a consumer goods company with a wide range of products in India.",
        "LT.NS": "Larsen & Toubro is a major technology, engineering, construction, manufacturing, and financial services conglomerate.",
        "ITC.NS": "ITC Limited is a diversified conglomerate with a presence in FMCG, hotels, packaging, paperboards, and agribusiness.",
        "TATAMOTORS.NS": "Tata Motors is a leading Indian automotive manufacturer and a part of Tata Group.",
        "RELIANCE.NS": "Reliance Industries is an Indian multinational conglomerate with businesses in energy, petrochemicals, retail, and telecommunications.",
        "WIPRO.NS": "Wipro is an Indian multinational corporation providing information technology, consulting, and business process services.",
        "^NSEI": "Nifty 50 is the flagship index of India's National Stock Exchange, representing the weighted average of 50 major Indian companies.",
        "BTC-USD": "Bitcoin is the first and most valuable cryptocurrency, operating on a decentralized blockchain network.",
        "ETH-USD": "Ethereum is a blockchain platform with its native cryptocurrency that enables smart contracts and decentralized applications.",
        "XRP-USD": "XRP is a digital asset built for payments, designed to enable fast, low-cost international money transfers.",
        "ADA-USD": "Cardano (ADA) is a proof-of-stake blockchain platform with a focus on sustainability, scalability, and transparency.",
        "SOL-USD": "Solana (SOL) is a high-performance blockchain supporting smart contracts and decentralized applications.",
        "DOT-USD": "Polkadot (DOT) is a multi-chain blockchain platform that enables different blockchains to transfer messages and value.",
        "DOGE-USD": "Dogecoin is a cryptocurrency created as a joke that gained popularity through internet memes and celebrity endorsements.",
        "AVAX-USD": "Avalanche (AVAX) is a blockchain platform focused on speed, low costs, and eco-friendliness for building decentralized applications.",
        "MATIC-USD": "Polygon (MATIC) is a protocol and framework for building and connecting Ethereum-compatible blockchain networks.",
        "NOK": "Nokia Corporation is a Finnish multinational telecommunications, information technology, and consumer electronics company.",
        "NOKIA.HE": "Nokia's stock code on the Helsinki Stock Exchange, representing the Finnish telecommunications company.",
        "SONY": "Sony is a multinational conglomerate corporation known for electronics, gaming, entertainment, and financial services.",
        "BABA": "Alibaba Group is a Chinese multinational technology company specializing in e-commerce, retail, and technology.",
        "TCEHY": "Tencent Holdings is a Chinese multinational technology and entertainment conglomerate.",
        "TM": "Toyota Motor Corporation is a Japanese multinational automotive manufacturer."
    }

    def post(self, request):
        try:
            data = request.data
            ticker = data.get('ticker')
            top_n = int(request.query_params.get('top_n', 3))
            alpha = float(request.query_params.get('alpha', 0.7))

            if ticker not in self.stocks:
                return Response({
                    "status": "error",
                    "message": f"Ticker {ticker} not found in our database"
                }, status=status.HTTP_400_BAD_REQUEST)

            recommendations = self.get_recommendations(ticker, top_n, alpha)

            return Response({
                "status": "success",
                "ticker": ticker,
                "recommendations": recommendations
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in StockRecommendation API: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_yahooquery_data(self, stock_list):
        details = {}
        try:
            ticker = Ticker(stock_list)
            summary = ticker.summary_detail

            for symbol in summary:
                try:
                    beta = summary[symbol].get('beta', 0) or 0
                    mcap = summary[symbol].get('marketCap', 0) or 0
                    payout = summary[symbol].get('payoutRatio', 0) or 0
                    details[symbol] = [beta, mcap, payout]
                except Exception as inner_e:
                    logger.warning(f"Error getting details for {symbol}: {str(inner_e)}")
                    details[symbol] = [0, 0, 0]
        except Exception as e:
            logger.error(f"Error in yahooquery: {str(e)}")

        return details

    def get_recommendations(self, stock_ticker, top_n=3, alpha=0.7):
        tickers = list(self.stocks.keys())
        descriptions = list(self.stocks.values())

        realtime_data = self.get_yahooquery_data(tickers)

        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(descriptions)
        content_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

        features = [realtime_data.get(t, [0, 0, 0]) for t in tickers]
        scaler = MinMaxScaler()
        norm_features = scaler.fit_transform(features)
        feature_sim = cosine_similarity(norm_features)

        combined_sim = alpha * content_sim + (1 - alpha) * feature_sim

        stock_idx = tickers.index(stock_ticker)
        sim_scores = list(enumerate(combined_sim[stock_idx]))

        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        top_matches = [x for x in sim_scores if x[0] != stock_idx][:top_n]

        recommendations = []
        for i, score in top_matches:
            ticker_symbol = tickers[i]
            recommendations.append({
                "ticker": ticker_symbol,
                "description": self.stocks[ticker_symbol],
                "similarity_score": round(float(score), 3),
                "features": {
                    "beta": realtime_data.get(ticker_symbol, [0, 0, 0])[0],
                    "market_cap": realtime_data.get(ticker_symbol, [0, 0, 0])[1],
                    "payout_ratio": realtime_data.get(ticker_symbol, [0, 0, 0])[2],
                }
            })

        return recommendations
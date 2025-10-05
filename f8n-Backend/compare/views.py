from django.http import JsonResponse
from django.views import View
import json
from yahooquery import Ticker
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os
import re
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Load environment variables
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Initialize LLM
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)


def compare_stock(metrics: dict) -> dict:
    stock1, stock2 = list(metrics.keys())
    metric_names = list(metrics[stock1].keys())

    # Format metrics for prompt
    metric_lines = []
    for metric in metric_names:
        val1 = metrics[stock1].get(metric, "N/A")
        val2 = metrics[stock2].get(metric, "N/A")
        metric_lines.append(f"- {metric}: {stock1} = {val1}, {stock2} = {val2}")
    metric_text = "\n".join(metric_lines)

    prompt = f"""
    You are a financial analyst specializing in comparing stocks.
    Based on the following financial metrics, compare the two stocks: {stock1} and {stock2}.
    Your response should help a non-technical person understand which stock is better and why. Assume the user doesn't know anything about the metrics.

    Metrics:
    {metric_text}

    Respond in JSON format with:
    - better_stock: The stock symbol that is better based on the analysis
    - reasoning: A clear, simple explanation for your decision
    """

    response = llm.predict(prompt)

    # Try to extract valid JSON from response
    match = re.search(r'{\s*"better_stock":\s*".+?",\s*"reasoning":\s*".+?"\s*}', response, re.DOTALL)
    if match:
        extracted_json = match.group()
        return json.loads(extracted_json)
    else:
        return {
            "better_stock": None,
            "reasoning": "Could not extract JSON from LLM response.",
            "raw_response": response
        }


def get_stock_metrics(stock1: str, stock2: str) -> dict:
    ticker1 = Ticker(stock1)
    ticker2 = Ticker(stock2)

    metrics = ['forwardPE', 'trailingPE', 'dividendYield', 'beta', 'marketCap']

    summary1 = ticker1.summary_detail.get(stock1, {})
    summary2 = ticker2.summary_detail.get(stock2, {})

    if not summary1 or not summary2:
        raise ValueError("One or both stock symbols are invalid or missing data.")

    return {
        stock1: {metric: summary1.get(metric, 'N/A') for metric in metrics},
        stock2: {metric: summary2.get(metric, 'N/A') for metric in metrics}
    }


@method_decorator(csrf_exempt, name='dispatch')
class compare(View):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            stock1 = data.get('stock1', '').strip().upper()
            stock2 = data.get('stock2', '').strip().upper()

            if not stock1 or not stock2:
                return JsonResponse({"error": "Both stock1 and stock2 are required"}, status=400)

            metrics = get_stock_metrics(stock1, stock2)
            comparison = compare_stock(metrics)

            response_data = {
                "stock1": stock1,
                "stock2": stock2,
                "metrics": metrics,
                "better_stock": comparison.get("better_stock"),
                "reasoning": comparison.get("reasoning")
            }

            return JsonResponse(response_data)

        except ValueError as ve:
            return JsonResponse({"error": str(ve)}, status=400)
        except Exception as e:
            import traceback
            error_detail = f"Internal server error: {str(e)}\n{traceback.format_exc()}"
            print(error_detail)
            return JsonResponse({"error": error_detail}, status=500)
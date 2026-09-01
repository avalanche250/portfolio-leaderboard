const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';

// How long a price is reused before Next.js re-fetches it from Finnhub.
// This value is what makes prices durable across serverless invocations:
// Next's fetch cache is a shared platform-level cache, not local disk, so
// every instance of this function sees the same cached result.
const PRICE_CACHE_SECONDS = 300;

export interface PriceResult {
  prices: Record<string, number>;
  failedTickers: string[];
  timestamp: number;
}

async function fetchQuote(ticker: string, apiKey: string): Promise<number | null> {
  try {
    const url = `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: PRICE_CACHE_SECONDS } });

    if (!response.ok) {
      console.error(`Failed to fetch ${ticker}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error(`Finnhub error for ${ticker}: ${data.error}`);
      return null;
    }

    // Finnhub returns c: 0 for unknown/untradeable symbols.
    if (typeof data.c === 'number' && data.c > 0) {
      return data.c;
    }

    console.error(`No usable price for ${ticker}:`, data);
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}

export async function getPrices(tickers: string[]): Promise<PriceResult> {
  const apiKey = process.env.FINNHUB_API_KEY;
  const prices: Record<string, number> = {};
  const failedTickers: string[] = [];

  if (!apiKey) {
    console.error('FINNHUB_API_KEY is not set');
    return { prices, failedTickers: tickers, timestamp: Date.now() };
  }

  await Promise.all(
    tickers.map(async (ticker) => {
      const price = await fetchQuote(ticker, apiKey);
      if (price !== null) {
        prices[ticker] = price;
      } else {
        failedTickers.push(ticker);
      }
    })
  );

  return { prices, failedTickers, timestamp: Date.now() };
}

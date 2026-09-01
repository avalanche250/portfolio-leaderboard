import fs from 'fs';
import path from 'path';

const PRICES_FILE = process.env.NODE_ENV === 'production'
  ? '/tmp/prices.json'
  : path.join(process.cwd(), 'lib', 'prices.json');

interface PriceData {
  [ticker: string]: number;
  timestamp: number;
}

export async function fetchYahooFinancePrices(tickers: string[]): Promise<{ [key: string]: number }> {
  const prices: { [key: string]: number } = {};

  for (const ticker of tickers) {
    try {
      // Yahoo Finance API endpoint
      const response = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch ${ticker}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const currentPrice = data.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw;

      if (currentPrice) {
        prices[ticker] = currentPrice;
      }
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
    }
  }

  return prices;
}

export function savePrices(prices: { [key: string]: number }): void {
  const data: PriceData = {
    ...prices,
    timestamp: Date.now(),
  };

  fs.writeFileSync(PRICES_FILE, JSON.stringify(data, null, 2));
}

export function getPrices(): { [key: string]: number } | null {
  try {
    if (fs.existsSync(PRICES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf-8')) as PriceData;
      // Return all except timestamp
      const { timestamp, ...prices } = data;
      return prices;
    }
  } catch (error) {
    console.error('Error reading prices file:', error);
  }

  return null;
}

export function getPricesTimestamp(): number | null {
  try {
    if (fs.existsSync(PRICES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf-8')) as PriceData;
      return data.timestamp;
    }
  } catch (error) {
    console.error('Error reading prices file:', error);
  }

  return null;
}

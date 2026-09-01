# Portfolio Leaderboard

A live portfolio tracking leaderboard for multiple teams competing with $1M starting capital.

## Features

- **Live Leaderboard**: Real-time ranking of teams by portfolio value
- **Live Prices**: Fetches current prices from Finnhub, cached for 5 minutes
- **Performance Tracking**: Shows gain/loss and percentage returns for each team
- **Clean UI**: Dark-themed dashboard with responsive design

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Get a free API key at [finnhub.io/register](https://finnhub.io/register), then copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
FINNHUB_API_KEY=your-finnhub-api-key-here
```

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

During deployment, add the `FINNHUB_API_KEY` environment variable to your Vercel project settings (Project Settings → Environment Variables).

**Also check Deployment Protection**: by default a new Vercel project may require signing in to Vercel to view it. If you want the leaderboard publicly viewable, go to Project Settings → Deployment Protection and turn off Vercel Authentication.

## Data Structure

Team positions are stored in `lib/teams.json` with the following format:

```json
{
  "teams": [
    {
      "name": "Team Name",
      "positions": [
        {
          "ticker": "AAPL",
          "shares": 100,
          "initialInvestment": 15000
        }
      ]
    }
  ]
}
```

## API Endpoints

### GET `/api/leaderboard`
Returns the current leaderboard with rankings, portfolio values, and returns. Prices are fetched from Finnhub and cached for 5 minutes (shared across all requests via Next.js's Data Cache), so this is safe to poll frequently.

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "name": "Team Name",
      "portfolioValue": 1050000,
      "gainLoss": 50000,
      "percentGain": 5.00,
      "lastUpdated": "2026-09-01T20:00:00.000Z"
    }
  ],
  "warning": null
}
```

If a ticker's live price can't be fetched (rate limit, invalid symbol, Finnhub outage), that position falls back to its cost basis (0% gain) rather than disappearing, and `warning` names the affected tickers.

## How It Works

1. **On-demand fetch**: Every request to `/api/leaderboard` fetches current prices for all tickers from Finnhub.
2. **Shared caching**: Each price fetch is cached for 5 minutes via Next.js's fetch cache, which is a platform-level cache shared across all serverless function instances — not local disk, so it works correctly on Vercel.
3. **Leaderboard Calculation**: For each team:
   - Current price × shares = position value
   - Sum all positions = portfolio value
   - Compare to $1M starting capital for gain/loss and %
4. **Live Display**: Frontend refreshes every 30 seconds to show latest prices.

## Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the leaderboard.

## Troubleshooting

- **No prices showing / "Live price unavailable" warning**: Make sure `FINNHUB_API_KEY` is set correctly in your environment (or Vercel project settings) and hasn't hit its rate limit.
- **Can't view the site without logging into Vercel**: Turn off Vercel Authentication under Project Settings → Deployment Protection.
- **Env variables not loading locally**: Make sure you're using `.env.local` and restart the dev server.

## License

MIT

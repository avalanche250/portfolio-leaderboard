# Portfolio Leaderboard

A live portfolio tracking leaderboard for multiple teams competing with $1M starting capital.

## Features

- **Live Leaderboard**: Real-time ranking of teams by portfolio value
- **Automatic Price Updates**: Fetches EOD prices daily at market close (4 PM ET)
- **Performance Tracking**: Shows gain/loss and percentage returns for each team
- **Clean UI**: Dark-themed dashboard with responsive design

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and set a secure cron secret:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
CRON_SECRET=your-random-secret-key-here
```

Generate a secure secret (use any random string generator):
```bash
openssl rand -hex 32
```

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

During deployment:
1. Add the `CRON_SECRET` environment variable to your Vercel project settings
2. The cron job will automatically run daily at 4 PM ET (market close)

### 4. Manual Price Update

To manually trigger a price update (useful for testing):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/update-prices
```

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
Returns the current leaderboard with rankings, portfolio values, and returns.

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
  ]
}
```

### GET `/api/update-prices`
Triggers a price update from Yahoo Finance. Requires `CRON_SECRET` authorization header.

**Request:**
```bash
curl -H "Authorization: Bearer CRON_SECRET" /api/update-prices
```

## How It Works

1. **Daily Cron Job** (4 PM ET): Fetches EOD prices for all tickers from Yahoo Finance
2. **Price Caching**: Prices are stored locally to avoid repeated API calls
3. **Leaderboard Calculation**: For each team:
   - Current price × shares = position value
   - Sum all positions = portfolio value
   - Compare to $1M starting capital for gain/loss and %
4. **Live Display**: Frontend refreshes every 30 seconds to show latest prices

## Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the leaderboard.

**Note**: Price updates won't work locally until you've manually triggered one or set up a local cron solution.

## Troubleshooting

- **No prices showing**: Make sure to run `/api/update-prices` manually or wait for the scheduled cron job
- **Yahoo Finance errors**: Some tickers may not be available via the API; check the ticker symbol
- **Env variables not loading**: Make sure you're using `.env.local` and restart the dev server

## License

MIT

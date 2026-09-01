import { NextResponse } from 'next/server';
import { getPrices } from '@/lib/prices';
import teamsData from '@/lib/teams.json';

interface TeamPosition {
  ticker: string;
  avgCost: number;
  currentPrice: number;
  percentChange: number;
}

interface TeamLeaderboard {
  rank: number;
  name: string;
  portfolioValue: number;
  initialValue: number;
  gainLoss: number;
  percentGain: number;
  lastUpdated: string;
  positions: TeamPosition[];
}

const STARTING_CAPITAL = 1000000;

export async function GET() {
  try {
    const tickers = new Set<string>();
    teamsData.teams.forEach((team) => {
      team.positions.forEach((position) => tickers.add(position.ticker));
    });

    const { prices, failedTickers, timestamp } = await getPrices(Array.from(tickers));

    const leaderboard: TeamLeaderboard[] = teamsData.teams.map((team) => {
      let portfolioValue = 0;
      let initialValue = 0;

      const positions: TeamPosition[] = team.positions.map((position) => {
        const avgCost = position.initialInvestment / position.shares;
        // Fall back to cost basis (0% gain) for a position whose live price
        // is temporarily unavailable, instead of dropping it to $0.
        const currentPrice = prices[position.ticker] ?? avgCost;
        portfolioValue += currentPrice * position.shares;
        initialValue += position.initialInvestment;

        return {
          ticker: position.ticker,
          avgCost: parseFloat(avgCost.toFixed(2)),
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          percentChange: parseFloat((((currentPrice - avgCost) / avgCost) * 100).toFixed(2)),
        };
      });

      const gainLoss = portfolioValue - STARTING_CAPITAL;
      const percentGain = ((gainLoss / STARTING_CAPITAL) * 100).toFixed(2);

      return {
        rank: 0,
        name: team.name,
        portfolioValue: parseFloat(portfolioValue.toFixed(2)),
        initialValue: parseFloat(initialValue.toFixed(2)),
        gainLoss: parseFloat(gainLoss.toFixed(2)),
        percentGain: parseFloat(percentGain),
        lastUpdated: new Date(timestamp).toISOString(),
        positions,
      };
    });

    // Sort by portfolio value descending
    leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Add ranks
    leaderboard.forEach((team, index) => {
      team.rank = index + 1;
    });

    return NextResponse.json({
      leaderboard,
      warning:
        failedTickers.length > 0
          ? `Live price unavailable for: ${failedTickers.join(', ')}. Showing cost basis for these positions until the next refresh.`
          : null,
    });
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to calculate leaderboard', details: String(error) },
      { status: 500 }
    );
  }
}

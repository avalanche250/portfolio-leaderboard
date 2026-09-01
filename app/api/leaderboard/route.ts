import { NextResponse } from 'next/server';
import { getPrices, getPricesTimestamp } from '@/lib/prices';
import teamsData from '@/lib/teams.json';

interface TeamLeaderboard {
  rank: number;
  name: string;
  portfolioValue: number;
  initialValue: number;
  gainLoss: number;
  percentGain: number;
  lastUpdated: string | null;
}

export async function GET() {
  try {
    const prices = getPrices();
    const pricesTimestamp = getPricesTimestamp();

    if (!prices) {
      return NextResponse.json(
        { error: 'Prices not yet loaded. Please check back after market close.' },
        { status: 503 }
      );
    }

    const STARTING_CAPITAL = 1000000;

    const leaderboard: TeamLeaderboard[] = teamsData.teams.map((team) => {
      let portfolioValue = 0;
      let initialValue = 0;

      team.positions.forEach((position) => {
        const currentPrice = prices[position.ticker];
        const positionValue = currentPrice ? currentPrice * position.shares : 0;
        portfolioValue += positionValue;
        initialValue += position.initialInvestment;
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
        lastUpdated: pricesTimestamp ? new Date(pricesTimestamp).toISOString() : null,
      };
    });

    // Sort by portfolio value descending
    leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Add ranks
    leaderboard.forEach((team, index) => {
      team.rank = index + 1;
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to calculate leaderboard', details: String(error) },
      { status: 500 }
    );
  }
}

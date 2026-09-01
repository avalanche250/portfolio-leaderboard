import { NextRequest, NextResponse } from 'next/server';
import { fetchYahooFinancePrices, savePrices } from '@/lib/prices';
import teamsData from '@/lib/teams.json';

export async function GET(request: NextRequest) {
  // Verify this is from Vercel Cron by checking the authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Extract all unique tickers from teams
    const tickers = new Set<string>();
    teamsData.teams.forEach((team) => {
      team.positions.forEach((pos) => {
        tickers.add(pos.ticker);
      });
    });

    // Fetch prices for all tickers
    const prices = await fetchYahooFinancePrices(Array.from(tickers));

    // Save prices to file
    savePrices(prices);

    return NextResponse.json({
      success: true,
      pricesUpdated: Object.keys(prices).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      { error: 'Failed to update prices', details: String(error) },
      { status: 500 }
    );
  }
}

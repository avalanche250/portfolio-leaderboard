'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  portfolioValue: number;
  gainLoss: number;
  percentGain: number;
  lastUpdated: string | null;
}

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to load leaderboard');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setLeaderboard(data.leaderboard);
        setError(null);
        setWarning(data.warning || null);

        if (data.leaderboard[0]?.lastUpdated) {
          setRefreshTime(new Date(data.leaderboard[0].lastUpdated).toLocaleString());
        }
      } catch (err) {
        setError('Error fetching leaderboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Portfolio Leaderboard</h1>
          <p className="text-slate-400">
            Starting Capital: <span className="font-semibold text-white">$1,000,000</span>
          </p>
          {refreshTime && (
            <p className="text-slate-500 text-sm mt-2">Last updated: {refreshTime}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!error && warning && (
          <div className="bg-amber-900/20 border border-amber-500/50 text-amber-300 p-4 rounded-lg mb-6 text-sm">
            {warning}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400">Loading leaderboard...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Team</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                    Portfolio Value
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                    Gain/Loss
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                    % Return
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.name}
                    className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-4 text-white font-bold text-lg">#{entry.rank}</td>
                    <td className="px-4 py-4 text-white">{entry.name}</td>
                    <td className="px-4 py-4 text-right text-white font-semibold">
                      ${entry.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-semibold ${
                        entry.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {entry.gainLoss >= 0
                        ? `+$${entry.gainLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                        : `-$${Math.abs(entry.gainLoss).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-bold text-lg ${
                        entry.percentGain >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {entry.percentGain >= 0 ? '+' : ''}
                      {entry.percentGain}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

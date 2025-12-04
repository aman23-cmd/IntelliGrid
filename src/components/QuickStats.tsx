import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';

interface QuickStatsProps {
  totalUsage: number;
  avgDailyUsage: number;
  currentMonthUsage: number;
  previousMonthUsage: number;
  totalEntries: number;
}

export function QuickStats({ 
  totalUsage, 
  avgDailyUsage, 
  currentMonthUsage,
  previousMonthUsage,
  totalEntries 
}: QuickStatsProps) {
  const monthlyChange = previousMonthUsage > 0 
    ? ((currentMonthUsage - previousMonthUsage) / previousMonthUsage) * 100 
    : 0;
  
  const isImprovement = monthlyChange < 0;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-blue-50 to-purple-50 mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white/80 rounded-lg backdrop-blur-sm border border-cyan-200">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-cyan-100 rounded-full">
                <Activity className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-cyan-600">{totalUsage.toFixed(0)}</p>
            <p className="text-xs text-gray-600 mt-1">Total kWh</p>
          </div>

          <div className="text-center p-4 bg-white/80 rounded-lg backdrop-blur-sm border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{avgDailyUsage.toFixed(1)}</p>
            <p className="text-xs text-gray-600 mt-1">Avg Daily kWh</p>
          </div>

          <div className="text-center p-4 bg-white/80 rounded-lg backdrop-blur-sm border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{currentMonthUsage.toFixed(0)}</p>
            <p className="text-xs text-gray-600 mt-1">This Month</p>
          </div>

          <div className="text-center p-4 bg-white/80 rounded-lg backdrop-blur-sm border border-emerald-200">
            <div className="flex items-center justify-center mb-2">
              <div className={`p-2 rounded-full ${isImprovement ? 'bg-green-100' : 'bg-orange-100'}`}>
                {isImprovement ? (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                )}
              </div>
            </div>
            <p className={`text-2xl font-bold ${isImprovement ? 'text-green-600' : 'text-orange-600'}`}>
              {isImprovement ? '' : '+'}{monthlyChange.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">vs Last Month</p>
          </div>
        </div>

        {totalEntries > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              📊 Tracking <span className="font-semibold text-purple-600">{totalEntries}</span> energy usage records
              {isImprovement && monthlyChange !== 0 && (
                <span className="ml-2 text-green-600 font-semibold">
                  🎉 Great job! You've reduced consumption by {Math.abs(monthlyChange).toFixed(1)}% this month!
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

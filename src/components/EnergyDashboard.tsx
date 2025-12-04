import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, DollarSign, TrendingUp, Bot, Plus, Download } from 'lucide-react';
import { EnergyInputForm } from './EnergyInputForm';
import { BillCalculator } from './BillCalculator';
import { EnergySavingBot } from './EnergySavingBot';
import { EnergyAssistantChatbot } from './EnergyAssistantChatbot';
import { toast } from 'sonner@2.0.3';
import { DarkModeToggle } from './DarkModeToggle';
import { EnergyGoals } from './EnergyGoals';
import { UsageAlerts } from './UsageAlerts';
import { SystemHealthCheck } from './SystemHealthCheck';
import { DataBackup } from './DataBackup';
import { QuickStats } from './QuickStats';
import { BluetoothDeviceManager } from './BluetoothDeviceManager';
import { VoiceAssistant } from './VoiceAssistant';
import { BrowserCompatibility } from './BrowserCompatibility';
import { GeminiSetupBanner } from './GeminiSetupBanner';

// Lazy load 3D component to prevent Three.js duplication
const Energy3DVisualization = lazy(() => import('./Energy3DVisualization').then(module => ({ default: module.Energy3DVisualization })));

// ChatbotToggle component
function ChatbotToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 ${
        isOpen 
          ? 'bg-gradient-to-br from-red-500 to-pink-500' 
          : 'bg-gradient-to-br from-blue-500 to-cyan-500 chatbot-glow'
      }`}
      aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
    >
      {isOpen ? (
        <span className="text-2xl">✕</span>
      ) : (
        <span className="text-3xl animate-bounce">🤖</span>
      )}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></span>
      )}
    </button>
  );
}

interface EnergyData {
  userId: string;
  date: string;
  usage: number;
  appliance: string;
  cost: number;
  timestamp: string;
}

interface PredictionData {
  date: string;
  predictedUsage: number;
}

export function EnergyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInputForm, setShowInputForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    checkUser();
    fetchEnergyData();
    fetchPredictions();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);
  };

  const fetchEnergyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No access token available, skipping energy data fetch');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/energy-usage`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        setEnergyData(result.data || []);
      } else {
        console.error('Failed to load energy data:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch energy data:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No access token available, skipping predictions fetch');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/predict-usage`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (response.ok && result.predictions) {
        setPredictions(result.predictions);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      // Don't show error toast for predictions as it's not critical
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleDataAdded = () => {
    fetchEnergyData();
    fetchPredictions();
    setShowInputForm(false);
    toast.success('Energy usage added successfully! 🎉');
  };

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const exportData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      toast.loading('Generating CSV export...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/export-csv`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'energy-usage.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('CSV exported successfully! 📥');
      } else {
        toast.error('Failed to export CSV');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  // Process data for charts
  const dailyUsageData = energyData
    .slice(0, 30)
    .reverse()
    .map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      usage: item.usage,
      cost: item.cost
    }));

  const applianceData = energyData.reduce((acc, item) => {
    const existing = acc.find(a => a.appliance === item.appliance);
    if (existing) {
      existing.usage += item.usage;
    } else {
      acc.push({ appliance: item.appliance, usage: item.usage });
    }
    return acc;
  }, [] as { appliance: string; usage: number }[]);

  const combinedChartData = dailyUsageData.map(day => {
    const prediction = predictions.find(p => 
      new Date(p.date).toLocaleDateString() === day.date
    );
    return {
      ...day,
      predicted: prediction?.predictedUsage || null
    };
  });

  const totalUsage = energyData.reduce((sum, item) => sum + item.usage, 0);
  const totalCost = energyData.reduce((sum, item) => sum + item.cost, 0);
  const avgDailyUsage = totalUsage / Math.max(energyData.length, 1);
  
  // Calculate current month usage for goals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthUsage = energyData
    .filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + item.usage, 0);
  
  // Calculate today's usage for alerts
  const today = new Date().toISOString().split('T')[0];
  const currentDailyUsage = energyData
    .filter(item => item.date.startsWith(today))
    .reduce((sum, item) => sum + item.usage, 0);
  
  // Calculate previous month usage for comparison
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const previousMonthUsage = energyData
    .filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
    })
    .reduce((sum, item) => sum + item.usage, 0);

  const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading Smart Energy Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20" 
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1662601311311-c4422d17abf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbmVyZ3klMjBkYXNoYm9hcmQlMjBzb2xhciUyMHBhbmVsc3xlbnwxfHx8fDE3NTk5Mjk5MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
          }}
        ></div>
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">⚡ Smart Energy Dashboard</h1>
              <p className="text-cyan-100 text-lg">Welcome back, {user?.user_metadata?.name || user?.email}</p>
              <p className="text-cyan-200 text-sm mt-1">Monitor, analyze, and optimize your energy consumption</p>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <Button 
                onClick={() => setShowInputForm(true)} 
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add Usage
              </Button>
              <Button 
                variant="outline" 
                onClick={exportData} 
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Quick Stats Overview */}
        <QuickStats
          totalUsage={totalUsage}
          avgDailyUsage={avgDailyUsage}
          currentMonthUsage={currentMonthUsage}
          previousMonthUsage={previousMonthUsage}
          totalEntries={energyData.length}
        />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-800">Total Usage</CardTitle>
              <div className="p-2 bg-cyan-500 rounded-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-900">{totalUsage.toFixed(1)} kWh</div>
              <p className="text-xs text-cyan-600">
                {energyData.length} entries recorded
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Total Cost</CardTitle>
              <div className="p-2 bg-emerald-500 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">${totalCost.toFixed(2)}</div>
              <p className="text-xs text-emerald-600">
                Estimated electricity cost
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Daily Average</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{avgDailyUsage.toFixed(1)} kWh</div>
              <p className="text-xs text-blue-600">
                Average per day
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Efficiency</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgDailyUsage < 25 ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    🌟 Excellent
                  </Badge>
                ) : avgDailyUsage < 40 ? (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                    ⚡ Average
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                    🔥 High
                  </Badge>
                )}
              </div>
              <p className="text-xs text-purple-600">
                Energy efficiency rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Energy Goals and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EnergyGoals 
            userId={user?.id} 
            currentMonthUsage={currentMonthUsage}
          />
          <UsageAlerts 
            userId={user?.id}
            currentDailyUsage={currentDailyUsage}
          />
        </div>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-lg border-0 p-1">
            <TabsTrigger value="usage" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              📊 Usage Trends
            </TabsTrigger>
            <TabsTrigger value="3d" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white">
              🎬 3D View
            </TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              📱 Devices
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              🎤 Voice
            </TabsTrigger>
            <TabsTrigger value="appliances" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
              🏠 Appliances
            </TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white">
              🔮 Predictions
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              💰 Billing
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
              💡 Energy Tips
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              ⚙️ Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-cyan-50">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Daily Energy Usage
                </CardTitle>
                <CardDescription className="text-cyan-100">
                  Track your energy consumption over time with smart analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyUsageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                      <XAxis dataKey="date" stroke="#0891b2" />
                      <YAxis stroke="#0891b2" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #0891b2',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="url(#usageGradient)" 
                        strokeWidth={3}
                        name="Usage (kWh)"
                        dot={{ fill: '#0891b2', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#0891b2' }}
                      />
                      <defs>
                        <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0891b2" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="3d">
            <Suspense fallback={
              <Card className="overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-cyan-500" />
                    <h3>3D Energy Visualization</h3>
                  </div>
                </div>
                <div className="h-96 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p>Loading 3D Visualization...</p>
                  </div>
                </div>
              </Card>
            }>
              <Energy3DVisualization currentUsage={currentDailyUsage} />
            </Suspense>
          </TabsContent>

          <TabsContent value="devices">
            <BluetoothDeviceManager />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceAssistant 
              currentUsage={currentDailyUsage} 
              monthlyAverage={avgDailyUsage}
            />
          </TabsContent>

          <TabsContent value="appliances">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    🏠 Usage by Appliance
                  </CardTitle>
                  <CardDescription className="text-emerald-100">Energy consumption breakdown</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={applianceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                        <XAxis dataKey="appliance" stroke="#059669" />
                        <YAxis stroke="#059669" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #059669',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="usage" fill="url(#applianceGradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="applianceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    🥧 Appliance Distribution
                  </CardTitle>
                  <CardDescription className="text-blue-100">Percentage breakdown</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applianceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ appliance, percent }) => `${appliance} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="usage"
                        >
                          {applianceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#eff6ff',
                            border: '1px solid #2563eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  🔮 AI Usage Predictions
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Smart AI-powered predictions for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {predictions.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                        <XAxis dataKey="date" stroke="#7c3aed" />
                        <YAxis stroke="#7c3aed" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#faf5ff',
                            border: '1px solid #7c3aed',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="usage" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          name="Actual Usage (kWh)"
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          strokeDasharray="8 4"
                          name="🤖 AI Predicted Usage (kWh)"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-xl">
                      <div className="text-6xl mb-4">🤖</div>
                      <h3 className="text-xl font-semibold text-purple-800 mb-2">AI Learning Mode</h3>
                      <p className="text-purple-600">
                        Our AI needs at least 7 days of data to generate accurate predictions
                      </p>
                      <p className="text-sm text-purple-500 mt-2">
                        Keep adding your energy usage data to unlock smart predictions!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <BillCalculator />
          </TabsContent>

          <TabsContent value="tips">
            <EnergySavingBot />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemHealthCheck />
              
              <BrowserCompatibility />
              
              <DataBackup 
                energyData={energyData}
                onRestoreComplete={() => {
                  fetchEnergyData();
                  fetchPredictions();
                }}
              />
              
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    App Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Version</span>
                    <Badge className="bg-purple-500">v3.0.0</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Total Entries</span>
                    <Badge className="bg-cyan-500">{energyData.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Account</span>
                    <span className="text-sm font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm font-medium">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-3">
                    <p className="text-xs text-gray-600 bg-purple-100 p-3 rounded-lg">
                      💡 <strong>Tip:</strong> Check the System Health regularly to ensure 
                      all services are running smoothly. Enable dark mode for comfortable viewing 
                      at night, and set energy goals to track your progress!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Energy Input Form Modal */}
      {showInputForm && (
        <EnergyInputForm
          onClose={() => setShowInputForm(false)}
          onDataAdded={handleDataAdded}
        />
      )}

      {/* Floating Chatbot */}
      <ChatbotToggle 
        onClick={toggleChatbot} 
        isOpen={showChatbot}
      />
      
      <EnergyAssistantChatbot
        isOpen={showChatbot}
        onToggle={toggleChatbot}
      />
    </div>
  );
}
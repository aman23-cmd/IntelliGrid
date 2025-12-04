import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bot, Lightbulb, RefreshCw, Leaf } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export function EnergySavingBot() {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No active session');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/energy-tips`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setTips(result.tips || []);
      } else {
        console.error('Failed to fetch tips:', result.error);
      }
    } catch (error) {
      console.error('Tips fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const energySavingActions = [
    {
      title: "Switch to LED Bulbs",
      description: "Replace incandescent bulbs with LEDs",
      savings: "Up to 80% less energy",
      difficulty: "Easy",
      color: "green"
    },
    {
      title: "Adjust Thermostat",
      description: "Set 2-3°F higher in summer, lower in winter",
      savings: "10-15% on heating/cooling",
      difficulty: "Easy",
      color: "blue"
    },
    {
      title: "Unplug Electronics",
      description: "Eliminate phantom power drain",
      savings: "5-10% on electricity bill",
      difficulty: "Easy",
      color: "yellow"
    },
    {
      title: "Use Smart Power Strips",
      description: "Automatically cut power to standby devices",
      savings: "Up to $100/year",
      difficulty: "Medium",
      color: "purple"
    },
    {
      title: "Upgrade to ENERGY STAR",
      description: "Replace old appliances with efficient models",
      savings: "20-50% per appliance",
      difficulty: "Hard",
      color: "red"
    },
    {
      title: "Install Programmable Thermostat",
      description: "Automatically adjust temperature when away",
      savings: "10-23% on heating/cooling",
      difficulty: "Medium",
      color: "indigo"
    }
  ];

  const getBadgeColor = (color: string) => {
    const colors = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      purple: "bg-purple-100 text-purple-800",
      red: "bg-red-100 text-red-800",
      indigo: "bg-indigo-100 text-indigo-800"
    };
    return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Energy Assistant
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Smart Recommendations</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTips}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Tips
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : tips.length > 0 ? (
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-800">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Add some energy usage data to get personalized tips!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Energy Saving Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Energy Saving Actions
          </CardTitle>
          <CardDescription>
            Proven strategies to reduce your energy consumption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {energySavingActions.map((action, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <Badge className={getDifficultyColor(action.difficulty)}>
                    {action.difficulty}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {action.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge className={getBadgeColor(action.color)}>
                    {action.savings}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Leaf className="h-3 w-3" />
                    Eco-friendly
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Energy Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">💡</div>
              <h4 className="font-semibold text-sm mb-1">LED Lighting</h4>
              <p className="text-xs text-muted-foreground">Use 75% less energy than incandescent</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🌡️</div>
              <h4 className="font-semibold text-sm mb-1">Smart Thermostat</h4>
              <p className="text-xs text-muted-foreground">Save 10-23% on heating & cooling</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">🔌</div>
              <h4 className="font-semibold text-sm mb-1">Unplug Devices</h4>
              <p className="text-xs text-muted-foreground">Reduce phantom power consumption</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🏠</div>
              <h4 className="font-semibold text-sm mb-1">Insulation</h4>
              <p className="text-xs text-muted-foreground">Keep conditioned air inside</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl mb-2">🌅</div>
              <h4 className="font-semibold text-sm mb-1">Solar Power</h4>
              <p className="text-xs text-muted-foreground">Generate your own clean energy</p>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-sm mb-1">Energy Star</h4>
              <p className="text-xs text-muted-foreground">Choose certified efficient appliances</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
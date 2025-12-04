import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UsageAlertsProps {
  userId: string;
  currentDailyUsage: number;
}

export function UsageAlerts({ userId, currentDailyUsage }: UsageAlertsProps) {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [threshold, setThreshold] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    if (userId) {
      loadAlertSettings();
    } else {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkThreshold();
  }, [currentDailyUsage, threshold, alertsEnabled]);

  const loadAlertSettings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/alert-settings/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlertsEnabled(data.enabled || false);
        setThreshold(data.threshold || 50);
      }
    } catch (error) {
      console.error('Error loading alert settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAlertSettings = async (enabled: boolean, thresholdValue: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/alert-settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            enabled,
            threshold: thresholdValue,
          }),
        }
      );

      if (response.ok) {
        toast.success('Alert settings saved! 🔔');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving alert settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const checkThreshold = () => {
    if (alertsEnabled && currentDailyUsage > threshold && !hasAlert) {
      setHasAlert(true);
      toast.warning(
        `⚠️ High Energy Usage Alert!\nYour daily usage (${currentDailyUsage.toFixed(1)} kWh) has exceeded the threshold (${threshold} kWh)`,
        {
          duration: 5000,
        }
      );
    } else if (currentDailyUsage <= threshold) {
      setHasAlert(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setAlertsEnabled(checked);
    await saveAlertSettings(checked, threshold);
    
    if (checked) {
      toast.success('Usage alerts enabled! 🔔');
    } else {
      toast.info('Usage alerts disabled');
    }
  };

  const handleThresholdChange = async (value: string) => {
    const newThreshold = parseFloat(value);
    if (!isNaN(newThreshold) && newThreshold > 0) {
      setThreshold(newThreshold);
    }
  };

  const handleSaveThreshold = async () => {
    await saveAlertSettings(alertsEnabled, threshold);
  };

  if (loading) {
    return (
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </CardHeader>
      </Card>
    );
  }

  const isOverThreshold = alertsEnabled && currentDailyUsage > threshold;

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${alertsEnabled ? 'bg-orange-500' : 'bg-gray-400'}`}>
              {alertsEnabled ? (
                <Bell className="w-5 h-5 text-white" />
              ) : (
                <BellOff className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Usage Alerts</CardTitle>
              <CardDescription>Get notified when usage is high</CardDescription>
            </div>
          </div>
          <Switch
            checked={alertsEnabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="threshold" className="text-sm font-medium">
            Daily Threshold (kWh)
          </Label>
          <div className="flex gap-2">
            <Input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              disabled={!alertsEnabled}
              className="bg-white"
              min="0"
              step="1"
            />
            <Button
              onClick={handleSaveThreshold}
              disabled={!alertsEnabled}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Save
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Today's Usage</span>
            <Badge
              variant={isOverThreshold ? 'destructive' : 'default'}
              className={isOverThreshold ? 'bg-red-500' : 'bg-green-500'}
            >
              {currentDailyUsage.toFixed(1)} kWh
            </Badge>
          </div>
          
          {alertsEnabled && (
            <div className="mt-3">
              {isOverThreshold ? (
                <div className="flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Threshold Exceeded!</p>
                    <p className="text-xs text-red-700">
                      {(currentDailyUsage - threshold).toFixed(1)} kWh over your daily limit
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-green-100 border border-green-300 rounded-lg p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Looking good! ✓</p>
                    <p className="text-xs text-green-700">
                      {(threshold - currentDailyUsage).toFixed(1)} kWh remaining today
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!alertsEnabled && (
          <p className="text-sm text-gray-500 text-center italic">
            Enable alerts to monitor your daily energy usage
          </p>
        )}
      </CardContent>
    </Card>
  );
}

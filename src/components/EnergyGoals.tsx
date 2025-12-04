import { useState, useEffect } from 'react';
import { Target, TrendingDown, Award, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface EnergyGoalsProps {
  userId: string;
  currentMonthUsage: number;
}

export function EnergyGoals({ userId, currentMonthUsage }: EnergyGoalsProps) {
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadGoal();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadGoal = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/energy-goal/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMonthlyGoal(data.goal || 0);
      }
    } catch (error) {
      console.error('Error loading energy goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = async () => {
    const newGoal = parseFloat(editValue);
    
    if (isNaN(newGoal) || newGoal <= 0) {
      toast.error('Please enter a valid goal (greater than 0)');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/energy-goal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            goal: newGoal,
          }),
        }
      );

      if (response.ok) {
        setMonthlyGoal(newGoal);
        setIsEditing(false);
        toast.success('Energy goal updated successfully! 🎯');
      } else {
        toast.error('Failed to save goal. Please try again.');
      }
    } catch (error) {
      console.error('Error saving energy goal:', error);
      toast.error('Failed to save goal. Please try again.');
    }
  };

  const handleEdit = () => {
    setEditValue(monthlyGoal.toString());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </CardHeader>
      </Card>
    );
  }

  const usagePercentage = monthlyGoal > 0 ? (currentMonthUsage / monthlyGoal) * 100 : 0;
  const isOnTrack = usagePercentage <= 100;
  const remainingUsage = monthlyGoal - currentMonthUsage;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Monthly Energy Goal</CardTitle>
            <CardDescription>Track and manage your consumption target</CardDescription>
          </div>
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="hover:bg-purple-100"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter monthly goal (kWh)"
                className="bg-white"
                min="0"
                step="0.1"
              />
              <Button
                onClick={saveGoal}
                size="icon"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleCancel}
                size="icon"
                variant="outline"
                className="hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : monthlyGoal > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <Badge
                  variant={isOnTrack ? 'default' : 'destructive'}
                  className={isOnTrack ? 'bg-green-500' : 'bg-red-500'}
                >
                  {usagePercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress
                value={Math.min(usagePercentage, 100)}
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Current Usage</p>
                <p className="text-xl font-bold text-purple-600">
                  {currentMonthUsage.toFixed(1)} kWh
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Monthly Goal</p>
                <p className="text-xl font-bold text-purple-600">
                  {monthlyGoal.toFixed(1)} kWh
                </p>
              </div>
            </div>

            {isOnTrack ? (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-start gap-2">
                <Award className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Great job! 🎉</p>
                  <p className="text-xs text-green-700">
                    You have {remainingUsage.toFixed(1)} kWh remaining this month
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 flex items-start gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Goal exceeded</p>
                  <p className="text-xs text-orange-700">
                    You're {Math.abs(remainingUsage).toFixed(1)} kWh over your monthly goal
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-3">No goal set yet</p>
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Set Your Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

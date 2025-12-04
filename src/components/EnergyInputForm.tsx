import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface EnergyInputFormProps {
  onClose: () => void;
  onDataAdded: () => void;
}

export function EnergyInputForm({ onClose, onDataAdded }: EnergyInputFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    usage: '',
    appliance: '',
    cost: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const appliances = [
    'HVAC',
    'Water Heater',
    'Lighting',
    'Refrigerator',
    'Washer/Dryer',
    'Electronics',
    'Kitchen Appliances',
    'General'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.usage || !formData.appliance) {
      const errorMsg = 'Please fill in all required fields';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    const usageValue = parseFloat(formData.usage);
    if (isNaN(usageValue) || usageValue <= 0) {
      const errorMsg = 'Please enter a valid usage value (greater than 0)';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (usageValue > 10000) {
      const errorMsg = 'Usage value seems unusually high. Please check your input.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    const costValue = formData.cost ? parseFloat(formData.cost) : 0;
    if (isNaN(costValue) || costValue < 0) {
      const errorMsg = 'Please enter a valid cost value';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const errorMsg = 'You must be logged in to add energy usage';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/energy-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to add energy usage';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success('Energy usage added successfully! ⚡');
      onDataAdded();
    } catch (err) {
      const errorMsg = 'Failed to add energy usage. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Energy usage add error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-0 shadow-2xl bg-gradient-to-br from-white to-cyan-50">
        <DialogHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            ⚡ Add Energy Usage
          </DialogTitle>
          <DialogDescription className="text-cyan-100">
            🏠 Record your energy consumption for smart tracking and analysis
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-700 font-medium">📅 Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              className="border-2 border-cyan-200 focus:border-cyan-500 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage" className="text-gray-700 font-medium">⚡ Energy Usage (kWh) *</Label>
            <Input
              id="usage"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 25.5"
              value={formData.usage}
              onChange={(e) => handleChange('usage', e.target.value)}
              required
              className="border-2 border-cyan-200 focus:border-cyan-500 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appliance" className="text-gray-700 font-medium">🏠 Appliance/Category *</Label>
            <Select 
              value={formData.appliance} 
              onValueChange={(value) => handleChange('appliance', value)}
            >
              <SelectTrigger className="border-2 border-cyan-200 focus:border-cyan-500 rounded-lg">
                <SelectValue placeholder="🔌 Select appliance category" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm">
                {appliances.map((appliance) => (
                  <SelectItem key={appliance} value={appliance} className="hover:bg-cyan-50">
                    {appliance === 'HVAC' && '❄️'} 
                    {appliance === 'Water Heater' && '🚿'} 
                    {appliance === 'Lighting' && '💡'} 
                    {appliance === 'Refrigerator' && '🧊'} 
                    {appliance === 'Washer/Dryer' && '👕'} 
                    {appliance === 'Electronics' && '📺'} 
                    {appliance === 'Kitchen Appliances' && '🍳'} 
                    {appliance === 'General' && '🏠'} {appliance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost" className="text-gray-700 font-medium">💰 Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 3.25 (optional)"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              className="border-2 border-cyan-200 focus:border-cyan-500 rounded-lg"
            />
            <p className="text-xs text-cyan-600 bg-cyan-50 p-2 rounded-md">
              💡 Optional - leave blank for automatic calculation based on usage
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium"
            >
              ❌ Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  ✅ Add Usage
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
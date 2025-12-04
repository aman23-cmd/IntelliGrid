import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calculator, FileText, DollarSign } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface BillData {
  month: number;
  year: number;
  totalUsage: number;
  ratePerKwh: number;
  estimatedCost: number;
  entriesCount: number;
}

export function BillCalculator() {
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    ratePerKwh: 0.12
  });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const calculateBill = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No active session');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/calculate-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setBillData(result.bill);
      } else {
        console.error('Failed to calculate bill:', result.error);
      }
    } catch (error) {
      console.error('Bill calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Monthly Bill Calculator
          </CardTitle>
          <CardDescription>
            Calculate your estimated electricity bill based on usage data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select 
                value={formData.month.toString()} 
                onValueChange={(value) => handleChange('month', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select 
                value={formData.year.toString()} 
                onValueChange={(value) => handleChange('year', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rate per kWh ($)</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={formData.ratePerKwh}
                onChange={(e) => handleChange('ratePerKwh', parseFloat(e.target.value) || 0)}
                placeholder="0.12"
              />
            </div>
          </div>

          <Button onClick={calculateBill} disabled={loading} className="w-full">
            {loading ? 'Calculating...' : 'Calculate Bill'}
          </Button>
        </CardContent>
      </Card>

      {billData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bill Summary - {months.find(m => m.value === billData.month)?.label} {billData.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Usage</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {billData.totalUsage.toFixed(1)} kWh
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Rate</p>
                    <p className="text-2xl font-bold text-green-800">
                      ${billData.ratePerKwh.toFixed(3)} /kWh
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Data Points</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {billData.entriesCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Estimated Cost</p>
                    <p className="text-2xl font-bold text-red-800 flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      {billData.estimatedCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Bill Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Energy Consumption:</span>
                  <span>{billData.totalUsage.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate per kWh:</span>
                  <span>${billData.ratePerKwh.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total Estimated Cost:</span>
                  <span>${billData.estimatedCost.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * This is an estimate based on your recorded usage data. Actual bills may vary due to taxes, fees, and utility company rates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
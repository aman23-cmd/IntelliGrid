import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Upload, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface DataBackupProps {
  energyData: any[];
  onRestoreComplete?: () => void;
}

export function DataBackup({ energyData, onRestoreComplete }: DataBackupProps) {
  const [loading, setLoading] = useState(false);

  const handleBackup = () => {
    try {
      if (energyData.length === 0) {
        toast.error('No data to backup');
        return;
      }

      const backupData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        dataCount: energyData.length,
        data: energyData,
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `energy-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Backup created successfully! ${energyData.length} entries backed up 💾`);
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backupData = JSON.parse(content);

          // Validate backup data
          if (!backupData.data || !Array.isArray(backupData.data)) {
            toast.error('Invalid backup file format');
            return;
          }

          toast.loading(`Restoring ${backupData.dataCount} entries...`);

          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            toast.error('You must be logged in to restore data');
            return;
          }

          // Restore each entry
          let successCount = 0;
          let errorCount = 0;

          for (const entry of backupData.data) {
            try {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/energy-usage`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    date: entry.date,
                    usage: entry.usage,
                    appliance: entry.appliance,
                    cost: entry.cost || 0,
                  }),
                }
              );

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              errorCount++;
              console.error('Error restoring entry:', error);
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully restored ${successCount} entries! 🎉`);
            onRestoreComplete?.();
          }

          if (errorCount > 0) {
            toast.warning(`${errorCount} entries failed to restore`);
          }
        } catch (error) {
          console.error('Restore parsing error:', error);
          toast.error('Failed to parse backup file');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read backup file');
        setLoading(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore data');
      setLoading(false);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Data Backup & Restore</CardTitle>
            <CardDescription>Backup your data or restore from a previous backup</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Download className="h-4 w-4 text-indigo-500" />
            Backup Your Data
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Download a complete backup of your energy usage data as JSON
          </p>
          <Button
            onClick={handleBackup}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white gap-2"
            disabled={energyData.length === 0}
          >
            <Download className="h-4 w-4" />
            Download Backup ({energyData.length} entries)
          </Button>
        </div>

        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Upload className="h-4 w-4 text-indigo-500" />
            Restore From Backup
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Upload a backup file to restore your energy data
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={loading}
              className="hidden"
              id="restore-input"
            />
            <label htmlFor="restore-input">
              <Button
                as="span"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2 cursor-pointer"
                disabled={loading}
              >
                <Upload className="h-4 w-4" />
                {loading ? 'Restoring...' : 'Upload Backup File'}
              </Button>
            </label>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Important Notes:</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Backup files are stored locally on your device</li>
                <li>• Restore will add entries (not replace existing data)</li>
                <li>• Keep backups in a safe location</li>
                <li>• Recommended: Create weekly backups</li>
              </ul>
            </div>
          </div>
        </div>

        {energyData.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Data Status: Active</p>
                <p className="text-xs text-green-700">
                  {energyData.length} energy usage entries are currently stored
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

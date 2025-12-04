import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  Power,
  Wifi,
  Zap,
  RefreshCw,
  Trash2,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface ConnectedDevice {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  powerUsage: number;
  isOn: boolean;
  batteryLevel?: number;
  lastSeen: Date;
}

export function BluetoothDeviceManager() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  useEffect(() => {
    // Check if Web Bluetooth API is supported
    if (!navigator.bluetooth) {
      setIsBluetoothSupported(false);
      toast.error('Bluetooth not supported', {
        description: 'Your browser does not support Web Bluetooth API',
      });
    }

    // Load saved devices from localStorage
    const savedDevices = localStorage.getItem('bluetooth-devices');
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices));
    }
  }, []);

  useEffect(() => {
    // Save devices to localStorage
    if (devices.length > 0) {
      localStorage.setItem('bluetooth-devices', JSON.stringify(devices));
    }
  }, [devices]);

  const scanForDevices = async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth not available');
      return;
    }

    setIsScanning(true);
    
    try {
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      });

      if (device) {
        // Create a new device entry
        const newDevice: ConnectedDevice = {
          id: device.id,
          name: device.name || 'Unknown Device',
          type: detectDeviceType(device.name || ''),
          status: 'connected',
          powerUsage: Math.random() * 5, // Simulated power usage
          isOn: true,
          lastSeen: new Date(),
        };

        // Check if device already exists
        const existingDeviceIndex = devices.findIndex(d => d.id === device.id);
        
        if (existingDeviceIndex >= 0) {
          // Update existing device
          setDevices(prev => {
            const updated = [...prev];
            updated[existingDeviceIndex] = { ...updated[existingDeviceIndex], ...newDevice };
            return updated;
          });
          toast.success('Device reconnected', {
            description: `${newDevice.name} is now connected`,
          });
        } else {
          // Add new device
          setDevices(prev => [...prev, newDevice]);
          toast.success('Device connected', {
            description: `${newDevice.name} has been added`,
          });
        }

        // Try to connect to GATT server
        try {
          const server = await device.gatt?.connect();
          console.log('GATT Server connected:', server);
          
          // Try to read battery level if available
          try {
            const batteryService = await server?.getPrimaryService('battery_service');
            const batteryLevel = await batteryService?.getCharacteristic('battery_level');
            const value = await batteryLevel?.readValue();
            if (value) {
              const battery = value.getUint8(0);
              setDevices(prev => prev.map(d => 
                d.id === device.id ? { ...d, batteryLevel: battery } : d
              ));
            }
          } catch (e) {
            console.log('Battery service not available');
          }
        } catch (error) {
          console.log('GATT connection failed:', error);
        }

        setShowConnectDialog(false);
      }
    } catch (error: any) {
      console.error('Bluetooth scan error:', error);
      if (error.message.includes('User cancelled')) {
        toast.info('Device selection cancelled');
      } else {
        toast.error('Failed to connect', {
          description: error.message,
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const detectDeviceType = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('bulb') || lowerName.includes('light')) return 'light';
    if (lowerName.includes('plug') || lowerName.includes('socket')) return 'plug';
    if (lowerName.includes('thermostat') || lowerName.includes('temp')) return 'thermostat';
    if (lowerName.includes('fan')) return 'fan';
    if (lowerName.includes('tv') || lowerName.includes('television')) return 'tv';
    return 'appliance';
  };

  const toggleDevice = (deviceId: string) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        const newIsOn = !device.isOn;
        toast.success(
          `${device.name} turned ${newIsOn ? 'on' : 'off'}`,
          {
            description: `Power usage: ${newIsOn ? device.powerUsage.toFixed(2) : '0.00'} kWh`,
          }
        );
        return {
          ...device,
          isOn: newIsOn,
          powerUsage: newIsOn ? device.powerUsage : 0,
        };
      }
      return device;
    }));
  };

  const removeDevice = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    toast.info('Device removed', {
      description: `${device?.name} has been disconnected`,
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light': return '💡';
      case 'plug': return '🔌';
      case 'thermostat': return '🌡️';
      case 'fan': return '🌀';
      case 'tv': return '📺';
      default: return '⚡';
    }
  };

  const totalPowerUsage = devices.reduce((sum, device) => sum + (device.isOn ? device.powerUsage : 0), 0);
  const connectedCount = devices.filter(d => d.status === 'connected').length;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BluetoothConnected className="h-5 w-5 text-blue-500" />
            <h3>Smart Appliances</h3>
          </div>
          <Button size="sm" onClick={() => setShowConnectDialog(true)} disabled={!isBluetoothSupported}>
            <Bluetooth className="h-4 w-4 mr-2" />
            Connect Device
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            <p className="text-xl font-semibold">{connectedCount}</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Total Power</span>
            </div>
            <p className="text-xl font-semibold">{totalPowerUsage.toFixed(2)} kWh</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <Bluetooth className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-2">No devices connected</p>
              <p className="text-xs text-muted-foreground mb-4">
                Connect your smart appliances to monitor their energy usage
              </p>
              <Button size="sm" onClick={() => setShowConnectDialog(true)} disabled={!isBluetoothSupported}>
                <Bluetooth className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          ) : (
            devices.map((device, index) => (
              <div key={device.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getDeviceIcon(device.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium truncate">{device.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={device.status === 'connected' ? 'default' : 'secondary'} className="text-xs">
                            {device.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">{device.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={device.isOn}
                          onCheckedChange={() => toggleDevice(device.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDevice(device.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Power Usage</span>
                        <span className="font-medium">
                          {device.isOn ? device.powerUsage.toFixed(2) : '0.00'} kWh
                        </span>
                      </div>
                      {device.isOn && (
                        <Progress value={(device.powerUsage / 10) * 100} className="h-1.5" />
                      )}
                      
                      {device.batteryLevel !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Battery</span>
                          <span className="font-medium">{device.batteryLevel}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {!isBluetoothSupported && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-t border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Web Bluetooth API is not supported in your browser. Please use Chrome, Edge, or Opera.
          </p>
        </div>
      )}

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Bluetooth Device</DialogTitle>
            <DialogDescription>
              Connect your smart appliances via Bluetooth to monitor and control their energy usage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bluetooth className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Supported Devices</p>
                  <p className="text-xs text-muted-foreground">
                    Smart bulbs, plugs, thermostats, fans, and other Bluetooth-enabled appliances
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={scanForDevices}
              disabled={isScanning || !isBluetoothSupported}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <BluetoothSearching className="h-4 w-4 mr-2 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Scan for Devices
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
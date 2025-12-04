import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Chrome, Info } from 'lucide-react';

export function BrowserCompatibility() {
  const features = [
    {
      name: '3D Visualization',
      icon: '🎬',
      requirements: 'WebGL Support',
      browsers: {
        chrome: 'full',
        edge: 'full',
        firefox: 'full',
        safari: 'full',
        opera: 'full',
      },
      notes: 'Requires hardware acceleration enabled',
    },
    {
      name: 'Bluetooth Devices',
      icon: '📱',
      requirements: 'Web Bluetooth API',
      browsers: {
        chrome: 'full',
        edge: 'full',
        firefox: 'none',
        safari: 'none',
        opera: 'full',
      },
      notes: 'Not supported in Firefox and Safari',
    },
    {
      name: 'Voice Assistant',
      icon: '🎤',
      requirements: 'Web Speech API',
      browsers: {
        chrome: 'full',
        edge: 'full',
        firefox: 'none',
        safari: 'partial',
        opera: 'full',
      },
      notes: 'Safari has limited support, Firefox not supported',
    },
    {
      name: 'Core Dashboard',
      icon: '📊',
      requirements: 'Modern Browser',
      browsers: {
        chrome: 'full',
        edge: 'full',
        firefox: 'full',
        safari: 'full',
        opera: 'full',
      },
      notes: 'Fully supported in all modern browsers',
    },
  ];

  const getBrowserIcon = (browser: string) => {
    switch (browser) {
      case 'chrome':
        return <Chrome className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getSupportBadge = (support: string) => {
    switch (support) {
      case 'full':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Full Support
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'none':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Not Supported
          </Badge>
        );
      default:
        return null;
    }
  };

  // Detect current browser
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) return 'chrome';
    if (userAgent.includes('edge')) return 'edge';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('opera') || userAgent.includes('opr')) return 'opera';
    return 'unknown';
  };

  const currentBrowser = detectBrowser();

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Browser Compatibility
        </CardTitle>
        <CardDescription>
          Check which features are supported in your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Browser Alert */}
        <Alert className="bg-blue-100 border-blue-300">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You're currently using:{' '}
            <span className="font-semibold capitalize">{currentBrowser === 'unknown' ? 'Unknown Browser' : currentBrowser}</span>
          </AlertDescription>
        </Alert>

        {/* Recommended Browser */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Recommended Browsers</h4>
          </div>
          <p className="text-sm text-green-700">
            For the best experience with all features, use:{' '}
            <strong>Chrome, Edge, or Opera</strong>
          </p>
        </div>

        {/* Feature Compatibility Table */}
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="text-xl">{feature.icon}</span>
                    {feature.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {feature.requirements}
                  </p>
                </div>
                {getSupportBadge(feature.browsers[currentBrowser as keyof typeof feature.browsers] || 'none')}
              </div>

              <div className="grid grid-cols-5 gap-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Chrome</div>
                  {getSupportBadge(feature.browsers.chrome)}
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Edge</div>
                  {getSupportBadge(feature.browsers.edge)}
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Firefox</div>
                  {getSupportBadge(feature.browsers.firefox)}
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Safari</div>
                  {getSupportBadge(feature.browsers.safari)}
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Opera</div>
                  {getSupportBadge(feature.browsers.opera)}
                </div>
              </div>

              {feature.notes && (
                <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                  ℹ️ {feature.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-2">Why these requirements?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Web Bluetooth API</strong> is a newer web standard not yet adopted by all
              browsers
            </li>
            <li>
              <strong>Web Speech API</strong> requires browser support for speech recognition and
              synthesis
            </li>
            <li>
              <strong>WebGL</strong> is widely supported but requires hardware acceleration
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

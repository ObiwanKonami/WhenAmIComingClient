// app/admin/app-info/page.tsx - DİNAMİK VERİLERLE NİHAİ SÜRÜM
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Code, Globe, BookOpen, HelpCircle, ExternalLink, Copy, Mail, Server, Database, Info, Loader2, AlertCircle
} from 'lucide-react'
import { useMemo, ReactNode } from 'react'
import { toast } from 'sonner'
import { useSystemSettings } from "@/hooks/useApi"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Bilgi satırlarını göstermek için bir arayüz tanımlıyoruz
interface AppInfoItem {
  icon: ReactNode
  label: string
  value: string | ReactNode
  copyable?: boolean
  copyValue?: string |null // Kopyalanacak değeri ayrıca tutmak daha güvenli
}

// Yükleme durumu için iskelet (skeleton) component'i
const InfoRowSkeleton = () => (
  <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-6 w-40" />
  </div>
);

export default function AppInfoPage() {
  // 1. API'den sistem ayarlarını çek
  const { data: settings, isLoading, error: fetchError } = useSystemSettings();

  // 2. Ayarları daha kolay erişilebilir bir Map formatına dönüştür
  const settingsMap = useMemo(() => {
    if (!settings) return new Map<string, string>();
    return new Map(settings.map(s => [s.key, s.value]));
  }, [settings]);

  const handleCopy = async (textToCopy?: string | null) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard.");
    }
  };

  // 3. Bilgi listesini API'den gelen verilerle dinamik olarak oluştur
  const appInfo: AppInfoItem[] = [
    {
      icon: <Info className="h-5 w-5 text-blue-600" />,
      label: "Application Name",
      value: settingsMap.get('AppName') || 'Aoxio',
      copyable: true,
      copyValue: settingsMap.get('AppName')
    },
    {
      icon: <Code className="h-5 w-5 text-blue-600" />,
      label: "Application Version",
      value: (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800">
          {settingsMap.get('AppVersion') || '1.0.0'}
        </Badge>
      ),
    },
    {
      icon: <Globe className="h-5 w-5 text-blue-600" />,
      label: "Domain",
      value: settingsMap.get('SiteUrl') || (typeof window !== 'undefined' ? window.location.origin : ''),
      copyable: true,
      copyValue: settingsMap.get('SiteUrl')
    },
    {
      icon: <Server className="h-5 w-5 text-blue-600" />,
      label: "Server Environment",
      value: <Badge variant="outline">{settingsMap.get('Environment') || 'Unknown'}</Badge>,
    },
    {
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      label: "Documentation",
      value: (
        <Button 
          variant="link" 
          className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
          onClick={() => window.open(settingsMap.get('DocsUrl') || '#', '_blank')}
        >
          View Documentation
          <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      ),
    },
    {
      icon: <HelpCircle className="h-5 w-5 text-blue-600" />,
      label: "Support Email",
      value: (
        <a href={`mailto:${settingsMap.get('SupportEmail')}`} className="text-blue-600 hover:underline">
          {settingsMap.get('SupportEmail') || 'support@example.com'}
        </a>
      ),
      copyable: true,
      copyValue: settingsMap.get('SupportEmail')
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Info</h1>
        <p className="text-muted-foreground">
          Application information and support details
        </p>
      </div>

      {fetchError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{(fetchError as Error).message}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Application Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y dark:divide-gray-800">
            {isLoading ? (
                Array.from({ length: appInfo.length }).map((_, index) => <InfoRowSkeleton key={index} />)
            ) : (
                appInfo.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        {item.value}
                        {item.copyable && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleCopy(item.copyValue)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Bu kartları da ileride dinamik hale getirebilirsin */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">System Requirements</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">.NET Version</span><span className="font-medium">{settingsMap.get('DotNetVersion') ?? '≥ 8.0'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="font-medium">{settingsMap.get('DbProvider') ?? 'PostgreSQL'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Web Server</span><span className="font-medium">{settingsMap.get('WebServer') ?? 'Kestrel'}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Application Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><Badge variant="outline">{settingsMap.get('Environment') ?? 'Production'}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Debug Mode</span><Badge variant={settingsMap.get('DebugMode') === 'true' ? 'destructive' : 'secondary'}>{settingsMap.get('DebugMode') === 'true' ? 'Enabled' : 'Disabled'}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
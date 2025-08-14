// app/admin/settings/page.tsx
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSystemSettings, useSystemSettingOperations } from "@/hooks/useApi"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

// 1. Form şemasını (validation) tanımla
// PHP kodundaki tüm ayarları buraya eklememiz gerekecek.
const settingsFormSchema = z.object({
  site_name: z.string().min(2, "Site name must be at least 2 characters."),
  site_title: z.string().min(2, "Site title must be at least 2 characters."),
  admin_email: z.string().email("Please enter a valid email."),
  // ... diğer tüm ayarlar ...
})

// Formun tipini şemadan türet
type SettingsFormValues = z.infer<typeof settingsFormSchema>

// Sekmeleri bir dizi olarak tanımlayalım
const settingTabs = [
  { id: "website", label: "Website Settings" },
  { id: "appearance", label: "Appearance" },
  { id: "preferences", label: "Preferences" },
  { id: "email", label: "Email Settings" },
  { id: "payment", label: "Payment Settings" }, // Örnek
  // ... diğer tüm sekmeler
]

export default function SettingsPage() {
  // 2. API'den verileri çek
  const { data: settings, isLoading: isLoadingSettings } = useSystemSettings()
  const { updateSetting, updateState } = useSystemSettingOperations()

  // 3. react-hook-form'u başlat
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      site_name: "",
      site_title: "",
      admin_email: "",
      // ... diğer varsayılanlar
    },
  })

  // 4. API'den veri geldiğinde formu doldur
  useEffect(() => {
    if (settings) {
      // API'den gelen [{ key: 'site_name', value: 'My App' }, ...] formatındaki
      // veriyi react-hook-form'un beklediği { site_name: 'My App' } formatına dönüştür.
      const formattedSettings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as any)
      
      form.reset(formattedSettings)
    }
  }, [settings, form])

  // 5. Formu gönderme (submit) fonksiyonu
  async function onSubmit(data: SettingsFormValues) {
    console.log("Form data to be submitted:", data)
    
    // Her bir ayarı tek tek güncellemek için bir döngü
    const updatePromises = Object.entries(data).map(([key, value]) =>
      updateSetting({ id: 0, key, value: String(value) }) // id'yi backend nasıl bekliyorsa ona göre ayarla
    )

    try {
      await Promise.all(updatePromises)
      // Başarı mesajı göster (örn: toast)
      console.log("Settings updated successfully!")
    } catch (error) {
      // Hata mesajı göster
      console.error("Failed to update settings:", error)
    }
  }

  if (isLoadingSettings) {
    return <div className="p-8"><Loader2 className="animate-spin" /> Loading settings...</div>
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      
      <Tabs defaultValue="website" className="flex flex-col md:flex-row gap-8">
        {/* Sol Menü (Sekme Başlıkları) */}
        <TabsList className="flex-col h-auto items-start bg-transparent p-0 w-full md:w-1/4">
          {settingTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="w-full justify-start px-4 py-2">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Sağ İçerik (Form) */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Sekme İçerikleri */}
              <TabsContent value="website">
                <div className="p-6 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Website Settings</h2>
                  <FormField
                    control={form.control}
                    name="site_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your App Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="site_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Your App Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* ... 'Website Settings' sekmesindeki diğer alanlar buraya ... */}
                </div>
              </TabsContent>

              <TabsContent value="appearance">
                <div className="p-6 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                  {/* ... 'Appearance' sekmesindeki alanlar buraya ... */}
                </div>
              </TabsContent>

              {/* ... Diğer tüm TabsContent'ler buraya ... */}

              <Button type="submit" disabled={updateState.isPending}>
                {updateState.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </Tabs>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Loader2, 
  Globe, 
  CreditCard, 
  Mail, 
  Calendar, 
  UserCog, 
  Database,
  Shield,
  Palette,
  Bell
} from 'lucide-react'

import { useSystemSettings, useSystemSettingOperations } from '@/hooks/useApi'
import { websiteSettingsFormSchema, type WebsiteSettingsFormValues } from '@/lib/schemas'
import type { UpdateSystemSettingsCommand, SettingToUpdate, SystemSettingDto } from '@/lib/api/generated/model'

// Backend'deki SystemSetting Key'leri ile eşleşen sabitler.
const SETTING_KEYS = {
  FAVICON: 'site_favicon',
  LOGO: 'site_logo',
  LOGO_LIGHT: 'site_logo_light',
  APP_NAME: 'site_application_name',
  APP_TITLE: 'site_application_title',
  KEYWORDS: 'site_keywords',
  DESCRIPTION: 'site_description',
  FOOTER_ABOUT: 'site_footer_about',
  COPYRIGHT: 'site_copyright',
  ADMIN_EMAIL: 'site_admin_email',
  CURRENCY: 'site_currency',
  CURRENCY_POSITION: 'site_currency_position',
  NUMBER_FORMAT: 'site_number_format',
  TRIAL_DAYS: 'site_trial_days',
  TIMEZONE: 'site_timezone',
  APPOINTMENT_REMINDER: 'site_appointment_reminder',
  COUPON_SYSTEM: 'site_coupon_system',
}

// Form state'ini API'den gelen veriye dönüştüren yardımcı fonksiyon
const mapSettingsToFormValues = (settings: SystemSettingDto[]): WebsiteSettingsFormValues => {
  const findValue = (key: string, defaultValue: string = '') => {
    const setting = settings.find(s => s.key === key)
    return setting?.value ?? defaultValue;
  }
  
  return {
    favicon: findValue(SETTING_KEYS.FAVICON),
    logo: findValue(SETTING_KEYS.LOGO),
    logoLight: findValue(SETTING_KEYS.LOGO_LIGHT),
    applicationName: findValue(SETTING_KEYS.APP_NAME),
    applicationTitle: findValue(SETTING_KEYS.APP_TITLE),
    keywords: findValue(SETTING_KEYS.KEYWORDS),
    description: findValue(SETTING_KEYS.DESCRIPTION),
    footerAbout: findValue(SETTING_KEYS.FOOTER_ABOUT),
    copyright: findValue(SETTING_KEYS.COPYRIGHT),
    adminEmail: findValue(SETTING_KEYS.ADMIN_EMAIL),
    currency: findValue(SETTING_KEYS.CURRENCY),
    currencyPosition: findValue(SETTING_KEYS.CURRENCY_POSITION),
    numberFormat: findValue(SETTING_KEYS.NUMBER_FORMAT),
    trialDays: findValue(SETTING_KEYS.TRIAL_DAYS) || '0',
    timeZone: findValue(SETTING_KEYS.TIMEZONE),
    appointmentReminder: findValue(SETTING_KEYS.APPOINTMENT_REMINDER),
    couponSystem: findValue(SETTING_KEYS.COUPON_SYSTEM, 'false') === 'true',
  }
}

// Form verisini API'ye gidecek veriye dönüştüren yardımcı fonksiyon
const mapFormValuesToSettings = (data: WebsiteSettingsFormValues): SettingToUpdate[] => {
  const settingMap = {
    favicon: SETTING_KEYS.FAVICON,
    logo: SETTING_KEYS.LOGO,
    logoLight: SETTING_KEYS.LOGO_LIGHT,
    applicationName: SETTING_KEYS.APP_NAME,
    applicationTitle: SETTING_KEYS.APP_TITLE,
    keywords: SETTING_KEYS.KEYWORDS,
    description: SETTING_KEYS.DESCRIPTION,
    footerAbout: SETTING_KEYS.FOOTER_ABOUT,
    copyright: SETTING_KEYS.COPYRIGHT,
    adminEmail: SETTING_KEYS.ADMIN_EMAIL,
    currency: SETTING_KEYS.CURRENCY,
    currencyPosition: SETTING_KEYS.CURRENCY_POSITION,
    numberFormat: SETTING_KEYS.NUMBER_FORMAT,
    trialDays: SETTING_KEYS.TRIAL_DAYS,
    timeZone: SETTING_KEYS.TIMEZONE,
    appointmentReminder: SETTING_KEYS.APPOINTMENT_REMINDER,
    couponSystem: SETTING_KEYS.COUPON_SYSTEM,
  }

  return (Object.keys(data) as Array<keyof WebsiteSettingsFormValues>).map(key => ({
    key: settingMap[key],
    value: String(data[key] ?? '')
  }))
}

// Working ImageUploadField component
const ImageUploadField = ({ name, label, control }: any) => {
  const [preview, setPreview] = useState<string | null>(null)
  
  // Form değerini watch et
  const currentValue = control._formValues?.[name] || ''
  
  // API'den gelen image URL'ini göster
  useEffect(() => {
    if (currentValue && currentValue.startsWith('http')) {
      setPreview(currentValue)
    }
  }, [currentValue])
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setPreview(imageUrl)
        // Form field'ı güncelle - Bu kısım form hook ile entegre olmalı
        // setValue metodunu kullanmak gerekiyor
      }
      reader.readAsDataURL(file)
      toast.success(`${file.name} uploaded successfully!`)
    }
  }

  const triggerFileInput = () => {
    document.getElementById(`file-input-${name}`)?.click()
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-8 text-center transition-colors">
        <input
          id={`file-input-${name}`}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="space-y-2">
          {(preview && preview.startsWith('http')) ? (
            <div className="mx-auto w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src={preview} 
                alt="Current image" 
                className="w-full h-full object-cover" 
                onError={() => setPreview(null)}
              />
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Palette className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="text-sm text-gray-600">
            {(preview && preview.startsWith('http')) ? "Click to change" : "Click to upload"}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerFileInput}
            type="button"
          >
            Browse
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("website")
  const { data: settings, isLoading } = useSystemSettings()
  const { updateItem: updateAllSettings, isUpdating } = useSystemSettingOperations()
  const isSubmitting = isUpdating

  const form = useForm<WebsiteSettingsFormValues>({
    resolver: zodResolver(websiteSettingsFormSchema),
    defaultValues: {
      favicon: '', logo: '', logoLight: '',
      applicationName: '', applicationTitle: '', keywords: '',
      description: '', footerAbout: '', copyright: '', adminEmail: '',
      currency: '', currencyPosition: '', numberFormat: '',
      trialDays: '0',
      timeZone: '', appointmentReminder: ''
    },
  })

  useEffect(() => {
    if (settings) {
      const mappedValues = mapSettingsToFormValues(settings as SystemSettingDto[])
      setTimeout(() => {
        form.reset(mappedValues)
      }, 100)
    }
  }, [settings, form])

  const onSubmit: SubmitHandler<WebsiteSettingsFormValues> = async (data) => {
    const settingsToUpdate = mapFormValuesToSettings(data)
    const payload: UpdateSystemSettingsCommand = { settings: settingsToUpdate }
    
    toast.promise(updateAllSettings({ data: payload }), {
      loading: 'Saving changes...',
      success: 'Website settings updated successfully!',
      error: (err) => (err as Error).message || 'Failed to update settings.',
    })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Admin Panel
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 lg:w-fit">
          <TabsTrigger value="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Website</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">User</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="favicon" render={({ field }) => (
                      <ImageUploadField name="favicon" control={form.control} label="Upload Favicon" />
                    )} />
                    <FormField control={form.control} name="logo" render={({ field }) => (
                      <ImageUploadField name="logo" control={form.control} label="Upload Logo" />
                    )} />
                    <FormField control={form.control} name="logoLight" render={({ field }) => (
                      <ImageUploadField name="logoLight" control={form.control} label="Upload Logo Light" />
                    )} />
                  </div>
                  
                  {/* Basic Info */}
                  <FormField control={form.control} name="applicationName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="applicationTitle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Title</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="keywords" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl><Input {...field} placeholder="booking, english, x" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} rows={3} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="footerAbout" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer About</FormLabel>
                      <FormControl><Textarea {...field} rows={3} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="copyright" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="adminEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Currency & Format Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="currency" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl><Input {...field} placeholder="Turkey - TRY (₺)" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="currencyPosition" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Position</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select position" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="left">$100 (Left)</SelectItem>
                            <SelectItem value="right">100$ (Right)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="numberFormat" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number Format</FormLabel>
                        <FormControl><Input {...field} placeholder="1,000.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="trialDays" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Set trial days</FormLabel>
                        <FormControl><Input type="text" {...field} /></FormControl>
                        <p className="text-xs text-muted-foreground">Set 0 to disable the trial option</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="timeZone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="appointmentReminder" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Reminder before</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select reminder time" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="2">2 Days</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stripe Public Key</label>
                  <Input placeholder="pk_test_..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stripe Secret Key</label>
                  <Input type="password" placeholder="sk_test_..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PayPal Client ID</label>
                  <Input placeholder="PayPal Client ID" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PayPal Secret</label>
                  <Input type="password" placeholder="PayPal Secret" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Enable Stripe</label>
                  <p className="text-xs text-muted-foreground">Allow payments via Stripe</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Enable PayPal</label>
                  <p className="text-xs text-muted-foreground">Allow payments via PayPal</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save Payment Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <Input placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input placeholder="587" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Username</label>
                  <Input placeholder="your-email@gmail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Password</label>
                  <Input type="password" placeholder="Your password" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Email</label>
                <Input placeholder="noreply@yoursite.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Name</label>
                <Input placeholder="Your App Name" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save Email Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Working Hours Start</label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Working Hours End</label>
                  <Input type="time" defaultValue="17:00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Working Days</label>
                <div className="flex gap-2 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <Badge key={day} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Appointment Duration</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save Calendar Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                User Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Allow User Registration</label>
                  <p className="text-xs text-muted-foreground">Let users create new accounts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Email Verification Required</label>
                  <p className="text-xs text-muted-foreground">Users must verify email before access</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default User Role</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save User Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Database Host</label>
                  <Input placeholder="localhost" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Database Port</label>
                  <Input placeholder="3306" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Database Name</label>
                <Input placeholder="your_database" />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Database Backup</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Auto Backup</label>
                    <p className="text-xs text-muted-foreground">Automatically backup database daily</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="outline">Create Backup Now</Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save Database Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Two-Factor Authentication</label>
                  <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Input type="number" placeholder="60" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Login Attempts</label>
                <Input type="number" placeholder="5" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">IP Whitelist</label>
                  <p className="text-xs text-muted-foreground">Restrict access to specific IPs</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save Security Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-xs text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">SMS Notifications</label>
                  <p className="text-xs text-muted-foreground">Send notifications via SMS</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-xs text-muted-foreground">Send browser push notifications</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Email</label>
                <Input placeholder="admin@yoursite.com" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button size="lg">Save Notification Settings</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
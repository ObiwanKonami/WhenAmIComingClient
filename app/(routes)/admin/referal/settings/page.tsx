'use client'

import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

import { useSystemSettings, useSystemSettingOperations } from '@/hooks/useApi'
import { affiliateSettingsFormSchema, type AffiliateSettingsFormValues } from '@/lib/schemas'
import type { UpdateSystemSettingsCommand, SettingToUpdate } from '@/lib/api/generated/model'

const SETTING_KEYS = {
  ENABLE_REFERRAL: 'affiliate_enable_referral',
  COMMISSION_RATE: 'affiliate_commission_rate',
  MINIMUM_PAYOUT: 'affiliate_minimum_payout',
  REFERRAL_GUIDELINES: 'affiliate_referral_guidelines',
};

export default function AffiliateSettingsPage() {
  const { data: settings, isLoading } = useSystemSettings();
  const { updateItem: updateAllSettings, isUpdating } = useSystemSettingOperations();
  const isSubmitting = isUpdating;

  const form = useForm<AffiliateSettingsFormValues>({
    resolver: zodResolver(affiliateSettingsFormSchema),
    defaultValues: {
      enableReferral: false,
      commissionRate: '0', 
      minimumPayout: '0',  
      referralGuidelines: '',
    }
  });

  useEffect(() => {
    if (settings) {
      const findValue = (key: string) => settings.find(s => s.key === key)?.value ?? '';
      
      form.reset({
        enableReferral: findValue(SETTING_KEYS.ENABLE_REFERRAL) === 'true',
        // Değerleri doğrudan string olarak atıyoruz
        commissionRate: findValue(SETTING_KEYS.COMMISSION_RATE) || '0',
        minimumPayout: findValue(SETTING_KEYS.MINIMUM_PAYOUT) || '0',
        referralGuidelines: findValue(SETTING_KEYS.REFERRAL_GUIDELINES),
      });
    }
  }, [settings, form.reset]);

  // SubmitHandler tipi artık hata vermeyecek.
  const onSubmit: SubmitHandler<AffiliateSettingsFormValues> = async (data) => {
    // API'ye göndermeden önce string'leri sayıya (veya uygun tipe) çeviriyoruz.
    const settingsToUpdate: SettingToUpdate[] = [
      { key: SETTING_KEYS.ENABLE_REFERRAL, value: String(data.enableReferral) },
      // `data.commissionRate` artık string, `value` da string beklediği için doğrudan atama yapabiliriz.
      { key: SETTING_KEYS.COMMISSION_RATE, value: data.commissionRate },
      { key: SETTING_KEYS.MINIMUM_PAYOUT, value: data.minimumPayout },
      { key: SETTING_KEYS.REFERRAL_GUIDELINES, value: data.referralGuidelines ?? '' },
    ];

    const payload: UpdateSystemSettingsCommand = { settings: settingsToUpdate };

    toast.promise(updateAllSettings({ data: payload }), {
      loading: 'Saving changes...',
      success: 'Settings updated successfully!',
      error: (err) => (err as Error).message || 'Failed to update settings.',
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Affiliate Settings</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <FormField control={form.control} name="enableReferral" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5"><FormLabel className="text-base">Enable Referral</FormLabel></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="commissionRate" render={({ field }) => (
                // Input type="text" olarak değiştirildi, çünkü form state'i string.
                <FormItem><FormLabel>Commission Rate (%)</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="minimumPayout" render={({ field }) => (
                // Input type="text" olarak değiştirildi.
                <FormItem><FormLabel>Minimum Payout</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="referralGuidelines" render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Guidelines</FormLabel>
                  <FormControl><Textarea className="min-h-[150px]" placeholder="Explain the rules of your affiliate program..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
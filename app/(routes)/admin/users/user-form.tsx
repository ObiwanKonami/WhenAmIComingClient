'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

import {
  userFormSchema,
  defaultUserFormValues,
  type UserFormValues,
  SUBSCRIPTION_TYPES,
  PAYMENT_STATUSES_FOR_FORM,
} from '@/lib/schemas';
import type { PlanDto } from '@/lib/api/generated/model';

type Role = { id: number | string; name: string };

// DÜZELTME: initialData'nın tipini daha esnek tutuyoruz, çünkü form doldurma mantığını basitleştireceğiz.
type Props = {
  isSubmitting: boolean;
  onSubmit: (data: UserFormValues) => void | Promise<void>;
  availableRoles: Role[];
  availablePlans: PlanDto[];
  initialData?: Partial<UserFormValues>; // Artık tam UserFormValues bekleyebiliriz.
};

export function UserForm({ isSubmitting, onSubmit, availableRoles, availablePlans, initialData }: Props) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData || defaultUserFormValues,
  });

  // DÜZELTME: useEffect'i tamamen basitleştiriyoruz.
  // Artık `page.tsx` bize her zaman doğru ve hazır veriyi veriyor.
  // Bu `useEffect`, sadece "Create User" ve "Edit User" modları arasında geçiş yapıldığında
  // formu sıfırlamak için çalışacak.
  useEffect(() => {
    if (initialData) {
      // Edit moduna geçildiğinde formu yeni verilerle doldur.
      form.reset(initialData);
    } else {
      // Create moduna geçildiğinde formu varsayılan değerlerle sıfırla.
      form.reset(defaultUserFormValues);
    }
  }, [initialData, form]);

  const submit = (values: UserFormValues) => onSubmit(values);

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              {...form.register('name')}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Slug (Bu alan UpdateUserAndSubscriptionCommand'da yok, sadece create'te kullanılıyor) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input
              {...form.register('slug')}
              placeholder="john-doe"
              disabled={isSubmitting}
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              {...form.register('email')}
              placeholder="john@example.com"
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              {...form.register('phone')}
              placeholder="+90..."
              disabled={isSubmitting}
            />
          </div>

          {/* Password (edit’te boş bırakılabilir) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              {...form.register('password')}
              placeholder="Leave blank to keep current password"
              disabled={isSubmitting}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message as string}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
                value={String(form.watch('status'))}
                onValueChange={(v) => form.setValue('status', v === 'true')}
                disabled={isSubmitting}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Plan</label>
            <Select
              value={form.watch('plan') ?? 'Free'}
              onValueChange={(v) => form.setValue('plan', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan..." />
              </SelectTrigger>
              <SelectContent>
                {/* DÜZELTME: "Free" seçeneğine benzersiz bir key veriyoruz */}
                <SelectItem key="static-free-plan" value="Free">Free</SelectItem>
                {/* DÜZELTME: Gelen plandan "Free" olanı filtreleyerek tekrar eklenmesini önlüyoruz */}
                {availablePlans.filter(p => p.name !== 'Free').map((p) => (
                  <SelectItem key={p.id} value={p.name ?? ''}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subscription Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Billing Cycle</label>
            <Select
              value={form.watch('subscriptionType') ?? ''}
              onValueChange={(v) => form.setValue('subscriptionType', v as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Status</label>
            <Select
              value={form.watch('paymentStatus') ?? ''}
              onValueChange={(v) => form.setValue('paymentStatus', v as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES_FOR_FORM.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Roles */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Roles</label>
            <div className="flex flex-wrap gap-3">
              {availableRoles.map((r) => {
                const checked = (form.watch('roles') ?? []).includes(r.name);
                return (
                  <label key={r.id} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const current = new Set(form.getValues('roles') ?? []);
                        if (e.target.checked) current.add(r.name);
                        else current.delete(r.name);
                        form.setValue('roles', Array.from(current));
                      }}
                    />
                    {r.name}
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
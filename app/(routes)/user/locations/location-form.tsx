'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Building2, Phone, Map, CheckCircle2 } from 'lucide-react';

import {
  locationFormSchema,
  defaultLocationFormValues,
  type LocationFormValues,
} from '@/lib/schemas';

type Props = {
  isSubmitting: boolean;
  onSubmit: (data: LocationFormValues) => void | Promise<void>;
  initialData?: Partial<LocationFormValues>;
};

export function LocationForm({ isSubmitting, onSubmit, initialData }: Props) {
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: initialData || defaultLocationFormValues,
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset(defaultLocationFormValues);
    }
  }, [initialData, form]);

  const submit = (values: LocationFormValues) => onSubmit(values);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Location Name
              <span className="text-red-500">*</span>
            </label>
            <Input
              {...form.register('name')}
              placeholder="Main Branch, Downtown Office, etc."
              disabled={isSubmitting}
              className="transition-colors focus:border-primary"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="w-1 h-1 bg-destructive rounded-full" />
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <Input
              {...form.register('phone')}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
              className="transition-colors focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Customer contact number for this location
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Map className="h-4 w-4" />
              Address
            </label>
            <Textarea
              {...form.register('address')}
              placeholder="123 Main Street, City, State 12345"
              disabled={isSubmitting}
              className="min-h-[80px] resize-none transition-colors focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Complete address including street, city, state, and postal code
            </p>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Location Status</label>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Make location visible</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  When active, customers can see and book appointments
                </p>
              </div>
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(value) => form.setValue('isActive', value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button 
          onClick={form.handleSubmit(submit)}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Location'
          )}
        </Button>
      </div>
    </div>
  );
}
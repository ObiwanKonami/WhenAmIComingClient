'use client'

import { useController, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, UploadCloud, ImageIcon } from 'lucide-react'

import { useUploadOperations } from '@/hooks/useApi'
import type { PostApiUploadImageBody } from '@/lib/api/generated/model'

interface ImageUploadFieldProps {
  name: string;
  control: Control<any>;
  label: string;
}

export function ImageUploadField({ name, control, label }: ImageUploadFieldProps) {
  const { field, fieldState } = useController({ name, control });
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadOperations();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // BrandsPage'deki ile aynı payload yapısını kullanıyoruz.
    const payload: PostApiUploadImageBody = { file };

    toast.promise(uploadImage({ data: payload }), {
      loading: 'Uploading image...',
      success: (response: any) => {
        // BrandsPage'deki ile aynı yanıt işleme mantığı.
        const imageUrl = response?.url;
        if (imageUrl) {
          field.onChange(imageUrl); // Form state'ini yeni URL ile güncelle.
          return 'Image uploaded successfully!';
        }
        throw new Error('Image URL not found in response.');
      },
      error: (err) => (err as Error).message || 'Upload failed.',
    });
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-md border border-dashed bg-muted">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : field.value ? (
            <Image src={field.value} alt={label} layout="fill" objectFit="contain" className="rounded-md" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          {/* Bu gizli input, dosya seçim penceresini açar */}
          <FormControl>
            <Input
              id={name}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </FormControl>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(name)?.click()}
            disabled={isUploading}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Browse
          </Button>
          <p className="text-xs text-muted-foreground mt-1">Recommended: 300x150</p>
        </div>
      </div>
      <FormMessage>{fieldState.error?.message}</FormMessage>
    </FormItem>
  );
}
// app/register/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
   Eye, EyeOff, Building2, Mail, Phone, Lock, Loader2, Check, XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth, useServiceCategories, useBusinessSlugCheck } from '@/hooks/useApi'; 
import { registerFormSchema, type RegisterFormValues } from '@/lib/schemas';
import { RegisterCommand, SlugAvailabilityDto } from '@/lib/api/generated/model'



const countryCodes = [
  { code: '+90', country: 'TR', flag: '🇹🇷' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
]

export default function CompanyRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailabilityDto | null>(null);
  const [slugToCheck, setSlugToCheck] = useState<string>('');

  const { 
    data: slugCheckResult, 
    isFetching: isCheckingSlug,
    isSuccess: isSlugCheckSuccess,
    isError: isSlugCheckError,
    error: slugCheckError
  } = useBusinessSlugCheck(
    slugToCheck,
    { 
      query: { 
        enabled: slugToCheck.length >= 3,
        retry: 1,
      } 
    }
  );

  useEffect(() => {
    // Sorgu çalışmıyorsa veya hala çalışıyorsa bir şey yapma
    if (!slugToCheck || isCheckingSlug) return;

    if (isSlugCheckSuccess) {
      // Başarılı olduğunda state'i güncelle. `?? null` ile undefined hatasını engelle.
      setSlugAvailability(slugCheckResult ?? null);
    }
    
    if (isSlugCheckError) {
      // Hata olduğunda state'i güncelle.
      setSlugAvailability({ isAvailable: false, message: (slugCheckError as Error).message });
    }
  }, [isSlugCheckSuccess, isSlugCheckError, slugCheckResult, slugCheckError, isCheckingSlug, slugToCheck]);


  const { data: categories = [], isLoading: isLoadingCategories } = useServiceCategories();

  const { register, isRegistering, registerError } = useAuth();
  const router = useRouter();

  // Form hook'u ile formu başlat
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      companySlug: '',
      companyName: '',
      category: '',
      email: '',
      phone: '',
      countryCode: '+90',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });

  const { watch, setValue, trigger, getValues } = form;
  const watchedCompanyName = watch('companyName');
  const watchedCompanySlug = watch('companySlug');
  

  const debouncedSlugCheck = useCallback(
    debounce(async (slug: string) => {
      const isValid = await trigger("companySlug");
      if (isValid) {
        setSlugToCheck(slug); // Sadece state'i güncelle, useEffect gerisini halleder.
      } else {
        setSlugToCheck('');
        setSlugAvailability(null);
      }
    }, 500),
    [trigger]
  );

  // Slug oluşturma
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }


  useEffect(() => {
    const currentSlug = getValues('companySlug');
    const slugFromName = generateSlug(watchedCompanyName);

    if (!currentSlug || currentSlug === generateSlug(getValues('companyName'))) {
      setValue('companySlug', slugFromName, { shouldValidate: true });
    }
  }, [watchedCompanyName, setValue, getValues]);


useEffect(() => {
    debouncedSlugCheck(watchedCompanySlug);
}, [watchedCompanySlug, debouncedSlugCheck]);

  const onSubmit = async (data: RegisterFormValues) => {
    if (slugAvailability?.isAvailable === false) {
      toast.error("Registration Failed", {
        description: "This Company URL is not available.",
      });
      return;
    }

    const apiPayload: RegisterCommand = {
      companyName: data.companyName,
      companySlug: data.companySlug,
      category: data.category,
      email: data.email,
      phone: `${data.countryCode}${data.phone}`,
      password: data.password,
    };

    toast.promise(register({ data: apiPayload }), {
        loading: "Registering company...",
        success: () => {
            router.push('/admin/dashboard');
            return "Registration successful! Redirecting to dashboard...";
        },
        error: (err) => (err as Error).message,
    });
  };

  // Şu anki loading durumu, kayıt işlemi veya ilk yetkilendirme kontrolü
  const isPending = isRegistering || isCheckingSlug || isLoadingCategories;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-8 ">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Form Section */}
          <div className="space-y-6">
            <div className='justify-items-center'>
              <h1 className="text-3xl font-bold">Register your company</h1>
              <p className="text-muted-foreground">Basic information, You can add more later</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Company Slug (Görsel önizleme ile uyumlu olması için Watch kullanıyoruz) */}
                <FormField
                  control={form.control}
                  name="companySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Slug (Related to url & cannot be changed) <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex">
                        <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
                          resulsari.com.tr/
                        </div>
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              className="rounded-l-none"
                              placeholder="deneme"
                              disabled={isPending}
                            />
                          </FormControl>
                          {isCheckingSlug && (
    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
  )}
  {!isCheckingSlug && slugAvailability?.isAvailable === true && (
    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
  )}
  {!isCheckingSlug && slugAvailability?.isAvailable === false && (
    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
  )}
</div>
</div>
{slugAvailability && (
  <p className={`text-sm mt-1 ${slugAvailability.isAvailable ? 'text-green-600' : 'text-destructive'}`}>
    {slugAvailability.message}
  </p>
)}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Masculine Hairboss"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categories */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* API'den gelen kategorilerle doldur */}
                          {(categories ?? []).map((category) => (
                            <SelectItem 
              key={category.id ?? `fallback-${category.name}`}
              value={category.name ?? ''} 
            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <FormControl>
                          <Input
                            type="email"
                            className="pl-10"
                            placeholder="resul@resul.com"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone & Country Code */}
                <div className="space-y-2">
                  <FormLabel>
                    Phone <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="flex">
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                            <FormControl>
                              <SelectTrigger className="w-32 rounded-r-none">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countryCodes.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <span className="flex items-center">
                                    <span className="mr-2">{country.flag}</span>
                                    {country.code}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <FormControl>
                            <Input
                              type="tel"
                              className="rounded-l-none pl-10"
                              placeholder="5444544444"
                              disabled={isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={isPending}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm Password <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={isPending}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Terms */}
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-2">
                      <FormControl>
                        <Checkbox
                          id="terms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="grid gap-1.5 leading-none">
                        <FormLabel htmlFor="terms" className="text-sm leading-relaxed">
                          I have read and understood the{' '}
                          <Link href="/terms" className="text-primary hover:underline">
                            Terms and Conditions
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>{' '}
                          of this site.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base"
                  disabled={isPending || !form.formState.isValid || slugAvailability?.isAvailable === false} // React hook form validasyonuna göre butonu devre dışı bırak
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Preview Section - React Hook Form watch ile güncellendi */}
          <div className="lg:sticky lg:top-8">
            <Card className="overflow-hidden shadow-xl">
              {/* Browser header (Aynı kaldı) */}
              <div className="bg-gray-200 dark:bg-gray-800">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-300 dark:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1"></div>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <button className="w-8 h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="w-8 h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button className="w-8 h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Address bar */}
                  <div className="flex-1 mx-3">
                    <div className="bg-white dark:bg-gray-900 rounded-full px-4 py-1.5 flex items-center space-x-3 shadow-sm border">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate">
                        resulsari.com.tr/<span className="text-gray-900 dark:text-white">{watchedCompanySlug || 'deneme'}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Chrome menu buttons */}
                  <div className="flex items-center space-x-1">
                    <button className="w-8 h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </button>
                    <button className="w-8 h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* Logo/Avatar Area */}
                  <div className="flex items-center justify-center">
                    {watchedCompanyName ? (
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    ) : (
                      <Skeleton className="w-16 h-16 rounded-full" />
                    )}
                  </div>
                  
                  {/* Company Name */}
                  <div className="space-y-2">
                    {watchedCompanyName ? (
                      <h2 className="text-2xl font-bold">
                        {watchedCompanyName}
                      </h2>
                    ) : (
                      <Skeleton className="h-8 w-48 mx-auto" />
                    )}
                    
                    {form.watch('category') ? (
                      <p className="text-sm text-muted-foreground">
                        {form.watch('category')}
                      </p>
                    ) : (
                      <Skeleton className="h-4 w-32 mx-auto" />
                    )}
                  </div>

                  {/* Contact Info Preview */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {form.watch('email') ? (
                        <span className="text-sm">{form.watch('email')}</span>
                      ) : (
                        <Skeleton className="h-4 w-36" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {form.watch('phone') ? (
                        <span className="text-sm">
                          {form.watch('countryCode')} {form.watch('phone')}
                        </span>
                      ) : (
                        <Skeleton className="h-4 w-28" />
                      )}
                    </div>
                  </div>

                  {/* Book Now Button */}
                  {(watchedCompanyName && form.watch('email')) ? (
                    <Button className="w-full">Book Now</Button>
                  ) : (
                    <Skeleton className="h-10 w-full" />
                  )}

                  {/* Services Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      {watchedCompanyName ? (
                        <h3 className="text-lg font-semibold">Our Services</h3>
                      ) : (
                        <Skeleton className="h-6 w-24" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          {form.watch('category') ? (
                            <div className="bg-muted rounded-lg p-4 h-20 flex items-center justify-center">
                              <span className="text-muted-foreground text-xs text-center">
                                Service {i}
                              </span>
                            </div>
                          ) : (
                            <Skeleton className="h-20 w-full rounded-lg" />
                          )}
                          
                          {form.watch('category') ? (
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-3/4 mx-auto" />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-2/3 mx-auto" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats/Features Preview */}
                  <div className="border-t pt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-2">
                        {watchedCompanyName ? (
                          <>
                            <div className="text-2xl font-bold text-primary">4.9</div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                          </>
                        ) : (
                          <>
                            <Skeleton className="h-8 w-8 mx-auto" />
                            <Skeleton className="h-3 w-12 mx-auto" />
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {watchedCompanyName ? (
                          <>
                            <div className="text-2xl font-bold text-primary">150+</div>
                            <div className="text-xs text-muted-foreground">Reviews</div>
                          </>
                        ) : (
                          <>
                            <Skeleton className="h-8 w-10 mx-auto" />
                            <Skeleton className="h-3 w-14 mx-auto" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="border-t pt-4">
                    {watchedCompanyName ? (
                      <p className="text-xs text-muted-foreground">
                        This is how your company page will look to customers
                      </p>
                    ) : (
                      <Skeleton className="h-3 w-3/4 mx-auto" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
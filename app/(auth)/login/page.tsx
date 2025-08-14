// app/(auth)/login/page.tsx - Modernize Edilmiş Nihai Sürüm
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useAuth, useCurrentUser } from '@/hooks/useApi'
import { loginFormSchema, type LoginFormValues } from '@/lib/schemas'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const { data: user, isLoading: isAuthLoading } = useCurrentUser();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
  // `user` nesnesi var olmadan ve yükleme bitmeden bir şey yapma
  if (isAuthLoading || !user) {
    return;
  }

  const userRoles = user.roles ?? [];

  if (userRoles.includes('Admin')) {
    router.push('/admin/dashboard');
  } else if (userRoles.includes('User')) {
    router.push('/user/dashboard');
  } else {
    toast.error('No valid role found. Please contact administrator.');
  }

}, [user, isAuthLoading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    toast.promise(login({ data: { 
        email: data.email, 
        password: data.password 
      }  }), {
      loading: "Signing in...",
      success: () => {
        return "Welcome back! Redirecting...";
      },
      error: (err) => (err as Error).message,
    });
  };

  // Oturum kontrolü sırasında yükleme ekranı göster
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sol Panel - Marka Bölümü (Değişiklik yok) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
            <h1 className="text-5xl font-bold mb-4">Aoxio</h1>
            {/* ... */}
        </div>
      </div>

      {/* Sağ Panel - Login Formu */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Sign in to your Aoxio account</h2>
            <p className="text-muted-foreground">Welcome back! Please enter your details.</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
                          className="pl-10" 
                          disabled={isLoggingIn} 
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter password" 
                          className="pl-10 pr-10" 
                          disabled={isLoggingIn} 
                          {...field} 
                        />
                      </FormControl>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground" disabled={isLoggingIn}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoggingIn}/>
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Remember Me</FormLabel>
                    </FormItem>
                  )}
                />
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-muted-foreground">
              Don't have an account yet?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
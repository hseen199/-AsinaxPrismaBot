import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const { dir, t, language } = useLanguage();

  const ArrowIcon = language === "ar" ? ArrowRight : ArrowLeft;

  const registerSchema = z.object({
    firstName: z.string().min(2, t.auth.firstNameMin),
    lastName: z.string().min(2, t.auth.lastNameMin),
    email: z.string().email(t.auth.invalidEmail),
    birthDate: z.string().refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
    }, t.auth.ageRequirement),
    password: z.string().min(8, t.auth.passwordMin),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, t.auth.mustAcceptTerms),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.auth.passwordMismatch,
    path: ["confirmPassword"],
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      birthDate: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        birthDate: data.birthDate,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationCode(data.verificationCode);
      setRegisteredEmail(form.getValues("email"));
      toast({
        title: t.auth.registrationSuccessTitle,
        description: t.auth.saveVerificationCode,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.auth.registrationError,
        description: error.message || t.auth.errorDuringRegistration,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (verificationCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">{t.auth.registrationSuccessTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              {t.auth.saveVerificationCodeDesc}
            </p>
            
            <div className="bg-muted p-6 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">{t.auth.yourVerificationCode}</p>
              <p className="text-4xl font-bold text-primary tracking-widest" data-testid="text-verification-code">
                {verificationCode}
              </p>
            </div>
            
            <div className={`bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl ${language === "ar" ? "text-right" : "text-left"}`}>
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                {t.auth.warningVerificationCode}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full gap-2" 
                onClick={() => navigate("/login")}
                data-testid="button-go-to-login"
              >
                {t.auth.goToLogin}
                <ArrowIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
                data-testid="button-go-home"
              >
                {t.auth.backToHome}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-purple-500/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-purple-500/10 to-transparent" />
        
        <header className="relative z-10 flex items-center justify-between p-4 md:p-6 border-b border-border/50 backdrop-blur-sm">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/favicon.png" alt="ASINAX Logo" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-xl bg-gradient-to-l from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">ASINAX</span>
                <span className="text-xs text-muted-foreground block">CRYPTO AI</span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" data-testid="button-login-header">
                {t.auth.login}
              </Button>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t.auth.createAccount}</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                {t.auth.createAccountSubtitle}
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.firstName}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.auth.firstNamePlaceholder}
                              {...field} 
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.lastName}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.auth.lastNamePlaceholder}
                              {...field}
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.email}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="example@email.com" 
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.birthDate}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            data-testid="input-birth-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.password}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="********" 
                              {...field}
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`absolute ${language === "ar" ? "left-1" : "right-1"} top-1/2 -translate-y-1/2`}
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.confirmPassword}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="********" 
                              {...field}
                              data-testid="input-confirm-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`absolute ${language === "ar" ? "left-1" : "right-1"} top-1/2 -translate-y-1/2`}
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              data-testid="button-toggle-confirm-password"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className={`flex flex-row items-start ${language === "ar" ? "space-x-3 space-x-reverse" : "space-x-3"} space-y-0 rounded-md border p-4`}>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-accept-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            {t.auth.agreeTerms}{" "}
                            <Link href="/terms" className="text-primary underline">
                              {t.auth.termsOfService}
                            </Link>{" "}
                            {t.auth.and}{" "}
                            <Link href="/privacy" className="text-primary underline">
                              {t.auth.privacyPolicy}
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                        {t.auth.registering}
                      </>
                    ) : (
                      t.auth.createTheAccount
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {t.auth.orContinueWith}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = "/api/auth/google"}
                    data-testid="button-google-register"
                  >
                    <SiGoogle className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t.auth.signInWithGoogle}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t.auth.hasAccount}{" "}
                    <Link href="/login" className="text-primary underline">
                      {t.auth.login}
                    </Link>
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

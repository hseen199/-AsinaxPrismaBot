import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Loader2, Brain } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NeuralNetworkBg } from "@/components/neural-network-bg";
import { AIThinkingPulse } from "@/components/ai-thinking-pulse";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const { dir, t, language } = useLanguage();

  const loginSchema = z.object({
    email: z.string().email(t.auth.invalidEmail),
    password: z.string().min(1, t.auth.passwordRequired),
  });

  const verifySchema = z.object({
    verificationCode: z.string().length(6, t.auth.verificationCodeLength),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  type VerifyFormData = z.infer<typeof verifySchema>;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.needsVerification) {
        setNeedsVerification(true);
        setLoginEmail(loginForm.getValues("email"));
        toast({
          title: t.auth.verificationRequired,
          description: t.auth.verificationRequiredDesc,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: t.auth.loginSuccess,
          description: t.auth.welcomeBackSubtitle,
        });
        navigate("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: t.auth.loginError,
        description: error.message || t.auth.invalidEmailOrPassword,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifyFormData) => {
      const response = await apiRequest("POST", "/api/auth/verify", {
        email: loginEmail,
        verificationCode: data.verificationCode,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t.auth.verified,
        description: t.auth.welcomeBackSubtitle,
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: t.auth.verificationError,
        description: error.message || t.auth.invalidVerificationCode,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onVerifySubmit = (data: VerifyFormData) => {
    verifyMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-purple-500/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-purple-500/10 to-transparent" />
        
        <NeuralNetworkBg nodeCount={10} className="opacity-30" />
        
        <header className="relative z-10 flex items-center justify-between p-4 md:p-6 border-b border-border/50 backdrop-blur-sm">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <img src="/favicon.png" alt="ASINAX Logo" className="w-10 h-10 rounded-xl object-cover glow-primary" />
              </div>
              <div>
                <span className="font-bold text-xl gradient-text-animate">ASINAX</span>
                <span className="text-xs text-muted-foreground block">CRYPTO AI</span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/register">
              <Button variant="outline" data-testid="button-register-header">
                {t.auth.register}
              </Button>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md login-card-glow border-primary/20 backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-t-lg pointer-events-none" />
              <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
                <div className="absolute -top-1 -right-1">
                  <AIThinkingPulse size="sm" isActive={true} />
                </div>
              </div>
              <CardTitle className="text-2xl gradient-text-animate">
                {needsVerification ? t.auth.confirmAccount : t.auth.login}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                {needsVerification 
                  ? t.auth.verificationRequiredDesc
                  : t.auth.welcomeBackSubtitle
                }
              </p>
            </CardHeader>
            <CardContent>
              {needsVerification ? (
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
                    <FormField
                      control={verifyForm.control}
                      name="verificationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.verificationCode}</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="123456" 
                              maxLength={6}
                              autoComplete="one-time-code"
                              className="text-center text-2xl tracking-widest"
                              {...field}
                              data-testid="input-verification-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={verifyMutation.isPending}
                      data-testid="button-verify"
                    >
                      {verifyMutation.isPending ? (
                        <>
                          <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                          {t.auth.verifying}
                        </>
                      ) : (
                        t.auth.confirmAccount
                      )}
                    </Button>

                    <Button 
                      type="button"
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setNeedsVerification(false)}
                      data-testid="button-back-to-login"
                    >
                      {t.auth.backToLogin}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <FormLabel>{t.auth.password}</FormLabel>
                            <Link href="/forgot-password" className="text-sm text-primary underline" data-testid="link-forgot-password">
                              {t.auth.forgotPassword}
                            </Link>
                          </div>
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

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                          {t.auth.loggingIn}
                        </>
                      ) : (
                        t.auth.login
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
                      data-testid="button-google-login"
                    >
                      <SiGoogle className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                      {t.auth.signInWithGoogle}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      {t.auth.noAccount}{" "}
                      <Link href="/register" className="text-primary underline">
                        {t.auth.createAccount}
                      </Link>
                    </p>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

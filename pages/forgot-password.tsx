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
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

type Step = "email" | "reset" | "success";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { dir, t, language } = useLanguage();

  const ArrowIcon = language === "ar" ? ArrowRight : ArrowLeft;

  const emailSchema = z.object({
    email: z.string().email(t.auth.invalidEmail),
  });

  const resetSchema = z.object({
    resetCode: z.string().length(6, t.auth.verificationCodeLength),
    newPassword: z.string().min(8, t.auth.passwordMin),
    confirmNewPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: t.auth.passwordMismatch,
    path: ["confirmNewPassword"],
  });

  type EmailFormData = z.infer<typeof emailSchema>;
  type ResetFormData = z.infer<typeof resetSchema>;

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      resetCode: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setEmail(emailForm.getValues("email"));
      setStep("reset");
      toast({
        title: t.auth.resetCodeSent,
        description: t.auth.resetCodeSentDesc,
      });
    },
    onError: (error: any) => {
      const message = typeof error === 'object' && error?.message ? error.message : t.auth.invalidEmail;
      toast({
        title: t.common.error,
        description: message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetFormData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        resetCode: data.resetCode,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: t.auth.passwordResetSuccess,
        description: t.auth.passwordResetSuccessDesc,
      });
    },
    onError: (error: any) => {
      const message = typeof error === 'object' && error?.message ? error.message : t.auth.invalidVerificationCode;
      toast({
        title: t.common.error,
        description: message,
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = (data: EmailFormData) => {
    sendCodeMutation.mutate(data);
  };

  const onResetSubmit = (data: ResetFormData) => {
    resetPasswordMutation.mutate(data);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">{t.auth.passwordResetSuccess}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              {t.auth.passwordResetSuccessDesc}
            </p>
            
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

        <div className="relative z-10 flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {step === "email" ? t.auth.resetPassword : t.auth.enterResetCode}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                {step === "email" ? t.auth.resetPasswordDesc : t.auth.enterResetCode}
              </p>
            </CardHeader>
            <CardContent>
              {step === "email" ? (
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
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

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={sendCodeMutation.isPending}
                      data-testid="button-send-code"
                    >
                      {sendCodeMutation.isPending ? (
                        <>
                          <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                          {t.common.loading}
                        </>
                      ) : (
                        t.auth.sendResetCode
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      {t.auth.hasAccount}{" "}
                      <Link href="/login" className="text-primary underline">
                        {t.auth.login}
                      </Link>
                    </p>
                  </form>
                </Form>
              ) : (
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                    <FormField
                      control={resetForm.control}
                      name="resetCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.verificationCode}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456" 
                              maxLength={6}
                              className="text-center text-2xl tracking-widest"
                              {...field}
                              data-testid="input-reset-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resetForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.newPassword}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="********" 
                                {...field}
                                data-testid="input-new-password"
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
                      control={resetForm.control}
                      name="confirmNewPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.confirmNewPassword}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="********" 
                                {...field}
                                data-testid="input-confirm-new-password"
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

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={resetPasswordMutation.isPending}
                      data-testid="button-reset-password"
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                          {t.common.loading}
                        </>
                      ) : (
                        t.auth.resetPasswordButton
                      )}
                    </Button>

                    <Button 
                      type="button"
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setStep("email")}
                      data-testid="button-back"
                    >
                      {t.auth.backToLogin}
                    </Button>
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

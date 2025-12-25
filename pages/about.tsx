import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { 
  Bot, 
  Brain, 
  Shield, 
  TrendingUp, 
  Users, 
  Zap,
  Target,
  BarChart3,
  Lock,
  Globe
} from "lucide-react";

export default function About() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const content = isRTL ? {
    title: "من نحن",
    subtitle: "بوت تداول بالذكاء الاصطناعي 100% على منصة MEXC، يتداول مباشرة من المحفظة المشتركة بدون اشتراك.",
    aiPoweredTitle: "تداول مدعوم بالذكاء الاصطناعي 100%",
    aiPoweredDesc: "نظام ذكاء اصطناعي متقدم يحلل اتجاهات السوق، ينفذ الصفقات مباشرة من المحفظة المشتركة، ويتعلم باستمرار من كل عملية. مبني على البلوكتشين لأقصى سرعة وأمان، مع شفافية كاملة في كل صفقة.",
    mainFeaturesTitle: "الميزات الرئيسية",
    createAccount: "إنشاء حساب",
    startNow: "ابدأ المشاركة الآن",
    features: [
      {
        icon: TrendingUp,
        title: "تداول تلقائي على أفضل 100 عملة رقمية",
        desc: "خوارزميات متقدمة تراقب وتتداول على أفضل العملات أداءً"
      },
      {
        icon: Zap,
        title: "جميع الصفقات مقابل USDT",
        desc: "استقرار وسيولة عالية مع تداول كل العملات مقابل USDT"
      },
      {
        icon: Brain,
        title: "تعلم مستمر وتحسين الأداء",
        desc: "الذكاء الاصطناعي يتعلم من كل صفقة لتحسين الاستراتيجيات"
      },
      {
        icon: Shield,
        title: "شفافية كاملة على البلوكتشين",
        desc: "جميع العمليات مسجلة وقابلة للتتبع بشفافية تامة"
      }
    ],
    stats: [
      { value: "100%", label: "ذكاء اصطناعي" },
      { value: "24/7", label: "تداول مستمر" },
      { value: "100+", label: "عملة رقمية" },
      { value: "0", label: "رسوم اشتراك" }
    ],
    whyUs: [
      {
        icon: Bot,
        title: "بوت ذكي متقدم",
        desc: "خوارزميات تداول متطورة تستخدم RSI, MACD والمتوسطات المتحركة"
      },
      {
        icon: Users,
        title: "محفظة جماعية",
        desc: "شارك مع الآخرين وتقاسم النتائج بنظام الحصص العادل"
      },
      {
        icon: Target,
        title: "إدارة مخاطر احترافية",
        desc: "وقف خسارة وجني أرباح تلقائي لحماية رأس مالك"
      },
      {
        icon: BarChart3,
        title: "تحليلات متقدمة",
        desc: "لوحة تحكم شاملة لمتابعة أداء محفظتك"
      },
      {
        icon: Lock,
        title: "أمان عالي",
        desc: "تشفير متقدم وحماية كاملة لبياناتك وأموالك"
      },
      {
        icon: Globe,
        title: "دعم متعدد اللغات",
        desc: "واجهة بالعربية والإنجليزية لتجربة سلسة"
      }
    ]
  } : {
    title: "About Us",
    subtitle: "100% AI-powered trading bot on MEXC, trading directly from the shared portfolio with no subscription fees.",
    aiPoweredTitle: "100% AI-Powered Trading",
    aiPoweredDesc: "Our advanced artificial intelligence system analyzes market trends, executes trades directly from the shared portfolio, and continuously learns from every transaction. Built on blockchain for maximum speed and security, with complete transparency for every trade.",
    mainFeaturesTitle: "Key Features",
    createAccount: "Create Account",
    startNow: "Start Participation Now",
    features: [
      {
        icon: TrendingUp,
        title: "Automated trading on Top 100 cryptocurrencies",
        desc: "Advanced algorithms monitor and trade the best performing currencies"
      },
      {
        icon: Zap,
        title: "All trades paired with USDT",
        desc: "High stability and liquidity with all currencies traded against USDT"
      },
      {
        icon: Brain,
        title: "Continuous learning and performance improvement",
        desc: "AI learns from every trade to improve strategies"
      },
      {
        icon: Shield,
        title: "Complete blockchain transparency",
        desc: "All operations recorded and traceable with full transparency"
      }
    ],
    stats: [
      { value: "100%", label: "AI Powered" },
      { value: "24/7", label: "Continuous Trading" },
      { value: "100+", label: "Cryptocurrencies" },
      { value: "0", label: "Subscription Fees" }
    ],
    whyUs: [
      {
        icon: Bot,
        title: "Advanced Smart Bot",
        desc: "Sophisticated trading algorithms using RSI, MACD and moving averages"
      },
      {
        icon: Users,
        title: "Collective Portfolio",
        desc: "Participate with others and share results with a fair share system"
      },
      {
        icon: Target,
        title: "Professional Risk Management",
        desc: "Automatic stop loss and take profit to protect your capital"
      },
      {
        icon: BarChart3,
        title: "Advanced Analytics",
        desc: "Comprehensive dashboard to track your portfolio performance"
      },
      {
        icon: Lock,
        title: "High Security",
        desc: "Advanced encryption and complete protection for your data and funds"
      },
      {
        icon: Globe,
        title: "Multi-language Support",
        desc: "Arabic and English interface for a seamless experience"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/favicon.png" alt="ASINAX Logo" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-xl bg-gradient-to-l from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">ASINAX</span>
                <span className="text-xs text-muted-foreground block">CRYPTO AI</span>
              </div>
            </div>
          </Link>
          <Link href="/register">
            <Button data-testid="button-register-header">
              {content.createAccount}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">{content.title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-card/50">
          <div className="container mx-auto max-w-5xl">
            <Card className="overflow-hidden">
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-3 text-center md:text-start">
                  <h2 className="text-2xl font-bold">{content.aiPoweredTitle}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {content.aiPoweredDesc}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.stats.map((stat, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-card/50">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-8">{content.mainFeaturesTitle}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {content.features.map((feature, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-3 gap-4">
              {content.whyUs.map((item, index) => (
                <Card key={index} className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
          <div className="container mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-2xl font-bold">{isRTL ? "جاهز للانطلاق؟" : "Ready to Start?"}</h2>
            <p className="text-muted-foreground">
              {isRTL 
                ? "انضم إلى مجتمع ASINAX اليوم وابدأ رحلتك نحو التداول الذكي"
                : "Join the ASINAX community today and start your smart trading journey"
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" data-testid="button-register-cta">
                  {content.startNow}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" data-testid="button-login-cta">
                  {isRTL ? "تسجيل الدخول" : "Login"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

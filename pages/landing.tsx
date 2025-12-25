import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Bot, TrendingUp, Shield, Users, ArrowLeft, ArrowRight, 
  BarChart3, Brain, Wallet, Target, Lock, Sparkles, 
  Zap, Globe, ChevronDown 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { NeuralNetworkBg } from "@/components/neural-network-bg";
import { AIThinkingPulse } from "@/components/ai-thinking-pulse";
import { HolographicCard } from "@/components/holographic-card";

export default function Landing() {
  const { login } = useAuth();
  const { dir, t, language } = useLanguage();

  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;

  const features = [
    {
      icon: Bot,
      title: t.landing.feature1Title,
      description: t.landing.feature1Desc,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: Brain,
      title: t.landing.feature2Title,
      description: t.landing.feature2Desc,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: Users,
      title: t.landing.feature3Title,
      description: t.landing.feature3Desc,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-500/10 to-rose-500/10",
    },
    {
      icon: Shield,
      title: t.landing.feature4Title,
      description: t.landing.feature4Desc,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
      icon: Target,
      title: t.landing.feature5Title,
      description: t.landing.feature5Desc,
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-500/10 to-amber-500/10",
    },
    {
      icon: Wallet,
      title: t.landing.feature6Title,
      description: t.landing.feature6Desc,
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-500/10 to-blue-500/10",
    },
  ];

  const stats = [
    { value: "$125,000+", label: t.landing.totalAssets, icon: Wallet },
    { value: "+18.5%", label: t.landing.monthlyReturn, isProfit: true, icon: TrendingUp },
    { value: "24/7", label: t.landing.tradingHours, icon: Globe },
    { value: "50+", label: t.landing.activeInvestors, icon: Users },
  ];

  const steps = [
    { step: "01", title: t.landing.step1Title, desc: t.landing.step1Desc, icon: Lock, gradient: "from-blue-500 to-purple-500" },
    { step: "02", title: t.landing.step2Title, desc: t.landing.step2Desc, icon: Wallet, gradient: "from-purple-500 to-pink-500" },
    { step: "03", title: t.landing.step3Title, desc: t.landing.step3Desc, icon: BarChart3, gradient: "from-pink-500 to-orange-500" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        duration: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.1,
      },
    },
  };

  const floatingAnimation = {
    y: [-3, 3, -3],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir={dir}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-purple-500/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-purple-500/10 to-transparent" />
        
        <NeuralNetworkBg nodeCount={12} className="opacity-40" />
        
        <motion.div 
          className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"
          animate={floatingAnimation}
        />
        <motion.div 
          className="absolute top-40 right-[15%] w-96 h-96 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
          animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 2 } }}
        />
        
        <header className="relative z-10 flex items-center justify-between p-4 md:p-6 border-b border-border/50 backdrop-blur-md bg-background/50">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: language === "ar" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-xl blur-md opacity-50" />
              <img src="/favicon.png" alt="ASINAX Logo" className="relative w-10 h-10 rounded-xl object-cover" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-l from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">
                ASINAX
              </span>
              <span className="text-xs text-muted-foreground block">CRYPTO AI</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: language === "ar" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LanguageToggle />
            <ThemeToggle />
            <Button onClick={login} className="gap-2" data-testid="button-login-header">
              {t.landing.login}
              <ArrowIcon className="w-4 h-4" />
            </Button>
          </motion.div>
        </header>

        <section className="relative z-10 px-4 py-16 md:py-28 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-l from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 text-sm mb-8 glow-primary"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <AIThinkingPulse size="sm" />
              <span className="text-foreground font-medium">{t.landing.botActiveNow}</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-foreground">{t.landing.heroSubtitle}</span>
              <span className="block gradient-text-animate mt-2">
                ASINAX CRYPTO AI
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.landing.heroDescription}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  onClick={login} 
                  className="text-lg gap-2 px-8 py-6 bg-gradient-to-l from-primary to-purple-600 border-0 shadow-lg shadow-primary/25" 
                  data-testid="button-start-now"
                >
                  <Zap className="w-5 h-5" />
                  {t.landing.startNow}
                  <ArrowIcon className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 backdrop-blur-sm" 
                  data-testid="button-learn-more"
                  asChild
                >
                  <Link href="/about">
                    {t.landing.learnMore}
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {stats.map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <HolographicCard 
                  key={index}
                  glowColor={stat.isProfit ? "emerald" : "primary"}
                  className="group"
                >
                  <div className="text-center">
                    <StatIcon className={`w-5 h-5 mb-2 mx-auto ${stat.isProfit ? 'text-green-500' : 'text-primary'}`} />
                    <p className={`text-2xl md:text-3xl font-bold mb-1 ${stat.isProfit ? 'text-green-500 glow-text' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </HolographicCard>
              );
            })}
          </motion.div>
          
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-8 h-8 mx-auto text-muted-foreground/50" />
            </motion.div>
          </motion.div>
        </section>
      </div>

      <section className="px-4 py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t.landing.whyAsinax}{" "}
              <span className="bg-gradient-to-l from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">
                ASINAX
              </span>
              ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t.landing.whyAsinaxDesc}
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="overflow-visible h-full group" data-testid={`card-feature-${index}`}>
                    <CardContent className="p-6 relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-4 icon-glow`}>
                          <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center">
                            <FeatureIcon className="w-6 h-6 text-foreground" />
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-28 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 relative overflow-hidden">
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl"
          animate={floatingAnimation}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl"
          animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 3 } }}
        />
        
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center"
            >
              <Zap className="w-8 h-8 text-purple-400" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.landing.howItWorks}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t.landing.howItWorksDesc}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] timeline-line-glow" />
            
            {(language === "ar" ? [...steps].reverse() : steps).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center group"
              >
                <motion.div 
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} p-0.5 mx-auto mb-6 icon-glow`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-foreground" />
                  </div>
                </motion.div>
                <motion.div 
                  className={`absolute -top-2 ${language === "ar" ? "-right-2" : "-left-2"} w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center font-bold text-sm text-white shadow-lg`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 + 0.3, type: "spring" }}
                >
                  {item.step}
                </motion.div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-28 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-8 md:p-16 border border-primary/20 backdrop-blur-sm text-center overflow-hidden">
            <motion.div
              className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-full blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
            
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-2xl blur-lg opacity-50" />
                <img src="/favicon.png" alt="ASINAX Logo" className="relative w-full h-full rounded-2xl object-cover" />
              </motion.div>
              
              <h2 className="text-3xl md:text-5xl font-bold mb-4 gradient-text-animate">{t.landing.readyToStart}</h2>
              <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-lg">
                {t.landing.readyToStartDesc}
              </p>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  onClick={login} 
                  className="text-lg gap-2 px-10 py-7 bg-gradient-to-l from-primary to-purple-600 border-0 shadow-xl shadow-primary/30" 
                  data-testid="button-join-now"
                >
                  <Sparkles className="w-5 h-5" />
                  {t.landing.joinNowFree}
                  <ArrowIcon className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

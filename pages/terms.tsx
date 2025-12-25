import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { ArrowRight, ArrowLeft, FileText, AlertTriangle, Scale, ShieldAlert, Ban, Gavel, RefreshCw } from "lucide-react";

export default function Terms() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const content = isRTL ? {
    title: "شروط الخدمة",
    lastUpdated: "آخر تحديث: ديسمبر 2024",
    createAccount: "إنشاء حساب",
    privacyLink: "سياسة الخصوصية",
    warningTitle: "تحذير هام - إخلاء المسؤولية",
    warningText1: "التداول في العملات الرقمية ينطوي على مخاطر عالية جداً. يمكن أن تفقد كامل رأس مالك المشارك. لا تشارك بأموال لا يمكنك تحمل خسارتها.",
    warningText2: "الأداء السابق لا يضمن النتائج المستقبلية. نحن لا نقدم نصائح مالية. جميع قرارات المشاركة هي مسؤوليتك الشخصية بالكامل.",
    confirmText: "تأكيد: بإنشاء حساب على منصتنا، فإنك تؤكد أنك قرأت وفهمت جميع الشروط والأحكام وسياسة الخصوصية، وأنك توافق عليها بالكامل، وأنك تدرك المخاطر المرتبطة بالتداول في العملات الرقمية.",
    sections: [
      {
        icon: FileText,
        title: "1. القبول والموافقة",
        content: "باستخدامك لمنصة ASINAX CRYPTO AI، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة.\n\nيجب أن يكون عمرك 18 سنة على الأقل وأن تكون أهلاً قانونياً للدخول في عقود ملزمة."
      },
      {
        icon: Scale,
        title: "2. طبيعة الخدمة",
        content: "ASINAX CRYPTO AI هي منصة مشاركة جماعية تعتمد على التداول الآلي في العملات الرقمية عبر منصة MEXC.\n\nنقدم:\n• نظام مشاركة جماعي قائم على الحصص\n• تداول آلي باستخدام الذكاء الاصطناعي\n• تحليلات ومؤشرات فنية للسوق\n• لوحة تحكم لمتابعة حصصك\n\nهام: نحن لا نقدم استشارات مالية أو توصيات. المنصة أداة تقنية فقط."
      },
      {
        icon: AlertTriangle,
        title: "3. المخاطر والتحذيرات",
        content: "أنت تقر وتوافق على ما يلي:\n\n• أسواق العملات الرقمية شديدة التقلب ولا يمكن التنبؤ بها\n• يمكن أن تخسر كامل رأس مالك أو جزءاً كبيراً منه\n• الأداء السابق لا يضمن أي نتائج مستقبلية\n• قد تحدث أخطاء تقنية أو أعطال في نظام التداول الآلي\n• الذكاء الاصطناعي قد يتخذ قرارات خاطئة\n• لا نضمن أي عوائد أو أرباح محددة\n• أنت المسؤول الوحيد عن قراراتك المالية"
      },
      {
        icon: ShieldAlert,
        title: "4. إخلاء المسؤولية الكامل",
        content: "ASINAX والفريق القائم عليها غير مسؤولين عن:\n\n• أي خسائر مالية ناتجة عن التداول\n• تقلبات السوق أو انهيار الأسعار\n• أخطاء الذكاء الاصطناعي أو الخوارزميات\n• الأعطال التقنية أو انقطاع الخدمة\n• تأخير المعاملات أو السحوبات\n• أي ظروف خارجة عن إرادتنا\n• القرارات التي تتخذها بناءً على تحليلاتنا\n\nأنت تتحمل المسؤولية الكاملة عن أي خسائر."
      },
      {
        icon: RefreshCw,
        title: "5. الإيداع والسحب",
        content: "• الحد الأدنى للإيداع: 100 USDT\n• رسوم السحب: 1.5% من المبلغ المسحوب\n• قد يستغرق معالجة السحب حتى 24 ساعة عمل\n• نحتفظ بالحق في طلب التحقق من الهوية\n• قد نرفض معاملات مشبوهة\n• أنت مسؤول عن صحة عنوان المحفظة"
      },
      {
        icon: Ban,
        title: "6. إنهاء الحساب",
        content: "نحتفظ بالحق في تعليق أو إنهاء حسابك دون إشعار مسبق إذا:\n\n• انتهكت هذه الشروط والأحكام\n• قدمت معلومات خاطئة أو مضللة\n• اشتبهنا في نشاط احتيالي أو غير قانوني\n• طُلب منا ذلك قانونياً\n\nعند الإنهاء، ستتمكن من سحب رصيدك المتبقي وفق الإجراءات المعتادة."
      },
      {
        icon: Gavel,
        title: "7. التعديلات والقانون",
        content: "• نحتفظ بالحق في تعديل هذه الشروط في أي وقت\n• سيتم إشعارك بالتغييرات الجوهرية عبر البريد الإلكتروني\n• استمرارك في استخدام المنصة يعني موافقتك على التعديلات\n• تخضع هذه الشروط للقوانين السارية\n• أي نزاع سيتم حله وفق الإجراءات القانونية المناسبة\n• في حالة التعارض بين اللغات، تُعتمد النسخة العربية"
      }
    ]
  } : {
    title: "Terms of Service",
    lastUpdated: "Last Updated: December 2024",
    createAccount: "Create Account",
    privacyLink: "Privacy Policy",
    warningTitle: "Important Warning - Disclaimer",
    warningText1: "Cryptocurrency trading involves very high risk. You may lose your entire participating capital. Do not participate with money you cannot afford to lose.",
    warningText2: "Past performance does not guarantee future results. We do not provide financial advice. All participation decisions are entirely your personal responsibility.",
    confirmText: "Confirmation: By creating an account on our platform, you confirm that you have read and understood all Terms and Conditions and Privacy Policy, that you fully agree to them, and that you understand the risks associated with cryptocurrency trading.",
    sections: [
      {
        icon: FileText,
        title: "1. Acceptance and Agreement",
        content: "By using ASINAX CRYPTO AI platform, you agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, please do not use the platform.\n\nYou must be at least 18 years old and legally capable of entering into binding contracts."
      },
      {
        icon: Scale,
        title: "2. Nature of Service",
        content: "ASINAX CRYPTO AI is a collective participation platform based on automated cryptocurrency trading via the MEXC exchange.\n\nWe offer:\n• Share-based collective participation system\n• AI-powered automated trading\n• Technical market analysis and indicators\n• Dashboard to track your shares\n\nImportant: We do not provide financial advice or recommendations. The platform is a technical tool only."
      },
      {
        icon: AlertTriangle,
        title: "3. Risks and Warnings",
        content: "You acknowledge and agree that:\n\n• Cryptocurrency markets are highly volatile and unpredictable\n• You may lose all or a significant portion of your capital\n• Past performance does not guarantee future results\n• Technical errors or automated trading system failures may occur\n• AI may make incorrect decisions\n• We do not guarantee any specific returns or profits\n• You are solely responsible for your financial decisions"
      },
      {
        icon: ShieldAlert,
        title: "4. Complete Disclaimer",
        content: "ASINAX and its team are not responsible for:\n\n• Any financial losses resulting from trading\n• Market volatility or price crashes\n• AI or algorithm errors\n• Technical failures or service interruptions\n• Transaction or withdrawal delays\n• Any circumstances beyond our control\n• Decisions you make based on our analysis\n\nYou bear full responsibility for any losses."
      },
      {
        icon: RefreshCw,
        title: "5. Deposits and Withdrawals",
        content: "• Minimum deposit: 100 USDT\n• Withdrawal fee: 1.5% of withdrawn amount\n• Withdrawals may take up to 24 business hours\n• We reserve the right to request identity verification\n• We may reject suspicious transactions\n• You are responsible for wallet address accuracy"
      },
      {
        icon: Ban,
        title: "6. Account Termination",
        content: "We reserve the right to suspend or terminate your account without prior notice if:\n\n• You violate these Terms and Conditions\n• You provide false or misleading information\n• We suspect fraudulent or illegal activity\n• We are legally required to do so\n\nUpon termination, you will be able to withdraw your remaining balance through standard procedures."
      },
      {
        icon: Gavel,
        title: "7. Modifications and Law",
        content: "• We reserve the right to modify these terms at any time\n• You will be notified of material changes via email\n• Continued use of the platform means acceptance of modifications\n• These terms are governed by applicable laws\n• Any disputes will be resolved through appropriate legal procedures\n• In case of conflict between languages, the Arabic version prevails"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-purple-500/5 to-background" />
        
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

        <div className="relative z-10 max-w-4xl mx-auto py-12 px-4">
          <Card>
            <CardHeader className="text-center border-b">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl">{content.title}</CardTitle>
              <p className="text-muted-foreground mt-2">{content.lastUpdated}</p>
            </CardHeader>
            <CardContent className="py-8 space-y-8">
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                  <h2 className="text-xl font-bold m-0 text-destructive">{content.warningTitle}</h2>
                </div>
                <div className="text-sm space-y-3">
                  <p className="leading-relaxed font-semibold">{content.warningText1}</p>
                  <p className="leading-relaxed">{content.warningText2}</p>
                </div>
              </div>

              {content.sections.map((section, index) => (
                <section key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold m-0">{section.title}</h2>
                  </div>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </section>
              ))}

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mt-8">
                <p className="text-amber-600 dark:text-amber-400 text-sm leading-relaxed">
                  <strong>{isRTL ? "تأكيد:" : "Confirmation:"}</strong> {content.confirmText}
                </p>
              </div>

              <div className="border-t pt-8 mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link href="/privacy">
                    <Button variant="outline" data-testid="button-go-to-privacy">
                      {content.privacyLink}
                      <ArrowIcon className="w-4 h-4 mx-2" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button data-testid="button-register-bottom">
                      {content.createAccount}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

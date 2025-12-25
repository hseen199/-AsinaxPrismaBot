import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { ArrowRight, ArrowLeft, Shield, Lock, Eye, FileText, Database, Users, Mail } from "lucide-react";

export default function Privacy() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const content = isRTL ? {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: ديسمبر 2024",
    createAccount: "إنشاء حساب",
    termsLink: "الشروط والأحكام",
    home: "الرئيسية",
    sections: [
      {
        icon: FileText,
        title: "1. مقدمة",
        content: "نحن في ASINAX CRYPTO AI نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها لنا عند استخدام منصتنا للتداول الآلي بالذكاء الاصطناعي.\n\nباستخدام خدماتنا، فإنك توافق على الممارسات الموضحة في هذه السياسة."
      },
      {
        icon: Database,
        title: "2. البيانات التي نجمعها",
        content: "نقوم بجمع الأنواع التالية من المعلومات:\n\n• بيانات الحساب: الاسم الكامل، البريد الإلكتروني، تاريخ الميلاد\n• بيانات المصادقة: كلمة المرور (مشفرة)، معلومات Google OAuth\n• بيانات التداول: سجل الإيداعات والسحوبات، الحصص، سجل الصفقات\n• بيانات تقنية: عنوان IP، نوع المتصفح، ملفات الارتباط"
      },
      {
        icon: Eye,
        title: "3. كيف نستخدم بياناتك",
        content: "نستخدم المعلومات المجمعة للأغراض التالية:\n\n• تشغيل الخدمة: إدارة حسابك، معالجة المعاملات، تنفيذ الصفقات\n• تحسين الخدمة: تحليل الأداء، تطوير خوارزميات الذكاء الاصطناعي\n• الأمان: حماية حسابك، اكتشاف الاحتيال، الامتثال القانوني\n• التواصل: إرسال إشعارات مهمة حول حسابك"
      },
      {
        icon: Lock,
        title: "4. حماية البيانات",
        content: "نتخذ إجراءات أمنية صارمة:\n\n• التشفير: جميع البيانات مشفرة (SSL/TLS)، كلمات المرور مشفرة بـ bcrypt\n• الوصول المحدود: فقط الموظفون المخولون يمكنهم الوصول للبيانات\n• النسخ الاحتياطي: نسخ احتياطية منتظمة وخطط استعادة الكوارث\n• المراقبة: مراجعات أمنية دورية وسجلات وصول مفصلة"
      },
      {
        icon: Users,
        title: "5. مشاركة البيانات",
        content: "لا نبيع بياناتك. قد نشاركها مع:\n\n• منصة MEXC: لتنفيذ صفقات التداول وإدارة المحفظة\n• OpenAI: لتحليل مشاعر السوق (بيانات مجهولة الهوية)\n• مزودو الخدمات: الاستضافة، البريد الإلكتروني، التحليلات\n• السلطات القانونية: عند الطلب الرسمي أو للامتثال للقوانين"
      },
      {
        icon: Mail,
        title: "6. حقوقك والتواصل",
        content: "لديك الحقوق التالية:\n\n• حق الوصول: طلب نسخة من بياناتك\n• حق التصحيح: تصحيح البيانات غير الدقيقة\n• حق الحذف: طلب حذف بياناتك (مع مراعاة المتطلبات القانونية)\n• حق الاعتراض: الاعتراض على معالجة معينة\n\nللتواصل: privacy@asinax.ai\n\nنحتفظ بالحق في تحديث هذه السياسة مع إشعارك بالتغييرات الجوهرية."
      }
    ]
  } : {
    title: "Privacy Policy",
    lastUpdated: "Last Updated: December 2024",
    createAccount: "Create Account",
    termsLink: "Terms of Service",
    home: "Home",
    sections: [
      {
        icon: FileText,
        title: "1. Introduction",
        content: "At ASINAX CRYPTO AI, we are committed to protecting your privacy and personal data. This policy explains how we collect, use, and protect the personal information you provide when using our AI-powered automated trading platform.\n\nBy using our services, you agree to the practices outlined in this policy."
      },
      {
        icon: Database,
        title: "2. Data We Collect",
        content: "We collect the following types of information:\n\n• Account Data: Full name, email address, date of birth\n• Authentication Data: Password (encrypted), Google OAuth information\n• Trading Data: Deposit/withdrawal history, shares, trade records\n• Technical Data: IP address, browser type, cookies"
      },
      {
        icon: Eye,
        title: "3. How We Use Your Data",
        content: "We use collected information for:\n\n• Service Operation: Managing your account, processing transactions, executing trades\n• Service Improvement: Performance analysis, AI algorithm development\n• Security: Protecting your account, fraud detection, legal compliance\n• Communication: Sending important account notifications"
      },
      {
        icon: Lock,
        title: "4. Data Protection",
        content: "We implement strict security measures:\n\n• Encryption: All data encrypted (SSL/TLS), passwords hashed with bcrypt\n• Limited Access: Only authorized personnel can access data\n• Backup: Regular backups and disaster recovery plans\n• Monitoring: Regular security audits and detailed access logs"
      },
      {
        icon: Users,
        title: "5. Data Sharing",
        content: "We do not sell your data. We may share it with:\n\n• MEXC Exchange: To execute trades and manage portfolio\n• OpenAI: For market sentiment analysis (anonymized data)\n• Service Providers: Hosting, email, analytics\n• Legal Authorities: Upon official request or for legal compliance"
      },
      {
        icon: Mail,
        title: "6. Your Rights & Contact",
        content: "You have the following rights:\n\n• Right of Access: Request a copy of your data\n• Right to Rectification: Correct inaccurate data\n• Right to Erasure: Request data deletion (subject to legal requirements)\n• Right to Object: Object to certain processing\n\nContact: privacy@asinax.ai\n\nWe reserve the right to update this policy with notice of material changes."
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
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl">{content.title}</CardTitle>
              <p className="text-muted-foreground mt-2">{content.lastUpdated}</p>
            </CardHeader>
            <CardContent className="py-8 space-y-8">
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

              <div className="border-t pt-8 mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link href="/terms">
                    <Button variant="outline" data-testid="button-go-to-terms">
                      {content.termsLink}
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

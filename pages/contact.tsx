import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  MessageCircle, 
  Send,
  MapPin,
  Clock,
  CheckCircle
} from "lucide-react";
import { SiTelegram } from "react-icons/si";

export default function Contact() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === "ar";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const content = isRTL ? {
    title: "تواصل معنا",
    subtitle: "نحن هنا للمساعدة. لا تتردد في التواصل معنا لأي استفسار.",
    createAccount: "إنشاء حساب",
    formTitle: "أرسل رسالة",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "أدخل اسمك",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "email@example.com",
    subjectLabel: "الموضوع",
    subjectPlaceholder: "موضوع رسالتك",
    messageLabel: "الرسالة",
    messagePlaceholder: "اكتب رسالتك هنا...",
    sendButton: "إرسال الرسالة",
    sending: "جاري الإرسال...",
    successTitle: "تم الإرسال!",
    successMessage: "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
    sendAnother: "إرسال رسالة أخرى",
    contactInfo: "معلومات التواصل",
    channels: [
      {
        icon: Mail,
        title: "البريد الإلكتروني",
        value: "support@asinax.ai",
        desc: "للدعم الفني والاستفسارات"
      },
      {
        icon: SiTelegram,
        title: "تيليجرام",
        value: "@AsinaxSupport",
        desc: "للتواصل السريع"
      },
      {
        icon: Clock,
        title: "ساعات العمل",
        value: "24/7",
        desc: "دعم على مدار الساعة"
      }
    ]
  } : {
    title: "Contact Us",
    subtitle: "We're here to help. Don't hesitate to reach out for any inquiries.",
    createAccount: "Create Account",
    formTitle: "Send a Message",
    nameLabel: "Full Name",
    namePlaceholder: "Enter your name",
    emailLabel: "Email",
    emailPlaceholder: "email@example.com",
    subjectLabel: "Subject",
    subjectPlaceholder: "Message subject",
    messageLabel: "Message",
    messagePlaceholder: "Write your message here...",
    sendButton: "Send Message",
    sending: "Sending...",
    successTitle: "Sent!",
    successMessage: "Thank you for contacting us. We'll get back to you as soon as possible.",
    sendAnother: "Send Another Message",
    contactInfo: "Contact Information",
    channels: [
      {
        icon: Mail,
        title: "Email",
        value: "support@asinax.ai",
        desc: "For technical support and inquiries"
      },
      {
        icon: SiTelegram,
        title: "Telegram",
        value: "@AsinaxSupport",
        desc: "For quick communication"
      },
      {
        icon: Clock,
        title: "Working Hours",
        value: "24/7",
        desc: "Round-the-clock support"
      }
    ]
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: content.successTitle,
      description: content.successMessage,
    });
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

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold">{content.title}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {content.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {content.formTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold">{content.successTitle}</h3>
                    <p className="text-muted-foreground">{content.successMessage}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubmitted(false)}
                      data-testid="button-send-another"
                    >
                      {content.sendAnother}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{content.nameLabel}</Label>
                      <Input 
                        id="name" 
                        placeholder={content.namePlaceholder}
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{content.emailLabel}</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder={content.emailPlaceholder}
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{content.subjectLabel}</Label>
                      <Input 
                        id="subject" 
                        placeholder={content.subjectPlaceholder}
                        required
                        data-testid="input-contact-subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{content.messageLabel}</Label>
                      <Textarea 
                        id="message" 
                        placeholder={content.messagePlaceholder}
                        rows={5}
                        required
                        data-testid="input-contact-message"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                      data-testid="button-send-message"
                    >
                      {isSubmitting ? (
                        content.sending
                      ) : (
                        <>
                          <Send className="w-4 h-4 mx-1" />
                          {content.sendButton}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">{content.contactInfo}</h2>
              {content.channels.map((channel, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <channel.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{channel.title}</h3>
                      <p className="text-primary font-medium">{channel.value}</p>
                      <p className="text-sm text-muted-foreground">{channel.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}

              <Card className="p-6 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
                <div className="text-center space-y-3">
                  <MapPin className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-muted-foreground text-sm">
                    {isRTL 
                      ? "منصة عالمية تعمل رقمياً بالكامل"
                      : "Global platform operating fully digitally"
                    }
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { 
  Mail, 
  MessageCircle, 
  Globe,
  AlertTriangle,
  Bot
} from "lucide-react";
import { SiTelegram, SiX } from "react-icons/si";

export function Footer() {
  const { t, language } = useLanguage();

  const quickLinks = [
    { label: language === "ar" ? "من نحن" : "About Us", href: "/about" },
    { label: language === "ar" ? "سياسة الخصوصية" : "Privacy Policy", href: "/privacy" },
    { label: language === "ar" ? "شروط الخدمة" : "Terms of Service", href: "/terms" },
    { label: language === "ar" ? "تواصل معنا" : "Contact Us", href: "/contact" },
  ];

  const socialLinks = [
    { icon: SiTelegram, href: "#", label: "Telegram" },
    { icon: SiX, href: "#", label: "X (Twitter)" },
    { icon: Mail, href: "mailto:support@asinax.ai", label: "Email" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="w-full bg-warning/10 border-b border-warning/20 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-sm text-warning">
            {language === "ar" 
              ? "تحذير: التداول الآلي ينطوي على مخاطر — شارك بما يمكنك تحمل خسارته فقط"
              : "Warning: Automated trading involves risks — only participate with what you can afford to lose"
            }
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg">ASINAX</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === "ar"
                ? "بوت تداول بالذكاء الاصطناعي 100% على منصة MEXC، يتداول مباشرة من المحفظة المشتركة بدون اشتراك."
                : "100% AI-powered trading bot on MEXC, trading directly from the shared portfolio with no subscription fees."
              }
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === "ar" ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.href.replace("/", "")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === "ar" ? "تواصل معنا" : "Contact Us"}
            </h4>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>{language === "ar" ? "العربية" : "English"}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ASINAX AI Trading. {language === "ar" ? "جميع الحقوق محفوظة" : "All Rights Reserved"}
          </p>
        </div>
      </div>
    </footer>
  );
}

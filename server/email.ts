// Resend Email Integration - connection:conn_resend
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendVerificationEmail(
  toEmail: string, 
  verificationCode: string, 
  firstName: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ASINAX Crypto AI <noreply@asinax.com>',
      to: [toEmail],
      subject: 'رمز التحقق من حسابك - ASINAX Crypto AI',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #fbbf24;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fbbf24; font-size: 28px; margin: 0;">ASINAX Crypto AI</h1>
              <p style="color: #94a3b8; margin-top: 10px;">منصة التداول الذكية</p>
            </div>
            
            <div style="background-color: rgba(251, 191, 36, 0.1); border-radius: 12px; padding: 30px; text-align: center;">
              <h2 style="color: #ffffff; margin-bottom: 20px;">مرحباً ${firstName}!</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.8;">
                شكراً لتسجيلك في ASINAX Crypto AI. استخدم الرمز التالي لتأكيد حسابك:
              </p>
              
              <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 20px; margin: 25px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0a0a0f;">${verificationCode}</span>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px;">
                هذا الرمز صالح لمدة 24 ساعة فقط.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
              <p style="color: #64748b; font-size: 12px;">
                إذا لم تقم بالتسجيل في ASINAX، يرجى تجاهل هذه الرسالة.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return false;
    }

    console.log('Verification email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetCode: string,
  firstName: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ASINAX Crypto AI <noreply@asinax.com>',
      to: [toEmail],
      subject: 'إعادة تعيين كلمة المرور - ASINAX Crypto AI',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #fbbf24;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fbbf24; font-size: 28px; margin: 0;">ASINAX Crypto AI</h1>
              <p style="color: #94a3b8; margin-top: 10px;">منصة التداول الذكية</p>
            </div>
            
            <div style="background-color: rgba(251, 191, 36, 0.1); border-radius: 12px; padding: 30px; text-align: center;">
              <h2 style="color: #ffffff; margin-bottom: 20px;">مرحباً ${firstName}!</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.8;">
                تم طلب إعادة تعيين كلمة المرور لحسابك. استخدم الرمز التالي:
              </p>
              
              <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 20px; margin: 25px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0a0a0f;">${resetCode}</span>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px;">
                هذا الرمز صالح لمدة ساعة واحدة فقط.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
              <p style="color: #64748b; font-size: 12px;">
                إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    console.log('Password reset email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

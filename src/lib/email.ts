import nodemailer from 'nodemailer'

// Email-Konfiguration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true für 465, false für andere Ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  // SMTP-Konfiguration prüfen
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('SMTP-Konfiguration fehlt. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS in .env setzen.')
  }

  try {
    const transporter = createTransporter()
    
    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Du hast es fast geschafft! - E-Mail bestätigen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>E-Mail bestätigen</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
            .highlight { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛡️ barriere-frei24</div>
              <h1>🎉 Du hast es fast geschafft!</h1>
            </div>
            
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>du hast es fast geschafft! 🚀 Um dein Konto bei barriere-frei24 zu aktivieren, bestätige einfach diesen Link und du kannst sofort mit der Barrierefreiheitsprüfung deiner Website beginnen.</p>
            
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">✅ Jetzt E-Mail bestätigen</a>
            </div>
            
            <div class="highlight">
              <p><strong>💡 Was dich erwartet:</strong></p>
              <p>Nach der Bestätigung kannst du direkt loslegen und deine Website auf WCAG-Konformität prüfen. Du bekommst detaillierte Berichte und konkrete Verbesserungsvorschläge - alles in wenigen Minuten!</p>
            </div>
            
            <p>Falls der Button nicht funktioniert, kopiere einfach diesen Link in deinen Browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 5px; font-size: 14px;">${verifyUrl}</p>
            
            <p><strong>⏰ Wichtig:</strong> Dieser Link ist 24 Stunden gültig. Falls er abgelaufen ist, kannst du dich einfach erneut registrieren.</p>
            
            <p>Freue dich auf:</p>
            <ul style="color: #059669;">
              <li><strong>✅ Automatische WCAG-Prüfungen</strong> in unter 60 Sekunden</li>
              <li><strong>📊 Detaillierte Berichte</strong> mit konkreten Lösungsvorschlägen</li>
              <li><strong>🎯 Aufgabenverwaltung</strong> für strukturierte Verbesserungen</li>
              <li><strong>🧠 WCAG-Coach</strong> für dein Team</li>
            </ul>
            
            <p>Bei Fragen sind wir für dich da! 😊</p>
            
            <p>Bis gleich im Dashboard,<br>
            <strong>Dein barriere-frei24 Team</strong></p>
            
            <div class="footer">
              <p>Diese E-Mail wurde automatisch generiert. Bitte antworte nicht auf diese E-Mail.</p>
              <p><strong>barriere-frei24</strong> | Dein Partner für digitale Barrierefreiheit 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
    
    await transporter.sendMail(mailOptions)
    return { success: true, message: 'Bestätigungs-E-Mail gesendet' }
    
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error)
    return { success: false, message: 'Fehler beim E-Mail-Versand' }
  }
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  // SMTP-Konfiguration prüfen
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('SMTP-Konfiguration fehlt. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS in .env setzen.')
  }

  try {
    const transporter = createTransporter()
    
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Passwort zurücksetzen - Barriere-frei24.de',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #2563eb; text-align: center;">Passwort zurücksetzen</h1>
          
          <p>Hallo ${name},</p>
          
          <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
          
          <p>Klicken Sie auf den folgenden Button, um ein neues Passwort zu setzen:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Neues Passwort setzen
            </a>
          </div>
          
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p>Dieser Link ist 1 Stunde gültig.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 14px;">
            Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Mit freundlichen Grüßen<br>
            Ihr Barriere-frei24.de Team
          </p>
        </div>
      `
    }
    
    await transporter.sendMail(mailOptions)
    return { success: true, message: 'Password-Reset-E-Mail gesendet' }
    
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error)
    return { success: false, message: 'Fehler beim E-Mail-Versand' }
  }
} 
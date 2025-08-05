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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 16px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; font-size: 16px; }
            .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
            .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">barriere-frei24</div>
              <h1 style="color: #1f2937; margin: 0; font-size: 24px;">E-Mail-Bestätigung erforderlich</h1>
            </div>
            
            <p>Hallo <strong>${name}</strong>,</p>
            
            <p>vielen Dank für Ihre Registrierung bei barriere-frei24. Um Ihr Konto zu aktivieren und mit der professionellen Barrierefreiheitsprüfung zu beginnen, bestätigen Sie bitte Ihre E-Mail-Adresse.</p>
            
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">E-Mail-Adresse bestätigen</a>
            </div>
            
            <div class="highlight">
              <p style="margin: 0 0 12px 0;"><strong>Nach der Bestätigung erhalten Sie Zugang zu:</strong></p>
              <ul style="padding-left: 0; list-style: none;">
                <li style="padding: 4px 0; color: #374151;">✓ Automatische WCAG-Konformitätsprüfung</li>
                <li style="padding: 4px 0; color: #374151;">✓ Detaillierte Analyseberichte</li>
                <li style="padding: 4px 0; color: #374151;">✓ Konkrete Verbesserungsvorschläge</li>
                <li style="padding: 4px 0; color: #374151;">✓ Strukturierte Aufgabenverwaltung</li>
              </ul>
            </div>
            
            <p>Falls der Button nicht funktioniert, können Sie folgenden Link kopieren und in Ihrem Browser öffnen:</p>
            <div style="word-break: break-all; background: #f8fafc; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #4b5563; margin: 16px 0;">${verifyUrl}</div>
            
            <p><strong>Hinweis:</strong> Dieser Bestätigungslink ist 24 Stunden gültig.</p>
            
            <p>Mit freundlichen Grüßen<br>
            <strong>Ihr barriere-frei24 Team</strong></p>
            
            <div class="footer">
              <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
              <p><strong>barriere-frei24</strong> – Professionelle Barrierefreiheitsprüfung</p>
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

export async function sendInvoiceEmail(
  email: string, 
  name: string, 
  invoiceNumber: string, 
  amount: number,
  pdfBuffer: Buffer,
  bundleType?: string,
  credits?: number
) {
  // SMTP-Konfiguration prüfen
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('SMTP-Konfiguration fehlt. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS in .env setzen.')
  }

  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Rechnung ${invoiceNumber} - barriere-frei24`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rechnung ${invoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 16px; }
            .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 6px; }
            .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
            .success-box { background: #2563eb; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">barriere-frei24</div>
              <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Rechnung ${invoiceNumber}</h1>
            </div>
            
            <div class="success-box">
              <h2 style="margin: 0; font-size: 18px;">Zahlung erfolgreich verarbeitet ✓</h2>
            </div>
            
            <p>Hallo <strong>${name}</strong>,</p>
            
            <p>vielen Dank für Ihren Kauf bei barriere-frei24.</p>
            
            <div class="highlight">
              <p><strong>Rechnungsdetails:</strong></p>
              <ul>
                <li><strong>Rechnungsnummer:</strong> ${invoiceNumber}</li>
                <li><strong>Betrag:</strong> ${amount.toFixed(2)} € (inkl. MwSt.)</li>
                <li><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}</li>
                ${bundleType ? `<li><strong>Bundle:</strong> ${bundleType}</li>` : ''}
                ${credits ? `<li><strong>Credits erhalten:</strong> +${credits} Credits</li>` : ''}
              </ul>
            </div>
            
            <p>Ihre Rechnung finden Sie als PDF im Anhang dieser E-Mail.</p>
            
            <p>Sie können Ihre Rechnungen auch jederzeit in Ihrem Dashboard unter "Einstellungen > Rechnungen & Pakete" einsehen und herunterladen.</p>
            
            ${bundleType ? `
              <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0;"><strong>Ihr ${bundleType} Bundle ist jetzt aktiv ✓</strong></p>
                <p style="margin: 8px 0 0 0;">Alle Features sind sofort verfügbar. Loggen Sie sich in Ihr Dashboard ein.</p>
              </div>
            ` : ''}
            
            ${credits ? `
              <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0;"><strong>${credits} Credits wurden gutgeschrieben ✓</strong></p>
                <p style="margin: 8px 0 0 0;">Ihre Credits sind sofort einsatzbereit für Scans, Coach und BFE-Generator.</p>
              </div>
            ` : ''}
            
            <p><strong>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</strong></p>
            <ul>
              <li>E-Mail: support@barriere-frei24.de</li>
              <li>Dashboard: <a href="${process.env.NEXTAUTH_URL || 'https://app.barriere-frei24.de'}/dashboard" style="color: #2563eb;">Jetzt einloggen</a></li>
            </ul>
            
            <p>Vielen Dank für Ihr Vertrauen.</p>
            
            <p>Mit freundlichen Grüßen<br>
            <strong>Ihr barriere-frei24 Team</strong></p>
            
            <div class="footer">
              <p>Diese E-Mail wurde automatisch generiert.</p>
              <p><strong>barriere-frei24</strong> – Professionelle Barrierefreiheitsprüfung</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Rechnung_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }
    
    await transporter.sendMail(mailOptions)
    return { success: true, message: 'Rechnung per E-Mail versendet' }
    
  } catch (error) {
    console.error('Fehler beim Rechnungs-E-Mail-Versand:', error)
    return { success: false, message: 'Fehler beim Rechnungs-E-Mail-Versand' }
  }
} 
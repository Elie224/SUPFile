/**
 * Utilitaire d'envoi d'emails pour SUPFile
 * Configuration SMTP via variables d'environnement
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configuration du transporteur email
let transporter = null;

const LOGO_CID = 'logo@supfile';

/**
 * Charge le logo pour l'email (buffer pour pièce jointe cid – affichage fiable dans tous les clients)
 */
function getLogoAttachment() {
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const content = fs.readFileSync(logoPath);
      return { filename: 'logo.png', content, cid: LOGO_CID };
    }
  } catch (e) {
    console.warn('Logo non trouvé pour l\'email:', e.message);
  }
  return null;
}

/**
 * Initialise le transporteur email
 */
function initTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ Configuration SMTP incomplète. Les emails ne seront pas envoyés.');
    console.warn('   Configurez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS dans .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: parseInt(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} to - Adresse email du destinataire
 * @param {string} resetUrl - URL de réinitialisation
 * @returns {Promise<boolean>} Succès ou échec
 */
async function sendPasswordResetEmail(to, resetUrl) {
  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    console.log('📧 [DEV MODE] Email de réinitialisation pour:', to);
    console.log('📧 [DEV MODE] URL de réinitialisation:', resetUrl);
    return true;
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = 'SUPFile';
  const logoAttachment = getLogoAttachment();
  const attachments = logoAttachment ? [logoAttachment] : [];
  const logoImg = logoAttachment
    ? `<img src="cid:${LOGO_CID}" alt="SUPFile" width="160" style="max-width:160px;height:auto;display:block;margin:0 auto;" />`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="color:#1e293b;font-size:22px;text-align:center;margin:0 0 16px 0;font-weight:700;">Réinitialisation du mot de passe</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.6;text-align:center;margin:0 0 28px 0;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
      <div style="text-align:center;margin:0 0 24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;">Réinitialiser mon mot de passe</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">Ce lien expire dans 15 minutes et ne fonctionnera plus après.</p>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0 0;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    </div>
    <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
      ${logoImg}
      <p style="color:#64748b;font-size:14px;font-weight:600;margin:12px 0 4px 0;">SUPFile</p>
      <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} SUPFile</p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `${appName} - Réinitialisation de votre mot de passe`,
    html,
    attachments,
    text: `SUPFile - Réinitialisation du mot de passe\n\nCliquez pour définir un nouveau mot de passe :\n${resetUrl}\n\nCe lien expire dans 15 minutes et ne fonctionnera plus après. Si vous n'avez pas fait cette demande, ignorez cet email.\n\n© ${new Date().getFullYear()} SUPFile`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Email de réinitialisation envoyé à:', to);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return false;
  }
}

/**
 * Envoie un email de vérification d'adresse email
 * @param {string} to - Adresse email du destinataire
 * @param {string} verifyUrl - URL de vérification (lien cliquable)
 * @param {string} [firstName] - Prénom pour personnaliser le message
 * @returns {Promise<boolean>} Succès ou échec
 */
async function sendVerificationEmail(to, verifyUrl, firstName = '') {
  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    console.log('📧 [DEV MODE] Email de vérification pour:', to);
    console.log('📧 [DEV MODE] URL de vérification:', verifyUrl);
    return true;
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = 'SUPFile';
  const logoAttachment = getLogoAttachment();
  const attachments = logoAttachment ? [logoAttachment] : [];
  const logoImg = logoAttachment
    ? `<img src="cid:${LOGO_CID}" alt="SUPFile" width="160" style="max-width:160px;height:auto;display:block;margin:0 auto;" />`
    : '';
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="color:#1e293b;font-size:22px;text-align:center;margin:0 0 16px 0;font-weight:700;">Vérifiez votre adresse email</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 12px 0;">${greeting}</p>
      <p style="color:#64748b;font-size:15px;line-height:1.6;text-align:center;margin:0 0 28px 0;">Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte SUPFile.</p>
      <div style="text-align:center;margin:0 0 24px 0;">
        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;">Vérifier mon email</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">Ce lien expire dans 24 heures.</p>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0 0;">Si vous n'avez pas créé de compte SUPFile, ignorez cet email.</p>
    </div>
    <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
      ${logoImg}
      <p style="color:#64748b;font-size:14px;font-weight:600;margin:12px 0 4px 0;">SUPFile</p>
      <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} SUPFile</p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `${appName} - Vérifiez votre adresse email`,
    html,
    attachments,
    text: `SUPFile - Vérification de votre email\n\n${greeting}\n\nCliquez pour vérifier votre adresse et activer votre compte :\n${verifyUrl}\n\nCe lien expire dans 15 minutes.\n\n© ${new Date().getFullYear()} SUPFile`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Email de vérification envoyé à:', to);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email vérification:', error.message);
    return false;
  }
}

module.exports = {
  initTransporter,
  sendPasswordResetEmail,
  sendVerificationEmail,
};

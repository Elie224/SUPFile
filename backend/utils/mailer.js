/**
 * Utilitaire d'envoi d'emails pour SUPFile
 * Configuration SMTP via variables d'environnement
 */

const nodemailer = require('nodemailer');

// Configuration du transporteur email
let transporter = null;

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

  // Si toujours pas de transporteur, on log l'URL pour le dev
  if (!transporter) {
    console.log('📧 [DEV MODE] Email de réinitialisation pour:', to);
    console.log('📧 [DEV MODE] URL de réinitialisation:', resetUrl);
    return true; // Retourne true en mode dev pour ne pas bloquer
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = 'SUPFile';

  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `${appName} - Réinitialisation de votre mot de passe`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 16px 24px; border-radius: 12px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">SUPFile</span>
              </div>
            </div>

            <!-- Titre -->
            <h1 style="color: #1e293b; font-size: 24px; text-align: center; margin-bottom: 16px;">
              Réinitialisation de mot de passe
            </h1>

            <!-- Message -->
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
              Vous avez demandé à réinitialiser votre mot de passe.<br>
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </p>

            <!-- Bouton -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);">
                Réinitialiser mon mot de passe
              </a>
            </div>

            <!-- Expiration -->
            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #92400E; font-size: 14px; margin: 0; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">⏱️</span>
                <strong>Important :</strong> Ce lien expire dans <strong>15 minutes</strong> pour votre sécurité.
              </p>
            </div>

            <!-- Lien alternatif -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
              </p>
              <p style="color: #3B82F6; font-size: 12px; word-break: break-all; margin: 0;">
                ${resetUrl}
              </p>
            </div>

            <!-- Avertissement -->
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.<br>
              Votre mot de passe restera inchangé.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #94a3b8; font-size: 12px;">
              © ${new Date().getFullYear()} ${appName}. Tous droits réservés.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
SUPFile - Réinitialisation de mot de passe

Vous avez demandé à réinitialiser votre mot de passe.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

⏱️ IMPORTANT : Ce lien expire dans 15 minutes pour votre sécurité.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

© ${new Date().getFullYear()} SUPFile
    `,
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

module.exports = {
  initTransporter,
  sendPasswordResetEmail,
};

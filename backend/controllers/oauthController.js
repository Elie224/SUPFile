const passport = require('passport');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const config = require('../config');

// Middleware pour initialiser l'authentification OAuth
const initiateOAuth = (provider) => {
  return (req, res, next) => {
    // Vérifier si le provider est configuré
    const providerConfig = config.oauth[provider];
    
    // Log de débogage
    console.log(`[OAuth ${provider}] Checking configuration...`);
    console.log(`[OAuth ${provider}] Config object:`, {
      exists: !!providerConfig,
      clientId: providerConfig?.clientId ? 'present' : 'missing',
      clientSecret: providerConfig?.clientSecret ? 'present' : 'missing',
      redirectUri: providerConfig?.redirectUri || 'not set'
    });
    
    if (!providerConfig || !providerConfig.clientId || !providerConfig.clientSecret) {
      console.error(`OAuth ${provider} not configured: missing credentials`);
      console.error(`  Provider config exists: ${!!providerConfig}`);
      console.error(`  Client ID present: ${!!providerConfig?.clientId}`);
      console.error(`  Client Secret present: ${!!providerConfig?.clientSecret}`);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured&message=${encodeURIComponent(`OAuth ${provider} is not configured. Please contact the administrator.`)}`);
    }
    
    console.log(`[OAuth ${provider}] Configuration OK, initiating authentication...`);

    // Stocker l'URL de redirection après connexion si fournie
    if (req.query.redirect) {
      req.session.oauthRedirect = req.query.redirect;
    }

    try {
      passport.authenticate(provider, { scope: provider === 'google' ? ['profile', 'email'] : ['user:email'] })(req, res, next);
    } catch (error) {
      console.error(`Error initiating OAuth ${provider}:`, error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_init_failed&message=${encodeURIComponent(error.message || 'Failed to initiate OAuth')}`);
    }
  };
};

// Callback OAuth - génère les tokens et redirige vers le frontend
const handleOAuthCallback = (provider) => {
  return async (req, res, next) => {
    passport.authenticate(provider, { session: false }, async (err, user, info) => {
      if (err) {
        console.error(`OAuth ${provider} error:`, err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(err.message)}`);
      }

      if (!user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=Authentication failed`);
      }

      try {
        // Mettre à jour last_login_at
        await User.updateLastLogin(user.id);

        // Générer les tokens JWT
        const payload = { id: user.id, email: user.email };
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(payload);

        // Créer une session
        try {
          const userAgent = req.get('user-agent') || null;
          const ip = req.ip || req.headers['x-forwarded-for'] || null;
          await Session.createSession({
            userId: user.id,
            refreshToken: refresh_token,
            userAgent,
            ipAddress: ip,
            deviceName: null,
            expiresIn: config.jwt.refreshExpiresIn
          });
        } catch (sessionErr) {
          console.error('Failed to create session for OAuth user:', sessionErr.message || sessionErr);
        }

        // Rediriger vers le frontend avec les tokens dans l'URL (ou mieux, dans un cookie sécurisé)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = req.session.oauthRedirect || '/dashboard';
        
        // Encoder les tokens pour les passer dans l'URL
        const tokens = encodeURIComponent(JSON.stringify({ access_token, refresh_token }));
        res.redirect(`${frontendUrl}/auth/callback?tokens=${tokens}&redirect=${encodeURIComponent(redirectUrl)}`);
      } catch (error) {
        console.error(`OAuth ${provider} callback error:`, error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
      }
    })(req, res, next);
  };
};

module.exports = {
  initiateOAuth,
  handleOAuthCallback,
};


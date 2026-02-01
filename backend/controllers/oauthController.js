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
      const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured&message=${encodeURIComponent(`OAuth ${provider} is not configured. Please contact the administrator.`)}`);
    }
    
    // Vérifier que la stratégie Passport existe
    if (!passport._strategies || !passport._strategies[provider]) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`OAuth ${provider} strategy not found in Passport`);
      }
      const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured&message=${encodeURIComponent(`OAuth ${provider} strategy is not registered. Please check server configuration.`)}`);
    }

    // Stocker l'URL de redirection si elle est sûre (chemin relatif uniquement - anti Open Redirect)
    const redirect = req.query.redirect;
    if (redirect && typeof redirect === 'string') {
      const r = redirect.trim();
      if (r.startsWith('/') && !r.startsWith('//') && !r.includes(':')) {
        req.session.oauthRedirect = r;
      }
    }

    try {
      passport.authenticate(provider, { scope: provider === 'google' ? ['profile', 'email'] : ['user:email'] })(req, res, next);
    } catch (error) {
      console.error(`Error initiating OAuth ${provider}:`, error);
      const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
      res.redirect(`${frontendUrl}/login?error=oauth_init_failed&message=${encodeURIComponent(error.message || 'Failed to initiate OAuth')}`);
    }
  };
};

// Callback OAuth - génère les tokens et redirige vers le frontend
const handleOAuthCallback = (provider) => {
  return async (req, res, next) => {
    passport.authenticate(provider, { session: false }, async (err, user, info) => {
      if (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`OAuth ${provider} error:`, err);
        }
        const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
        const errorMessage = err.message || 'Erreur lors de l\'authentification OAuth';
        return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`);
      }

      if (!user) {
        console.error(`OAuth ${provider}: No user returned from authentication`);
        const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
        const errorMessage = info?.message || 'Échec de l\'authentification. Veuillez réessayer.';
        return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`);
      }

      try {
        // Vérifier que l'utilisateur a bien un email
        if (!user.email) {
          throw new Error('Aucun email trouvé dans le profil OAuth');
        }

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
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to create session for OAuth user:', sessionErr.message || sessionErr);
          }
          // Ne pas bloquer la connexion si la session échoue
        }

        // Vérifier si c'est un callback mobile (deep link) - valider le schéma strict
        const requestedRedirectUri = req.query.redirect_uri || req.body?.redirect_uri;
        const allowedMobileScheme = /^supfile:\/\/oauth\/(google|github)\/callback(\?.*)?$/i;
        
        if (requestedRedirectUri && typeof requestedRedirectUri === 'string' && allowedMobileScheme.test(requestedRedirectUri.trim())) {
          // C'est un callback mobile - rediriger vers le deep link avec les tokens
          const redirectUrl = `${requestedRedirectUri}?token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`;
          console.log(`OAuth ${provider} success (mobile): User ${user.email} authenticated`);
          return res.redirect(redirectUrl);
        }
        
        // Sinon, rediriger vers le frontend web avec les tokens dans l'URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
        const redirectUrl = req.session?.oauthRedirect || '/dashboard';
        
        // Encoder les tokens pour les passer dans l'URL
        const tokens = encodeURIComponent(JSON.stringify({ access_token, refresh_token }));
        if (process.env.NODE_ENV !== 'production') {
          console.log(`OAuth ${provider} success (web)`);
        }
        res.redirect(`${frontendUrl}/auth/callback?tokens=${tokens}&redirect=${encodeURIComponent(redirectUrl)}`);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`OAuth ${provider} callback error:`, error);
        }
        const frontendUrl = process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com';
        const errorMessage = error.message || 'Erreur lors du traitement de l\'authentification OAuth';
        res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`);
      }
    })(req, res, next);
  };
};

module.exports = {
  initiateOAuth,
  handleOAuthCallback,
};


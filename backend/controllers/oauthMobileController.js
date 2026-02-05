const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const config = require('../config');
const axios = require('axios');
const { normalizeEmailForLookup } = require('../utils/authTokenSecurity');
const { capString, normalizeTokenString } = require('../utils/inputStrings');

/**
 * Gérer le callback OAuth depuis l'application mobile (Google Sign-In natif)
 * POST /api/auth/google/callback
 */
async function handleGoogleMobileCallback(req, res, next) {
  try {
    const id_token = normalizeTokenString(req.body?.id_token, 8192);
    const access_token = normalizeTokenString(req.body?.access_token, 4096);
    const email = normalizeEmailForLookup(req.body?.email);
    const display_name = capString(req.body?.display_name, 120);
    const photo_url = capString(req.body?.photo_url, 2048);

    if (!id_token && !access_token) {
      return res.status(400).json({
        error: { message: 'id_token ou access_token requis' }
      });
    }

    const googleClientId = config?.oauth?.google?.clientId;
    if (!googleClientId || typeof googleClientId !== 'string') {
      return res.status(500).json({
        error: { message: 'Configuration OAuth Google manquante' }
      });
    }

    const extraAllowedAudiences = (process.env.GOOGLE_ALLOWED_CLIENT_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const allowedAudiences = new Set([googleClientId, ...extraAllowedAudiences]);

    // Vérifier le token Google
    let payload;

    try {
      if (id_token) {
        // Vérifier le ID token avec Google
        const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
          params: { id_token },
          timeout: 5000,
          maxContentLength: 64 * 1024,
          maxBodyLength: 64 * 1024,
        });
        const tokenInfo = response.data;
        
        // Vérifier que le token est pour un client ID autorisé.
        // Si mismatch mais access_token présent, on peut fallback sur userinfo.
        if (!tokenInfo || !tokenInfo.aud || !allowedAudiences.has(tokenInfo.aud)) {
          if (access_token) {
            // Fallback: use access_token verification path.
            payload = null;
          } else {
            return res.status(401).json({
              error: { message: 'Token Google invalide (client ID mismatch)' }
            });
          }
        }

        // Vérifier l'issuer si présent
        if (tokenInfo.iss && tokenInfo.iss !== 'accounts.google.com' && tokenInfo.iss !== 'https://accounts.google.com') {
          return res.status(401).json({
            error: { message: 'Token Google invalide (issuer mismatch)' }
          });
        }

        if (tokenInfo && tokenInfo.sub && tokenInfo.email && tokenInfo.aud && allowedAudiences.has(tokenInfo.aud)) {
          const normalizedEmail = normalizeEmailForLookup(tokenInfo.email) || email;
          payload = {
            sub: tokenInfo.sub,
            email: normalizedEmail,
            name: capString(tokenInfo.name, 120) || display_name,
            picture: capString(tokenInfo.picture, 2048) || photo_url,
          };
        }
      } else if (access_token) {
        // Utiliser l'access_token pour obtenir les infos utilisateur
        const response = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo`, {
          headers: { 'Authorization': `Bearer ${access_token}` },
          timeout: 5000,
          maxContentLength: 64 * 1024,
          maxBodyLength: 64 * 1024,
        });
        const userInfo = response.data;
        const normalizedEmail = normalizeEmailForLookup(userInfo?.email) || email;
        payload = {
          sub: userInfo.id,
          email: normalizedEmail,
          name: capString(userInfo?.name, 120) || display_name,
          picture: capString(userInfo?.picture, 2048) || photo_url,
        };
      }

      // If we tried id_token but did not build payload (aud mismatch), fallback to access_token if present.
      if ((!payload || !payload.sub || !payload.email) && access_token) {
        const response = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo`, {
          headers: { 'Authorization': `Bearer ${access_token}` },
          timeout: 5000,
          maxContentLength: 64 * 1024,
          maxBodyLength: 64 * 1024,
        });
        const userInfo = response.data;
        const normalizedEmail = normalizeEmailForLookup(userInfo?.email) || email;
        payload = {
          sub: userInfo.id,
          email: normalizedEmail,
          name: capString(userInfo?.name, 120) || display_name,
          picture: capString(userInfo?.picture, 2048) || photo_url,
        };
      }

      if (!payload || !payload.sub || !payload.email) {
        return res.status(400).json({
          error: { message: 'Token Google invalide ou email manquant' }
        });
      }

      // Chercher ou créer l'utilisateur
      let user = await User.findByEmail(payload.email);

      if (!user) {
        // Créer un nouvel utilisateur
        user = await User.create({
          email: payload.email,
          passwordHash: null, // Pas de mot de passe pour OAuth
          display_name: payload.name || display_name || payload.email.split('@')[0],
          avatar_url: payload.picture || null,
          oauth_provider: 'google',
          oauth_id: payload.sub,
          email_verified: true,
        });

        // Créer le dossier racine
        const FolderModel = require('../models/folderModel');
        try {
          await FolderModel.create({ name: 'Root', ownerId: user.id, parentId: null });
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to create root folder for OAuth user:', e.message || e);
          }
        }
      } else {
        // Mettre à jour le last_login
        await User.updateLastLogin(user.id);
      }

      // Générer les tokens JWT
      const jwtPayload = { id: user.id, email: user.email };
      const access_token_jwt = generateAccessToken(jwtPayload);
      const refresh_token_jwt = generateRefreshToken(jwtPayload);

      // Créer une session
      try {
        const userAgent = req.get('user-agent') || null;
        const ip = req.ip || req.headers['x-forwarded-for'] || null;
        await Session.createSession({
          userId: user.id,
          refreshToken: refresh_token_jwt,
          userAgent,
          ipAddress: ip,
          deviceName: 'Mobile App',
          expiresIn: config.jwt.refreshExpiresIn
        });
      } catch (sessionErr) {
        console.error('Failed to create session for OAuth mobile user:', sessionErr.message || sessionErr);
      }

      // Retourner les tokens en JSON pour le mobile
      return res.status(200).json({
        data: {
          access_token: access_token_jwt,
          refresh_token: refresh_token_jwt,
          user: user.toDTO ? user.toDTO() : {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            quota_limit: user.quota_limit,
            quota_used: user.quota_used,
            is_admin: user.is_admin || false,
            created_at: user.created_at,
          }
        }
      });

    } catch (googleError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Google token verification error:', googleError);
      }
      return res.status(401).json({
        error: { message: 'Token Google invalide ou expiré' }
      });
    }

  } catch (error) {
    console.error('Google mobile OAuth callback error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Erreur lors de l\'authentification Google' }
    });
  }
}

/**
 * Gérer le callback OAuth depuis l'application mobile (GitHub via deep link)
 * Le mobile reçoit les tokens depuis le navigateur via deep link
 * Cette route vérifie les tokens reçus
 */
async function handleGitHubMobileCallback(req, res, next) {
  try {
    // Pour GitHub mobile, les tokens sont déjà dans l'URL du deep link
    // Cette route peut être utilisée pour valider les tokens si nécessaire
    // Pour l'instant, GitHub mobile utilise le flux navigateur avec deep links
    
    return res.status(400).json({
      error: { message: 'GitHub mobile utilise le flux navigateur avec deep links. Utilisez GET /api/auth/github avec redirect_uri=supfile://oauth/github/callback' }
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('GitHub mobile OAuth callback error:', error);
    }
    return res.status(500).json({
      error: { message: error.message || 'Erreur lors de l\'authentification GitHub' }
    });
  }
}

module.exports = {
  handleGoogleMobileCallback,
  handleGitHubMobileCallback,
};
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const config = require('../config');
const axios = require('axios');

/**
 * Gérer le callback OAuth depuis l'application mobile (Google Sign-In natif)
 * POST /api/auth/google/callback
 */
async function handleGoogleMobileCallback(req, res, next) {
  try {
    const { id_token, access_token, email, display_name, photo_url } = req.body;

    if (!id_token && !access_token) {
      return res.status(400).json({
        error: { message: 'id_token ou access_token requis' }
      });
    }

    // Vérifier le token Google
    let payload;

    try {
      if (id_token) {
        // Vérifier le ID token avec Google
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
        const tokenInfo = response.data;
        
        // Vérifier que le token est pour notre client ID
        if (tokenInfo.aud !== config.oauth.google.clientId) {
          return res.status(401).json({
            error: { message: 'Token Google invalide (client ID mismatch)' }
          });
        }
        
        payload = {
          sub: tokenInfo.sub,
          email: tokenInfo.email || email,
          name: tokenInfo.name || display_name,
          picture: tokenInfo.picture || photo_url,
        };
      } else if (access_token) {
        // Utiliser l'access_token pour obtenir les infos utilisateur
        const response = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo`, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const userInfo = response.data;
        payload = {
          sub: userInfo.id,
          email: userInfo.email || email,
          name: userInfo.name || display_name,
          picture: userInfo.picture || photo_url,
        };
      }

      if (!payload || !payload.email) {
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
          displayName: payload.name || display_name || payload.email.split('@')[0],
          oauthProvider: 'google',
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
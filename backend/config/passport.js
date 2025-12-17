const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const UserModel = require('../models/userModel');
const FolderModel = require('../models/folderModel');
const config = require('../config');

// Configuration des stratégies OAuth
const configurePassport = () => {
  console.log('🔧 Configuring OAuth strategies...');
  console.log('📋 GitHub config check:', {
    clientId: config.oauth.github?.clientId ? 'present' : 'missing',
    clientSecret: config.oauth.github?.clientSecret ? 'present' : 'missing',
    redirectUri: config.oauth.github?.redirectUri || 'not set'
  });
  
  // Stratégie Google
  if (config.oauth.google?.clientId && config.oauth.google?.clientSecret) {
    console.log('✅ Google OAuth configured');
    passport.use(new GoogleStrategy({
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.redirectUri,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Chercher un utilisateur existant avec cet email
        const UserSchema = mongoose.model('User');
        let dbUser = await UserSchema.findOne({ email });
        
        if (dbUser) {
          // Utilisateur existe déjà - mettre à jour les infos OAuth si nécessaire
          if (!dbUser.oauth_provider || dbUser.oauth_provider !== 'google') {
            await UserSchema.findByIdAndUpdate(dbUser._id, {
              oauth_provider: 'google',
              oauth_id: profile.id,
              display_name: dbUser.display_name || profile.displayName,
              avatar_url: dbUser.avatar_url || profile.photos?.[0]?.value,
            });
            dbUser = await UserSchema.findById(dbUser._id);
          }
          
          const user = await UserModel.findById(dbUser._id.toString());
          return done(null, user);
        } else {
          // Créer un nouvel utilisateur OAuth
          const newUser = new UserSchema({
            email,
            oauth_provider: 'google',
            oauth_id: profile.id,
            display_name: profile.displayName,
            avatar_url: profile.photos?.[0]?.value,
            password_hash: null,
          });
          
          const saved = await newUser.save();
          
          // Créer le dossier racine pour l'utilisateur
          try {
            await FolderModel.create({ name: 'Root', ownerId: saved._id.toString(), parentId: null });
          } catch (e) {
            console.error('Failed to create root folder for OAuth user:', e.message || e);
          }
          
          const user = await UserModel.findById(saved._id.toString());
          return done(null, user);
        }
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
  }

  // Stratégie GitHub
  if (config.oauth.github?.clientId && config.oauth.github?.clientSecret) {
    console.log('✅ GitHub OAuth configured');
    passport.use(new GitHubStrategy({
      clientID: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.redirectUri,
      scope: ['user:email'], // Demander explicitement l'accès à l'email
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub peut ne pas fournir l'email dans le profile directement
        // Il faut utiliser l'API GitHub pour récupérer l'email
        let email = profile.emails?.[0]?.value;
        
        // Si pas d'email dans le profile, essayer de le récupérer via l'API GitHub
        if (!email && accessToken) {
          try {
            const https = require('https');
            const emailResponse = await new Promise((resolve, reject) => {
              https.get({
                hostname: 'api.github.com',
                path: '/user/emails',
                headers: {
                  'User-Agent': 'SUPFile',
                  'Authorization': `token ${accessToken}`,
                  'Accept': 'application/vnd.github.v3+json'
                }
              }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                  try {
                    const emails = JSON.parse(data);
                    // Chercher l'email principal ou le premier email vérifié
                    const primaryEmail = emails.find(e => e.primary) || emails.find(e => e.verified) || emails[0];
                    resolve(primaryEmail?.email);
                  } catch (e) {
                    reject(e);
                  }
                });
              }).on('error', reject);
            });
            
            if (emailResponse) {
              email = emailResponse;
            }
          } catch (emailError) {
            console.warn('Failed to fetch GitHub email:', emailError.message);
          }
        }
        
        // Fallback si toujours pas d'email
        if (!email) {
          email = `${profile.username}@github.noreply`;
        }
        
        const displayName = profile.displayName || profile.username || profile._json?.name;

        // Chercher un utilisateur existant
        const UserSchema = mongoose.model('User');
        let dbUser = await UserSchema.findOne({ email });
        
        if (dbUser) {
          if (!dbUser.oauth_provider || dbUser.oauth_provider !== 'github') {
            await UserSchema.findByIdAndUpdate(dbUser._id, {
              oauth_provider: 'github',
              oauth_id: profile.id.toString(),
              display_name: dbUser.display_name || displayName,
              avatar_url: dbUser.avatar_url || profile.photos?.[0]?.value,
            });
            dbUser = await UserSchema.findById(dbUser._id);
          }
          
          const user = await UserModel.findById(dbUser._id.toString());
          return done(null, user);
        } else {
          const newUser = new UserSchema({
            email,
            oauth_provider: 'github',
            oauth_id: profile.id.toString(),
            display_name: displayName,
            avatar_url: profile.photos?.[0]?.value,
            password_hash: null,
          });
          
          const saved = await newUser.save();
          
          try {
            await FolderModel.create({ name: 'Root', ownerId: saved._id.toString(), parentId: null });
          } catch (e) {
            console.error('Failed to create root folder for OAuth user:', e.message || e);
          }
          
          const user = await UserModel.findById(saved._id.toString());
          return done(null, user);
        }
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
  }
  
  console.log('🔧 OAuth strategies configuration completed');
};

module.exports = configurePassport;


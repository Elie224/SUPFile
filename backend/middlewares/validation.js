// Schémas de validation Joi
const Joi = require('joi');

// Liste des pays valides (backend/config/countries.js)
const { isValidCountry } = require('../config/countries');

// Schéma pour l'inscription
const signupSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'L\'adresse e-mail doit être valide',
      'any.required': 'L\'adresse e-mail est requise',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le mot de passe ne doit pas dépasser 128 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir une majuscule et un chiffre',
      'any.required': 'Le mot de passe est requis',
    }),
  passwordConfirm: Joi.string()
    .valid(Joi.ref('password'))
    .optional()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
    }),
  first_name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'Le prénom est requis',
    }),
  last_name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'Le nom est requis',
    }),
  country: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (value && !isValidCountry(value)) {
        return helpers.error('any.invalid');
      }
      return value ? value.trim() : value;
    }, 'valid country')
    .messages({
      'any.invalid': 'Veuillez sélectionner un pays valide',
    }),
}).unknown(true);

// Schéma pour la connexion
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'L\'adresse e-mail doit être valide',
      'any.required': 'L\'adresse e-mail est requise',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe est requis',
    }),
}).unknown(true);

// Schéma pour création de dossier
const createFolderSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .trim()
    .messages({
      'string.max': 'Le nom du dossier ne doit pas dépasser 255 caractères',
      'any.required': 'Le nom du dossier est requis',
    }),
  parent_id: Joi.string().allow(null, '').optional(),
}).unknown(false);

// Schéma pour renommage
const renameSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .trim()
    .messages({
      'string.max': 'Le nom ne doit pas dépasser 255 caractères',
      'any.required': 'Le nom est requis',
    }),
}).unknown(false);

// Schéma pour partage public
const publicShareSchema = Joi.object({
  file_id: Joi.string().optional().allow(null, ''),
  folder_id: Joi.string().optional().allow(null, ''),
  password: Joi.string().min(6).max(128).optional().allow(null, '').messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'string.max': 'Le mot de passe ne doit pas dépasser 128 caractères',
  }),
  expires_at: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().isoDate(),
    Joi.string().allow('', null)
  ).optional().messages({
    'date.base': 'La date doit être valide',
    'alternatives.match': 'La date doit être une chaîne de date valide',
  }),
})
  .or('file_id', 'folder_id')
  .unknown(true) // Permettre d'autres champs pour éviter les erreurs
  .messages({
    'alternatives.match': 'file_id ou folder_id doit être fourni',
  });

// Schéma pour changement de mot de passe
const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe actuel est requis',
    }),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir une majuscule et un chiffre',
      'any.required': 'Le nouveau mot de passe est requis',
    }),
}).unknown(false);

// Fonction middleware pour valider avec un schéma
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retourner tous les erreurs
      stripUnknown: true, // Supprimer les propriétés inconnues
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: {
          message: 'Échec de validation',
          details: messages,
        },
      });
    }

    req.validatedBody = value;
    next();
  };
}

module.exports = {
  // Schémas
  signupSchema,
  loginSchema,
  createFolderSchema,
  renameSchema,
  publicShareSchema,
  changePasswordSchema,

  // Middleware
  validate,
};

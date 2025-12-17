// Schémas de validation Joi
const Joi = require('joi');

// Schéma pour l'inscription
const signupSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain uppercase letter and number',
      'any.required': 'Password is required',
    }),
  passwordConfirm: Joi.string()
    .valid(Joi.ref('password'))
    .optional()
    .messages({
      'any.only': 'Passwords do not match',
    }),
}).unknown(true);

// Schéma pour la connexion
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
}).unknown(true);

// Schéma pour création de dossier
const createFolderSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .trim()
    .messages({
      'string.max': 'Folder name must not exceed 255 characters',
      'any.required': 'Folder name is required',
    }),
  parent_id: Joi.number().integer().optional(),
}).unknown(false);

// Schéma pour renommage
const renameSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .trim()
    .messages({
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required',
    }),
}).unknown(false);

// Schéma pour partage public
const publicShareSchema = Joi.object({
  file_id: Joi.string().optional().allow(null, ''),
  folder_id: Joi.string().optional().allow(null, ''),
  password: Joi.string().min(6).optional().allow(null, '').messages({
    'string.min': 'Password must be at least 6 characters',
  }),
  expires_at: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().isoDate(),
    Joi.string().allow('', null)
  ).optional().messages({
    'date.base': 'Must be a valid date',
    'alternatives.match': 'Must be a valid date string',
  }),
})
  .or('file_id', 'folder_id')
  .unknown(true) // Permettre d'autres champs pour éviter les erreurs
  .messages({
    'alternatives.match': 'Either file_id or folder_id must be provided',
  });

// Schéma pour changement de mot de passe
const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase letter and number',
      'any.required': 'New password is required',
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
          message: 'Validation failed',
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

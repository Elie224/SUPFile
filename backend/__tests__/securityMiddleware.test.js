const path = require('path');

const { sanitizeQuery } = require('../middlewares/security');
const { resolvePathInUploadDir } = require('../utils/pathSafety');
const config = require('../config');

describe('security middlewares', () => {
  describe('sanitizeQuery', () => {
    test('strips mongo operators, dotted keys, and prototype pollution keys (query + body)', (done) => {
      const req = {
        query: {
          ok: '1',
          $ne: 'x',
          'a.b': 'x',
          nested: {
            $gt: 1,
            good: 2,
            deeper: {
              __proto__: { polluted: true },
              safe: 'y',
            },
          },
          arr: [{ $where: 'evil', ok: true }, 2],
        },
        body: {
          email: 'user@example.com',
          $where: 'evil',
          profile: {
            constructor: { prototype: { hacked: true } },
            safe: 'z',
          },
          list: [{ 'x.y': 1, fine: 2 }],
        },
      };

      sanitizeQuery(req, {}, () => {
        expect(req.query).toEqual({
          ok: '1',
          nested: {
            good: 2,
            deeper: {
              safe: 'y',
            },
          },
          arr: [{ ok: true }, 2],
        });

        expect(req.body).toEqual({
          email: 'user@example.com',
          profile: {
            safe: 'z',
          },
          list: [{ fine: 2 }],
        });

        done();
      });
    });
  });

  describe('resolvePathInUploadDir', () => {
    test('accepts paths within UPLOAD_DIR and rejects outside', () => {
      const baseDir = path.resolve(config.upload.uploadDir);

      const inside = path.join(baseDir, 'user_123', 'file.bin');
      expect(resolvePathInUploadDir(inside)).toBe(path.resolve(inside));

      const outside = path.resolve(baseDir, '..', '..', 'Windows', 'System32', 'drivers', 'etc', 'hosts');
      expect(resolvePathInUploadDir(outside)).toBeNull();
    });
  });
});

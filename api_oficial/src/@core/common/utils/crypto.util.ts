import * as bcrypt from 'bcrypt';

export const hashPasswordTransform = {
  async to(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  },
  async compare(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  },

  async salt() {
    return bcrypt.genSaltSync();
  },
};

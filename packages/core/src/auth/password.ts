// Hashes a plaintext password using bcrypt (cost 10 by default)
export async function hashPassword(plain: string): Promise<string> {
  // Bun.password.hash uses the options to specify algorithm and cost
  return Bun.password.hash(plain, { algorithm: 'bcrypt', cost: 10 });
}

// Verifies a plaintext password against a bcrypt hash
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plain, hash, 'bcrypt');
}

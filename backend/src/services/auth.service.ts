import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, NewUser } from '../db/schema';
import { generateToken } from '../utils/jwt';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants';
import { LoginInput, SignupInput } from '../schemas/auth.schema';

export async function signup(input: SignupInput) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw { statusCode: 409, message: 'Email already registered' };
  }

  const existingUsername = await db
    .select()
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);

  if (existingUsername.length > 0) {
    throw { statusCode: 409, message: 'Username already taken' };
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const newUser: NewUser = {
    email: input.email,
    username: input.username,
    passwordHash,
    role: 'user',
  };

  const [user] = await db.insert(users).values(newUser).returning();

  const token = generateToken(user.id, user.email, user.role);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  };
}

export async function login(input: LoginInput) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const token = generateToken(user.id, user.email, user.role);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  };
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

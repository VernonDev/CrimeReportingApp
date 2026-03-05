import { FastifyRequest } from 'fastify';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'user' | 'moderator' | 'admin';
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: TokenPayload;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

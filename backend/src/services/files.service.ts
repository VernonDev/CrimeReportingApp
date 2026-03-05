import { MultipartFile } from '@fastify/multipart';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../utils/constants';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}

export async function saveUploadedFile(file: MultipartFile): Promise<string> {
  const mimetype = file.mimetype;

  if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    throw {
      statusCode: 400,
      message: `Invalid file type: ${mimetype}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  const chunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of file.file) {
    totalSize += chunk.length;
    if (totalSize > MAX_FILE_SIZE) {
      throw {
        statusCode: 400,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const filename = generateUniqueFilename(file.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}

export async function saveUploadedFiles(files: AsyncIterableIterator<MultipartFile>): Promise<string[]> {
  await ensureUploadDir();
  const savedPaths: string[] = [];

  for await (const file of files) {
    const savedPath = await saveUploadedFile(file);
    savedPaths.push(savedPath);
  }

  return savedPaths;
}

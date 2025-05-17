import { z } from 'zod';

// S3 Upload URL Request Schema
export const S3UploadUrlRequestSchema = z.object({
  filename: z.string().min(1),
  fileType: z.string().min(1),
  userId: z.string().min(1),
});

export type S3UploadUrlRequest = z.infer<typeof S3UploadUrlRequestSchema>;

// S3 Upload URL Response
export interface S3UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

// Recording Creation Request Schema
export const RecordingCreationRequestSchema = z.object({
  userId: z.string().min(1),
  filename: z.string().min(1),
  s3Url: z.string().url(),
  duration: z.number().optional(),
});

export type RecordingCreationRequest = z.infer<typeof RecordingCreationRequestSchema>;

// Error Response
export interface ErrorResponse {
  message: string;
  status: number;
}

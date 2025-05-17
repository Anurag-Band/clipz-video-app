import { Router, Request, Response, NextFunction } from 'express';
import { generateUploadUrl } from '../services/s3Service';
import { S3UploadUrlRequestSchema } from '../types';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/s3/upload-url
 * Generate a pre-signed URL for uploading a file to S3
 */
router.post('/upload-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = S3UploadUrlRequestSchema.parse(req.body);
    const { filename, fileType, userId } = validatedData;

    // Generate pre-signed URL
    const { uploadUrl, key } = await generateUploadUrl(filename, fileType, userId);

    // Return the URL and key
    return res.status(200).json({ uploadUrl, key });
  } catch (error) {
    next(error);
  }
});

export default router;

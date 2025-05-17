import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.S3_BUCKET_NAME || '';

/**
 * Generate a pre-signed URL for uploading a file to S3
 * @param filename The name of the file
 * @param fileType The MIME type of the file
 * @param userId The ID of the user uploading the file
 * @returns An object containing the pre-signed URL and the S3 key
 */
export async function generateUploadUrl(
  filename: string,
  fileType: string,
  userId: string
): Promise<{ uploadUrl: string; key: string }> {
  // Create a unique key for the file
  const timestamp = Date.now();
  const key = `uploads/${userId}/${timestamp}-${filename}`;

  // Create the command to put an object in the S3 bucket
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  // Generate a pre-signed URL that expires in 10 minutes (600 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 600,
  });

  return {
    uploadUrl,
    key,
  };
}

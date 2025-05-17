import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Create a new recording record in the database
 * @param userId The ID of the user who uploaded the recording
 * @param filename The name of the recording file
 * @param s3Url The S3 URL where the recording is stored
 * @param duration Optional duration of the recording in seconds
 * @returns The created recording record
 */
export async function createRecording(
  userId: string,
  filename: string,
  s3Url: string,
  duration?: number
) {
  return prisma.recording.create({
    data: {
      userId,
      filename,
      s3Url,
      duration,
    },
  });
}

/**
 * Get all recordings for a specific user
 * @param userId The ID of the user
 * @returns An array of recording records
 */
export async function getRecordingsByUserId(userId: string) {
  return prisma.recording.findMany({
    where: {
      userId,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });
}

/**
 * Get a recording by its ID
 * @param id The ID of the recording
 * @returns The recording record or null if not found
 */
export async function getRecordingById(id: string) {
  return prisma.recording.findUnique({
    where: {
      id,
    },
  });
}

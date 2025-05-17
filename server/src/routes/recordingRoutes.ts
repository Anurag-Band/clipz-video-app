import { Router, Request, Response, NextFunction } from 'express';
import { createRecording, getRecordingsByUserId, getRecordingById } from '../services/recordingService';
import { RecordingCreationRequestSchema } from '../types';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/recordings
 * Create a new recording record
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = RecordingCreationRequestSchema.parse(req.body);
    const { userId, filename, s3Url, duration } = validatedData;

    // Create recording record
    const recording = await createRecording(userId, filename, s3Url, duration);

    // Return the created recording
    return res.status(201).json(recording);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recordings/user/:userId
 * Get all recordings for a specific user
 */
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Get recordings for the user
    const recordings = await getRecordingsByUserId(userId);

    // Return the recordings
    return res.status(200).json(recordings);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recordings/:id
 * Get a recording by its ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError('Recording ID is required', 400);
    }

    // Get the recording
    const recording = await getRecordingById(id);

    if (!recording) {
      throw new ApiError('Recording not found', 404);
    }

    // Return the recording
    return res.status(200).json(recording);
  } catch (error) {
    next(error);
  }
});

export default router;

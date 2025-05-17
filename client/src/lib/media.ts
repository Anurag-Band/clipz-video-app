/**
 * Media utility functions for handling camera and screen capture
 */

// Types for media streams
export type MediaStreamType = 'camera' | 'screen' | 'audio';

// Interface for media constraints
export interface MediaConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

// Default constraints for camera
export const DEFAULT_CAMERA_CONSTRAINTS: MediaConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
  audio: true,
};

// Default constraints for screen sharing
export const DEFAULT_SCREEN_CONSTRAINTS: MediaConstraints = {
  video: {
    cursor: 'always',
    displaySurface: 'monitor',
  },
  audio: false,
};

/**
 * Get user media (camera/microphone)
 * @param constraints Media constraints
 * @returns Promise with MediaStream
 */
export async function getUserMedia(
  constraints: MediaConstraints = DEFAULT_CAMERA_CONSTRAINTS
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw new Error(`Failed to get user media: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get display media (screen sharing)
 * @param constraints Media constraints
 * @returns Promise with MediaStream
 */
export async function getDisplayMedia(
  constraints: MediaConstraints = DEFAULT_SCREEN_CONSTRAINTS
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getDisplayMedia(constraints);
  } catch (error) {
    console.error('Error accessing display media:', error);
    throw new Error(`Failed to get display media: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stop all tracks in a media stream
 * @param stream MediaStream to stop
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Create a canvas element with picture-in-picture (PiP) effect
 * @param screenStream Screen sharing stream
 * @param cameraStream Camera stream
 * @param pipPosition Position of the camera PiP
 * @returns Canvas element and canvas stream
 */
export function createCanvasPiP(
  screenStream: MediaStream,
  cameraStream: MediaStream,
  pipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'
): { canvas: HTMLCanvasElement; stream: MediaStream } {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  
  // Get context
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Create video elements for screen and camera
  const screenVideo = document.createElement('video');
  screenVideo.srcObject = screenStream;
  screenVideo.autoplay = true;
  screenVideo.muted = true;
  
  const cameraVideo = document.createElement('video');
  cameraVideo.srcObject = cameraStream;
  cameraVideo.autoplay = true;
  cameraVideo.muted = true;
  
  // Calculate PiP position
  const pipSize = { width: 240, height: 180 };
  const pipMargin = 20;
  let pipX = 0;
  let pipY = 0;
  
  switch (pipPosition) {
    case 'top-left':
      pipX = pipMargin;
      pipY = pipMargin;
      break;
    case 'top-right':
      pipX = canvas.width - pipSize.width - pipMargin;
      pipY = pipMargin;
      break;
    case 'bottom-left':
      pipX = pipMargin;
      pipY = canvas.height - pipSize.height - pipMargin;
      break;
    case 'bottom-right':
      pipX = canvas.width - pipSize.width - pipMargin;
      pipY = canvas.height - pipSize.height - pipMargin;
      break;
  }
  
  // Draw function for canvas animation
  function draw() {
    // Draw screen
    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
    
    // Draw camera PiP
    ctx.drawImage(cameraVideo, pipX, pipY, pipSize.width, pipSize.height);
    
    // Add border to PiP
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipX, pipY, pipSize.width, pipSize.height);
    
    // Request next frame
    requestAnimationFrame(draw);
  }
  
  // Start drawing when videos are loaded
  Promise.all([
    new Promise<void>((resolve) => {
      screenVideo.onloadedmetadata = () => resolve();
    }),
    new Promise<void>((resolve) => {
      cameraVideo.onloadedmetadata = () => resolve();
    }),
  ]).then(() => {
    draw();
  });
  
  // Get stream from canvas
  const stream = canvas.captureStream(30); // 30 FPS
  
  // Add audio track from camera stream if available
  const audioTracks = cameraStream.getAudioTracks();
  if (audioTracks.length > 0) {
    stream.addTrack(audioTracks[0]);
  }
  
  return { canvas, stream };
}

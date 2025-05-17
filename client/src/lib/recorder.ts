/**
 * Recorder utility functions for recording media streams
 */

// Types for recording
export type RecordingState = 'inactive' | 'recording' | 'paused';

// Interface for recorder options
export interface RecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
}

// Default recorder options
export const DEFAULT_RECORDER_OPTIONS: RecorderOptions = {
  mimeType: 'video/webm;codecs=vp9',
  bitsPerSecond: 2500000, // 2.5 Mbps
};

/**
 * Create a MediaRecorder instance
 * @param stream MediaStream to record
 * @param options Recorder options
 * @returns MediaRecorder instance
 */
export function createRecorder(
  stream: MediaStream,
  options: RecorderOptions = DEFAULT_RECORDER_OPTIONS
): MediaRecorder {
  // Check if the specified mimeType is supported
  if (options.mimeType) {
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.warn(`${options.mimeType} is not supported, using default codec instead`);
      delete options.mimeType;
    }
  }
  
  // Create MediaRecorder
  return new MediaRecorder(stream, options as MediaRecorderOptions);
}

/**
 * Start recording a media stream
 * @param recorder MediaRecorder instance
 * @param timeslice Optional timeslice for data availability
 * @returns Promise that resolves when recording starts
 */
export function startRecording(
  recorder: MediaRecorder,
  timeslice?: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    recorder.onstart = () => resolve();
    recorder.start(timeslice);
  });
}

/**
 * Stop recording
 * @param recorder MediaRecorder instance
 * @returns Promise that resolves with recorded Blob
 */
export function stopRecording(recorder: MediaRecorder): Promise<Blob> {
  return new Promise<Blob>((resolve) => {
    // Array to store chunks
    const chunks: BlobPart[] = [];
    
    // Event handler for data available
    const handleDataAvailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    // Event handler for stop
    const handleStop = () => {
      // Create blob from chunks
      const blob = new Blob(chunks, { type: recorder.mimeType });
      
      // Clean up event listeners
      recorder.removeEventListener('dataavailable', handleDataAvailable);
      recorder.removeEventListener('stop', handleStop);
      
      // Resolve with blob
      resolve(blob);
    };
    
    // Add event listeners
    recorder.addEventListener('dataavailable', handleDataAvailable);
    recorder.addEventListener('stop', handleStop);
    
    // Request data and stop recording
    if (recorder.state !== 'inactive') {
      recorder.requestData();
      recorder.stop();
    } else {
      // If already inactive, resolve with empty blob
      resolve(new Blob([], { type: recorder.mimeType }));
    }
  });
}

/**
 * Create a download link for a recorded blob
 * @param blob Recorded blob
 * @param filename Filename for download
 * @returns URL for download
 */
export function createDownloadLink(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  
  // Create temporary link element
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  
  // Add to document, click, and remove
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  return url;
}

/**
 * Convert blob to base64 string
 * @param blob Blob to convert
 * @returns Promise with base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

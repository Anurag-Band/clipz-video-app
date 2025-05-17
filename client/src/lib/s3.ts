/**
 * S3 upload utility functions
 */

// Types for upload
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to S3 using a pre-signed URL
 * @param presignedUrl Pre-signed S3 URL
 * @param file File to upload
 * @param onProgress Progress callback
 * @returns Promise with upload result
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File | Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve) => {
    // Create XHR request
    const xhr = new XMLHttpRequest();

    // Track progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    });

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          success: true,
          url: presignedUrl.split("?")[0], // Remove query parameters to get the actual file URL
        });
      } else {
        resolve({
          success: false,
          error: `Upload failed with status ${xhr.status}: ${xhr.statusText}`,
        });
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      resolve({
        success: false,
        error: "Network error occurred during upload",
      });
    });

    xhr.addEventListener("abort", () => {
      resolve({
        success: false,
        error: "Upload was aborted",
      });
    });

    // Open and send request
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

import { apiRequest } from "./api";
import { getUserId } from "./auth";

/**
 * Get a pre-signed URL from the backend
 * @param filename Filename for the upload
 * @param contentType Content type of the file
 * @returns Promise with pre-signed URL
 */
export async function getPresignedUrl(
  filename: string,
  contentType: string
): Promise<string> {
  try {
    // Get the current user ID from auth system
    const userId = await getUserId();

    // Call the backend API to get a pre-signed URL
    const data = await apiRequest<{ uploadUrl: string; key: string }>(
      "/api/s3/upload-url",
      {
        method: "POST",
        body: JSON.stringify({
          filename,
          fileType: contentType,
          userId,
        }),
      }
    );

    return data.uploadUrl;
  } catch (error) {
    console.error("Error getting pre-signed URL:", error);
    throw error;
  }
}

/**
 * Upload a recording to S3
 * @param blob Recording blob
 * @param filename Filename for the recording
 * @param onProgress Progress callback
 * @param duration Optional duration of the recording in seconds
 * @returns Promise with upload result
 */
export async function uploadRecording(
  blob: Blob,
  filename: string,
  onProgress?: (progress: UploadProgress) => void,
  duration?: number
): Promise<UploadResult> {
  try {
    // Get the current user ID from auth system
    const userId = await getUserId();

    // Create file from blob
    const file = new File([blob], filename, { type: blob.type });

    // Get pre-signed URL
    const presignedUrl = await getPresignedUrl(filename, blob.type);

    // Upload to S3
    const uploadResult = await uploadToS3(presignedUrl, file, onProgress);

    // If upload was successful, save metadata to the backend
    if (uploadResult.success && uploadResult.url) {
      try {
        const response = await fetch("/api/recordings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            filename,
            s3Url: uploadResult.url,
            duration,
          }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to save recording metadata, but file was uploaded successfully"
          );
        }
      } catch (metadataError) {
        console.warn(
          "Error saving recording metadata, but file was uploaded successfully:",
          metadataError
        );
      }
    }

    return uploadResult;
  } catch (error) {
    console.error("Error uploading recording:", error);
    return {
      success: false,
      error: `Upload failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}


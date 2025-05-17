/**
 * Recorder component for handling recording functionality
 */
"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Download, Upload } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { createRecorder, startRecording, stopRecording } from '@/lib/recorder';
import { createCanvasPiP } from '@/lib/media';
import { uploadRecording } from '@/lib/s3';
import UploadProgress from './UploadProgress';

interface RecorderProps {
  className?: string;
}

export default function Recorder({ className = '' }: RecorderProps) {
  // Refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Global state
  const {
    cameraStream,
    screenStream,
    canvasStream,
    isRecording,
    recordedBlob,
    recordingStartTime,
    isUploading,
    uploadProgress,
    uploadedUrl,
    uploadError,
    setMediaStream,
    setRecordedBlob,
    startRecording: startRecordingState,
    stopRecording: stopRecordingState,
    startUpload,
    updateUploadProgress,
    setUploadedUrl,
    setUploadError,
  } = useAppStore();

  // Set up canvas PiP when both streams are available
  useEffect(() => {
    if (cameraStream && screenStream && !canvasStream) {
      try {
        const { canvas, stream } = createCanvasPiP(screenStream, cameraStream);
        canvasRef.current = canvas;
        setMediaStream('canvas', stream);
      } catch (error) {
        console.error('Error creating canvas PiP:', error);
      }
    }
  }, [cameraStream, screenStream, canvasStream, setMediaStream]);

  // Start recording when isRecording changes to true
  useEffect(() => {
    if (isRecording && canvasStream && !recorderRef.current) {
      try {
        // Create recorder
        const recorder = createRecorder(canvasStream);
        recorderRef.current = recorder;

        // Start recording
        startRecording(recorder);
      } catch (error) {
        console.error('Error starting recording:', error);
        stopRecordingState();
      }
    } else if (!isRecording && recorderRef.current) {
      try {
        // Stop recording
        stopRecording(recorderRef.current).then((blob) => {
          setRecordedBlob(blob);
          recorderRef.current = null;

          // Automatically upload the recording when it stops
          if (blob) {
            // Small delay to ensure the blob is properly set in state
            setTimeout(() => {
              startUpload();
              uploadRecording(
                blob,
                `recording-${Date.now()}.webm`,
                updateUploadProgress
              )
                .then((result) => {
                  if (result.success && result.url) {
                    setUploadedUrl(result.url);
                  } else {
                    setUploadError(result.error || 'Automatic upload failed');
                  }
                })
                .catch((error) => {
                  console.error('Error in automatic upload:', error);
                  setUploadError(`Automatic upload failed: ${error instanceof Error ? error.message : String(error)}`);
                });
            }, 100);
          }
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
        recorderRef.current = null;
      }
    }
  }, [isRecording, canvasStream, setRecordedBlob, stopRecordingState, startUpload, updateUploadProgress, setUploadedUrl, setUploadError]);

  // Handle download recording
  const handleDownload = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Handle upload recording
  const handleUpload = async () => {
    if (!recordedBlob) return;

    try {
      startUpload();

      const result = await uploadRecording(
        recordedBlob,
        `recording-${Date.now()}.webm`,
        updateUploadProgress
      );

      if (result.success && result.url) {
        setUploadedUrl(result.url);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      setUploadError(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // If no recording and not recording, don't render
  if (!isRecording && !recordedBlob) {
    return null;
  }

  return (
    <>
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>

        <CardContent>
          {recordedBlob && (
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="w-full rounded-md"
            />
          )}

          {isRecording && (
            <div className="flex items-center justify-center h-40 bg-muted rounded-md">
              <p className="text-muted-foreground">Recording in progress...</p>
            </div>
          )}

          {!isRecording && isUploading && !uploadedUrl && !uploadError && (
            <div className="flex items-center justify-center mt-2">
              <p className="text-sm text-muted-foreground">Automatically uploading recording...</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {recordedBlob && !isRecording && (
            <>
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Preview
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>

                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadedUrl || uploadError ? 'Re-upload' : 'Upload'}
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Upload progress */}
      {(isUploading || uploadedUrl || uploadError) && (
        <UploadProgress
          isUploading={isUploading}
          progress={uploadProgress}
          uploadedUrl={uploadedUrl}
          error={uploadError}
          onClose={() => {
            setUploadError(null);
            setUploadedUrl(null);
          }}
          className="mt-4"
        />
      )}

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recording Preview</DialogTitle>
          </DialogHeader>

          {recordedBlob && (
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
              autoPlay
              className="w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

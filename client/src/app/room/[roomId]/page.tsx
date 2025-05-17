"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VideoPlayer from '@/components/VideoPlayer';
import CallControls from '@/components/CallControls';
import RecordingIndicator from '@/components/RecordingIndicator';
import Recorder from '@/components/Recorder';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppStore } from '@/lib/store';
import { createPeerConnection, addStreamToPeerConnection } from '@/lib/webrtc';
import { createCanvasPiP } from '@/lib/media';

export default function RoomPage() {
  // Get room ID from URL
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  // Local state
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global state
  const {
    cameraEnabled,
    micEnabled,
    screenShareEnabled,
    cameraStream,
    screenStream,
    canvasStream,
    remoteStream,
    isRecording,
    recordingStartTime,
    recordedBlob,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    setMediaStream,
    startRecording,
    stopRecording,
    setRecordedBlob,
    joinRoom,
    leaveRoom,
  } = useAppStore();

  // Initialize room
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Join room
        await joinRoom(roomId);

        // Enable camera by default
        if (!cameraEnabled) {
          await toggleCamera();
        }

        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing room:', error);
        setError(`Failed to initialize room: ${error instanceof Error ? error.message : String(error)}`);
        setIsInitializing(false);
      }
    };

    initializeRoom();

    // Clean up on unmount
    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom, cameraEnabled, toggleCamera]);

  // Handle recording with canvas PiP
  const handleStartRecording = async () => {
    try {
      // If screen sharing is not enabled, prompt user
      if (!screenShareEnabled) {
        await toggleScreenShare();
      }

      // If camera is not enabled, prompt user
      if (!cameraEnabled) {
        await toggleCamera();
      }

      // If we have both streams but no canvas stream, create it
      if (cameraStream && screenStream && !canvasStream) {
        const { stream } = createCanvasPiP(screenStream, cameraStream);
        setMediaStream('canvas', stream);
      }

      // Start recording
      startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle stop recording
  const handleStopRecording = () => {
    stopRecording();
  };

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Room: {roomId}</h1>
            <p className="text-sm text-muted-foreground">
              Share this room ID with others to join the call
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Recording indicator */}
            {isRecording && (
              <RecordingIndicator
                isRecording={isRecording}
                startTime={recordingStartTime}
              />
            )}

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isInitializing ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">Initializing call...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Video grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local video */}
              <VideoPlayer
                stream={canvasStream || screenStream || cameraStream}
                muted
                label="You"
                fallbackText="Your camera is off"
                className="aspect-video"
              />

              {/* Remote video (placeholder for now) */}
              <VideoPlayer
                stream={remoteStream}
                label="Remote"
                fallbackText="Waiting for others to join..."
                className="aspect-video"
              />
            </div>

            {/* Call controls */}
            <CallControls
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              className="bg-card rounded-lg"
            />

            {/* Recorder (shows when recording or has recording) */}
            {(isRecording || recordedBlob) && (
              <Recorder className="mt-4" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

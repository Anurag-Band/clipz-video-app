/**
 * CallControls component for video call controls
 */
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MonitorStop,
  PhoneOff,
  CircleDot,
  StopCircle,
  Upload,
} from "lucide-react";

interface CallControlsProps {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onUpload?: () => void;
  showRecordingControls?: boolean;
  showUploadButton?: boolean;
  className?: string;
}

export default function CallControls({
  onStartRecording,
  onStopRecording,
  onUpload,
  showRecordingControls = true,
  showUploadButton = true,
  className = "",
}: CallControlsProps) {
  const router = useRouter();

  // Get state from store
  const {
    cameraEnabled,
    micEnabled,
    screenShareEnabled,
    isRecording,
    recordedBlob,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    startRecording,
    stopRecording,
    leaveRoom,
  } = useAppStore();

  // Handle recording start
  const handleStartRecording = () => {
    startRecording();
    if (onStartRecording) onStartRecording();
  };

  // Handle recording stop
  const handleStopRecording = () => {
    stopRecording();
    if (onStopRecording) onStopRecording();
  };

  // Handle upload
  const handleUpload = () => {
    if (onUpload) onUpload();
  };

  // Handle end call
  const handleEndCall = () => {
    leaveRoom();
    router.push("/");
  };

  return (
    <div className={`flex items-center justify-center gap-2 p-4 ${className}`}>
      {/* Camera toggle */}
      <Button
        variant={cameraEnabled ? "default" : "outline"}
        size="icon"
        onClick={() => toggleCamera()}
        title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {cameraEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </Button>

      {/* Microphone toggle */}
      <Button
        variant={micEnabled ? "default" : "outline"}
        size="icon"
        onClick={() => toggleMic()}
        title={micEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {micEnabled ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </Button>

      {/* Screen share toggle */}
      <Button
        variant={screenShareEnabled ? "default" : "outline"}
        size="icon"
        onClick={() => toggleScreenShare()}
        title={screenShareEnabled ? "Stop screen sharing" : "Share screen"}
      >
        {screenShareEnabled ? (
          <MonitorStop className="h-5 w-5" />
        ) : (
          <ScreenShare className="h-5 w-5" />
        )}
      </Button>

      {/* Recording controls */}
      {showRecordingControls && (
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <StopCircle className="h-5 w-5" />
          ) : (
            <CircleDot className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Upload button */}
      {showUploadButton && recordedBlob && !isRecording && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleUpload}
          title="Upload recording"
        >
          <Upload className="h-5 w-5" />
        </Button>
      )}

      {/* End call button */}
      <Button
        variant="destructive"
        size="icon"
        onClick={handleEndCall}
        title="End call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}


/**
 * RecordingIndicator component to show recording status
 */
"use client";

import { useEffect, useState } from 'react';
import { CircleDot } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface RecordingIndicatorProps {
  className?: string;
}

export default function RecordingIndicator({
  className = '',
}: RecordingIndicatorProps) {
  const { isRecording, recordingStartTime } = useAppStore();
  const [duration, setDuration] = useState(0);
  const [blinking, setBlinking] = useState(true);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update duration every second when recording
  useEffect(() => {
    if (!isRecording || !recordingStartTime) {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTime) / 1000;
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  // Blink effect for recording indicator
  useEffect(() => {
    if (!isRecording) {
      setBlinking(false);
      return;
    }

    const interval = setInterval(() => {
      setBlinking((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isRecording) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-destructive/90 text-destructive-foreground rounded-full ${className}`}>
      <CircleDot className={`h-4 w-4 ${blinking ? 'opacity-100' : 'opacity-50'}`} />
      <span className="text-sm font-medium">Recording {formatDuration(duration)}</span>
    </div>
  );
}

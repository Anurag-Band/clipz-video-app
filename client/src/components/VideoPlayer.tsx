/**
 * VideoPlayer component for rendering video streams
 */
"use client";

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  autoPlay?: boolean;
  className?: string;
  label?: string;
  fallbackText?: string;
}

export default function VideoPlayer({
  stream,
  muted = false,
  autoPlay = true,
  className = '',
  label,
  fallbackText = 'No video available',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update video stream when it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {label && (
        <div className="absolute top-2 left-2 z-10 bg-black/50 text-white px-2 py-1 text-xs rounded">
          {label}
        </div>
      )}
      
      {stream ? (
        <video
          ref={videoRef}
          autoPlay={autoPlay}
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <CardContent className="flex items-center justify-center h-full min-h-[200px] bg-muted">
          <p className="text-muted-foreground">{fallbackText}</p>
        </CardContent>
      )}
    </Card>
  );
}

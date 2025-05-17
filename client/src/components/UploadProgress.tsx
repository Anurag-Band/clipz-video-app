/**
 * UploadProgress component to show S3 upload status
 */
"use client";

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Check, X, ExternalLink } from 'lucide-react';
import { UploadProgress as UploadProgressType } from '@/lib/s3';

interface UploadProgressProps {
  isUploading: boolean;
  progress: UploadProgressType | null;
  uploadedUrl: string | null;
  error: string | null;
  onClose: () => void;
  className?: string;
}

export default function UploadProgress({
  isUploading,
  progress,
  uploadedUrl,
  error,
  onClose,
  className = '',
}: UploadProgressProps) {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // If no upload in progress and no result, don't render
  if (!isUploading && !uploadedUrl && !error) {
    return null;
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {isUploading ? 'Uploading Recording' : uploadedUrl ? 'Upload Complete' : 'Upload Failed'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress bar */}
        {isUploading && progress && (
          <div className="space-y-2">
            <Progress value={progress.percentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.percentage}%</span>
              <span>
                {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
              </span>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {uploadedUrl && (
          <div className="flex items-center gap-2 text-green-500">
            <Check className="h-5 w-5" />
            <span>Recording uploaded successfully</span>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 text-destructive">
            <X className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {/* View uploaded file */}
        {uploadedUrl && (
          <Button 
            variant="outline" 
            onClick={() => window.open(uploadedUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Recording
          </Button>
        )}
        
        {/* Close button */}
        <Button 
          variant={uploadedUrl ? "ghost" : "default"} 
          onClick={onClose}
        >
          {uploadedUrl ? 'Close' : 'Dismiss'}
        </Button>
      </CardFooter>
    </Card>
  );
}

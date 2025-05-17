/**
 * JoinRoomForm component for entering a room ID
 */
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface JoinRoomFormProps {
  onJoinRoom?: (roomId: string) => void;
}

export default function JoinRoomForm({ onJoinRoom }: JoinRoomFormProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a random room ID
  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 9);
    setRoomId(randomId);
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate room ID
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // If onJoinRoom callback is provided, call it
      if (onJoinRoom) {
        onJoinRoom(roomId);
      }
      
      // Navigate to room page
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a Video Call</CardTitle>
        <CardDescription>
          Enter a room ID to join an existing call or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="roomId" className="text-sm font-medium">
              Room ID
            </label>
            <div className="flex gap-2">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateRoomId}
                className="shrink-0"
              >
                Generate
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          onClick={handleSubmit} 
          disabled={isLoading || !roomId.trim()}
          className="w-full"
        >
          {isLoading ? 'Joining...' : 'Join Room'}
        </Button>
      </CardFooter>
    </Card>
  );
}

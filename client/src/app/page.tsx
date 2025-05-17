import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import JoinRoomForm from "@/components/JoinRoomForm";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Clipz</h1>
            <p className="text-xl text-muted-foreground">
              Video calling and recording made simple
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Everything you need for video calls and recordings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">🎥 Video Calling</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with others in real-time with high-quality video and audio
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">🖥️ Screen Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Share your screen with others during calls
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">📹 Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Record your calls with picture-in-picture camera overlay
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">☁️ Cloud Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Upload recordings to the cloud for easy sharing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Join form */}
          <div className="space-y-6">
            <JoinRoomForm />

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Enter a room ID or generate a random one</li>
                  <li>Share the room ID with others to join</li>
                  <li>Enable your camera and microphone</li>
                  <li>Start recording when ready</li>
                  <li>Download or upload your recording when finished</li>
                </ol>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/room/demo">Try Demo Room</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8">
          <p>© {new Date().getFullYear()} Clipz. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

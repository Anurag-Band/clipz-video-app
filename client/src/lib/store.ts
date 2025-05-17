/**
 * Zustand store for application state management
 */
import { create } from 'zustand';
import { UploadProgress } from './s3';

// Types for media state
export interface MediaState {
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenShareEnabled: boolean;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  canvasStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

// Types for recording state
export interface RecordingState {
  isRecording: boolean;
  recordingStartTime: number | null;
  recordingDuration: number;
  recordedBlob: Blob | null;
  recordingPreviewUrl: string | null;
}

// Types for upload state
export interface UploadState {
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  uploadedUrl: string | null;
  uploadError: string | null;
}

// Types for connection state
export interface ConnectionState {
  roomId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  peerConnection: RTCPeerConnection | null;
}

// Combined state interface
export interface AppState extends MediaState, RecordingState, UploadState, ConnectionState {
  // Media actions
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setMediaStream: (type: 'camera' | 'screen' | 'canvas' | 'remote', stream: MediaStream | null) => void;

  // Recording actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setRecordedBlob: (blob: Blob | null) => void;

  // Upload actions
  startUpload: () => Promise<void>;
  updateUploadProgress: (progress: UploadProgress) => void;
  setUploadedUrl: (url: string | null) => void;
  setUploadError: (error: string | null) => void;

  // Connection actions
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  setConnectionError: (error: string | null) => void;

  // Reset actions
  resetState: () => void;
}

// Create store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial media state
  cameraEnabled: false,
  micEnabled: false,
  screenShareEnabled: false,
  cameraStream: null,
  screenStream: null,
  canvasStream: null,
  remoteStream: null,

  // Initial recording state
  isRecording: false,
  recordingStartTime: null,
  recordingDuration: 0,
  recordedBlob: null,
  recordingPreviewUrl: null,

  // Initial upload state
  isUploading: false,
  uploadProgress: null,
  uploadedUrl: null,
  uploadError: null,

  // Initial connection state
  roomId: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  peerConnection: null,

  // Media actions
  toggleCamera: async () => {
    const { cameraEnabled, cameraStream } = get();

    if (cameraEnabled && cameraStream) {
      // Stop camera
      cameraStream.getTracks().forEach((track) => track.stop());
      set({ cameraEnabled: false, cameraStream: null });
    } else {
      try {
        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        set({ cameraEnabled: true, cameraStream: stream });
      } catch (error) {
        console.error('Error toggling camera:', error);
      }
    }
  },

  toggleMic: async () => {
    const { micEnabled, cameraStream } = get();

    if (micEnabled && cameraStream) {
      // Mute microphone
      cameraStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      set({ micEnabled: false });
    } else {
      try {
        // If no camera stream with audio, get new audio stream
        if (!cameraStream || cameraStream.getAudioTracks().length === 0) {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

          // If camera stream exists, add audio track to it
          if (cameraStream) {
            audioStream.getAudioTracks().forEach((track) => {
              cameraStream.addTrack(track);
            });
          }

          set({
            micEnabled: true,
            cameraStream: cameraStream || audioStream
          });
        } else {
          // Enable existing audio tracks
          cameraStream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
          set({ micEnabled: true });
        }
      } catch (error) {
        console.error('Error toggling microphone:', error);
      }
    }
  },

  toggleScreenShare: async () => {
    const { screenShareEnabled, screenStream } = get();

    if (screenShareEnabled && screenStream) {
      // Stop screen sharing
      screenStream.getTracks().forEach((track) => track.stop());
      set({ screenShareEnabled: false, screenStream: null });
    } else {
      try {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

        // Add track ended listener
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          set({ screenShareEnabled: false, screenStream: null });
        });

        set({ screenShareEnabled: true, screenStream: stream });
      } catch (error) {
        console.error('Error toggling screen share:', error);
      }
    }
  },

  setMediaStream: (type, stream) => {
    switch (type) {
      case 'camera':
        set({ cameraStream: stream });
        break;
      case 'screen':
        set({ screenStream: stream });
        break;
      case 'canvas':
        set({ canvasStream: stream });
        break;
      case 'remote':
        set({ remoteStream: stream });
        break;
    }
  },

  // Recording actions
  startRecording: async () => {
    set({
      isRecording: true,
      recordingStartTime: Date.now(),
      recordingDuration: 0,
    });
  },

  stopRecording: async () => {
    const { recordingStartTime } = get();

    set({
      isRecording: false,
      recordingDuration: recordingStartTime ? Date.now() - recordingStartTime : 0,
    });
  },

  setRecordedBlob: (blob) => {
    // Revoke previous URL if exists
    const { recordingPreviewUrl } = get();
    if (recordingPreviewUrl) {
      URL.revokeObjectURL(recordingPreviewUrl);
    }

    // Create new URL if blob exists
    const newUrl = blob ? URL.createObjectURL(blob) : null;

    set({
      recordedBlob: blob,
      recordingPreviewUrl: newUrl,
    });
  },

  // Upload actions
  startUpload: async () => {
    set({
      isUploading: true,
      uploadProgress: { loaded: 0, total: 1, percentage: 0 },
      uploadError: null,
    });
  },

  updateUploadProgress: (progress) => {
    set({ uploadProgress: progress });
  },

  setUploadedUrl: (url) => {
    set({
      isUploading: false,
      uploadedUrl: url,
    });
  },

  setUploadError: (error) => {
    set({
      isUploading: false,
      uploadError: error,
    });
  },

  // Connection actions
  joinRoom: async (roomId) => {
    try {
      // Import socket functions
      const { joinRoom: socketJoinRoom, onSignal, onUserJoined, onUserLeft } = await import('./socket');
      const { createPeerConnection, addStreamToPeerConnection, createOffer, setRemoteDescription, addIceCandidate } = await import('./webrtc');

      // Set initial state
      set({
        roomId,
        isConnecting: true,
        connectionError: null,
      });

      // Create peer connection
      const peerConnection = createPeerConnection();
      set({ peerConnection });

      // Add local stream to peer connection if available
      const { cameraStream, screenStream, canvasStream } = get();
      const localStream = canvasStream || screenStream || cameraStream;
      if (localStream) {
        addStreamToPeerConnection(peerConnection, localStream);
      }

      // Set up ICE candidate event
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          // Send ICE candidate to peers
          const { sendSignal } = await import('./socket');
          await sendSignal(roomId, {
            type: 'ice-candidate',
            candidate: event.candidate,
          });
        }
      };

      // Set up track event to receive remote streams
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Set up connection state change event
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('Connection state changed:', state);

        if (state === 'connected') {
          set({ isConnected: true, isConnecting: false });
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          set({ isConnected: false, isConnecting: false });
        }
      };

      // Join room via socket
      await socketJoinRoom(roomId);

      // Set up signal event listener
      onSignal(async (userId, signal) => {
        try {
          if (signal.type === 'offer') {
            await setRemoteDescription(peerConnection, signal.sdp);

            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer
            const { sendSignal } = await import('./socket');
            await sendSignal(roomId, {
              type: 'answer',
              sdp: answer,
            });
          } else if (signal.type === 'answer') {
            await setRemoteDescription(peerConnection, signal.sdp);
          } else if (signal.type === 'ice-candidate') {
            await addIceCandidate(peerConnection, signal.candidate);
          }
        } catch (error) {
          console.error('Error handling signal:', error);
        }
      });

      // Set up user joined event listener
      onUserJoined(async (userId) => {
        try {
          // Create and send offer when new user joins
          const offer = await createOffer(peerConnection);

          // Send offer
          const { sendSignal } = await import('./socket');
          await sendSignal(roomId, {
            type: 'offer',
            sdp: offer,
          });
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      });

      // Set up user left event listener
      onUserLeft((userId) => {
        console.log('User left:', userId);
      });

    } catch (error) {
      console.error('Error joining room:', error);
      set({
        connectionError: error instanceof Error ? error.message : String(error),
        isConnecting: false,
      });
    }
  },

  leaveRoom: async () => {
    const {
      roomId,
      peerConnection,
      cameraStream,
      screenStream,
      canvasStream,
      recordingPreviewUrl
    } = get();

    // Notify server that user is leaving the room
    if (roomId) {
      try {
        const { leaveRoom: socketLeaveRoom } = await import('./socket');
        await socketLeaveRoom(roomId);
      } catch (error) {
        console.error('Error leaving room via socket:', error);
      }
    }

    // Close peer connection if exists
    if (peerConnection) {
      peerConnection.close();
    }

    // Stop all media streams
    [cameraStream, screenStream, canvasStream].forEach((stream) => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    // Revoke object URL if exists
    if (recordingPreviewUrl) {
      URL.revokeObjectURL(recordingPreviewUrl);
    }

    set({
      // Reset connection state
      roomId: null,
      isConnected: false,
      isConnecting: false,
      peerConnection: null,

      // Reset media state
      cameraEnabled: false,
      micEnabled: false,
      screenShareEnabled: false,
      cameraStream: null,
      screenStream: null,
      canvasStream: null,
      remoteStream: null,
    });
  },

  setConnectionError: (error) => {
    set({
      connectionError: error,
      isConnecting: false,
    });
  },

  // Reset state
  resetState: () => {
    const {
      cameraStream,
      screenStream,
      canvasStream,
      peerConnection,
      recordingPreviewUrl,
    } = get();

    // Stop all media streams
    [cameraStream, screenStream, canvasStream].forEach((stream) => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    // Revoke object URL
    if (recordingPreviewUrl) {
      URL.revokeObjectURL(recordingPreviewUrl);
    }

    // Reset to initial state
    set({
      // Media state
      cameraEnabled: false,
      micEnabled: false,
      screenShareEnabled: false,
      cameraStream: null,
      screenStream: null,
      canvasStream: null,
      remoteStream: null,

      // Recording state
      isRecording: false,
      recordingStartTime: null,
      recordingDuration: 0,
      recordedBlob: null,
      recordingPreviewUrl: null,

      // Upload state
      isUploading: false,
      uploadProgress: null,
      uploadedUrl: null,
      uploadError: null,

      // Connection state
      roomId: null,
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      peerConnection: null,
    });
  },
}));

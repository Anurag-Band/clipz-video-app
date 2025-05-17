/**
 * WebRTC utility functions for peer-to-peer connections
 */

// Types for WebRTC
export type PeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
export type IceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';

// Interface for peer connection options
export interface PeerConnectionOptions {
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
  sdpSemantics?: 'unified-plan' | 'plan-b';
}

// Default STUN/TURN servers
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ],
  },
];

// Default peer connection options
export const DEFAULT_PEER_CONNECTION_OPTIONS: PeerConnectionOptions = {
  iceServers: DEFAULT_ICE_SERVERS,
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
  sdpSemantics: 'unified-plan',
};

/**
 * Create a new RTCPeerConnection
 * @param options Peer connection options
 * @returns RTCPeerConnection instance
 */
export function createPeerConnection(
  options: PeerConnectionOptions = DEFAULT_PEER_CONNECTION_OPTIONS
): RTCPeerConnection {
  return new RTCPeerConnection(options);
}

/**
 * Add media stream tracks to peer connection
 * @param peerConnection RTCPeerConnection instance
 * @param stream MediaStream to add
 * @returns Array of added RTCRtpSender objects
 */
export function addStreamToPeerConnection(
  peerConnection: RTCPeerConnection,
  stream: MediaStream
): RTCRtpSender[] {
  const senders: RTCRtpSender[] = [];
  
  stream.getTracks().forEach((track) => {
    const sender = peerConnection.addTrack(track, stream);
    senders.push(sender);
  });
  
  return senders;
}

/**
 * Create and set local offer
 * @param peerConnection RTCPeerConnection instance
 * @returns Promise with SDP offer
 */
export async function createOffer(
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
}

/**
 * Create and set local answer
 * @param peerConnection RTCPeerConnection instance
 * @returns Promise with SDP answer
 */
export async function createAnswer(
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error('Error creating answer:', error);
    throw error;
  }
}

/**
 * Set remote description
 * @param peerConnection RTCPeerConnection instance
 * @param description Remote session description
 * @returns Promise that resolves when remote description is set
 */
export async function setRemoteDescription(
  peerConnection: RTCPeerConnection,
  description: RTCSessionDescriptionInit
): Promise<void> {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  } catch (error) {
    console.error('Error setting remote description:', error);
    throw error;
  }
}

/**
 * Add ICE candidate
 * @param peerConnection RTCPeerConnection instance
 * @param candidate ICE candidate
 * @returns Promise that resolves when ICE candidate is added
 */
export async function addIceCandidate(
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
    throw error;
  }
}

/**
 * Close peer connection and clean up
 * @param peerConnection RTCPeerConnection instance
 */
export function closePeerConnection(peerConnection: RTCPeerConnection): void {
  if (peerConnection.signalingState !== 'closed') {
    // Remove all tracks
    const senders = peerConnection.getSenders();
    senders.forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    
    // Close connection
    peerConnection.close();
  }
}

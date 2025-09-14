import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

interface CallInterfaceProps {
  userId: string;
  username: string;
  onClose: () => void;
}

export function CallInterface({ userId, username, onClose }: CallInterfaceProps) {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected' | 'ended'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const { sendMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    userId,
    location: null
  });

  function handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'incoming_call':
        setIncomingCall(data);
        setCallState('incoming');
        setCallType(data.callType);
        break;
      
      case 'call_accepted':
        setCallState('connected');
        if (callType === 'video') {
          startVideo();
        } else {
          startAudio();
        }
        break;
      
      case 'call_declined':
      case 'call_ended':
        endCall();
        break;
      
      case 'webrtc_offer':
        handleOffer(data);
        break;
      
      case 'webrtc_answer':
        handleAnswer(data);
        break;
      
      case 'webrtc_ice_candidate':
        handleIceCandidate(data);
        break;
    }
  }

  const initiatePeerConnection = () => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(config);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'webrtc_ice_candidate',
          targetUserId: currentCall?.callerId === userId ? currentCall?.receiverId : currentCall?.callerId,
          data: { candidate: event.candidate }
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStream);
      });
    }
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      setLocalStream(stream);
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing audio:', error);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      setLocalStream(stream);
      setIsVideoOn(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const handleOffer = async (data: any) => {
    initiatePeerConnection();
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      sendMessage({
        type: 'webrtc_answer',
        targetUserId: currentCall?.callerId,
        data: { answer }
      });
    }
  };

  const handleAnswer = async (data: any) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
    }
  };

  const handleIceCandidate = async (data: any) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    }
  };

  const initiateCall = async (type: 'audio' | 'video', targetUserId: string, targetUsername: string) => {
    setCallType(type);
    setCallState('calling');
    
    if (type === 'video') {
      await startVideo();
    } else {
      await startAudio();
    }

    sendMessage({
      type: 'initiate_call',
      callType: type,
      callerUsername: username,
      receiverId: targetUserId,
      receiverUsername: targetUsername
    });

    initiatePeerConnection();
    
    if (peerConnectionRef.current) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      sendMessage({
        type: 'webrtc_offer',
        targetUserId: targetUserId,
        data: { offer }
      });
    }
  };

  const acceptCall = async () => {
    setCurrentCall(incomingCall);
    setCallState('connected');
    
    sendMessage({
      type: 'accept_call',
      callId: incomingCall.callId
    });

    if (callType === 'video') {
      await startVideo();
    } else {
      await startAudio();
    }
  };

  const declineCall = () => {
    sendMessage({
      type: 'decline_call',
      callId: incomingCall.callId
    });
    setCallState('idle');
    setIncomingCall(null);
  };

  const endCall = () => {
    if (currentCall) {
      sendMessage({
        type: 'end_call',
        callId: currentCall.callId
      });
    }

    // Stop media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState('idle');
    setCurrentCall(null);
    setIncomingCall(null);
    setRemoteStream(null);
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    if (remoteStream) {
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (callType === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType]);

  if (callState === 'idle') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
        {/* Incoming Call */}
        {callState === 'incoming' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto flex items-center justify-center">
              <PhoneCall className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Incoming {callType} call</h3>
              <p className="text-muted-foreground">{incomingCall?.callerUsername}</p>
            </div>
            <div className="flex space-x-4 justify-center">
              <Button
                variant="destructive"
                size="lg"
                onClick={declineCall}
                className="rounded-full w-16 h-16"
                data-testid="button-decline-call"
              >
                <PhoneOff size={24} />
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={acceptCall}
                className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                data-testid="button-accept-call"
              >
                <Phone size={24} />
              </Button>
            </div>
          </div>
        )}

        {/* Calling State */}
        {callState === 'calling' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto flex items-center justify-center">
              <Phone className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Calling...</h3>
              <p className="text-muted-foreground">Connecting {callType} call</p>
            </div>
            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="rounded-full w-16 h-16"
              data-testid="button-end-call"
            >
              <PhoneOff size={24} />
            </Button>
          </div>
        )}

        {/* Active Call */}
        {callState === 'connected' && (
          <div className="space-y-4">
            {callType === 'video' && (
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {/* Remote Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="video-remote"
                />
                
                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute top-4 right-4 w-24 h-18 bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    data-testid="video-local"
                  />
                </div>
              </div>
            )}

            {callType === 'audio' && (
              <>
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Phone className="text-white" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold">Audio Call Active</h3>
                  <p className="text-muted-foreground">Connected</p>
                </div>
              </>
            )}

            {/* Call Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleMute}
                className="rounded-full w-12 h-12"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>

              {callType === 'video' && (
                <Button
                  variant={isVideoOn ? "secondary" : "destructive"}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full w-12 h-12"
                  data-testid="button-toggle-video"
                >
                  {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                </Button>
              )}

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full w-12 h-12"
                data-testid="button-end-call"
              >
                <PhoneOff size={20} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export function to initiate calls from other components
export { CallInterface as default };
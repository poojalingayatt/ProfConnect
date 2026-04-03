import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const createEmptyRemoteStream = () => new MediaStream();

export const useCall = ({ currentUserId, onError } = {}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(() => createEmptyRemoteStream());
  const [peerConnection, setPeerConnection] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [callerId, setCallerId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);

  const pendingOfferRef = useRef(null);
  const pendingIceRef = useRef([]);

  const emitError = useCallback(
    (message) => {
      if (!message) return;
      if (typeof onError === 'function') {
        onError(message);
      }
    },
    [onError]
  );

  const stopStreamTracks = useCallback((stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const clearCallState = useCallback(() => {
    setCallStatus('idle');
    setCallerId(null);
    setReceiverId(null);
    pendingOfferRef.current = null;
    pendingIceRef.current = [];

    setPeerConnection((existing) => {
      if (existing) {
        existing.ontrack = null;
        existing.onicecandidate = null;
        existing.onconnectionstatechange = null;
        existing.close();
      }
      return null;
    });

    setLocalStream((stream) => {
      stopStreamTracks(stream);
      return null;
    });

    setRemoteStream((stream) => {
      stopStreamTracks(stream);
      return createEmptyRemoteStream();
    });
  }, [stopStreamTracks]);

  const ensureLocalStream = useCallback(async () => {
    if (localStream) return localStream;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    return stream;
  }, [localStream]);

  const ensurePeerConnection = useCallback(
    async (targetUserId) => {
      if (peerConnection) return peerConnection;

      const socket = getSocket();
      if (!socket) {
        throw new Error('Socket connection unavailable');
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const outgoingStream = await ensureLocalStream();
      const incomingStream = createEmptyRemoteStream();
      setRemoteStream(incomingStream);

      outgoingStream.getTracks().forEach((track) => {
        pc.addTrack(track, outgoingStream);
      });

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          incomingStream.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit('ice-candidate', {
          to: targetUserId,
          candidate: event.candidate,
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
          return;
        }

        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          clearCallState();
        }
      };

      setPeerConnection(pc);
      return pc;
    },
    [clearCallState, ensureLocalStream, peerConnection]
  );

  const flushPendingIceCandidates = useCallback(async (pc) => {
    if (!pc || !pendingIceRef.current.length) return;

    const candidates = [...pendingIceRef.current];
    pendingIceRef.current = [];

    await Promise.all(
      candidates.map((candidate) => pc.addIceCandidate(new RTCIceCandidate(candidate)))
    );
  }, []);

  const startCall = useCallback(
    async (nextReceiverId) => {
      const socket = getSocket();
      console.log('🔍 START CALL DEBUG');
      console.log('Socket:', socket);
      console.log('Socket Connected:', socket?.connected);
      console.log('Receiver ID:', nextReceiverId);
      console.log('Call Status:', callStatus);

      if (!currentUserId) {
        console.warn('❌ Invalid current user ID');
        return false;
      }

      if (!socket || !socket.connected) {
        console.warn('❌ Socket not ready');
        emitError('Socket connection unavailable');
        return false;
      }

      if (!nextReceiverId) {
        console.warn('❌ Invalid receiver ID');
        return false;
      }

      if (callStatus !== 'idle') {
        console.warn('❌ Already in a call or busy:', callStatus);
        emitError('Another call is already in progress');
        return false;
      }

      try {
        setCallerId(currentUserId);
        setReceiverId(nextReceiverId);
        setCallStatus('calling');

        const pc = await ensurePeerConnection(nextReceiverId);
        console.log('✅ Creating offer...');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const receiverId = String(nextReceiverId);
        console.log('Calling user:', receiverId);

        console.log('📤 Emitting call-user event', {
          to: receiverId,
        });
        socket.emit('call-user', { to: receiverId, offer }, (ack) => {
          if (ack?.ok) return;
          emitError(ack?.message || 'Unable to place call');
          clearCallState();
        });

        return true;
      } catch (error) {
        emitError(error?.message || 'Failed to start call');
        clearCallState();
        return false;
      }
    },
    [callStatus, clearCallState, currentUserId, emitError, ensurePeerConnection]
  );

  const acceptCall = useCallback(async () => {
    if (!pendingOfferRef.current || !callerId || !currentUserId) return false;
    if (callStatus !== 'incoming') return false;

    try {
      const socket = getSocket();
      if (!socket) {
        emitError('Socket connection unavailable');
        return false;
      }

      const pc = await ensurePeerConnection(callerId);
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      await flushPendingIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call-accepted', { to: callerId, answer }, (ack) => {
        if (ack?.ok) return;
        emitError(ack?.message || 'Failed to accept call');
        clearCallState();
      });

      setReceiverId(callerId);
      setCallStatus('connected');
      return true;
    } catch (error) {
      emitError(error?.message || 'Failed to accept call');
      clearCallState();
      return false;
    }
  }, [callStatus, callerId, clearCallState, currentUserId, emitError, ensurePeerConnection, flushPendingIceCandidates]);

  const rejectCall = useCallback(() => {
    if (callStatus !== 'incoming' || !callerId) {
      clearCallState();
      return;
    }

    getSocket()?.emit('reject-call', { to: callerId });
    clearCallState();
  }, [callStatus, callerId, clearCallState]);

  const endCall = useCallback(() => {
    const peerId = receiverId || callerId;
    if (peerId) {
      getSocket()?.emit('end-call', { to: peerId });
    }

    clearCallState();
    setCallStatus('idle');
  }, [callerId, clearCallState, receiverId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = ({ offer, from }) => {
      if (!offer || !from) return;

      if (callStatus !== 'idle') {
        socket.emit('reject-call', { to: from });
        return;
      }

      pendingOfferRef.current = offer;
      setCallerId(from);
      setReceiverId(currentUserId ?? null);
      setCallStatus('incoming');
    };

    const handleCallAccepted = async ({ answer, from }) => {
      if (!peerConnection || !answer || !from) return;

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingIceCandidates(peerConnection);
        setReceiverId(from);
        setCallStatus('connected');
      } catch (error) {
        emitError(error?.message || 'Failed to establish call');
        clearCallState();
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      try {
        if (!peerConnection || !peerConnection.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }

        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        emitError(error?.message || 'Failed to process network candidate');
      }
    };

    const handleCallRejected = () => {
      emitError('Call was rejected');
      clearCallState();
    };

    const handleCallEnded = () => {
      clearCallState();
    };

    const handleCallError = ({ reason }) => {
      emitError(reason || 'Call failed');
      clearCallState();
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-error', handleCallError);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-error', handleCallError);
    };
  }, [callStatus, clearCallState, currentUserId, emitError, flushPendingIceCandidates, peerConnection]);

  useEffect(() => {
    return () => {
      clearCallState();
    };
  }, [clearCallState]);

  return {
    localStream,
    remoteStream,
    peerConnection,
    callStatus,
    callerId,
    receiverId,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
};

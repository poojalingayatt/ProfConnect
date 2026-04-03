import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, PhoneCall, Video, VideoOff } from 'lucide-react';

type CallStatus = 'calling' | 'incoming' | 'connected';
type CallType = 'audio' | 'video';

interface CallOverlayProps {
  callStatus: CallStatus;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  user: {
    name: string;
    avatar?: string;
  };
  isMuted?: boolean;
  isCameraOff?: boolean;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

const getStatusText = (status: CallStatus) => {
  if (status === 'calling') return 'Calling...';
  if (status === 'incoming') return 'Incoming call';
  return 'Connected';
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const ControlButton = ({
  onClick,
  className,
  children,
  title,
}: {
  onClick: () => void;
  className: string;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`inline-flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors ${className}`}
  >
    {children}
  </button>
);

export const CallOverlay: React.FC<CallOverlayProps> = ({
  callStatus,
  callType,
  localStream,
  remoteStream,
  user,
  isMuted = false,
  isCameraOff = false,
  onEndCall,
  onAcceptCall,
  onToggleMute,
  onToggleCamera,
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;
    remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (callStatus !== 'connected') {
      setElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [callStatus]);

  const statusText = useMemo(() => getStatusText(callStatus), [callStatus]);

  if (callType === 'video') {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />

        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute right-4 top-4 w-32 rounded-lg border border-white/40 bg-black object-cover"
        />

        <div className="pointer-events-none absolute inset-x-0 top-6 text-center text-white">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-white/80">
            {statusText}
            {callStatus === 'connected' ? ` • ${formatDuration(elapsedSeconds)}` : ''}
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-4">
          {callStatus === 'incoming' && onAcceptCall && (
            <ControlButton
              onClick={onAcceptCall}
              title="Accept call"
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <PhoneCall className="h-6 w-6" />
            </ControlButton>
          )}
          <ControlButton
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </ControlButton>

          <ControlButton
            onClick={onEndCall}
            title="End call"
            className="bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </ControlButton>

          <ControlButton
            onClick={onToggleCamera}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </ControlButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-white">
      <div className="mb-6 h-28 w-28 overflow-hidden rounded-full border-4 border-white/20 bg-white/10">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold">{user.name}</h2>
      <p className="mt-2 text-sm text-white/80">
        {statusText}
        {callStatus === 'connected' ? ` • ${formatDuration(elapsedSeconds)}` : ''}
      </p>

      <div className="mt-12 flex items-center justify-center gap-5">
        {callStatus === 'incoming' && onAcceptCall && (
          <ControlButton
            onClick={onAcceptCall}
            title="Accept call"
            className="bg-green-500 text-white hover:bg-green-600"
          >
            <PhoneCall className="h-6 w-6" />
          </ControlButton>
        )}
        <ControlButton
          onClick={onToggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </ControlButton>

        <ControlButton
          onClick={onEndCall}
          title="End call"
          className="bg-red-500 text-white hover:bg-red-600"
        >
          <PhoneOff className="h-6 w-6" />
        </ControlButton>
      </div>
    </div>
  );
};

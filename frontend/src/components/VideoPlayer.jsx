import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward } from 'lucide-react';

export const VideoPlayer = forwardRef(({ videoUrl, segments = [], onTimeUpdate }, ref) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Expose seekTo function to parent
  useImperativeHandle(ref, () => ({
    seekTo: (timeInSeconds) => {
      if (videoRef.current) {
        videoRef.current.currentTime = timeInSeconds;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
  }));

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }

    // Find active subtitle segment
    const activeSegment = segments.find(
      (s) => time >= s.start_time && time <= s.end_time
    );
    setCurrentSubtitle(activeSegment ? activeSegment.text : '');
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setPlaybackRate(newSpeed);
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.videoWrapper}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={styles.video}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
        />

        {/* Live Subtitle Overlay */}
        {currentSubtitle && (
          <div style={styles.subtitleOverlay}>
            <span style={styles.subtitleText}>{currentSubtitle}</span>
          </div>
        )}
      </div>

      {/* Custom Clean Player Controls */}
      <div style={styles.controlsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button type="button" onClick={togglePlay} style={styles.iconBtn} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button type="button" onClick={() => videoRef.current && (videoRef.current.currentTime -= 5)} style={styles.iconBtn} title="Rewind 5s">
            <RotateCcw size={15} />
          </button>

          <button type="button" onClick={toggleMute} style={styles.iconBtn} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <span style={styles.timeDisplay}>
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" onClick={cycleSpeed} style={styles.speedBtn} title="Playback Speed">
            <FastForward size={14} />
            <span>{playbackRate}x</span>
          </button>
        </div>
      </div>
    </div>
  );
});

const styles = {
  container: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  subtitleOverlay: {
    position: 'absolute',
    bottom: '24px',
    left: '12px',
    right: '12px',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  subtitleText: {
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: 500,
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    display: 'inline-block',
    maxWidth: '90%',
    lineHeight: 1.4,
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.65rem 1rem',
    backgroundColor: '#111827',
    borderTop: '1px solid #1e293b',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#1f2937',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplay: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontVariantNumeric: 'tabular-nums',
    marginLeft: '0.25rem',
  },
  speedBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: '#1f2937',
    color: '#38bdf8',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
};

export default VideoPlayer;

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Square, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputBarProps {
  onStop: (transcript: string) => void;
  onSend: (transcript: string) => void;
  onAttach: () => void;
}

/* ── Types for browser speech API ── */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceInputBar({ onStop, onSend, onAttach }: VoiceInputBarProps) {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const animFrameRef     = useRef<number>(0);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const recognitionRef   = useRef<any>(null);
  const transcriptRef    = useRef('');

  const [transcript,   setTranscript]   = useState('');
  const [permError,    setPermError]    = useState(false);
  const [hasAudio,     setHasAudio]     = useState(false);

  /* ── Draw waveform on canvas ── */
  const drawWave = useCallback(() => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx     = canvas.getContext('2d')!;
    const W       = canvas.width;
    const H       = canvas.height;
    const bufLen  = analyser.frequencyBinCount;
    const data    = new Uint8Array(bufLen);

    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, W, H);

    const BAR_W   = 3;
    const GAP     = 3.5;
    const COUNT   = Math.floor(W / (BAR_W + GAP));
    const MIN_H   = 3;
    const MAX_H   = H - 4;
    const t       = Date.now() / 400;

    for (let i = 0; i < COUNT; i++) {
      const idx   = Math.floor((i / COUNT) * bufLen * 0.75); // use lower 75% of spectrum
      const raw   = data[idx] / 255;
      /* add a gentle idle pulse so bars never disappear completely */
      const idle  = 0.10 + 0.07 * Math.sin(t + i * 0.45);
      const value = Math.max(raw, idle);
      const h     = MIN_H + value * (MAX_H - MIN_H);
      const x     = i * (BAR_W + GAP);
      const y     = (H - h) / 2;

      ctx.fillStyle = 'rgba(255,255,255,0.80)';
      ctx.beginPath();
      (ctx as any).roundRect?.(x, y, BAR_W, h, 1.5) ?? ctx.rect(x, y, BAR_W, h);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(drawWave);
  }, []);

  /* ── Start mic + analyser ── */
  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const ctx      = new AudioContext();
        audioCtxRef.current = ctx;
        const source   = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize          = 64;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyserRef.current = analyser;
        setHasAudio(true);
        drawWave();
      } catch {
        setPermError(true);
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, [drawWave]);

  /* ── Start speech recognition ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.continuous      = true;
    r.interimResults  = true;
    r.lang            = 'en-US';

    r.onresult = (e: any) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else interim += text;
      }
      if (final) transcriptRef.current += final;
      const full = transcriptRef.current + interim;
      setTranscript(full);
    };

    r.onerror = () => {};
    r.onend   = () => {};

    r.start();
    recognitionRef.current = r;

    return () => {
      try { r.stop(); } catch {}
    };
  }, []);

  /* ── Resize canvas to match parent ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      canvas.style.width  = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  function commitStop() {
    try { recognitionRef.current?.stop(); } catch {}
    onStop(transcriptRef.current.trim());
  }

  function commitSend() {
    try { recognitionRef.current?.stop(); } catch {}
    onSend(transcriptRef.current.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
      className="w-full"
    >
      {/* Live transcript preview */}
      <AnimatePresence>
        {transcript && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[14px] text-foreground/70 px-1 mb-2.5 leading-relaxed line-clamp-2"
          >
            {transcript}
          </motion.p>
        )}
        {permError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[13px] text-red-400/80 px-1 mb-2.5"
          >
            Microphone access denied. Check browser permissions.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Voice bar — mirrors the toolbar */}
      <div className="gemini-input-pill w-full px-3.5 py-3 flex items-center gap-2">

        {/* + attach */}
        <button
          onClick={onAttach}
          className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90 shrink-0"
        >
          <Plus className="w-[22px] h-[22px]" strokeWidth={1.8} />
        </button>

        {/* Waveform canvas */}
        <div className="flex-1 h-[36px] relative overflow-hidden">
          {hasAudio ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            /* Placeholder skeleton bars while mic is initialising */
            <div className="flex items-center justify-center gap-[3.5px] h-full">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-foreground/20 rounded-full"
                  style={{
                    width: 3,
                    height: 3 + Math.abs(Math.sin(i * 0.5)) * 10,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stop (square) */}
        <button
          onClick={commitStop}
          className="w-9 h-9 rounded-[10px] bg-foreground/10 hover:bg-foreground/15 active:scale-90 transition-all flex items-center justify-center shrink-0"
        >
          <Square className="w-4 h-4 text-foreground/80 fill-foreground/80" />
        </button>

        {/* Send */}
        <button
          onClick={commitSend}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90',
            transcript.trim()
              ? 'bg-primary hover:opacity-90'
              : 'bg-foreground/15 cursor-default'
          )}
        >
          <ArrowUp className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
        </button>
      </div>
    </motion.div>
  );
}

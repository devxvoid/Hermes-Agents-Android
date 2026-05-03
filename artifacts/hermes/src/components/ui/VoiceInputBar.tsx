import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Square, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputBarProps {
  onStop: (transcript: string) => void;
  onSend: (transcript: string) => void;
  onAttach: () => void;
}

export function VoiceInputBar({ onStop, onSend, onAttach }: VoiceInputBarProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const animFrameRef   = useRef<number>(0);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const isActiveRef    = useRef(true);          // stays true while component is mounted
  const finalRef       = useRef('');            // accumulates confirmed text

  const [transcript, setTranscript] = useState('');
  const [permError,  setPermError]  = useState(false);
  const [ready,      setReady]      = useState(false);

  /* ── 1. Start mic + analyser ─────────────────────────────────── */
  useEffect(() => {
    async function startAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isActiveRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current   = stream;
        const actx          = new AudioContext();
        audioCtxRef.current = actx;

        const source  = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize             = 128;   // 64 frequency bins
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;
        setReady(true);
      } catch {
        setPermError(true);
      }
    }
    startAudio();

    return () => {
      isActiveRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  /* ── 2. Canvas animation — starts when analyser is ready ────── */
  useEffect(() => {
    if (!ready) return;

    const canvas   = canvasRef.current;
    const wrapper  = wrapperRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !wrapper || !analyser) return;

    const bufLen  = analyser.frequencyBinCount; // 64
    const data    = new Uint8Array(bufLen);

    function syncSize() {
      const dpr  = window.devicePixelRatio || 1;
      const w    = wrapper!.clientWidth;
      const h    = wrapper!.clientHeight;
      if (canvas!.width  !== Math.round(w * dpr) ||
          canvas!.height !== Math.round(h * dpr)) {
        canvas!.width  = Math.round(w * dpr);
        canvas!.height = Math.round(h * dpr);
        canvas!.style.width  = `${w}px`;
        canvas!.style.height = `${h}px`;
      }
    }

    let frame = 0;
    function draw() {
      frame = requestAnimationFrame(draw);
      syncSize();

      const W = canvas!.width;
      const H = canvas!.height;
      if (W === 0 || H === 0) return;

      analyser!.getByteFrequencyData(data);

      const ctx      = canvas!.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);

      const BAR_W    = Math.ceil(W / 52);     // ~3px bars at 1x, scales with dpr
      const GAP      = Math.ceil(W / 60);
      const STEP     = BAR_W + GAP;
      const COUNT    = Math.floor(W / STEP);
      const MIN_H    = Math.ceil(H * 0.08);
      const MAX_H    = H - 2;
      const t        = performance.now() / 500;

      for (let i = 0; i < COUNT; i++) {
        // spread across lower 70% of spectrum for voice range
        const idx   = Math.floor((i / COUNT) * bufLen * 0.70);
        const raw   = data[idx] / 255;
        // gentle idle shimmer so bars are always visible
        const idle  = 0.08 + 0.06 * Math.abs(Math.sin(t + i * 0.55));
        const value = Math.max(raw, idle);
        const barH  = MIN_H + value * (MAX_H - MIN_H);
        const x     = i * STEP;
        const y     = (H - barH) / 2;
        const r     = Math.min(BAR_W / 2, barH / 2, 3);

        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        // rounded rect via arc (no roundRect needed for compatibility)
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + BAR_W - r, y);
        ctx.arcTo(x + BAR_W, y, x + BAR_W, y + r, r);
        ctx.lineTo(x + BAR_W, y + barH - r);
        ctx.arcTo(x + BAR_W, y + barH, x + BAR_W - r, y + barH, r);
        ctx.lineTo(x + r, y + barH);
        ctx.arcTo(x, y + barH, x, y + barH - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        ctx.fill();
      }
    }

    draw();
    animFrameRef.current = frame;
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  /* ── 3. Speech recognition — auto-restarts on silence ───────── */
  useEffect(() => {
    const SR = (window as any).SpeechRecognition
            || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    let r: any;

    function startRecognition() {
      if (!isActiveRef.current) return;
      r = new SR();
      r.continuous     = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.lang           = 'en-US';

      r.onresult = (e: any) => {
        let interimText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalRef.current += (finalRef.current ? ' ' : '') + t.trim();
          } else {
            interimText += t;
          }
        }
        setTranscript(finalRef.current + (interimText ? ' ' + interimText : ''));
      };

      r.onerror = (e: any) => {
        // "no-speech" is common and harmless — just restart
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('SpeechRecognition error:', e.error);
        }
      };

      // Auto-restart: browser stops after silence
      r.onend = () => {
        if (isActiveRef.current) startRecognition();
      };

      try { r.start(); } catch {}
      recognitionRef.current = r;
    }

    startRecognition();

    return () => {
      isActiveRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  /* ── Commit helpers ────────────────────────────────────────────── */
  function commitStop() {
    isActiveRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    onStop(finalRef.current.trim() || transcript.trim());
  }

  function commitSend() {
    isActiveRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    onSend(finalRef.current.trim() || transcript.trim());
  }

  const hasText = transcript.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.16 }}
      className="w-full"
    >
      {/* Live transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.p
            key="transcript"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[14px] text-foreground/70 px-1 mb-2.5 leading-relaxed line-clamp-3"
          >
            {transcript}
          </motion.p>
        )}
        {permError && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[13px] text-red-400/80 px-1 mb-2.5"
          >
            Microphone access denied — check browser permissions.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Bar row — same pill shape as normal input */}
      <div className="gemini-input-pill w-full px-3.5 flex items-center gap-2.5" style={{ height: 56 }}>

        {/* + attach */}
        <button
          onClick={onAttach}
          className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90 shrink-0"
        >
          <Plus className="w-[22px] h-[22px]" strokeWidth={1.8} />
        </button>

        {/* Waveform */}
        <div ref={wrapperRef} className="flex-1 h-9 relative">
          {!ready && !permError && (
            /* Placeholder skeleton while mic initialises */
            <div className="absolute inset-0 flex items-center gap-[3px] px-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-foreground/20 animate-pulse"
                  style={{ height: 3 + Math.abs(Math.sin(i * 0.6)) * 10 }}
                />
              ))}
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn('w-full h-full', !ready && 'opacity-0')}
          />
        </div>

        {/* ■ Stop */}
        <button
          onClick={commitStop}
          className="w-9 h-9 rounded-[11px] bg-foreground/10 hover:bg-foreground/16 active:scale-90 transition-all flex items-center justify-center shrink-0"
        >
          <Square className="w-[15px] h-[15px] text-foreground fill-foreground" />
        </button>

        {/* ↑ Send */}
        <button
          onClick={commitSend}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90',
            hasText ? 'bg-primary hover:opacity-90' : 'bg-foreground/12'
          )}
        >
          <ArrowUp className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
        </button>
      </div>
    </motion.div>
  );
}

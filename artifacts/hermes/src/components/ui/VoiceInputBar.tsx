import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Square, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputBarProps {
  onStop: (transcript: string) => void;
  onSend: (transcript: string) => void;
  onAttach: () => void;
  onTranscriptChange: (text: string) => void;
}

export function VoiceInputBar({ onStop, onSend, onAttach, onTranscriptChange }: VoiceInputBarProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);        // always holds the LATEST scheduled frame id
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const recRef       = useRef<any>(null);
  const activeRef    = useRef(true);             // flip to false on unmount / stop / send
  const finalRef     = useRef('');               // committed (final) words
  const interimRef   = useRef('');               // live partial words

  const [permError, setPermError] = useState(false);
  const [micReady,  setMicReady]  = useState(false);

  /* ─── helpers ─────────────────────────────────────────────── */
  function currentText() {
    const t = (finalRef.current + ' ' + interimRef.current).trim();
    return t;
  }

  function stopAll() {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    try { recRef.current?.stop(); } catch {}
  }

  /* ─── 1. Microphone + analyser ────────────────────────────── */
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const actx = new AudioContext();
        audioCtxRef.current = actx;

        const analyser = actx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.72;
        actx.createMediaStreamSource(stream).connect(analyser);
        analyserRef.current = analyser;

        setMicReady(true);
      })
      .catch(() => setPermError(true));

    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── 2. Waveform draw loop — starts once mic is ready ─────── */
  useEffect(() => {
    if (!micReady) return;

    const canvas   = canvasRef.current;
    const wrapper  = wrapperRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !wrapper || !analyser) return;

    const bufLen = analyser.frequencyBinCount; // 64
    const data   = new Uint8Array(bufLen);
    const dpr    = window.devicePixelRatio || 1;

    function syncSize() {
      const w = wrapper!.clientWidth;
      const h = wrapper!.clientHeight;
      const tw = Math.round(w * dpr);
      const th = Math.round(h * dpr);
      if (canvas!.width !== tw || canvas!.height !== th) {
        canvas!.width  = tw;
        canvas!.height = th;
        canvas!.style.width  = w + 'px';
        canvas!.style.height = h + 'px';
      }
    }

    function draw() {
      // KEY FIX: update rafRef INSIDE draw() every frame so cleanup always cancels the live frame
      rafRef.current = requestAnimationFrame(draw);

      syncSize();
      const W = canvas!.width;
      const H = canvas!.height;
      if (W === 0 || H === 0) return;

      analyser!.getByteFrequencyData(data);

      const ctx    = canvas!.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);

      const BAR_W  = Math.max(2, Math.round(W / 55));
      const GAP    = Math.max(2, Math.round(W / 65));
      const STEP   = BAR_W + GAP;
      const COUNT  = Math.floor(W / STEP);
      const MIN_H  = Math.max(3, Math.round(H * 0.09));
      const MAX_H  = H - 2;
      const t      = performance.now() / 480;

      for (let i = 0; i < COUNT; i++) {
        const idx   = Math.floor((i / COUNT) * bufLen * 0.72);
        const raw   = data[idx] / 255;
        const idle  = 0.07 + 0.055 * Math.abs(Math.sin(t + i * 0.52));
        const v     = Math.max(raw, idle);
        const barH  = Math.round(MIN_H + v * (MAX_H - MIN_H));
        const x     = i * STEP;
        const y     = (H - barH) / 2;
        const r     = Math.min(BAR_W / 2, barH / 2, 3);

        // cross-browser rounded rect via arc (no roundRect needed)
        ctx.fillStyle = 'rgba(255,255,255,0.83)';
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

    draw(); // starts the loop (rafRef is updated on the first tick)

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [micReady]);

  /* ─── 3. Speech recognition — auto-restarts on silence ─────── */
  useEffect(() => {
    const SR = (window as any).SpeechRecognition
            || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    function start() {
      if (!activeRef.current) return;
      const r = new SR();
      r.continuous      = true;
      r.interimResults  = true;
      r.maxAlternatives = 1;
      r.lang            = 'en-US';

      r.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const seg = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalRef.current   += (finalRef.current ? ' ' : '') + seg.trim();
            interimRef.current  = '';
          } else {
            interimRef.current  = seg;
          }
        }
        // Live-update the input textarea
        onTranscriptChange(currentText());
      };

      r.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setPermError(true);
        }
        // no-speech / aborted are expected during pauses — ignore
      };

      // Auto-restart so silence gaps don't kill transcription
      r.onend = () => { if (activeRef.current) start(); };

      try { r.start(); } catch {}
      recRef.current = r;
    }

    start();

    return () => {
      activeRef.current = false;
      try { recRef.current?.abort(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── actions ─────────────────────────────────────────────── */
  function handleStop() {
    const t = currentText();
    stopAll();
    onStop(t);
  }

  function handleSend() {
    const t = currentText();
    stopAll();
    onSend(t);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      className="w-full"
    >
      {permError && (
        <p className="text-[13px] text-red-400/80 px-1 mb-2">
          Microphone access denied — check browser permissions.
        </p>
      )}

      {/* Voice bar */}
      <div className="gemini-input-pill w-full px-3.5 flex items-center gap-2.5" style={{ height: 54 }}>

        {/* + */}
        <button
          onClick={onAttach}
          className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90 shrink-0"
        >
          <Plus className="w-[22px] h-[22px]" strokeWidth={1.8} />
        </button>

        {/* Waveform canvas container */}
        <div ref={wrapperRef} className="flex-1 h-[36px] relative overflow-hidden">
          {/* Placeholder skeleton bars while mic initialises */}
          {!micReady && !permError && (
            <div className="absolute inset-0 flex items-center gap-[3.5px]">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-foreground/20"
                  style={{ height: 3 + Math.abs(Math.sin(i * 0.65)) * 11 }}
                />
              ))}
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn('absolute inset-0 w-full h-full', !micReady && 'opacity-0')}
          />
        </div>

        {/* ■ Stop */}
        <button
          onClick={handleStop}
          className="w-9 h-9 rounded-[11px] bg-foreground/10 hover:bg-foreground/15 active:scale-90 transition-all flex items-center justify-center shrink-0"
        >
          <Square className="w-[14px] h-[14px] text-foreground fill-foreground" />
        </button>

        {/* ↑ Send */}
        <button
          onClick={handleSend}
          className="w-9 h-9 rounded-full bg-primary hover:opacity-90 active:scale-90 transition-all flex items-center justify-center shrink-0"
        >
          <ArrowUp className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
        </button>
      </div>
    </motion.div>
  );
}

import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Square, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputBarProps {
  onStop:              (transcript: string) => void;
  onSend:              (transcript: string) => void;
  onAttach:            () => void;
  onTranscriptChange:  (text: string) => void;
}

export function VoiceInputBar({ onStop, onSend, onAttach, onTranscriptChange }: VoiceInputBarProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  /* Always-fresh callback ref — avoids stale closure in the audio effect */
  const cbRef = useRef(onTranscriptChange);
  useLayoutEffect(() => { cbRef.current = onTranscriptChange; });

  /* Accumulate transcript across recognition restarts */
  const finalRef   = useRef('');
  const interimRef = useRef('');

  /* Expose stop/send to buttons — kept in a ref so the effect closure can call them */
  const actionsRef = useRef({ onStop, onSend });
  useLayoutEffect(() => { actionsRef.current = { onStop, onSend }; });

  /* A single ref that lets buttons trigger teardown */
  const stopRef = useRef<(() => void) | null>(null);

  const [permError, setPermError] = useState(false);
  const [micReady,  setMicReady]  = useState(false);

  /* ── Single effect owns the entire mic / canvas / speech lifecycle ── */
  useEffect(() => {
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    /* ── local-only state (not shared via refs across renders) ── */
    let stopped  = false;
    let rafId    = 0;
    let analyser: AnalyserNode | null = null;
    let stream:   MediaStream  | null = null;
    let actx:     AudioContext | null = null;
    let rec:      any                 = null;

    function currentText() {
      return (finalRef.current + ' ' + interimRef.current).trim();
    }

    /* ── Teardown — called by cleanup AND by buttons ── */
    function teardown() {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach(t => t.stop());
      actx?.close().catch(() => {});
      try { rec?.abort(); } catch {}
    }
    stopRef.current = teardown;

    /* ── Canvas draw loop ── */
    const DPR    = window.devicePixelRatio || 1;
    const BUF    = 64;
    const fdata  = new Uint8Array(BUF);

    function syncCanvas() {
      const w = wrapper!.clientWidth;
      const h = wrapper!.clientHeight;
      if (!w || !h) return;
      const tw = Math.round(w * DPR);
      const th = Math.round(h * DPR);
      if (canvas!.width !== tw || canvas!.height !== th) {
        canvas!.width  = tw;
        canvas!.height = th;
        canvas!.style.width  = w + 'px';
        canvas!.style.height = h + 'px';
      }
    }

    function drawFrame() {
      if (stopped) return;
      rafId = requestAnimationFrame(drawFrame);

      syncCanvas();
      const W = canvas!.width;
      const H = canvas!.height;
      if (!W || !H) return;

      if (analyser) analyser.getByteFrequencyData(fdata);

      const ctx   = canvas!.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);

      const BAR_W = Math.max(2, Math.round(W / 54));
      const GAP   = Math.max(2, Math.round(W / 64));
      const STEP  = BAR_W + GAP;
      const COUNT = Math.floor(W / STEP);
      const MIN_H = Math.max(3, Math.round(H * 0.10));
      const MAX_H = H - 2;
      const T     = performance.now() / 500;

      for (let i = 0; i < COUNT; i++) {
        let v: number;
        if (analyser) {
          const idx = Math.floor((i / COUNT) * BUF * 0.75);
          v = fdata[idx] / 255;
          // floor: gentle shimmer so bars never disappear
          const idle = 0.08 + 0.06 * Math.abs(Math.sin(T + i * 0.53));
          v = Math.max(v, idle);
        } else {
          // idle animation before mic is ready
          v = 0.10 + 0.09 * Math.abs(Math.sin(T * 1.4 + i * 0.55));
        }

        const barH = Math.round(MIN_H + v * (MAX_H - MIN_H));
        const x    = i * STEP;
        const y    = (H - barH) / 2;
        const r    = Math.min(BAR_W / 2, barH / 2, 3);

        ctx.fillStyle = analyser
          ? 'rgba(255,255,255,0.84)'
          : 'rgba(255,255,255,0.30)'; // dimmer while not yet connected

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + BAR_W - r, y);
        ctx.arcTo(x + BAR_W, y,       x + BAR_W, y + r,       r);
        ctx.lineTo(x + BAR_W, y + barH - r);
        ctx.arcTo(x + BAR_W, y + barH, x + BAR_W - r, y + barH, r);
        ctx.lineTo(x + r,    y + barH);
        ctx.arcTo(x,         y + barH, x,           y + barH - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x,         y,        x + r,       y,            r);
        ctx.closePath();
        ctx.fill();
      }
    }
    drawFrame(); // starts immediately — dim idle bars until mic is connected

    /* ── Microphone ── */
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(s => {
        if (stopped) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        actx   = new AudioContext();
        analyser = actx.createAnalyser();
        analyser.fftSize             = 128;
        analyser.smoothingTimeConstant = 0.74;
        actx.createMediaStreamSource(s).connect(analyser);
        setMicReady(true);
      })
      .catch(() => setPermError(true));

    /* ── Speech recognition ── */
    const SR = (window as any).SpeechRecognition
             || (window as any).webkitSpeechRecognition;

    if (SR) {
      function startRec() {
        if (stopped) return;
        rec = new SR();
        rec.continuous      = true;
        rec.interimResults  = true;
        rec.maxAlternatives = 1;
        rec.lang            = 'en-US';

        rec.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const seg = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalRef.current   += (finalRef.current ? ' ' : '') + seg.trim();
              interimRef.current  = '';
            } else {
              interimRef.current  = seg;
            }
          }
          cbRef.current(currentText()); // update input field live
        };

        rec.onerror = (ev: any) => {
          if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
            setPermError(true);
          }
          // 'no-speech' / 'aborted' are normal during pauses — silently ignore
        };

        // auto-restart on silence
        rec.onend = () => { if (!stopped) startRec(); };

        try { rec.start(); } catch {}
      }
      startRec();
    }

    /* ── Cleanup on unmount ── */
    return () => {
      teardown();
      stopRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // single mount effect — no deps

  /* ── Button handlers ── */
  function handleStop() {
    const text = (finalRef.current + ' ' + interimRef.current).trim();
    stopRef.current?.();
    actionsRef.current.onStop(text);
  }

  function handleSend() {
    const text = (finalRef.current + ' ' + interimRef.current).trim();
    stopRef.current?.();
    actionsRef.current.onSend(text);
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

      <div className="gemini-input-pill w-full px-3.5 flex items-center gap-2.5" style={{ height: 54 }}>

        {/* + attach */}
        <button
          onClick={onAttach}
          className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90 shrink-0"
        >
          <Plus className="w-[22px] h-[22px]" strokeWidth={1.8} />
        </button>

        {/* Waveform */}
        <div ref={wrapperRef} className="flex-1 h-[36px] relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              micReady ? 'opacity-100' : 'opacity-60'
            )}
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

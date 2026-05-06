'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, radius: 150 });
  const [showPudge, setShowPudge] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const bufferRef = useRef('');
  const [loaded, setLoaded] = useState(false);
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState<string[]>([]);
  const [ambientOn, setAmbientOn] = useState(false);
  const [vText, setVText] = useState('V');
  const [einText, setEinText] = useState('EIN');
  const ambientOscRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Booting Preloader & Entrance
  useEffect(() => {
    const lines = [
      'INITIALIZING NEURAL SPACE...',
      'CONNECTING TO VEIN ECOSYSTEM...',
      'VERIFYING PROTOCOLS...',
      'ACCESS GRANTED.'
    ];
    let step = 0;
    const interval = setInterval(() => {
      setBootText(prev => [...prev, lines[step]]);
      step++;
      if (step >= lines.length) {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 600);
        setTimeout(() => setLoaded(true), 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Text Scramble Effect
  useEffect(() => {
    if (!loaded) return;
    const chars = '!<>-_\\\\/[]{}—=+*^?#_01';
    let scrambleInterval: NodeJS.Timeout;
    
    const scramble = () => {
      let iteration = 0;
      const maxIters = 12;
      
      clearInterval(scrambleInterval);
      scrambleInterval = setInterval(() => {
        setVText(chars[Math.floor(Math.random() * chars.length)]);
        setEinText(
          'EIN'.split('').map((char, index) => {
            if (index < iteration / 4) return char;
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );
        
        if (iteration >= maxIters) {
          clearInterval(scrambleInterval);
          setVText('V');
          setEinText('EIN');
        }
        iteration++;
      }, 40);
    };

    const loop = setInterval(() => {
      if (Math.random() > 0.4) scramble();
    }, 4000);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(loop);
    };
  }, [loaded]);

  // Ambient Drone
  useEffect(() => {
    if (!ambientOn) {
      if (ambientGainRef.current && audioCtxRef.current) {
        ambientGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
      }
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    
    if (!ambientOscRef.current) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55; // Low bass drone
      gain.gain.value = 0;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      
      ambientOscRef.current = osc;
      ambientGainRef.current = gain;
    }

    // Fade in
    ambientGainRef.current!.gain.setTargetAtTime(0.08, ctx.currentTime, 2);
  }, [ambientOn]);


  // Custom cursor & trail
  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;
    
    let mouseX = -9999, mouseY = -9999;
    let ringX = -9999, ringY = -9999;
    const trailPositions = Array(6).fill({ x: -9999, y: -9999 });
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      // Update trail
      let prevX = mouseX;
      let prevY = mouseY;
      trailPositions.forEach((p, i) => {
        p.x += (prevX - p.x) * 0.45;
        p.y += (prevY - p.y) * 0.45;
        prevX = p.x;
        prevY = p.y;
        
        const el = trailRefs.current[i];
        if (el && p.x > -1000) {
          el.style.left = p.x + 'px';
          el.style.top = p.y + 'px';
          el.style.opacity = String(1 - i * 0.15);
          el.style.transform = `translate(-50%, -50%) scale(${1 - i * 0.12})`;
        }
      });

      raf = requestAnimationFrame(tick);
    };

    const onEnter = () => ring.classList.add('cursor-ring--hover');
    const onLeave = () => ring.classList.remove('cursor-ring--hover');

    document.querySelectorAll('.card, button, a, .hero-title-container').forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [loaded]);

  // Hover sound (soft tone)
  const playHoverSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, []);

  // Easter Egg Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-4);
        if (bufferRef.current === 'vein') {
          setShowPudge(true);
          bufferRef.current = '';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas Particle Web
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 100;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; baseX: number; baseY: number;

      constructor() {
        this.baseX = this.x = Math.random() * canvas!.width;
        this.baseY = this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.size = Math.random() * 1.2 + 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas!.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas!.height) this.vy = -this.vy;

        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouseRef.current.radius) {
          const force = (mouseRef.current.radius - dist) / mouseRef.current.radius;
          this.x += (dx / dist) * force * 3;
          this.y += (dy / dist) * force * 3;
        }
      }

      draw() {
        ctx!.fillStyle = 'rgba(160, 180, 255, 0.4)';
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    };

    const drawLines = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(120, 100, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    init();
    animate();
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // 3D Tilt Effect
  const handleCardMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6; // Max 6 deg tilt
    const rotateY = ((x - centerX) / centerX) * 6;
    
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleCardLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <main className="screen">
      {/* Preloader */}
      <div className={`preloader ${!booting ? 'preloader--hidden' : ''}`}>
        {bootText.map((line, i) => (
          <div key={i} className="preloader-line">&gt; {line}</div>
        ))}
      </div>

      {/* Sound Toggle */}
      <button 
        className="sound-toggle" 
        onClick={() => setAmbientOn(!ambientOn)}
        style={{ pointerEvents: booting ? 'none' : 'auto' }}
      >
        [ SOUND {ambientOn ? 'ON' : 'OFF'} ]
      </button>

      {/* Custom cursor & Trail */}
      <div className="cursor" ref={cursorDotRef} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 999999 }}>
        <div className="cursor-dot" />
      </div>
      <div className="cursor" ref={cursorRingRef} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 999998 }}>
        <div className="cursor-ring" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="cursor-trail"
          ref={el => { trailRefs.current[i] = el; }}
        />
      ))}

      <canvas ref={canvasRef} />

      {/* Layered background glows */}
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
      <div className="vignette" />
      <div className="scan-lines" />

      <div className={`page-content ${loaded ? 'page-content--in' : ''}`}>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="hero-title-container" onClick={() => setShowAbout(true)} style={{ pointerEvents: 'auto' }}>
            {/* Base Title */}
            <h1 className="hero-title">
              <span className="v-letter">
                {vText}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/frieren.png" className="frieren-img" alt="Frieren" />
              </span>
              <span className="ein-text">{einText}</span>
            </h1>
          </div>

          <p className="hero-sub">
            всё своё. всё здесь.
          </p>
        </header>

        {/* ── CARDS ── */}
        <div className="cards">

          {/* AI Card */}
          <article 
            className="card card--ai" 
            style={{ animationDelay: '0ms' }} 
            onMouseEnter={playHoverSound}
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div className="card-glow" />
            <div className="card-noise" />
            <div className="card-inner">
              <header className="card-head">
                <div className="card-title-row">
                  <span className="card-icon">✦</span>
                  <h2>VEIN AI</h2>
                </div>
                <span className="badge badge--wip">В РАЗРАБОТКЕ</span>
              </header>
              <p className="card-desc">
                Персональный интеллект в Telegram. Помнит тебя, слышит тебя, думает вместе с тобой.
              </p>
              <ul className="feat-list">
                <li className="feat">
                  <span className="feat-name">RAG Memory</span>
                  <span className="feat-desc">Долгосрочная память — контекст не теряется</span>
                </li>
                <li className="feat">
                  <span className="feat-name">Voice & Vision</span>
                  <span className="feat-desc">Понимает голос, генерирует арты</span>
                </li>
                <li className="feat">
                  <span className="feat-name">Web & Tools</span>
                  <span className="feat-desc">Ищет в интернете, читает PDF и сайты</span>
                </li>
              </ul>
              <div className="card-footer">
                <span className="card-soon">Скоро —</span>
                <span className="card-soon-detail">Telegram-бот</span>
              </div>
            </div>
          </article>

          {/* Music Card */}
          <article 
            className="card card--music" 
            style={{ animationDelay: '120ms' }} 
            onMouseEnter={playHoverSound}
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div className="card-glow" />
            <div className="card-noise" />
            <div className="card-inner">
              <header className="card-head">
                <div className="card-title-row">
                  <span className="card-icon">◈</span>
                  <h2>VEIN Music</h2>
                </div>
                <span className="badge badge--wip">В РАЗРАБОТКЕ</span>
              </header>
              <p className="card-desc">
                Каждый трек оставляет след. Скроблинг из Spotify, Яндекса и VK — всё в одном профиле.
              </p>
              <ul className="feat-list">
                <li className="feat">
                  <span className="feat-name">Scrobble</span>
                  <span className="feat-desc">Перехватывает треки с 4 платформ разом</span>
                </li>
                <li className="feat">
                  <span className="feat-name">XP / Уровни</span>
                  <span className="feat-desc">Ранги: Новичок → Меломан → Легенда</span>
                </li>
                <li className="feat">
                  <span className="feat-name">Discord RPC</span>
                  <span className="feat-desc feat-desc--dim">Трансляция трека и уровня в Discord</span>
                </li>
              </ul>
              <div className="card-footer">
                <span className="card-soon">Скоро —</span>
                <span className="card-soon-detail">Веб-профиль</span>
              </div>
            </div>
          </article>

          {/* Pulse Card */}
          <article 
            className="card card--pulse" 
            style={{ animationDelay: '240ms' }} 
            onMouseEnter={playHoverSound}
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div className="card-glow" />
            <div className="card-noise" />
            <div className="card-inner">
              <header className="card-head">
                <div className="card-title-row">
                  <span className="card-icon">◎</span>
                  <h2>VEIN Pulse</h2>
                </div>
                <span className="badge badge--wip">В РАЗРАБОТКЕ</span>
              </header>
              <p className="card-desc">
                Своя социальная сеть. Посты, подписки, профили — пространство только для своих.
              </p>
              <ul className="feat-list">
                <li className="feat">
                  <span className="feat-name">Лента</span>
                  <span className="feat-desc">Посты, лайки, репосты — живая сеть</span>
                </li>
                <li className="feat">
                  <span className="feat-name">Подписки</span>
                  <span className="feat-desc">Follow-система и Explore для знакомств</span>
                </li>
                <li className="feat">
                  <span className="feat-name">Профиль</span>
                  <span className="feat-desc feat-desc--dim">Темы, аватар, статус и биография</span>
                </li>
              </ul>
              <div className="card-footer">
                <span className="card-soon">Скоро —</span>
                <span className="card-soon-detail">Закрытая бета</span>
              </div>
            </div>
          </article>

        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <footer className="bottom-bar">
        <span className="bottom-line" />
        <span className="bottom-text bottom-text--poem" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
          Не уходи безропотно во тьму,<br />
          Будь яростней пред ночью всех ночей,<br />
          Не дай погаснуть свету своему.
        </span>
        <span className="bottom-line" />
      </footer>

      {/* ── VERSION ── */}
      <div className="version-tag">v0.1 &middot; 3 проекта</div>

      {/* ── EASTER EGG PLAYER ── */}
      {showPudge && (
        <div className="pudge-overlay" onClick={() => setShowPudge(false)}>
          <div className="music-player" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPudge(false)}>✕</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/spiritoftheworld.png" className="player-cover" alt="Cover" />
            <div className="player-info">
              <a href="https://genius.com/artists/Dzhizus" target="_blank" rel="noopener noreferrer" className="player-artist">Джизус</a>
              <div className="player-title">Заповедь</div>
              <div className="player-progress-container">
                <span className="player-time">{formatTime(audioTime)}</span>
                <div className="player-bar-bg">
                  <div 
                    className="player-bar-fill" 
                    style={{ width: `${audioDuration > 0 ? (audioTime / audioDuration) * 100 : 0}%` }}
                  />
                </div>
                <span className="player-time">{formatTime(audioDuration)}</span>
              </div>
            </div>
            <audio 
              src="/track.mp3" 
              autoPlay 
              onTimeUpdate={(e) => setAudioTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
              onEnded={() => setShowPudge(false)}
            />
          </div>
        </div>
      )}

      {/* ── ABOUT MODAL ── */}
      {showAbout && (
        <div className="pudge-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAbout(false)}>✕</button>
            <h2 className="about-title">VEIN</h2>
            
            <div className="about-content">
              <p className="about-text-primary">
                VEIN — это моё личное пространство. я устал от перегруженного интернета и решил собрать всё, что мне нужно, в одном месте, где нет чужих правил.
              </p>

              <div className="about-divider" />

              <p className="about-text-secondary" style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '0.05em' }}>
                всё своё. всё здесь.
              </p>

              <div className="about-grid">
                <div className="about-grid-item">
                  <span className="grid-icon">✦</span>
                  <h4>VEIN AI</h4>
                  <p>мой личный ии в телеграме, который помнит контекст.</p>
                </div>
                <div className="about-grid-item">
                  <span className="grid-icon">◈</span>
                  <h4>VEIN Music</h4>
                  <p>трекер, который просто собирает мою музыку, где бы я её ни слушал.</p>
                </div>
                <div className="about-grid-item">
                  <span className="grid-icon">◎</span>
                  <h4>VEIN Pulse</h4>
                  <p>лента только для своих, без умных алгоритмов и спама.</p>
                </div>
              </div>
            </div>

            <div className="about-footer">
              Статус системы: <span style={{ color: '#8b5cf6', fontWeight: 600 }}>[ В РАЗРАБОТКЕ ]</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

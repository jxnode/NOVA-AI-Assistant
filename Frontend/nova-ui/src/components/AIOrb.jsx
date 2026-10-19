const orbCSS = `
  @keyframes spin         { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
  @keyframes spinReverse  { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
  @keyframes spinSlow     { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }

  @keyframes orbPulse {
    0%, 100% { transform: scale(1);    box-shadow: 0 0 60px rgba(200,0,0,0.8), 0 0 120px rgba(180,0,0,0.4), inset 0 0 40px rgba(255,80,80,0.2); }
    50%      { transform: scale(1.08); box-shadow: 0 0 100px rgba(255,30,30,1),  0 0 200px rgba(200,0,0,0.6), inset 0 0 60px rgba(255,100,100,0.4); }
  }

  @keyframes orbPulseActive {
    0%, 100% { transform: scale(1);    box-shadow: 0 0 80px  rgba(255,50,50,0.9), 0 0 160px rgba(200,0,0,0.6), 0 0 300px rgba(180,0,0,0.2), inset 0 0 50px rgba(255,100,100,0.3); }
    50%      { transform: scale(1.12); box-shadow: 0 0 140px rgba(255,60,60,1),   0 0 280px rgba(200,0,0,0.8), 0 0 500px rgba(180,0,0,0.3), inset 0 0 80px rgba(255,120,120,0.5); }
  }

  @keyframes ringPulse {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%      { opacity: 0.45; transform: scale(1.03); }
  }

  @keyframes ringPulseActive {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%      { opacity: 0.9; transform: scale(1.05); }
  }

  @keyframes particleFloat {
    0%   { transform: translateY(0px)   translateX(0px)   scale(1);   opacity: 0.8; }
    33%  { transform: translateY(-18px) translateX(10px)  scale(1.3); opacity: 1; }
    66%  { transform: translateY(-8px)  translateX(-12px) scale(0.8); opacity: 0.6; }
    100% { transform: translateY(0px)   translateX(0px)   scale(1);   opacity: 0.8; }
  }

  @keyframes scanLine {
    0%   { top: 15%; opacity: 0; }
    5%   { opacity: 0.7; }
    95%  { opacity: 0.7; }
    100% { top: 85%; opacity: 0; }
  }

  @keyframes energyRing {
    0%   { transform: scale(0.8); opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  @keyframes dotBounce {
    0%, 100% { transform: scaleY(1);   opacity: 0.5; }
    50%      { transform: scaleY(2.5); opacity: 1; }
  }

  @keyframes glowBreath {
    0%, 100% { opacity: 0.3; }
    50%      { opacity: 0.7; }
  }

  .orb-particle {
    position: absolute;
    border-radius: 50%;
    background: #ff4444;
    pointer-events: none;
  }

  .energy-burst {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(255,50,50,0.6);
    pointer-events: none;
    animation: energyRing 2s ease-out infinite;
  }
`;

const PARTICLES = [
  { size: 5,  top: '18%', left: '22%', delay: '0s',    dur: '3.2s' },
  { size: 4,  top: '72%', left: '68%', delay: '0.6s',  dur: '2.8s' },
  { size: 6,  top: '25%', left: '74%', delay: '1.1s',  dur: '3.6s' },
  { size: 3,  top: '65%', left: '20%', delay: '0.3s',  dur: '2.5s' },
  { size: 5,  top: '50%', left: '88%', delay: '1.8s',  dur: '4.0s' },
  { size: 4,  top: '82%', left: '44%', delay: '0.9s',  dur: '3.0s' },
  { size: 3,  top: '12%', left: '50%', delay: '2.1s',  dur: '2.7s' },
  { size: 6,  top: '48%', left: '10%', delay: '1.4s',  dur: '3.8s' },
];

export default function AIOrb({ active }) {
  return (
    <>
      <style>{orbCSS}</style>

      <div style={{
        position: 'relative',
        width: '340px',
        height: '340px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>

        {/* ── AMBIENT GLOW BACKDROP ── */}
        <div style={{
          position: 'absolute',
          width: active ? '320px' : '260px',
          height: active ? '320px' : '260px',
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle, rgba(200,0,0,0.28) 0%, rgba(120,0,0,0.14) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(150,0,0,0.14) 0%, transparent 70%)',
          filter: 'blur(30px)',
          transition: 'all 0.6s ease',
          animation: 'glowBreath 3s ease-in-out infinite',
        }} />

        {/* ── ENERGY BURST RINGS (active only) ── */}
        {active && [0, 0.7, 1.4].map((delay, i) => (
          <div key={i} className="energy-burst" style={{
            width: '160px',
            height: '160px',
            animationDelay: `${delay}s`,
          }} />
        ))}

        {/* ── OUTER RING ── */}
        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: active
            ? '1px solid rgba(255,50,50,0.55)'
            : '1px solid rgba(180,0,0,0.22)',
          animationName: 'spin',
          animationDuration: active ? '4s' : '18s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          boxShadow: active ? '0 0 20px rgba(255,0,0,0.3), inset 0 0 20px rgba(200,0,0,0.1)' : 'none',
          transition: 'border-color 0.5s, box-shadow 0.5s',
        }}>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '6px',
              height: '2px',
              background: active ? 'rgba(255,100,100,0.9)' : 'rgba(180,0,0,0.4)',
              top: '50%',
              left: '50%',
              transformOrigin: '-156px 0',
              transform: `translateY(-50%) rotate(${deg}deg)`,
              borderRadius: '1px',
              transition: 'background 0.5s',
            }} />
          ))}
        </div>

        {/* ── MIDDLE RING ── */}
        <div style={{
          position: 'absolute',
          width: '265px',
          height: '265px',
          borderRadius: '50%',
          border: active
            ? '1.5px solid rgba(255,80,80,0.65)'
            : '1px solid rgba(180,0,0,0.25)',
          animationName: 'spinReverse',
          animationDuration: active ? '2.5s' : '10s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          boxShadow: active ? '0 0 15px rgba(255,0,0,0.4)' : 'none',
          transition: 'border-color 0.5s, box-shadow 0.5s',
        }}>
          {[45, 225].map((deg, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: active ? '#ff4444' : 'rgba(180,0,0,0.5)',
              boxShadow: active ? '0 0 10px #ff2222, 0 0 20px #cc0000' : 'none',
              top: '50%',
              left: '50%',
              transformOrigin: '-128px 0',
              transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(128px)`,
              transition: 'background 0.5s, box-shadow 0.5s',
            }} />
          ))}
        </div>

        {/* ── INNER RING ── */}
        <div style={{
          position: 'absolute',
          width: '210px',
          height: '210px',
          borderRadius: '50%',
          border: active
            ? '1px solid rgba(255,80,80,0.45)'
            : '1px solid rgba(150,0,0,0.15)',
          animation: active ? 'ringPulseActive 1.5s ease-in-out infinite' : 'ringPulse 3s ease-in-out infinite',
          transition: 'border-color 0.5s',
        }} />

        {/* ── FLOATING PARTICLES ── */}
        {PARTICLES.map((p, i) => (
          <div key={i} className="orb-particle" style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            top: p.top,
            left: p.left,
            opacity: active ? 1 : 0.35,
            boxShadow: active ? `0 0 ${p.size * 3}px #ff2222` : 'none',
            animation: `particleFloat ${p.dur} ${p.delay} ease-in-out infinite`,
            transition: 'opacity 0.5s, box-shadow 0.5s',
          }} />
        ))}

        {/* ── CORE ORB ── */}
        <div style={{
          position: 'relative',
          width: active ? '148px' : '124px',
          height: active ? '148px' : '124px',
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle at 35% 35%, #ff6666 0%, #cc0000 35%, #7a0000 65%, #3d0000 100%)'
            : 'radial-gradient(circle at 38% 35%, #ff3333 0%, #aa0000 40%, #4a0000 100%)',
          animation: active ? 'orbPulseActive 1.8s ease-in-out infinite' : 'orbPulse 3s ease-in-out infinite',
          transition: 'width 0.4s ease, height 0.4s ease, background 0.5s ease',
          zIndex: 2,
          overflow: 'hidden',
        }}>

          {/* Scan line */}
          <div style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,150,150,0.8), transparent)',
            animation: `scanLine ${active ? '1.5s' : '3s'} linear infinite`,
            borderRadius: '50%',
          }} />

          {/* Specular highlight */}
          <div style={{
            position: 'absolute',
            top: '18%',
            left: '22%',
            width: '30%',
            height: '20%',
            borderRadius: '50%',
            background: 'rgba(255,200,200,0.22)',
            filter: 'blur(4px)',
          }} />

          {/* Voice bars */}
          <div style={{
            position: 'absolute',
            bottom: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}>
            {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
              <div key={i} style={{
                width: '4px',
                height: active ? `${10 + i * 4}px` : '5px',
                borderRadius: '2px',
                background: 'rgba(255,200,200,0.8)',
                animation: active ? `dotBounce ${0.6 + i * 0.1}s ${delay}s ease-in-out infinite` : 'none',
                transition: 'height 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* ── OUTER GLOW HALO ── */}
        <div style={{
          position: 'absolute',
          width: active ? '180px' : '150px',
          height: active ? '180px' : '150px',
          borderRadius: '50%',
          background: 'transparent',
          boxShadow: active
            ? '0 0 60px rgba(255,0,0,0.5), 0 0 120px rgba(200,0,0,0.25)'
            : '0 0 30px rgba(180,0,0,0.2)',
          transition: 'all 0.5s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

      </div>
    </>
  );
}
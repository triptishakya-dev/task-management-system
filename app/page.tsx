"use client";

import React, { useEffect, useRef } from "react";
import { useDashboardState } from "../lib/hooks/useDashboardState";
import { SYSTEMS_DATA, PLANET_DATA } from "../lib/data/solar-system-data";

export default function Dashboard() {
  const {
    activePlanet,
    activePlanetName,
    focused,
    hoveredPlanetName,
    setHoveredPlanetName,
    clock,
    missionTime,
    orbitPos,
    setOrbitPos,
    telemetry,
    selectPlanet,
    resetView
  } = useDashboardState();

  const bgRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Canvas drawing logic
  useEffect(() => {
    let animationFrameId: number;
    let t0 = performance.now();
    
    // Initialize stars
    let stars: any[] = [];
    const initStars = () => {
      stars = [];
      for (let i = 0; i < 360; i++) {
        const layer = Math.random();
        stars.push({
          x: Math.random(), y: Math.random(),
          r: layer < .85 ? Math.random()*.6+.2 : Math.random()*.9+.7,
          a: layer < .85 ? Math.random()*.35+.08 : Math.random()*.3+.35,
          v: (layer < .85 ? .0012 : .003)*(Math.random()*.6+.7),
          tw: Math.random()*6.28,
          hue: Math.random() < .12 ? (Math.random() < .5 ? '196,181,253' : '246,246,243') : '255,255,255'
        });
      }
    };
    initStars();

    const drawNebula = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      [[.16,.26,.44,'79,70,229',.06],[.8,.16,.34,'11,135,147',.04],[.62,.84,.46,'79,70,229',.08],[.06,.8,.3,'99,91,255',.03]]
        .forEach(([x,y,r,c,a]) => {
          const g = ctx.createRadialGradient(Number(x)*w, Number(y)*h, 0, Number(x)*w, Number(y)*h, Number(r)*Math.max(w,h));
          g.addColorStop(0,'rgba('+c+','+a+')'); g.addColorStop(1,'rgba('+c+',0)');
          ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        });
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      
      // BG
      if (bgRef.current) {
        const c = bgRef.current;
        const ctx = c.getContext('2d');
        if (ctx) {
          const w = c.width, h = c.height;
          ctx.clearRect(0,0,w,h);
          drawNebula(ctx, w, h);
          for (const s of stars) {
            const y = (s.y + t*s.v*.02) % 1;
            const x = ((s.x - t*s.v*.006) % 1 + 1) % 1;
            const tw = .72 + .28*Math.sin(t*.7 + s.tw);
            ctx.fillStyle = 'rgba(' + s.hue + ',' + (s.a*tw).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(x*w, y*h, s.r*2, 0, 6.2832); ctx.fill();
          }
        }
      }

      // Wave
      if (waveRef.current) {
        const c = waveRef.current;
        const ctx = c.getContext('2d');
        if (ctx) {
          const w = c.width, h = c.height;
          ctx.clearRect(0,0,w,h);
          ctx.strokeStyle = 'rgba(59,130,246,.07)'; ctx.lineWidth = 1;
          for (let i=1;i<4;i++){ const y=h*i/4; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
          
          const sd = activePlanet.seed;
          const line = (amp: number, sp: number, col: string, lw: number) => {
            ctx.beginPath();
            for (let px=0; px<=w; px+=2) {
              const u = px/w;
              const v = Math.sin(u*22 + t*sp + sd)*.5 + Math.sin(u*7.3 - t*sp*.6)*.32 + Math.sin(u*41 + t*sp*1.7)*.16;
              const y = h/2 - v*amp*(Math.pow(Math.sin(u*Math.PI), 0.6));
              px ? ctx.lineTo(px,y) : ctx.moveTo(px,y);
            }
            ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
          };
          
          ctx.shadowColor = 'rgba(99,91,255,.55)'; ctx.shadowBlur = 8;
          line(h*.34, 1.5, 'rgba(59,130,246,.9)', 1.4);
          ctx.shadowBlur = 0;
          line(h*.2, -1.05, 'rgba(122,45,185,.42)', 1);
          line(h*.11, 2.4, 'rgba(99,91,255,.3)', 1);
        }
      }

      // Chart
      if (chartRef.current) {
        const c = chartRef.current;
        const ctx = c.getContext('2d');
        if (ctx) {
          const w = c.width, h = c.height;
          ctx.clearRect(0,0,w,h);
          ctx.strokeStyle = 'rgba(59,130,246,.06)'; ctx.lineWidth = 1;
          for (let i=0;i<=4;i++){ const y=h*i/4+.5; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
          for (let i=1;i<6;i++){ const x=w*i/6+.5; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
          
          const sd = activePlanet.seed;
          const pts: number[][] = [];
          for (let px=0; px<=w; px+=3) {
            const u = px/w;
            const base = .58 + .3*Math.sin(u*3.1+sd) + .16*Math.sin(u*7.7+sd*2+t*.12) + .07*Math.sin(u*19+t*.4);
            pts.push([px, h - Math.max(.08, Math.min(.94, base*.62+.16))*h]);
          }
          const g = ctx.createLinearGradient(0,0,0,h);
          g.addColorStop(0,'rgba(59,130,246,.26)'); g.addColorStop(1,'rgba(59,130,246,0)');
          ctx.beginPath(); ctx.moveTo(0,h); pts.forEach(p => ctx.lineTo(p[0],p[1])); ctx.lineTo(w,h); ctx.closePath();
          ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); pts.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
          ctx.strokeStyle = 'rgba(196,181,253,.95)'; ctx.lineWidth = 1.5;
          ctx.shadowColor = 'rgba(99,91,255,.7)'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.beginPath();
          for (let px=0; px<=w; px+=3) {
            const u = px/w, b = .42 + .18*Math.sin(u*4.6-sd) + .1*Math.sin(u*11+t*.09);
            const y = h - Math.max(.05, Math.min(.9, b))*h;
            px ? ctx.lineTo(px,y) : ctx.moveTo(px,y);
          }
          ctx.strokeStyle = 'rgba(122,45,185,.45)'; ctx.lineWidth = 1; ctx.setLineDash([3,4]); ctx.stroke(); ctx.setLineDash([]);
          const last = pts[pts.length-1];
          if (last) {
            const r = 2.6 + Math.sin(t*2.2)*.7;
            ctx.fillStyle = '#E7FEEF'; ctx.beginPath(); ctx.arc(last[0]-1, last[1], r, 0, 6.2832); ctx.fill();
            ctx.strokeStyle = 'rgba(59,130,246,.35)'; ctx.beginPath(); ctx.arc(last[0]-1, last[1], r+4+Math.sin(t*2.2)*1.5, 0, 6.2832); ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const resize = () => {
      [bgRef.current, waveRef.current, chartRef.current].forEach(c => {
        if (!c) return;
        const r = c.parentElement?.getBoundingClientRect();
        if (r) {
          c.width = r.width * 2;
          c.height = r.height * 2;
        }
      });
    };
    
    window.addEventListener('resize', resize);
    // slight delay to let layout settle
    setTimeout(resize, 100);

    draw(performance.now());
    
    // Custom event listeners for web component
    const handleTick = (e: any) => { if (e.detail) setOrbitPos(e.detail.angle); };
    const handlePick = (e: any) => { 
      const n = e.detail?.name; 
      if (n === 'SOL SYSTEM') resetView();
      else if (n) selectPlanet(n);
    };

    document.addEventListener('planettick', handleTick);
    document.addEventListener('planetselect', handlePick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('planettick', handleTick);
      document.removeEventListener('planetselect', handlePick);
    };
  }, [activePlanet, resetView, selectPlanet, setOrbitPos]);

  useEffect(() => {
    // Sync web component when active planet changes in React
    const stage = document.querySelector('solar-system') as any;
    if (stage) {
      if (focused && stage.focusPlanet) {
        stage.focusPlanet(activePlanetName);
      } else if (!focused && stage.resetView) {
        stage.resetView();
      }
    }
  }, [activePlanetName, focused]);

  return (
    <div className="dashboard-shell" style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateRows: '56px minmax(0,1fr) 58px', gridTemplateColumns: 'minmax(0,1fr)', overflow: 'hidden', backgroundColor: '#231F20', color: '#F6F6F3' }}>
      
      {/* Background Canvases */}
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}></canvas>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(99,91,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(99,91,255,.045) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 10%, transparent 78%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 10%, transparent 78%)' }}></div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 40% 44% at 50% 52%, rgba(79,70,229,.13), transparent 70%), radial-gradient(circle at 8% 88%, rgba(11,135,147,.10), transparent 55%), radial-gradient(circle at 96% 10%, rgba(31,191,138,.07), transparent 50%)' }}></div>

      {/* Header */}
      <header className="dashboard-header" style={{ position: 'relative', zIndex: 5, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', padding: '0 18px', gap: '14px', borderBottom: '1px solid rgba(99,91,255,.13)', background: 'linear-gradient(180deg, rgba(35,31,32,.72), rgba(35,31,32,.35))', backdropFilter: 'blur(18px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative', width: '26px', height: '26px', display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(99,91,255,.5)', borderRadius: '50%', animation: 'om-spin 14s linear infinite', borderTopColor: 'transparent', borderLeftColor: 'rgba(99,91,255,.15)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 12px 2px rgba(99,91,255,.75)' }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontFamily: 'var(--font-sora), sans-serif', fontSize: '14px', letterSpacing: '.2em', fontWeight: 600, color: '#F6F6F3', whiteSpace: 'nowrap' }}>REDS COMMAND CENTER</div>
            <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.22em', color: 'rgba(59,130,246,.5)', whiteSpace: 'nowrap' }}>SOL SYSTEM // LIVE · CELESTIAL NAVIGATION</div>
          </div>
        </div>
        <nav className="dashboard-nav" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontFamily: 'var(--font-body), sans-serif', fontSize: '10.5px', letterSpacing: '.2em' }}>
          <div style={{ padding: '7px 11px', color: '#231F20', background: 'linear-gradient(180deg, rgba(59,130,246,.95), rgba(79,70,229,.8))', borderRadius: '2px', boxShadow: '0 0 18px rgba(99,91,255,.35)' }}>SYSTEM OVERVIEW</div>
          <div style={{ width: '1px', height: '14px', background: 'rgba(99,91,255,.2)' }}></div>
          {['PLANETS', 'MISSIONS', 'SIGNALS', 'ANALYTICS'].map(item => (
            <div key={item} className="hover:text-[#F6F6F3] hover:bg-[rgba(99,91,255,.09)] hover:shadow-[inset_0_0_0_1px_rgba(99,91,255,.22)]" style={{ padding: '7px 11px', color: 'rgba(246,246,243,.62)', borderRadius: '2px', cursor: 'pointer', transition: 'all .4s ease' }}>{item}</div>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.16em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#A5B4FC' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#635BFF', boxShadow: '0 0 10px 2px rgba(99,91,255,.7)', animation: 'om-blink 2.4s ease-in-out infinite' }}></span>LIVE
          </div>
          <div style={{ width: '1px', height: '16px', background: 'rgba(99,91,255,.18)' }}></div>
          <div style={{ color: 'rgba(246,246,243,.8)' }}>UTC {clock}</div>
          <div style={{ width: '1px', height: '16px', background: 'rgba(99,91,255,.18)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(246,246,243,.55)' }}>
            LINK
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '11px' }}>
              <i style={{ width: '2px', height: '4px', background: '#3B82F6', display: 'block' }}></i>
              <i style={{ width: '2px', height: '7px', background: '#3B82F6', display: 'block' }}></i>
              <i style={{ width: '2px', height: '10px', background: '#3B82F6', display: 'block' }}></i>
              <i style={{ width: '2px', height: '11px', background: 'rgba(59,130,246,.25)', display: 'block', animation: 'om-blink 3s ease-in-out infinite' }}></i>
            </span>
          </div>
          <div className="hover:border-[rgba(59,130,246,.8)] hover:shadow-[0_0_16px_rgba(99,91,255,.4)]" style={{ position: 'relative', width: '30px', height: '30px', borderRadius: '50%', display: 'grid', placeItems: 'center', border: '1px solid rgba(99,91,255,.3)', background: 'rgba(51,53,56,.6)', fontSize: '9.5px', color: '#C4B5FD', cursor: 'pointer', transition: 'all .4s ease' }}>CMD</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main" style={{ position: 'relative', zIndex: 4, display: 'grid', gridTemplateColumns: 'minmax(205px,285px) minmax(0,1fr) minmax(220px,315px)', gap: '16px', padding: '14px 18px', minWidth: 0, minHeight: 0 }}>
        
        {/* Left Section */}
        <section className="dashboard-left" style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto', paddingRight: '3px' }}>
          
          <div className="hover:border-[rgba(59,130,246,.4)] hover:shadow-[inset_0_1px_0_rgba(196,181,253,.16),_inset_0_0_50px_rgba(79,70,229,.2),_0_18px_46px_rgba(0,0,0,.5)]" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(99,91,255,.15)', borderRadius: '3px', background: 'rgba(41,41,41,.45)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,.08), inset 0 0 40px rgba(79,70,229,.12), 0 18px 40px rgba(0,0,0,.4)', padding: '14px 16px 16px', transition: 'border-color .5s ease, box-shadow .5s ease', flex: 'none' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '34px', background: 'linear-gradient(180deg, rgba(59,130,246,.16), transparent)', pointerEvents: 'none', animation: 'om-panel-scan 9s ease-in-out infinite' }}></div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.26em', color: 'rgba(59,130,246,.85)' }}>01 · MISSION STATUS</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.16em', color: 'rgba(246,246,243,.35)' }}>ODYSSEY-07</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'var(--font-sora), sans-serif', fontSize: '22px', letterSpacing: '.02em', color: '#F6F6F3' }}>ODYSSEY-07</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body), sans-serif', fontSize: '9.5px', letterSpacing: '.18em', color: '#A5B4FC', border: '1px solid rgba(99,91,255,.3)', padding: '3px 8px', borderRadius: '2px', background: 'rgba(99,91,255,.07)' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#635BFF', boxShadow: '0 0 8px 2px rgba(99,91,255,.7)', animation: 'om-blink 2s ease-in-out infinite' }}></span>ACTIVE
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px', fontFamily: 'var(--font-body), sans-serif' }}>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>DISTANCE</div>
                <div style={{ fontSize: '15px', color: '#F6F6F3' }}>18.42 <span style={{ fontSize: '10px', color: 'rgba(246,246,243,.45)' }}>AU</span></div>
              </div>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>VELOCITY</div>
                <div style={{ fontSize: '15px', color: '#F6F6F3' }}>{telemetry.velocity} <span style={{ fontSize: '10px', color: 'rgba(246,246,243,.45)' }}>KM/H</span></div>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.2em', color: 'rgba(246,246,243,.45)', marginBottom: '7px' }}>
                <span>SIGNAL INTEGRITY</span><span style={{ color: '#3B82F6' }}>{telemetry.signal}%</span>
              </div>
              <div style={{ position: 'relative', height: '3px', background: 'rgba(59,130,246,.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '0 auto 0 0', width: '94.8%', background: 'linear-gradient(90deg, rgba(99,91,255,.7), #3B82F6)', boxShadow: '0 0 12px rgba(99,91,255,.8)' }}></div>
              </div>
            </div>
          </div>

          <div className="hover:border-[rgba(59,130,246,.35)]" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(99,91,255,.15)', borderRadius: '3px', background: 'rgba(41,41,41,.45)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,.08), 0 18px 40px rgba(0,0,0,.4)', flex: '1 1 250px', minHeight: '250px', padding: '14px 12px 12px', transition: 'border-color .5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '11px', padding: '0 3px' }}>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.26em', color: 'rgba(59,130,246,.85)' }}>02 · PLANETARY BODIES</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', color: 'rgba(246,246,243,.3)' }}>08</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'auto', minHeight: 0 }}>
              {PLANET_DATA.map(b => {
                const on = activePlanetName === b.name;
                const hv = hoveredPlanetName === b.name;
                return (
                  <div key={b.name} onClick={() => selectPlanet(b.name)} onMouseEnter={() => setHoveredPlanetName(b.name)} onMouseLeave={() => setHoveredPlanetName(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '2px', cursor: 'pointer', transition: 'all .4s ease',
                      border: `1px solid ${on ? 'rgba(59,130,246,.42)' : hv ? 'rgba(99,91,255,.22)' : 'rgba(99,91,255,.08)'}`,
                      background: on ? 'linear-gradient(90deg, rgba(99,91,255,.16), rgba(99,91,255,.03))' : hv ? 'rgba(99,91,255,.05)' : 'rgba(255,255,255,.012)',
                      boxShadow: on ? 'inset 0 0 22px rgba(79,70,229,.16), 0 0 18px rgba(79,70,229,.1)' : 'none'
                    }}>
                    <span style={{
                      flex: 'none', width: '13px', height: '13px', borderRadius: '50%',
                      background: `radial-gradient(circle at 32% 28%, ${b.color}, ${b.c2} 70%, #05080f)`,
                      boxShadow: `0 0 ${on ? 14 : 6}px ${on ? 3 : 1}px ${b.color}${on ? '99' : '44'}`
                    }}></span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ fontSize: '11.5px', letterSpacing: '.14em', color: '#F6F6F3', whiteSpace: 'nowrap' }}>{b.name}</div>
                      <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '8px', letterSpacing: '.14em', color: 'rgba(246,246,243,.38)', whiteSpace: 'nowrap' }}>{b.type}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right', fontFamily: 'var(--font-body), sans-serif' }}>
                      <div style={{ fontSize: '10px', color: '#C5FCD7' }}>{b.au}</div>
                      <div style={{ fontSize: '8px', letterSpacing: '.12em', color: on ? '#A5B4FC' : 'rgba(246,246,243,.35)' }}>{b.moons.length ? `${b.moons.length} MOON${b.moons.length > 1 ? 'S' : ''}` : 'NO MOONS'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hover:border-[rgba(59,130,246,.35)]" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(99,91,255,.15)', borderRadius: '3px', background: 'rgba(41,41,41,.45)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,.08), 0 18px 40px rgba(0,0,0,.4)', padding: '14px 16px 16px', transition: 'border-color .5s ease', flex: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '13px' }}>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.26em', color: 'rgba(59,130,246,.85)' }}>03 · SYSTEM STATUS</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.14em', color: 'rgba(99,91,255,.6)' }}>NOMINAL</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {SYSTEMS_DATA.map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.2em', color: 'rgba(246,246,243,.5)', marginBottom: '6px' }}>
                    <span>{s.label}</span><span style={{ color: '#E7FEEF' }}>{s.value}%</span>
                  </div>
                  <div style={{ position: 'relative', height: '2px', background: 'rgba(59,130,246,.09)' }}>
                    <div style={{ position: 'absolute', inset: '0 auto 0 0', height: '2px', width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}55, ${s.color})`, boxShadow: `0 0 10px ${s.color}BB` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Center Canvas */}
        <section className="dashboard-visualizer" style={{ position: 'relative', minHeight: 0, minWidth: 0 }}>
          
          {/* Custom Web Component from public/solar-system.js */}
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* @ts-ignore */}
            <solar-system style={{ display: 'block', width: '100%', height: '100%' }}></solar-system>
          </div>

          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '26px', height: '26px', borderLeft: '1px solid rgba(59,130,246,.35)', borderTop: '1px solid rgba(59,130,246,.35)' }}></div>
            <div style={{ position: 'absolute', right: 0, top: 0, width: '26px', height: '26px', borderRight: '1px solid rgba(59,130,246,.35)', borderTop: '1px solid rgba(59,130,246,.35)' }}></div>
            <div style={{ position: 'absolute', left: 0, bottom: 0, width: '26px', height: '26px', borderLeft: '1px solid rgba(59,130,246,.35)', borderBottom: '1px solid rgba(59,130,246,.35)' }}></div>
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: '26px', height: '26px', borderRight: '1px solid rgba(59,130,246,.35)', borderBottom: '1px solid rgba(59,130,246,.35)' }}></div>

            <div style={{ position: 'absolute', left: '14px', top: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.22em', color: 'rgba(59,130,246,.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#A5B4FC' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#635BFF', boxShadow: '0 0 8px 2px rgba(99,91,255,.7)', animation: 'om-blink 2.6s ease-in-out infinite' }}></span>TRACKING ACTIVE
              </div>
              <div style={{ color: 'rgba(246,246,243,.34)' }}>8 PLANETARY BODIES DETECTED</div>
              <div style={{ color: 'rgba(246,246,243,.34)' }}>ASTEROID BELT // TRACKING</div>
            </div>

            <div style={{ position: 'absolute', right: '14px', top: '10px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.22em', color: 'rgba(59,130,246,.5)' }}>
              <div>TRACKING · {activePlanetName}</div>
              <div style={{ color: 'rgba(246,246,243,.34)' }}>ORB POS {orbitPos}°</div>
              <div style={{ color: 'rgba(246,246,243,.34)' }}>LAT {telemetry.lat} · LNG {telemetry.lng}</div>
            </div>

            <div style={{ position: 'absolute', left: '50%', top: '50%', width: '44%', height: '44%', transform: 'translate(-50%,-50%)', animation: 'om-bracket .8s ease both', opacity: 0.5 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: '14px', height: '14px', borderLeft: '1px solid rgba(59,130,246,.5)', borderTop: '1px solid rgba(59,130,246,.5)' }}></div>
              <div style={{ position: 'absolute', right: 0, top: 0, width: '14px', height: '14px', borderRight: '1px solid rgba(59,130,246,.5)', borderTop: '1px solid rgba(59,130,246,.5)' }}></div>
              <div style={{ position: 'absolute', left: 0, bottom: 0, width: '14px', height: '14px', borderLeft: '1px solid rgba(59,130,246,.5)', borderBottom: '1px solid rgba(59,130,246,.5)' }}></div>
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '14px', height: '14px', borderRight: '1px solid rgba(59,130,246,.5)', borderBottom: '1px solid rgba(59,130,246,.5)' }}></div>
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '2px', display: 'flex', justifyContent: 'space-between', padding: '0 34px', fontFamily: 'var(--font-body), sans-serif', fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.28)' }}>
              <span>SOL SYSTEM // LIVE</span>
              <span>KUIPER FIELD 5.0K NODES</span>
              <span>SYSTEM STATUS: NOMINAL</span>
            </div>
          </div>

          <div 
            onClick={resetView}
            className="hover:border-[rgba(59,130,246,.85)] hover:bg-[rgba(99,91,255,.14)] hover:text-[#F6F6F3]"
            style={{ 
              position: 'absolute', left: '50%', bottom: '26px', zIndex: 4, padding: '8px 18px', border: '1px solid rgba(99,91,255,.35)', borderRadius: '2px', background: 'rgba(41,41,41,.6)', backdropFilter: 'blur(14px)', fontFamily: 'var(--font-body), sans-serif', fontSize: '9.5px', letterSpacing: '.22em', color: 'rgba(246,246,243,.8)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .45s ease', boxShadow: '0 0 26px rgba(79,70,229,.35)',
              opacity: focused ? 1 : 0, pointerEvents: focused ? 'auto' : 'none', transform: focused ? 'translate(-50%,0)' : 'translate(-50%,10px)'
            }}>
            ◄ RETURN TO SOLAR SYSTEM
          </div>
        </section>

        {/* Right Section */}
        <section className="dashboard-right" style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto', paddingRight: '3px' }}>
          
          <div className="hover:border-[rgba(59,130,246,.35)]" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(99,91,255,.15)', borderRadius: '3px', background: 'rgba(41,41,41,.45)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,.08), 0 18px 40px rgba(0,0,0,.4)', padding: '14px 16px 16px', transition: 'border-color .5s ease', flex: 'none' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '30px', background: 'linear-gradient(180deg, rgba(59,130,246,.13), transparent)', pointerEvents: 'none', animation: 'om-panel-scan 13s ease-in-out infinite' }}></div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.26em', color: 'rgba(59,130,246,.85)' }}>PLANET ANALYSIS</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.16em', color: 'rgba(246,246,243,.35)' }}>{activePlanet.idx}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'var(--font-sora), sans-serif', fontSize: '25px', letterSpacing: '.04em', color: '#F6F6F3' }}>{activePlanetName}</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.18em', color: 'rgba(59,130,246,.55)' }}>{activePlanet.type}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px 12px', fontFamily: 'var(--font-body), sans-serif' }}>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>DISTANCE · SOL</div>
                <div style={{ fontSize: '16px', color: '#F6F6F3' }}>{activePlanet.au}</div>
              </div>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>DIAMETER</div>
                <div style={{ fontSize: '16px', color: '#F6F6F3' }}>{activePlanet.dia}</div>
              </div>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>ORBITAL PERIOD</div>
                <div style={{ fontSize: '16px', color: '#F6F6F3' }}>{activePlanet.period}</div>
              </div>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>TEMPERATURE</div>
                <div style={{ fontSize: '16px', color: '#F6F6F3' }}>{activePlanet.temp}</div>
              </div>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>MOONS</div>
                <div style={{ fontSize: '16px', color: '#F6F6F3' }}>{String(activePlanet.moons.length).padStart(2, '0')}</div>
              </div>
              <div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', color: 'rgba(246,246,243,.4)', marginBottom: '4px' }}>ORBIT POSITION</div>
                <div style={{ fontSize: '16px', color: '#3B82F6' }}>{orbitPos}°</div>
              </div>
            </div>
            <div style={{ marginTop: '13px', fontFamily: 'var(--font-body), sans-serif', fontSize: '8.5px', letterSpacing: '.16em', color: 'rgba(246,246,243,.35)', borderTop: '1px solid rgba(99,91,255,.1)', paddingTop: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              SAT · {activePlanet.moons.length ? activePlanet.moons.join(' · ') : 'NO NATURAL SATELLITES'}
            </div>
          </div>

          <div className="hover:border-[rgba(59,130,246,.35)]" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(99,91,255,.15)', borderRadius: '3px', background: 'rgba(41,41,41,.45)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,.08), 0 18px 40px rgba(0,0,0,.4)', padding: '14px 16px 12px', transition: 'border-color .5s ease', flex: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.26em', color: 'rgba(59,130,246,.85)' }}>SIGNAL ANALYSIS</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.16em', color: 'rgba(99,91,255,.7)' }}>{telemetry.freq} GHZ</div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '70px' }}>
              <canvas ref={waveRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body), sans-serif', fontSize: '8.5px', letterSpacing: '.16em', color: 'rgba(246,246,243,.32)', marginTop: '8px' }}>
              <span>AMP {telemetry.amp}</span><span>SNR {telemetry.snr} dB</span><span>PH {telemetry.phase}°</span>
            </div>
          </div>

          <div className="hover:border-[rgba(59,130,246,.35)]" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(99,91,255,.15)', borderRadius: '3px', background: 'rgba(41,41,41,.45)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,.08), 0 18px 40px rgba(0,0,0,.4)', padding: '14px 16px 12px', transition: 'border-color .5s ease', flex: '1 1 200px', minHeight: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '10px', letterSpacing: '.26em', color: 'rgba(59,130,246,.85)' }}>ORBITAL TELEMETRY</div>
              <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: '9px', letterSpacing: '.16em', color: 'rgba(246,246,243,.35)' }}>T+284D</div>
            </div>
            <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '70px' }}>
              <canvas ref={chartRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body), sans-serif', fontSize: '8.5px', letterSpacing: '.16em', color: 'rgba(246,246,243,.3)', marginTop: '8px' }}>
              <span>T-72H</span><span>T-48H</span><span>T-24H</span><span>NOW</span>
            </div>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer" style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', gap: '22px', padding: '0 20px', borderTop: '1px solid rgba(99,91,255,.13)', background: 'linear-gradient(0deg, rgba(35,31,32,.75), rgba(35,31,32,.3))', backdropFilter: 'blur(18px)', fontFamily: 'var(--font-body), sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '.22em', color: 'rgba(246,246,243,.38)' }}>CURRENT COORDINATES</div>
          <div style={{ fontSize: '12px', letterSpacing: '.1em', color: '#F6F6F3', whiteSpace: 'nowrap' }}>RA 14H 39M · DEC -60° 50'</div>
        </div>
        <div style={{ width: '1px', height: '26px', background: 'rgba(99,91,255,.16)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '.22em', color: 'rgba(246,246,243,.38)' }}>SHIP VELOCITY</div>
          <div style={{ fontSize: '12px', letterSpacing: '.1em', color: '#F6F6F3', whiteSpace: 'nowrap' }}>{telemetry.velocity} KM/H</div>
        </div>
        <div style={{ width: '1px', height: '26px', background: 'rgba(99,91,255,.16)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '.22em', color: 'rgba(246,246,243,.38)' }}>SIGNAL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', letterSpacing: '.1em', color: '#F6F6F3' }}>
            {telemetry.signal}%
            <span style={{ display: 'block', width: '74px', height: '2px', background: 'rgba(59,130,246,.12)' }}>
              <span style={{ display: 'block', height: '2px', width: '94%', background: 'linear-gradient(90deg, rgba(99,91,255,.6), #3B82F6)', boxShadow: '0 0 10px rgba(99,91,255,.7)' }}></span>
            </span>
          </div>
        </div>
        <div style={{ width: '1px', height: '26px', background: 'rgba(99,91,255,.16)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '.22em', color: 'rgba(246,246,243,.38)' }}>MISSION TIME</div>
          <div style={{ fontSize: '12px', letterSpacing: '.1em', color: '#F6F6F3', whiteSpace: 'nowrap' }}>{missionTime}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '9px', letterSpacing: '.18em', color: 'rgba(246,246,243,.35)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#635BFF', boxShadow: '0 0 8px 2px rgba(99,91,255,.6)', animation: 'om-blink 3.2s ease-in-out infinite' }}></span>TELEMETRY STREAM</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 8px 2px rgba(99,91,255,.6)', animation: 'om-blink 2.1s ease-in-out infinite' }}></span>DEEP SPACE NET</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#7A2DB9', boxShadow: '0 0 8px 2px rgba(122,45,185,.6)', animation: 'om-blink 4.4s ease-in-out infinite' }}></span>AI NAV ASSIST</span>
        </div>
      </footer>
    </div>
  );
}

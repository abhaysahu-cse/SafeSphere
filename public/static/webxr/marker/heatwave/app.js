// heatwave app.js
console.log('[SafeSphere] heatwave loaded');
window.addEventListener('load', () => {
  const marker = document.getElementById('marker');
  const root = document.getElementById('root');
  const sunEnt = document.getElementById('sunEnt');
  const tank = document.getElementById('tank');
  const card = document.getElementById('card');
  const start = document.getElementById('start');
  const msg = document.getElementById('msg');

  let running = false;
  let t = 0;
  let raf;

  marker.addEventListener('markerFound', () => { root.setAttribute('visible', true); card.style.display='block'; });
  marker.addEventListener('markerLost', () => { card.style.display='none'; stop(); });

  function speak(txt){ if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(txt); u.rate=0.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} }

  function step(){
    t += 0.03;
    // pulse sun (scale)
    const s = 0.25 + Math.abs(Math.sin(t)) * 0.12;
    sunEnt.setAttribute('scale', `${s} ${s} ${s}`);
    // when t large, show tank/advise
    if (t > 6 && !tank.getAttribute('visible')) {
      tank.setAttribute('visible', true);
      msg.textContent = 'Heat sharp: use water tanks, shade crops and drink water.';
      speak('Heat warning. Use water storage and provide shade for crops and people.');
    }
    raf = requestAnimationFrame(step);
  }
  function start(){ if (running) return; running=true; step(); speak('Heatwave simulation started.'); msg.textContent='Heat simulation running'; }
  function stop(){ running=false; if (raf) cancelAnimationFrame(raf); }

  start.onclick = start;
});

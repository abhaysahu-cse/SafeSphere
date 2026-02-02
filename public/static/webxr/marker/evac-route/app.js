// evac app.js
console.log('[SafeSphere] evac-route loaded');
window.addEventListener('load', () => {
  const marker = document.getElementById('marker');
  const root = document.getElementById('root');
  const arrowEnt = document.getElementById('arrowEnt');
  const walker = document.getElementById('walker');
  const startBtn = document.getElementById('start');

  marker.addEventListener('markerFound', () => { root.setAttribute('visible', true); document.getElementById('card').style.display='block';});
  marker.addEventListener('markerLost', ()=>{ document.getElementById('card').style.display='none'; });

  function speak(t){ if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(t); u.rate=0.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} }

  startBtn.addEventListener('click', async () => {
    arrowEnt.setAttribute('visible', true);
    walker.setAttribute('visible', true);
    speak('Follow the arrow to the safe shelter. Walk calmly and help children.');
    // simple tween walk across map
    let steps = 80;
    for (let i=0;i<=steps;i++){
      const t = i/steps;
      const x = -0.4 + (0.6 * t);
      const z = 0.4 - (0.8 * t);
      walker.setAttribute('position', `${x} 0 ${z}`);
      await new Promise(r => setTimeout(r,16));
    }
    speak('You have reached the safe shelter.');
  });
});

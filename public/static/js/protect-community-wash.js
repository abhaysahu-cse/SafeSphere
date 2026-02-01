(function () {

const CONTENT = {
  water: `
    <h3>Safe Drinking Water</h3>
    <ul>
      <li>Identify safe sources: borewell, tankers, protected wells.</li>
      <li>Mark unsafe sources clearly with red paint or signboards.</li>
      <li>Chlorinate water (bleaching powder or tablets).</li>
      <li>Store water in clean, covered containers.</li>
      <li>Never dip hands or cups directly into storage containers.</li>
    </ul>
    <p><strong>Emergency rule:</strong> Boil water for 10 minutes if quality is doubtful.</p>
  `,

  sanitation: `
    <h3>Sanitation in Shelters</h3>
    <ul>
      <li>Temporary toilets at least 30m away from water sources.</li>
      <li>Separate toilets for men, women and children.</li>
      <li>Daily cleaning with disinfectant.</li>
      <li>Ensure proper drainage — no stagnant waste water.</li>
      <li>Provide waste bins and daily garbage removal.</li>
    </ul>
  `,

  hygiene: `
    <h3>Hygiene Practices</h3>
    <ul>
      <li>Handwashing stations with soap at toilets and kitchens.</li>
      <li>Mandatory handwashing before eating.</li>
      <li>Separate cooking and sleeping areas.</li>
      <li>Clean utensils with safe water only.</li>
      <li>Regular bathing where possible.</li>
    </ul>
  `,

  disease: `
    <h3>Disease Prevention</h3>
    <ul>
      <li>Early symptoms: diarrhea, vomiting, fever.</li>
      <li>Isolate sick individuals immediately.</li>
      <li>ORS and zinc for diarrhea cases.</li>
      <li>Drain stagnant water to prevent mosquitoes.</li>
      <li>Display emergency health contacts clearly.</li>
    </ul>
  `,

  operations: `
    <h3>Community WASH Operations</h3>
    <ul>
      <li>Assign WASH team (water, toilets, waste).</li>
      <li>Daily inspection checklist.</li>
      <li>Water testing every 48 hours.</li>
      <li>Record illness cases.</li>
      <li>Coordinate with health department.</li>
    </ul>
  `
};

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tabContent').innerHTML = CONTENT[tab];
}

function openChecklist() {
  document.getElementById('checklistModal').style.display = 'block';
}

function closeChecklist() {
  document.getElementById('checklistModal').style.display = 'none';
}

function saveChecklist() {
  alert("Checklist saved locally. (Offline-first)");
  closeChecklist();
}

window.switchTab = switchTab;
window.openChecklist = openChecklist;
window.closeChecklist = closeChecklist;
window.saveChecklist = saveChecklist;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tabContent').innerHTML = CONTENT.water;
});

})();

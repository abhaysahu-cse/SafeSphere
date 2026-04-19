// Modern Module UI JavaScript - SafeSphere
// Include this in all learning modules for consistent interactions

(function() {
  'use strict';
  
  // ══════════════════════════════════════════════════════════════════════
  // 1. SCROLL REVEAL ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.mod-section').forEach(el => {
      observer.observe(el);
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 2. SMOOTH SCROLL TO SECTIONS
  // ══════════════════════════════════════════════════════════════════════
  function initSmoothScroll() {
    // Start Learning button
    const startBtn = document.querySelector('.mod-btn-primary');
    if (startBtn && startBtn.textContent.includes('Start Learning')) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const firstSection = document.querySelector('.mod-section');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
    
    // Quiz button
    const quizBtns = document.querySelectorAll('[href="#quiz"]');
    quizBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const quizSection = document.getElementById('quiz');
        if (quizSection) {
          quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 3. QUIZ FUNCTIONALITY
  // ══════════════════════════════════════════════════════════════════════
  function initQuiz() {
    const submitBtn = document.getElementById('submitQuiz');
    const quizForm = document.getElementById('quizForm');
    const resultDiv = document.getElementById('quizResult');
    
    if (!submitBtn || !quizForm || !resultDiv) return;
    
    // Get answers from data attribute or global variable
    const answersData = quizForm.dataset.answers;
    if (!answersData) {
      console.warn('Quiz answers not found. Add data-answers attribute to quiz form.');
      return;
    }
    
    const answers = JSON.parse(answersData);
    
    function gradeQuiz() {
      let correct = 0;
      let total = 0;
      
      for (let key in answers) {
        total++;
        const selected = quizForm.querySelector(`input[name="${key}"]:checked`);
        if (selected && selected.value === answers[key]) {
          correct++;
        }
      }
      
      const pct = Math.round((correct / total) * 100);
      
      // Display result
      let message = `Score: ${correct}/${total} (${pct}%) — `;
      if (pct === 100) {
        message += 'Perfect! Excellent understanding! 🎉';
      } else if (pct >= 80) {
        message += 'Great job! Strong knowledge! 👏';
      } else if (pct >= 60) {
        message += 'Good effort! Review missed items. 📚';
      } else {
        message += 'Keep learning! Review the module again. 💪';
      }
      
      resultDiv.textContent = message;
      resultDiv.style.color = pct >= 60 ? '#16a34a' : '#dc2626';
      resultDiv.style.display = 'block';
      
      // Save to localStorage
      try {
        const moduleName = document.querySelector('.mod-hero-title')?.textContent || 'module';
        localStorage.setItem(`quiz_${moduleName}`, JSON.stringify({
          score: { correct, total, pct },
          date: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Could not save quiz score to localStorage');
      }
      
      // Scroll to result
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Submit button click
    submitBtn.addEventListener('click', gradeQuiz);
    
    // Enter key submit
    quizForm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        gradeQuiz();
      }
    });
    
    // Restore previous score if exists
    try {
      const moduleName = document.querySelector('.mod-hero-title')?.textContent || 'module';
      const saved = localStorage.getItem(`quiz_${moduleName}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.score) {
          const { correct, total, pct } = data.score;
          resultDiv.textContent = `Previous score: ${correct}/${total} (${pct}%)`;
          resultDiv.style.color = pct >= 60 ? '#16a34a' : '#dc2626';
          resultDiv.style.display = 'block';
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 4. PROGRESS TRACKING
  // ══════════════════════════════════════════════════════════════════════
  function initProgressTracking() {
    const sections = document.querySelectorAll('.mod-section');
    const progressText = document.querySelector('.mod-progress-text');
    const progressCircle = document.querySelector('.mod-progress-ring svg circle:last-child');
    
    if (!progressText || !progressCircle || sections.length === 0) return;
    
    let visibleSections = 0;
    const totalSections = sections.length;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          visibleSections++;
          updateProgress();
        }
      });
    }, { threshold: 0.5 });
    
    sections.forEach(section => observer.observe(section));
    
    function updateProgress() {
      const pct = Math.round((visibleSections / totalSections) * 100);
      progressText.textContent = `${pct}%`;
      
      // Update SVG circle
      const radius = 32;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (pct / 100) * circumference;
      progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircle.style.strokeDashoffset = offset;
    }
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 5. CARD HOVER EFFECTS
  // ══════════════════════════════════════════════════════════════════════
  function initCardEffects() {
    const cards = document.querySelectorAll('.mod-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-6px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 6. ACCESSIBILITY ENHANCEMENTS
  // ══════════════════════════════════════════════════════════════════════
  function initAccessibility() {
    // Add keyboard navigation for quiz options
    const quizOptions = document.querySelectorAll('.mod-quiz-options label');
    quizOptions.forEach((label, index) => {
      label.setAttribute('tabindex', '0');
      label.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const radio = label.querySelector('input[type="radio"]');
          if (radio) radio.checked = true;
        }
      });
    });
    
    // Add focus visible styles
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 7. VIDEO PLAYER ENHANCEMENTS
  // ══════════════════════════════════════════════════════════════════════
  function initVideoEnhancements() {
    const videos = document.querySelectorAll('.mod-video-wrapper video');
    
    videos.forEach(video => {
      // Add loading indicator
      video.addEventListener('loadstart', function() {
        this.parentElement.classList.add('loading');
      });
      
      video.addEventListener('canplay', function() {
        this.parentElement.classList.remove('loading');
      });
      
      // Track video completion
      video.addEventListener('ended', function() {
        try {
          const moduleName = document.querySelector('.mod-hero-title')?.textContent || 'module';
          localStorage.setItem(`video_${moduleName}`, 'completed');
        } catch (e) {
          // Ignore
        }
      });
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // 8. INITIALIZE ALL FEATURES
  // ══════════════════════════════════════════════════════════════════════
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Initialize all features
    initScrollReveal();
    initSmoothScroll();
    initQuiz();
    initProgressTracking();
    initCardEffects();
    initAccessibility();
    initVideoEnhancements();
    
    console.log('✅ Modern module UI initialized');
  }
  
  // Start initialization
  init();
  
})();

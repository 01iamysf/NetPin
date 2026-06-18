document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconDark = document.getElementById('theme-icon-dark');
  const themeIconLight = document.getElementById('theme-icon-light');
  
  const currentTheme = localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  const updateThemeIcon = (theme) => {
    if (theme === 'dark') {
      themeIconDark.style.display = 'block';
      themeIconLight.style.display = 'none';
    } else {
      themeIconDark.style.display = 'none';
      themeIconLight.style.display = 'block';
    }
  };
  
  updateThemeIcon(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      let theme = document.documentElement.getAttribute('data-theme');
      theme = theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      updateThemeIcon(theme);
    });
  }

  // 1. FAQ Accordion Logic
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.faq-answer').style.maxHeight = null;
      });
      
      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // 2. Fallback for CSS Scroll-driven animations (Intersection Observer)
  // If browser doesn't support view() timeline natively
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    const scaleElementsToAnimate = document.querySelectorAll('.animate-on-scroll-scale');
    
    // Swap native animation classes with fallback initial hidden state
    elementsToAnimate.forEach(el => {
      el.classList.remove('animate-on-scroll');
      el.classList.add('js-fallback-hidden');
    });

    scaleElementsToAnimate.forEach(el => {
      el.classList.remove('animate-on-scroll-scale');
      el.classList.add('js-fallback-hidden-scale');
    });

    const staggerElements = document.querySelectorAll('.stagger-scroll > *');
    staggerElements.forEach(el => {
      el.classList.add('js-fallback-hidden');
    });

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15 // Trigger when 15% visible
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // Only animate once
        }
      });
    }, observerOptions);

    document.querySelectorAll('.js-fallback-hidden, .js-fallback-hidden-scale').forEach(el => {
      observer.observe(el);
    });
  }

  // 3. Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Offset for sticky header
        const headerOffset = 72;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});

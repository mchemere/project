const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Floating back-to-top button
const backToTop = document.querySelector('.back-to-top');

if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle('visible', window.scrollY > 350);
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Scroll reveal for elements marked with .reveal
const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

// Automatic house image slideshow
const slideshow = document.querySelector('.slideshow');

if (slideshow) {
  const slides = Array.from(slideshow.querySelectorAll('.slide'));
  const prevButton = slideshow.querySelector('.slideshow-btn.prev');
  const nextButton = slideshow.querySelector('.slideshow-btn.next');
  const dotsContainer = slideshow.querySelector('.slideshow-dots');
  const slideCount = slides.length;
  let currentIndex = 0;
  let intervalId = null;

  const goToSlide = (index) => {
    const nextIndex = (index + slideCount) % slideCount;
    const previousSlide = slides[currentIndex];

    slides.forEach((slide, i) => {
      const isActive = i === nextIndex;
      slide.classList.toggle('active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.setAttribute('aria-label', `Slide ${i + 1} of ${slideCount}`);
    });

    currentIndex = nextIndex;

    if (dotsContainer) {
      dotsContainer.querySelectorAll('.slideshow-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === nextIndex);
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.setAttribute('aria-current', String(i === nextIndex));
      });
    }

    return nextIndex;
  };

  const stopAutoplay = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    intervalId = setInterval(() => goToSlide(currentIndex + 1), 5000);
  };

  const shouldAutoplay = () =>
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pauseAutoplay = () => stopAutoplay();
  const resumeAutoplay = () => {
    if (shouldAutoplay()) startAutoplay();
  };

  slideshow.addEventListener('mouseenter', pauseAutoplay);
  slideshow.addEventListener('mouseleave', resumeAutoplay);

  prevButton?.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    startAutoplay();
  });

  if (dotsContainer) {
    slides.forEach((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slideshow-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('aria-current', String(i === 0));
      dot.addEventListener('click', () => {
        goToSlide(i);
        startAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  goToSlide(0);
  startAutoplay();
}

const homeSearchForm = document.getElementById('homeSearchForm');

if (homeSearchForm) {
  homeSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const location = document.getElementById('location')?.value.trim() || '';
    const propertyType = document.getElementById('propertyType')?.value || '';
    const minPrice = document.getElementById('minPrice')?.value || '';
    const price = document.getElementById('price')?.value || '';

    const query = new URLSearchParams({
      search: location,
      type: propertyType,
      minPrice: minPrice,
      maxPrice: price,
    });

    window.location.href = `./pages/properties.html?${query.toString()}`;
  });
}

const propertySearchForm = document.getElementById('propertySearchForm');

if (propertySearchForm) {
  const searchParams = new URLSearchParams(window.location.search);
  const searchInput = document.getElementById('searchInput');
  const typeInput = document.getElementById('typeInput');
  const maxPriceInput = document.getElementById('maxPriceInput');

  if (searchInput) searchInput.value = searchParams.get('search') || '';
  if (typeInput) typeInput.value = searchParams.get('type') || '';
  if (maxPriceInput) maxPriceInput.value = searchParams.get('maxPrice') || '';
}

function getLoginHref() {
  const inPages = window.location.pathname.includes('/pages/');
  return inPages ? './login.html' : './pages/login.html';
}

function logoutUser() {
  localStorage.removeItem('rentkeToken');
  localStorage.removeItem('rentkeUser');
  window.location.href = getLoginHref();
}

document.querySelectorAll('[data-logout]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    logoutUser();
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Service worker registration failed; the app continues as a normal website.
    });
  });
}

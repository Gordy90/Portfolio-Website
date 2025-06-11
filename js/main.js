class PortfolioApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeTheme();
    this.setupIntersectionObserver();
    this.setupSmoothScrolling();
    this.hideLoadingScreen();
    this.initializeNavigation();
    this.setupFormValidation();
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => this.toggleTheme());

    // Mobile navigation toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
    
    mobileToggle?.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navLinks?.classList.toggle('open');
      
      // Update ARIA expanded
      const isExpanded = navLinks?.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Close mobile menu when clicking on links
    navLinks?.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        mobileToggle?.classList.remove('active');
        navLinks.classList.remove('open');
        mobileToggle?.setAttribute('aria-expanded', 'false');
      }
    });

    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    // Handle scroll
    window.addEventListener('scroll', this.throttle(() => {
      this.handleScroll();
    }, 16));
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update theme toggle state
    const themeToggle = document.getElementById('theme-toggle');
    if (savedTheme === 'dark') {
      themeToggle?.classList.add('dark');
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update toggle button
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.classList.toggle('dark', newTheme === 'dark');
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    // Fade in animation observer
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
      fadeObserver.observe(el);
    });

    // Navigation highlighting observer
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.updateActiveNavLink(entry.target.id);
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: '-20% 0px -80% 0px'
    });

    // Observe all sections
    document.querySelectorAll('section[id]').forEach(section => {
      navObserver.observe(section);
    });
  }

  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  initializeNavigation() {
    // Set initial active state
    const currentHash = window.location.hash || '#home';
    this.updateActiveNavLink(currentHash.substring(1));
  }

  updateActiveNavLink(sectionId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('active');
      }
    });
  }

  setupFormValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission(form);
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';

    // Clear previous errors
    this.clearFieldError(field);

    // Validation rules
    switch (fieldName) {
      case 'name':
        if (!value) {
          errorMessage = 'Name is required';
          isValid = false;
        } else if (value.length < 2) {
          errorMessage = 'Name must be at least 2 characters';
          isValid = false;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errorMessage = 'Email is required';
          isValid = false;
        } else if (!emailRegex.test(value)) {
          errorMessage = 'Please enter a valid email address';
          isValid = false;
        }
        break;

      case 'message':
        if (!value) {
          errorMessage = 'Message is required';
          isValid = false;
        } else if (value.length < 10) {
          errorMessage = 'Message must be at least 10 characters';
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  }

  showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      field.classList.add('error');
    }
  }

  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      field.classList.remove('error');
    }
  }

  async handleFormSubmission(form) {
    const submitBtn = form.querySelector('.submit-btn');
    const formData = new FormData(form);
    
    // Validate all fields
    const inputs = form.querySelectorAll('input, textarea');
    let isFormValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) return;

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      // Simulate API call (replace with actual endpoint)
      await this.simulateFormSubmission(formData);
      
      // Success handling
      this.showFormSuccess();
      form.reset();
      
    } catch (error) {
      // Error handling
      this.showFormError('Failed to send message. Please try again.');
      
    } finally {
      // Reset button state
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  async simulateFormSubmission(formData) {
    // Replace this with actual form submission logic
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Form data:', Object.fromEntries(formData));
        resolve();
      }, 2000);
    });
  }

  showFormSuccess() {
    // You can implement a toast notification or modal here
    alert('Thank you! Your message has been sent successfully.');
  }

  showFormError(message) {
    // You can implement a toast notification or modal here
    alert(message);
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }, 1000);
    }
  }

  handleScroll() {
    const navbar = document.querySelector('.navbar-container');
    if (window.scrollY > 100) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  handleResize() {
    // Close mobile menu on resize to larger screen
    if (window.innerWidth > 768) {
      const mobileToggle = document.getElementById('mobile-toggle');
      const navLinks = document.getElementById('nav-links');
      
      mobileToggle?.classList.remove('active');
      navLinks?.classList.remove('open');
      mobileToggle?.setAttribute('aria-expanded', 'false');
    }
  }

  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});

// Handle page visibility for performance optimization
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause animations or reduce activity when page is hidden
    document.body.classList.add('page-hidden');
  } else {
    // Resume normal activity when page becomes visible
    document.body.classList.remove('page-hidden');
  }
});
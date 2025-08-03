document.addEventListener('DOMContentLoaded', function() {
    // Initialize typewriter with professional phrases and manual line breaks
    const typed = new Typed('#typed-text', {
        strings: [
            'Grade Vision AI',
            'Advanced Grading\nSystem',
            'Intelligent Assessment\nPlatform',
            'Next-Generation\nEvaluation System'
        ],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 3000,
        loop: true,
        showCursor: false, // Remove the cursor
        fadeOut: true,
        fadeOutClass: 'typed-fade-out',
        fadeOutDelay: 500
    });

    // Parallax effect for floating elements
    document.addEventListener('mousemove', (e) => {
        const floats = document.querySelectorAll('.float');
        const shapes = document.querySelectorAll('.shape');
        
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        floats.forEach((float, index) => {
            const speed = 1 - (index * 0.1);
            const x = (mouseX - 0.5) * 40 * speed;
            const y = (mouseY - 0.5) * 40 * speed;
            
            float.style.transform = `translate(${x}px, ${y}px)`;
        });
        
        shapes.forEach((shape, index) => {
            const speed = 1 - (index * 0.15);
            const x = (mouseX - 0.5) * 60 * speed;
            const y = (mouseY - 0.5) * 60 * speed;
            
            shape.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add intersection observer for animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '20px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with animation classes
    document.querySelectorAll('.hero-content > *').forEach(el => {
        observer.observe(el);
    });

    // Dynamic grid background
    const gridBackground = document.querySelector('.grid-background');
    let previousScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = (currentScrollY - previousScrollY) * 0.1;
        
        gridBackground.style.transform = `skewY(${delta}deg)`;
        previousScrollY = currentScrollY;
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-value');
    stats.forEach(stat => {
        const value = parseFloat(stat.textContent);
        let current = 0;
        const increment = value / 50; // Adjust speed of counting
        const updateCount = () => {
            if (current < value) {
                current += increment;
                if (current > value) current = value;
                stat.textContent = stat.textContent.includes('%') 
                    ? current.toFixed(1) + '%'
                    : current.toFixed(0) + 'ms';
                requestAnimationFrame(updateCount);
            }
        };
        updateCount();
    });

    // Add hover effect for CTA button
    const ctaButton = document.querySelector('.cta-primary');
    ctaButton.addEventListener('mouseenter', () => {
        const shapes = document.querySelectorAll('.shape');
        shapes.forEach(shape => {
            shape.style.transform = 'scale(1.1)';
            shape.style.opacity = '0.2';
        });
    });

    ctaButton.addEventListener('mouseleave', () => {
        const shapes = document.querySelectorAll('.shape');
        shapes.forEach(shape => {
            shape.style.transform = 'scale(1)';
            shape.style.opacity = '0.1';
        });
    });

    // Performance optimization
    let animationFrameId;
    const throttledMouseMove = (e) => {
        if (animationFrameId) {
            return;
        }
        
        animationFrameId = requestAnimationFrame(() => {
            handleMouseMove(e);
            animationFrameId = null;
        });
    };

    const handleMouseMove = (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.documentElement.style.setProperty('--mouse-x', x);
        document.documentElement.style.setProperty('--mouse-y', y);
    };

    document.addEventListener('mousemove', throttledMouseMove);
});
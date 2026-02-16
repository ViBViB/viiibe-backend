// DOM Elements
const masonryWrapper = document.querySelector('.masonry-wrapper');
const masonryContainer = document.querySelector('.masonry-container');
const contentWrapper = document.getElementById('contentWrapper');
const howItWorks = document.getElementById('howItWorks');
const gradientOverlay = document.querySelector('.masonry-gradient-overlay');

// Animation Constants
const MAX_SCROLL = 800; // Pixels to scroll for full animation (Phase 1: content + rotation)
const MASONRY_PAUSE_SCROLL = 200; // Additional scroll to view static masonry (Phase 2) - reduced
const MASONRY_FADEOUT_SCROLL = 600; // Scroll distance for masonry fade-out (Phase 3) - increased
const INITIAL_ROTATION = -10; // Initial Z-axis rotation in degrees (2D rotation)
const INITIAL_WIDTH = 45; // Initial content width percentage

// Handle scroll events with progressive animation
let ticking = false;

function handleScroll() {
    const scrollY = window.scrollY;

    // PHASE 1: Content disappears + Rotation (0px to MAX_SCROLL)
    const phase1Progress = Math.min(scrollY / MAX_SCROLL, 1);

    // Calculate rotation: from INITIAL_ROTATION to 0deg
    const rotation = INITIAL_ROTATION * (1 - phase1Progress);

    // Calculate content width: from 45% to 0%
    const contentWidth = INITIAL_WIDTH * (1 - phase1Progress);

    // Apply transforms to masonry and content
    masonryContainer.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    contentWrapper.style.width = `${contentWidth}%`;

    // Calculate clip-path for content to create clipping effect
    // Content is fixed at viewport, clipped by the shrinking container from LEFT to RIGHT
    const content = document.querySelector('.content');
    const viewportWidth = window.innerWidth;
    const containerWidthPx = (contentWidth / 100) * viewportWidth;

    // Initial container width at 45% viewport
    const initialContainerWidth = (INITIAL_WIDTH / 100) * viewportWidth;

    // As container shrinks from right, clip more from the LEFT
    // clipLeft increases as containerWidthPx decreases
    const clipLeft = Math.max(0, initialContainerWidth - containerWidthPx - 50); // 50px is left padding
    content.style.clipPath = `inset(0 0 0 ${clipLeft}px)`; // inset(top right bottom LEFT)

    // Hide initial content completely when width is very small
    if (contentWidth < 5) {
        contentWrapper.style.opacity = '0';
        contentWrapper.style.pointerEvents = 'none';
    } else {
        contentWrapper.style.opacity = '1';
        contentWrapper.style.pointerEvents = 'auto';
    }

    // PHASE 2: Static Masonry Viewing (MAX_SCROLL to MAX_SCROLL + MASONRY_PAUSE_SCROLL)
    // Masonry stays at full opacity, no changes
    const phase2Start = MAX_SCROLL;
    const phase2End = MAX_SCROLL + MASONRY_PAUSE_SCROLL;

    if (scrollY >= phase2Start) {
        // Change masonry to absolute positioning so it scrolls with the page
        masonryWrapper.style.position = 'absolute';
        masonryWrapper.style.top = `${phase2Start}px`;
    } else {
        // Keep masonry fixed during Phase 1
        masonryWrapper.style.position = 'fixed';
        masonryWrapper.style.top = '0';
    }

    // PHASE 3: Masonry Fade-out (after phase2End)
    // How it Works section scrolls in normally while masonry fades out
    const phase3Start = phase2End;
    const phase3End = phase3Start + MASONRY_FADEOUT_SCROLL;

    // TEMPORARILY COMMENTED FOR TESTING - to see when "How it Works" appears
    /*
    if (scrollY < phase3Start) {
        // Before Phase 3: Masonry is fully visible
        masonryWrapper.style.opacity = '1';
    } else {
        // Phase 3: Masonry fades out
        const phase3Progress = Math.min((scrollY - phase3Start) / MASONRY_FADEOUT_SCROLL, 1);
        const masonryOpacity = 1 - phase3Progress;
        
        masonryWrapper.style.opacity = masonryOpacity;
    }
    */

    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
    }
});

// Duplicate images for infinite scroll effect
function duplicateImages() {
    const columns = document.querySelectorAll('.masonry-column');

    columns.forEach(column => {
        const images = Array.from(column.querySelectorAll('img'));
        // Clone all images and append them for seamless loop
        images.forEach(img => {
            const clone = img.cloneNode(true);
            column.appendChild(clone);
        });
    });
}

// Initialize
duplicateImages();

// CTA Button click handler
const ctaButton = document.querySelector('.cta-button');
ctaButton.addEventListener('click', () => {
    // TODO: Add your Figma plugin installation link
    window.open('https://www.figma.com/community/plugin/your-plugin-id', '_blank');
});

// Initial state
handleScroll();

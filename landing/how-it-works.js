// How It Works Carousel
(function () {
    const container = document.getElementById('howItWorksContainer');
    const carouselViewport = document.getElementById('carouselViewport');
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselItemWrappers = document.querySelectorAll('.carousel-item-wrapper');
    const carouselNavigation = document.getElementById('carouselNavigation');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    let currentIndex = 0;

    // Show carousel immediately
    carouselViewport.classList.add('active');
    carouselNavigation.classList.add('active');

    // Carousel navigation
    function goToSlide(index) {
        currentIndex = index;

        // Allow all items to be centered
        const maxIndex = carouselItemWrappers.length - 1;

        // Calculate initial offset to center first item
        const viewportWidth = carouselViewport.offsetWidth;
        const itemWidth = 731 + 24; // width + gap
        const initialOffset = (viewportWidth / 2) - (731 / 2) - 12; // Center first item

        // Slide the track with initial offset
        const slideOffset = index * itemWidth;
        carouselTrack.style.transform = `translateX(${initialOffset - slideOffset}px)`;

        // Update center class and distance classes for arc effect
        carouselItemWrappers.forEach((wrapper, i) => {
            // Remove all classes
            wrapper.classList.remove('center', 'distance-1', 'distance-2', 'distance-3');

            // Calculate distance from center
            const distance = Math.abs(i - currentIndex);

            if (i === currentIndex) {
                wrapper.classList.add('center');
            } else if (distance === 1) {
                wrapper.classList.add('distance-1');
            } else if (distance === 2) {
                wrapper.classList.add('distance-2');
            } else {
                wrapper.classList.add('distance-3');
            }
        });

        // Update navigation buttons
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index >= maxIndex;
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            goToSlide(currentIndex - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < carouselItemWrappers.length - 1) {
            goToSlide(currentIndex + 1);
        }
    });

    // Initialize carousel with first item centered
    goToSlide(0);
})();

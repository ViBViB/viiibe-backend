import lottie, { AnimationItem } from 'lottie-web';

let animation: AnimationItem | null = null;

export function initLottieAnimation(container: HTMLElement, animationData: any) {
    // Destroy previous animation if exists
    if (animation) {
        animation.destroy();
    }

    // Load and play the animation
    animation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData
    });

    return animation;
}

export function destroyLottieAnimation() {
    if (animation) {
        animation.destroy();
        animation = null;
    }
}

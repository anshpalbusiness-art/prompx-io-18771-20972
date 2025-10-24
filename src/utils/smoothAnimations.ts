/**
 * Ultra-smooth animation utilities using requestAnimationFrame
 * Optimized for 60fps performance across all devices
 */

/**
 * Smooth scroll to element with optimal performance
 */
export function smoothScrollTo(
  element: HTMLElement | null,
  duration: number = 800,
  offset: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    function animation(currentTime: number) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Easing function for smooth deceleration
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animation);
  });
}

/**
 * Throttle with requestAnimationFrame for optimal performance
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        callback(...lastArgs);
        rafId = null;
      });
    }
  };
}

/**
 * Smooth value interpolation using requestAnimationFrame
 */
export function animateValue(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void,
  easing: (t: number) => number = (t) => t
): () => void {
  let startTime: number | null = null;
  let rafId: number;

  function animate(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = start + (end - start) * easedProgress;

    callback(currentValue);

    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    }
  }

  rafId = requestAnimationFrame(animate);

  // Return cancel function
  return () => cancelAnimationFrame(rafId);
}

/**
 * Easing functions for smooth animations
 */
export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
};

/**
 * Batch DOM reads and writes for optimal performance
 */
export class DOMBatcher {
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];
  private rafId: number | null = null;

  read(callback: () => void): void {
    this.readQueue.push(callback);
    this.schedule();
  }

  write(callback: () => void): void {
    this.writeQueue.push(callback);
    this.schedule();
  }

  private schedule(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      // Execute all reads first
      while (this.readQueue.length > 0) {
        const read = this.readQueue.shift();
        read?.();
      }

      // Then execute all writes
      while (this.writeQueue.length > 0) {
        const write = this.writeQueue.shift();
        write?.();
      }

      this.rafId = null;
    });
  }

  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.readQueue = [];
    this.writeQueue = [];
  }
}

// Global DOM batcher instance
export const domBatcher = new DOMBatcher();

/**
 * Optimize animation frames for smooth 60fps
 */
export function optimizeAnimation(
  callback: (deltaTime: number) => void,
  maxFPS: number = 60
): () => void {
  const minDelay = 1000 / maxFPS;
  let lastTime = performance.now();
  let rafId: number;
  let running = true;

  function animate() {
    if (!running) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= minDelay) {
      callback(deltaTime);
      lastTime = currentTime - (deltaTime % minDelay);
    }

    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  // Return stop function
  return () => {
    running = false;
    cancelAnimationFrame(rafId);
  };
}

/**
 * Visibility-based animation controller
 * Only runs animations when element is visible
 */
export function createVisibleAnimation(
  element: HTMLElement,
  callback: (visible: boolean) => void
): () => void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      callback(entry.isIntersecting);
    },
    {
      threshold: 0,
      rootMargin: '50px',
    }
  );

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Preload animation frames for smoother transitions
 */
export function preloadAnimations(...animationNames: string[]): void {
  const style = document.createElement('style');
  const preloadCSS = animationNames
    .map(
      (name) => `
    @keyframes ${name}-preload {
      from { opacity: 0.99; }
      to { opacity: 1; }
    }
    .${name}-preload {
      animation: ${name}-preload 0.001s;
    }
  `
    )
    .join('\n');

  style.textContent = preloadCSS;
  document.head.appendChild(style);

  // Trigger preload
  const div = document.createElement('div');
  animationNames.forEach((name) => div.classList.add(`${name}-preload`));
  document.body.appendChild(div);
  
  requestAnimationFrame(() => {
    document.body.removeChild(div);
    document.head.removeChild(style);
  });
}

/**
 * Force GPU compositing for smoother animations
 */
export function forceGPUCompositing(element: HTMLElement): void {
  element.style.transform = 'translateZ(0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
}

/**
 * Optimize transition for best performance
 */
export function optimizeTransition(
  element: HTMLElement,
  property: string = 'all',
  duration: number = 300,
  easing: string = 'cubic-bezier(0.4, 0, 0.2, 1)'
): void {
  element.style.transition = `${property} ${duration}ms ${easing}`;
  element.style.willChange = property === 'all' ? 'transform, opacity' : property;
  
  // Remove will-change after transition
  element.addEventListener(
    'transitionend',
    () => {
      element.style.willChange = 'auto';
    },
    { once: true }
  );
}

/**
 * Measure frame rate
 */
export function measureFPS(duration: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();

    function countFrame() {
      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < duration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = Math.round((frameCount / elapsed) * 1000);
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

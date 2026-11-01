/**
 * Interaction patterns ported to vanilla JS from the free Skiper UI components
 * (https://skiper-ui.com): Skiper 58 Text Roll, Skiper 61 Spring Mouse Follow,
 * Skiper 89 Scroll Progress. Skiper 40 Animated Link lives in skiper.css.
 * Free to use and modify with attribution to Skiper UI (credited in the footer).
 */

const ROLL_STAGGER = 0.035;

/** Skiper 58: letters of a link roll up and are replaced by a second copy, staggered from the centre. */
export function initTextRoll(env) {
  if (env.reducedMotion) return;
  document.querySelectorAll('[data-text-roll]').forEach((link) => {
    const text = link.textContent.trim();
    if (!text || link.querySelector('.roll')) return;
    const chars = [...text];
    const centre = (chars.length - 1) / 2;

    const layer = (cls) => {
      const wrap = document.createElement('span');
      wrap.className = cls;
      wrap.setAttribute('aria-hidden', 'true');
      chars.forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'roll__char';
        s.textContent = ch === ' ' ? ' ' : ch;
        s.style.transitionDelay = `${(ROLL_STAGGER * Math.abs(i - centre)).toFixed(3)}s`;
        wrap.append(s);
      });
      return wrap;
    };

    const roll = document.createElement('span');
    roll.className = 'roll';
    roll.append(layer('roll__layer'), layer('roll__layer roll__layer--next'));
    link.setAttribute('aria-label', text);
    link.textContent = '';
    link.append(roll);
  });
}

/** Skiper 61: a spring-driven dot follows the pointer inside a container. */
const SPRING = { mass: 0.1, damping: 10, stiffness: 131 };

export function initMouseFollow(env) {
  if (env.reducedMotion || !env.finePointer) return;
  document.querySelectorAll('[data-mouse-follow]').forEach((area) => {
    const dot = document.createElement('span');
    dot.className = 'follow';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = area.dataset.mouseFollow || '';
    area.append(dot);

    const axes = { x: [0, 0], y: [0, 0], s: [0, 0] };
    const target = { x: 0, y: 0, s: 0 };
    let raf = 0;
    let last = 0;

    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let moving = false;
      for (const k of ['x', 'y', 's']) {
        const a = axes[k];
        const sub = Math.ceil(dt / (1 / 120));
        const h = dt / sub;
        for (let i = 0; i < sub; i++) {
          const acc = (SPRING.stiffness * (target[k] - a[0]) - SPRING.damping * a[1]) / SPRING.mass;
          a[1] += acc * h;
          a[0] += a[1] * h;
        }
        if (Math.abs(a[1]) > 0.01 || Math.abs(target[k] - a[0]) > 0.01) moving = true;
      }
      dot.style.transform = `translate3d(${axes.x[0]}px, ${axes.y[0]}px, 0) translate(-50%, -50%) scale(${Math.max(axes.s[0], 0)})`;
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    const run = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };

    area.addEventListener('pointermove', (e) => {
      const b = area.getBoundingClientRect();
      target.x = e.clientX - b.left;
      target.y = e.clientY - b.top;
      run();
    });
    area.addEventListener('pointerenter', (e) => {
      const b = area.getBoundingClientRect();
      // Start under the pointer so the dot grows in place instead of flying in from the corner.
      axes.x[0] = target.x = e.clientX - b.left;
      axes.y[0] = target.y = e.clientY - b.top;
      axes.x[1] = axes.y[1] = 0;
      target.s = 1;
      run();
    });
    area.addEventListener('pointerleave', () => {
      target.s = 0;
      run();
    });
  });
}

/** Skiper 89: draggable circular scroll progress with a percentage on hover. */
export function initScrollProgress(env, scroll) {
  const R = 18;
  const C = 2 * Math.PI * R;
  const widget = document.createElement('div');
  widget.className = 'scroll-ring';
  widget.setAttribute('aria-hidden', 'true');
  widget.innerHTML =
    `<span class="scroll-ring__value">0%</span>` +
    `<span class="scroll-ring__disc"><svg viewBox="0 0 48 48" role="presentation">` +
    `<circle class="scroll-ring__track" cx="24" cy="24" r="${R}"></circle>` +
    `<circle class="scroll-ring__bar" cx="24" cy="24" r="${R}" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"></circle>` +
    `</svg></span>`;
  document.body.append(widget);

  const bar = widget.querySelector('.scroll-ring__bar');
  const value = widget.querySelector('.scroll-ring__value');
  scroll.subscribe(({ progress }) => {
    const p = Math.min(Math.max(progress, 0), 1);
    bar.style.strokeDashoffset = String(C * (1 - p));
    value.textContent = `${Math.round(p * 100)}%`;
  });

  // Drag it out of the way; it stays inside the viewport.
  let dx = 0;
  let dy = 0;
  let drag = null;
  widget.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX - dx, y: e.clientY - dy };
    widget.setPointerCapture(e.pointerId);
    widget.classList.add('is-dragging');
  });
  widget.addEventListener('pointermove', (e) => {
    if (!drag) return;
    dx = e.clientX - drag.x;
    dy = e.clientY - drag.y;
    widget.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    const r = widget.getBoundingClientRect();
    const fixX = r.left < 0 ? -r.left : r.right > innerWidth ? innerWidth - r.right : 0;
    const fixY = r.top < 0 ? -r.top : r.bottom > innerHeight ? innerHeight - r.bottom : 0;
    if (fixX || fixY) {
      dx += fixX;
      dy += fixY;
      widget.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
  });
  const end = () => {
    drag = null;
    widget.classList.remove('is-dragging');
  };
  widget.addEventListener('pointerup', end);
  widget.addEventListener('pointercancel', end);
}

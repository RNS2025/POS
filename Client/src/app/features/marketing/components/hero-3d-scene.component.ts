import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';

@Component({
  selector: 'app-hero-3d-scene',
  template: `
    <div class="relative mx-auto h-[380px] w-full max-w-lg perspective-[1600px] md:h-[480px]">
      <div class="landing-pulse-ring pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/20 md:h-80 md:w-80"></div>
      <div class="landing-pulse-ring pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-violet/20 md:h-60 md:w-60"></div>

      <div
        class="landing-scene landing-parallax landing-float relative mx-auto h-full w-full"
        [style.--rx]="rx() + 'deg'"
        [style.--ry]="ry() + 'deg'"
      >
        <div class="landing-orbit absolute inset-0 flex items-center justify-center">
          <div
            class="landing-orbit-ring absolute h-56 w-56 rounded-full border border-dashed border-accent/25 md:h-72 md:w-72"
            style="transform: rotateX(70deg)"
          ></div>

          <div
            class="landing-hub-glow landing-device absolute flex h-36 w-36 flex-col items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-br from-surface-raised via-surface-raised to-accent/20 md:h-44 md:w-44"
            style="transform: translateZ(100px)"
          >
            <div class="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-cyan">POS</div>
            <div class="mt-2 text-lg font-bold text-ink md:text-xl">Unified</div>
            <div class="mt-1 flex gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-accent-emerald"></span>
              <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
              <span class="h-1.5 w-1.5 rounded-full bg-accent-violet"></span>
            </div>
          </div>

          <div
            class="landing-device landing-float absolute h-44 w-24 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 shadow-2xl shadow-accent/10"
            style="transform: translateZ(60px) rotateY(-20deg) translateX(-90px)"
          >
            <div class="text-[10px] font-medium text-ink-muted">Shop</div>
            <div class="mt-3 space-y-2">
              <div class="h-2 rounded-full bg-accent/40"></div>
              <div class="h-2 w-2/3 rounded-full bg-white/15"></div>
              <div class="mt-4 h-10 rounded-xl bg-accent/20"></div>
            </div>
          </div>

          <div
            class="landing-device landing-float-delay absolute h-32 w-40 rounded-2xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/10 to-transparent p-3 shadow-xl"
            style="transform: translateZ(30px) rotateY(25deg) translateX(85px) translateY(-30px)"
          >
            <div class="text-[10px] font-medium text-accent-cyan">Checkout</div>
            <div class="mt-3 h-14 rounded-xl border border-accent-cyan/20 bg-black/30"></div>
            <div class="mt-2 h-2 w-1/2 rounded-full bg-accent-emerald/60"></div>
          </div>

          <div
            class="landing-device absolute h-36 w-28 rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/15 to-surface-raised p-3 shadow-2xl"
            style="transform: translateZ(50px) rotateY(-30deg) translateX(20px) translateY(95px)"
          >
            <div class="text-[10px] font-medium text-accent-violet">Kasse</div>
            <div class="mx-auto mt-4 h-14 w-20 rounded-lg bg-gradient-to-b from-accent-violet/30 to-accent/20"></div>
            <div class="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Hero3dSceneComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly rx = signal(12);
  protected readonly ry = signal(-18);

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = this.el.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (event.clientX - centerX) / rect.width;
    const dy = (event.clientY - centerY) / rect.height;

    this.rx.set(12 + dy * 16);
    this.ry.set(-18 + dx * 24);
  }
}

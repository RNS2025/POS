import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Hero3dSceneComponent } from '../components/hero-3d-scene.component';
import { LandingFooterComponent } from '../components/landing-footer.component';
import { LandingHeaderComponent } from '../components/landing-header.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    TranslatePipe,
    LandingHeaderComponent,
    LandingFooterComponent,
    Hero3dSceneComponent,
  ],
  templateUrl: './landing.page.html',
})
export class LandingPage {
  protected readonly steps = [
    {
      num: '01',
      titleKey: 'landing.steps.step1Title',
      descKey: 'landing.steps.step1Desc',
    },
    {
      num: '02',
      titleKey: 'landing.steps.step2Title',
      descKey: 'landing.steps.step2Desc',
    },
    {
      num: '03',
      titleKey: 'landing.steps.step3Title',
      descKey: 'landing.steps.step3Desc',
    },
  ];
}

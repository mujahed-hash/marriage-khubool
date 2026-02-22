import { Injectable, signal } from '@angular/core';

export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTier = signal<MembershipTier>('bronze');

  constructor() {
    this.updateBodyAttribute('bronze');
  }

  setTier(tier: MembershipTier) {
    this.currentTier.set(tier);
    this.updateBodyAttribute(tier);
  }

  getTier() {
    return this.currentTier();
  }

  private updateBodyAttribute(tier: MembershipTier) {
    document.body.setAttribute('data-tier', tier);
  }
}

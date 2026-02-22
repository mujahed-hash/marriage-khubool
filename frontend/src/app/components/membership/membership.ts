import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, MembershipTier } from '../../services/theme';
import { MembershipService } from '../../services/membership.service';
import { AuthService } from '../../services/auth';

declare const Razorpay: any;

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './membership.html',
  styleUrl: './membership.css'
})
export class MembershipComponent {
  message = '';
  loading = false;

  private themeService = inject(ThemeService);
  private membershipService = inject(MembershipService);
  private authService = inject(AuthService);

  selectTier(tier: MembershipTier) {
    this.themeService.setTier(tier);
  }

  async subscribe(plan: string, amount: number) {
    if (!this.authService.isAuthenticated()) {
      this.showMessage('Please login to subscribe.');
      return;
    }
    this.loading = true;
    this.message = '';
    try {
      const res = await this.membershipService.createOrder(plan, amount);
      if (res.keyId && (window as any).Razorpay) {
        const options = {
          key: res.keyId,
          amount: res.amount * 100,
          currency: 'INR',
          order_id: res.orderId,
          name: 'Khubool Hai',
          description: `${plan} Membership`,
          handler: (response: any) => this.onPaymentSuccess(res.membershipOrderId, response.razorpay_payment_id, response.razorpay_signature)
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', () => {
          this.showMessage('Payment failed. Please try again.');
          this.loading = false;
        });
        rzp.open();
      } else {
        await this.membershipService.verifyPayment(res.membershipOrderId);
        this.showMessage('Membership upgraded! (Test mode)');
        this.themeService.setTier(plan as MembershipTier);
      }
    } catch (e: any) {
      this.showMessage(e.message || 'Failed to create order.');
    }
    this.loading = false;
  }

  private async onPaymentSuccess(membershipOrderId: string, paymentId?: string, signature?: string) {
    try {
      const res = await this.membershipService.verifyPayment(membershipOrderId, paymentId, signature);
      this.showMessage(res.message);
      this.themeService.setTier(res.tier as MembershipTier);
    } catch (e: any) {
      this.showMessage(e.message || 'Payment verification failed.');
    }
    this.loading = false;
  }

  private showMessage(msg: string) {
    this.message = msg;
    setTimeout(() => this.message = '', 5000);
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MembershipService {
    private api = inject(ApiService);

    createOrder(plan: string, amount: number): Promise<{ orderId: string; membershipOrderId: string; amount: number; plan: string; keyId: string | null }> {
        return this.api.post('/membership/order', { plan, amount });
    }

    verifyPayment(membershipOrderId: string, razorpayPaymentId?: string, razorpaySignature?: string): Promise<{ message: string; tier: string }> {
        return this.api.post('/membership/verify', {
            membershipOrderId,
            razorpayPaymentId,
            razorpaySignature
        });
    }
}

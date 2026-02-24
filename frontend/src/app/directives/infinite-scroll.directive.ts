import { Directive, EventEmitter, Output, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[appInfiniteScroll]',
    standalone: true
})
export class InfiniteScrollDirective {
    @Output() scrolled = new EventEmitter<void>();
    @Input() scrollThreshold = 150; // px from bottom to trigger
    @Input() isLoading = false;
    @Input() hasMore = true;

    @HostListener('scroll', ['$event'])
    onScroll(event: Event) {
        if (this.isLoading || !this.hasMore) return;

        const target = event.target as HTMLElement;
        const limit = target.scrollHeight - target.clientHeight;

        // If we are within the threshold from the bottom
        if (target.scrollTop >= limit - this.scrollThreshold) {
            this.scrolled.emit();
        }
    }

    // Also listen to window scroll if the directive is placed on a container that stretches the body
    @HostListener('window:scroll', [])
    onWindowScroll() {
        if (this.isLoading || !this.hasMore) return;

        // Find the element with scrolling (usually document.documentElement)
        const doc = document.documentElement;
        const limit = doc.scrollHeight - doc.clientHeight;

        if (doc.scrollTop >= limit - this.scrollThreshold) {
            this.scrolled.emit();
        }
    }
}

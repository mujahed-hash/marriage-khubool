import { Component, ElementRef, ViewChild, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import Cropper from 'cropperjs';
import { ProfileService } from '../../services/profile';
import { environment } from '../../../environments/environment';

interface PhotoSlot {
    id: number;
    previewUrl: string | null;
    file: File | null;
    serverUrl?: string | null;
    photoId?: string | null;
}

@Component({
    selector: 'app-my-photos',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-photos.html',
    styleUrl: './my-photos.css'
})
export class MyPhotosComponent implements OnInit {
    private slotsData = signal<PhotoSlot[]>([
        { id: 1, previewUrl: null, file: null },
        { id: 2, previewUrl: null, file: null },
        { id: 3, previewUrl: null, file: null },
        { id: 4, previewUrl: null, file: null },
        { id: 5, previewUrl: null, file: null }
    ]);
    slots = this.slotsData.asReadonly();

    @ViewChild('cropImage') cropImageElement!: ElementRef<HTMLImageElement>;
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
    cropper: Cropper | null = null;
    isCropperOpen = false;
    currentSlotId: number | null = null;
    pendingSetAsDp = false;
    isSaving = signal(false);
    saveMessage = '';

    constructor(private profileService: ProfileService) {}

    ngOnInit() {
        this.loadPhotos();
    }

    loadPhotos() {
        this.profileService.getPhotos().then(photos => {
            const current = this.slotsData();
            const next = current.map((slot, i) => {
                const p = photos[i];
                if (p?.url) {
                    const fullUrl = p.url.startsWith('http') ? p.url : `${environment.uploadsBaseUrl}${p.url}`;
                    return { ...slot, previewUrl: fullUrl, serverUrl: fullUrl, photoId: (p as { _id?: string })._id ?? null };
                }
                return { ...slot };
            });
            this.slotsData.set(next);
        });
    }

    currentSlotForUpload = 0;

    triggerFileInput(slotId: number) {
        this.currentSlotForUpload = slotId;
        this.fileInputRef?.nativeElement?.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const slotId = this.currentSlotForUpload;
            const reader = new FileReader();
            reader.onload = (e) => {
                const current = this.slotsData();
                const next = current.map(s =>
                    s.id === slotId ? { ...s, previewUrl: e.target?.result as string, file } : s
                );
                this.slotsData.set(next);
            };
            reader.readAsDataURL(file);
        }
        input.value = '';
    }

    async setAsDp(slotId: number) {
        const slot = this.slotsData().find(s => s.id === slotId);
        if (!slot || !slot.previewUrl) return;
        if (slot.photoId) {
            this.isSaving.set(true);
            this.saveMessage = '';
            const ok = await this.profileService.setPrimaryPhoto(slot.photoId);
            this.saveMessage = ok ? 'Profile photo updated!' : 'Failed to update.';
            this.isSaving.set(false);
            return;
        }
        this.currentSlotId = slotId;
        this.pendingSetAsDp = true;
        this.isCropperOpen = true;
        setTimeout(() => {
            if (this.cropImageElement?.nativeElement) {
                this.cropImageElement.nativeElement.src = slot.previewUrl!;
                this.initializeCropper();
            }
        }, 50);
    }

    async removePhoto(slotId: number) {
        const slot = this.slotsData().find(s => s.id === slotId);
        if (!slot) return;
        if (slot.photoId) {
            this.isSaving.set(true);
            await this.profileService.deletePhoto(slot.photoId);
            this.isSaving.set(false);
        }
        const current = this.slotsData();
        const next = current.map(s =>
            s.id === slotId ? { ...s, previewUrl: null, file: null, serverUrl: null, photoId: null } : s
        );
        this.slotsData.set(next);
    }

    initializeCropper() {
        if (this.cropper) {
            this.cropper.destroy();
        }
        this.cropper = new Cropper(this.cropImageElement.nativeElement, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            background: false,
        });
    }

    async performCrop() {
        if (!this.cropper || this.currentSlotId === null) return;
        const canvas = this.cropper.getCroppedCanvas({ maxWidth: 800, maxHeight: 800 });
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const slot = this.slotsData().find(s => s.id === this.currentSlotId);
        this.closeCropper();
        if (!slot) return;
        if (this.pendingSetAsDp) {
            this.pendingSetAsDp = false;
            this.isSaving.set(true);
            this.saveMessage = '';
            try {
                const file = await this.dataUrlToFile(croppedDataUrl, `dp_${slot.id}.jpg`);
                const res = await this.profileService.uploadPhoto(file, true);
                if (res?.url) {
                    const fullUrl = res.url.startsWith('http') ? res.url : `${environment.uploadsBaseUrl}${res.url}`;
                    const current = this.slotsData();
                    const next = current.map(s =>
                        s.id === slot.id ? { ...s, previewUrl: fullUrl, serverUrl: fullUrl, file: null, photoId: res._id ?? undefined } : s
                    );
                    this.slotsData.set(next);
                    await this.profileService.fetchMyProfile();
                    this.saveMessage = 'Profile photo updated!';
                } else {
                    this.saveMessage = 'Upload failed.';
                }
            } catch (e) {
                this.saveMessage = (e as Error).message || 'Upload failed.';
            }
            this.isSaving.set(false);
        } else {
            const current = this.slotsData();
            const next = current.map(s =>
                s.id === slot.id ? { ...s, previewUrl: croppedDataUrl, file: null } : s
            );
            this.slotsData.set(next);
        }
    }

    closeCropper() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        this.isCropperOpen = false;
        this.currentSlotId = null;
        this.pendingSetAsDp = false;
    }

    async saveAllPhotos() {
        const current = this.slotsData();
        const toUpload = current.filter(s => s.previewUrl && (s.file || (s.previewUrl?.startsWith('data:'))));
        if (toUpload.length === 0) {
            this.saveMessage = 'No new photos to upload.';
            return;
        }
        this.isSaving.set(true);
        this.saveMessage = '';
        try {
            let next = [...current];
            for (const slot of toUpload) {
                let file: File | null = slot.file;
                if (!file && slot.previewUrl?.startsWith('data:')) {
                    file = await this.dataUrlToFile(slot.previewUrl, `photo_${slot.id}.jpg`);
                }
                if (file) {
                    const res = await this.profileService.uploadPhoto(file);
                    if (res?.url) {
                        const fullUrl = res.url.startsWith('http') ? res.url : `${environment.uploadsBaseUrl}${res.url}`;
                        next = next.map(s =>
                            s.id === slot.id ? { ...s, serverUrl: fullUrl, previewUrl: fullUrl, file: null, photoId: res._id ?? undefined } : s
                        );
                    }
                }
            }
            this.slotsData.set(next);
            await this.profileService.fetchMyProfile();
            this.loadPhotos();
            this.saveMessage = 'Photos saved successfully!';
        } catch (e) {
            this.saveMessage = (e as Error).message || 'Upload failed.';
        } finally {
            this.isSaving.set(false);
        }
    }

    private dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
        return fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => new File([blob], filename, { type: blob.type || 'image/jpeg' }));
    }
}

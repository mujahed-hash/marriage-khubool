import { Injectable, signal } from '@angular/core';
import { Profile } from '../models/profile';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

function resolvePhotoUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `${environment.uploadsBaseUrl}${url}`;
}

const DRAFT_KEY = 'khubool_profile_draft';

export interface ProfileListResponse {
  profiles: Partial<Profile>[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private currentProfile = signal<Partial<Profile>>({});
  private currentStep = signal<number>(1);

  constructor(private api: ApiService) {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      this.currentProfile.set(JSON.parse(draft));
    }
  }

  get profile() {
    return this.currentProfile.asReadonly();
  }

  get step() {
    return this.currentStep.asReadonly();
  }

  setProfile(data: Partial<Profile>): void {
    this.currentProfile.set({ ...data });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }

  updateProfile(data: Partial<Profile>): void {
    const updated = { ...this.currentProfile(), ...data };
    this.currentProfile.set(updated);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  }

  nextStep(): void {
    if (this.currentStep() < 7) this.currentStep.set(this.currentStep() + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.set(this.currentStep() - 1);
  }

  setStep(step: number): void {
    if (step >= 1 && step <= 7) this.currentStep.set(step);
  }

  async fetchMyProfile(): Promise<Partial<Profile> | null> {
    try {
      const data = await this.api.get<Partial<Profile>>('/profiles/me');
      if (data.profilePhotoUrl) {
        data.profilePhotoUrl = resolvePhotoUrl(data.profilePhotoUrl);
      }
      this.currentProfile.set(data);
      return data;
    } catch {
      return null;
    }
  }

  async saveProfile(): Promise<boolean> {
    try {
      const data = this.currentProfile();
      const payload = this.toApiPayload(data);
      const hasExisting = !!(data._id || data.profileId);
      const saved = hasExisting
        ? await this.api.put<Partial<Profile>>('/profiles', payload)
        : await this.api.post<Partial<Profile>>('/profiles', payload);
      if (saved.profilePhotoUrl) {
        saved.profilePhotoUrl = resolvePhotoUrl(saved.profilePhotoUrl);
      }
      this.currentProfile.set(saved);
      localStorage.removeItem(DRAFT_KEY);
      return true;
    } catch {
      return false;
    }
  }

  async getProfileById(id: string): Promise<Partial<Profile> | null> {
    try {
      return await this.api.get<Partial<Profile>>(`/profiles/${id}`);
    } catch {
      return null;
    }
  }

  /**
   * Get the id to use for profile action APIs (shortlist, interest, block, actions).
   * Backend accepts either MongoDB _id or custom profileId string.
   */
  getProfileIdForApi(profile: Partial<Profile> | null, routeId?: string | null): string | null {
    const id = (profile as any)?._id ?? (profile as any)?.profileId ?? routeId ?? null;
    return id != null ? String(id) : null;
  }

  async getProfileActions(profileId: string): Promise<{ shortlisted: boolean; interestSent: boolean; blocked: boolean }> {
    try {
      return await this.api.get<{ shortlisted: boolean; interestSent: boolean; blocked: boolean }>(`/profiles/${profileId}/actions`);
    } catch {
      return { shortlisted: false, interestSent: false, blocked: false };
    }
  }

  async getSampleProfile(): Promise<Partial<Profile>> {
    try {
      return await this.api.get<Partial<Profile>>('/profiles/sample');
    } catch {
      return {};
    }
  }

  async deleteProfile(): Promise<boolean> {
    try {
      await this.api.delete<{ message: string }>('/profiles/me');
      this.currentProfile.set({});
      localStorage.removeItem(DRAFT_KEY);
      return true;
    } catch {
      return false;
    }
  }

  async getProfiles(params?: { tier?: string; search?: string; state?: string; gender?: string; page?: number; limit?: number }): Promise<ProfileListResponse> {
    const q: Record<string, string> = {};
    if (params?.tier) q['tier'] = params.tier;
    if (params?.search) q['search'] = params.search;
    if (params?.state) q['state'] = params.state;
    if (params?.gender) q['gender'] = params.gender;
    if (params?.page) q['page'] = String(params.page);
    if (params?.limit) q['limit'] = String(params.limit);
    return this.api.get<ProfileListResponse>('/profiles/list', Object.keys(q).length ? q : undefined);
  }

  async getPhotos(): Promise<{ url: string; order: number; isPrimary: boolean; _id?: string }[]> {
    try {
      const res = await this.api.get<{ photos: { url: string; order: number; isPrimary: boolean; _id?: string }[] }>('/profiles/me/photos');
      return res.photos || [];
    } catch {
      return [];
    }
  }

  async uploadPhoto(file: File, setAsPrimary = false): Promise<{ url: string; _id?: string } | null> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const url = setAsPrimary ? '/profiles/me/photos?primary=true' : '/profiles/me/photos';
      const res = await this.api.upload<{ url: string; _id?: string }>(url, formData);
      return res;
    } catch {
      return null;
    }
  }

  async setPrimaryPhoto(photoId: string): Promise<boolean> {
    try {
      await this.api.put<{ message: string }>(`/profiles/me/photos/${photoId}/primary`, {});
      await this.fetchMyProfile();
      return true;
    } catch {
      return false;
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      await this.api.delete<{ message: string }>(`/profiles/me/photos/${photoId}`);
      await this.fetchMyProfile();
      return true;
    } catch {
      return false;
    }
  }

  private toApiPayload(p: Partial<Profile>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const keys = [
      'fullName', 'gender', 'dateOfBirth', 'height', 'motherTongue', 'maritalStatus',
      'religion', 'caste', 'gothra', 'manglik', 'country', 'state', 'district', 'city',
      'locality', 'pinCode', 'nativePlace', 'highestEducation', 'degree', 'occupation',
      'company', 'monthlyIncome', 'placeOfOccupation', 'fatherStatus', 'motherStatus',
      'siblings', 'familyType', 'familyValues', 'diet', 'smoking', 'drinking',
      'hobbies', 'bio', 'profilePhotoUrl', 'verificationDocUrl', 'membershipTier',
      'visitDarghaFateha', 'complexion', 'email', 'contactNo', 'alternateNo',
      'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation',
      'partnerPreferences'
    ];
    keys.forEach(k => {
      const v = (p as Record<string, unknown>)[k];
      if (v !== undefined && v !== null && v !== '') out[k] = v;
    });
    return out;
  }
}

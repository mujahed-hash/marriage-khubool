import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({ name: 'photoUrl', standalone: true })
export class PhotoUrlPipe implements PipeTransform {
  transform(url: string | undefined | null): string | undefined | null {
    if (!url || url === 'public') return null; // Guard against 'public' directory name
    if (url.startsWith('http')) return url;
    return `${environment.uploadsBaseUrl}${url}`;
  }
}

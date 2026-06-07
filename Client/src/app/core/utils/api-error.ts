import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (typeof err.error?.error === 'string' && err.error.error.trim()) {
      return err.error.error;
    }

    if (err.status === 0) {
      return 'Could not reach the server. Check your internet connection and try again.';
    }

    if (err.status >= 500) {
      return 'Something went wrong on our side. Try again in a moment.';
    }
  }

  return fallback;
}

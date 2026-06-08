import { HttpErrorResponse } from '@angular/common/http';

const GENERIC_SERVER_ERROR_PREFIX = 'Something went wrong on our side';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const serverMessage =
      typeof err.error?.error === 'string' && err.error.error.trim() ? err.error.error.trim() : '';

    if (err.status === 0) {
      return 'Could not reach the server. Check your internet connection and try again.';
    }

    if (serverMessage && !serverMessage.startsWith(GENERIC_SERVER_ERROR_PREFIX)) {
      return serverMessage;
    }

    if (err.status === 404) {
      return fallback;
    }

    if (err.status >= 500) {
      return fallback;
    }

    if (serverMessage) {
      return serverMessage;
    }
  }

  return fallback;
}

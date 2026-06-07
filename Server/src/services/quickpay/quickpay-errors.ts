export function mapQuickpayPingError(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return (
      'Quickpay did not accept the payment window key. ' +
      'In Quickpay Manager go to Settings → Integration and copy the API key for the "Payment Window" user (not the owner key).'
    );
  }

  if (status === 422 || status === 400) {
    try {
      const parsed = JSON.parse(body) as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      const firstField = parsed.errors ? Object.entries(parsed.errors)[0] : undefined;
      if (firstField) {
        const [field, messages] = firstField;
        return `Quickpay rejected the request (${field}: ${messages.join(', ')}).`;
      }
      if (parsed.message) {
        return `Quickpay rejected the request: ${parsed.message}.`;
      }
    } catch {
      // fall through
    }
  }

  if (status >= 500) {
    return 'Quickpay is temporarily unavailable. Wait a minute and try Save again.';
  }

  if (body.trim()) {
    return `Quickpay could not be reached: ${body.trim()}`;
  }

  return `Quickpay returned an unexpected response (HTTP ${status}). Check your keys in Quickpay Manager → Settings → Integration.`;
}

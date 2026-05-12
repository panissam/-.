import { Registration } from '../types';

const GAS_WEBHOOK_URL = import.meta.env.VITE_GAS_WEBHOOK_URL;

export const sendNotification = async (type: 'new_registration' | 'status_update', data: Partial<Registration>) => {
  if (!GAS_WEBHOOK_URL) {
    console.log('GAS_WEBHOOK_URL is not set. Simulation mode (Log only):', { type, data });
    return;
  }

  try {
    const response = await fetch(GAS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-referrer', // GAS often requires this if not configured for CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        payload: data,
      }),
    });
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Failed to send notification to GAS:', error);
  }
};

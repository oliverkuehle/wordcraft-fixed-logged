/**
 * A lightweight logging helper that posts to your server's /api/log route.
 * Safe to import from anywhere (browser or Node).
 */

export type LogEvent = 
{
  key: 'USER_LOGIN';
  value: { device: string; success: boolean };
}
| {
  key: 'USER_LOGOUT';
  value: { itemId: string; price: number };
};

/**
 * Sends a log event to /api/log.
 * Automatically stringifies JSON and handles basic errors.
 */
export async function logEvent(event: LogEvent): Promise<void> {
  try {
    const response = await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventKey: event.key,
        eventValue: event.value ?? {},
      }),
    });

    if (!response.ok) {
      console.error("❌ Failed to log event:", response.status, await response.text());
    }
  } catch (err) {
    console.error("❌ Error sending log event:", err);
  }
}

import { Capacitor } from "@capacitor/core";
import { Haptics, NotificationType } from "@capacitor/haptics";

export async function playCheckoutHaptic(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics are optional feedback and must never make checkout fail.
  }
}

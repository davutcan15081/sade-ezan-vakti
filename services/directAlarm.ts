import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface DirectAlarmPlugin {
  /**
   * Schedule a direct alarm that will launch the app
   */
  scheduleAlarm(options: {
    prayer: string;
    timestamp: number;
    autoTrigger?: boolean;
    directLaunch?: boolean;
    testMode?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * Cancel a specific alarm
   */
  cancelAlarm(options: {
    prayer: string;
  }): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * Cancel all alarms
   */
  cancelAllAlarms(): Promise<{
    success: boolean;
    message: string;
  }>;
}

class DirectAlarmWeb extends WebPlugin implements DirectAlarmPlugin {
  private testTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  async scheduleAlarm(options: {
    prayer: string;
    timestamp: number;
    autoTrigger?: boolean;
    directLaunch?: boolean;
    testMode?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const delayMs = options.timestamp - Date.now();

    console.log(
      `[DirectAlarm] Web: "${options.prayer}" için alarm kuruldu. ${Math.round(delayMs / 1000)}sn sonra tetiklenecek.`,
      { autoTrigger: options.autoTrigger, testMode: options.testMode }
    );

    // Önceki aynı isimli timer varsa temizle
    if (this.testTimers.has(options.prayer)) {
      clearTimeout(this.testTimers.get(options.prayer));
    }

    if (delayMs <= 0) {
      // Zaten geçmiş — hemen tetikle
      this._triggerAlarmScreen(options.prayer);
    } else {
      const timer = setTimeout(() => {
        this._triggerAlarmScreen(options.prayer);
        this.testTimers.delete(options.prayer);
      }, delayMs);

      this.testTimers.set(options.prayer, timer);
    }

    return {
      success: true,
      message: `Web: "${options.prayer}" alarmı ${Math.round(delayMs / 1000)}sn içinde otomatik açılacak.`,
    };
  }

  /** Alarm ekranını otomatik açar — bildirime tıklama gerekmez */
  private _triggerAlarmScreen(prayer: string) {
    console.log(`[DirectAlarm] ⏰ Alarm tetikleniyor: "${prayer}"`);
    const event = new CustomEvent('showAlarm', { detail: { prayer } });
    window.dispatchEvent(event);
  }

  async cancelAlarm(options: { prayer: string }): Promise<{ success: boolean; message: string }> {
    if (this.testTimers.has(options.prayer)) {
      clearTimeout(this.testTimers.get(options.prayer));
      this.testTimers.delete(options.prayer);
    }
    console.log(`[DirectAlarm] Web: "${options.prayer}" alarmı iptal edildi.`);
    return { success: true, message: `Web: "${options.prayer}" alarmı iptal edildi.` };
  }

  async cancelAllAlarms(): Promise<{ success: boolean; message: string }> {
    this.testTimers.forEach((timer) => clearTimeout(timer));
    this.testTimers.clear();
    console.log('[DirectAlarm] Web: Tüm alarmlar iptal edildi.');
    return { success: true, message: 'Web: Tüm alarmlar iptal edildi.' };
  }
}

// Plugin'i global olarak kaydet
const DirectAlarm = registerPlugin<DirectAlarmPlugin>('DirectAlarm', {
  web: () => Promise.resolve(new DirectAlarmWeb()),
});

export { DirectAlarmWeb };
export default DirectAlarm;

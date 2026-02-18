import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface DirectAlarmPlugin {
  /**
   * Schedule a direct alarm that will launch the app
   */
  scheduleAlarm(options: {
    prayer: string;
    timestamp: number;
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
  async scheduleAlarm(options: { prayer: string; timestamp: number }): Promise<{ success: boolean; message: string; }> {
    console.log('Web platform: Alarm scheduling simulated for', options.prayer, 'at', new Date(options.timestamp));
    return { success: true, message: 'Web platform: Alarm scheduled (simulated)' };
  }

  async cancelAlarm(options: { prayer: string }): Promise<{ success: boolean; message: string; }> {
    console.log('Web platform: Alarm cancellation simulated for', options.prayer);
    return { success: true, message: 'Web platform: Alarm cancelled (simulated)' };
  }

  async cancelAllAlarms(): Promise<{ success: boolean; message: string; }> {
    console.log('Web platform: All alarms cancelled (simulated)');
    return { success: true, message: 'Web platform: All alarms cancelled (simulated)' };
  }
}

// Plugin'i global olarak kaydet
const DirectAlarm = registerPlugin<DirectAlarmPlugin>('DirectAlarm', {
  web: () => Promise.resolve(new DirectAlarmWeb()),
});

export { DirectAlarmWeb };
export default DirectAlarm;

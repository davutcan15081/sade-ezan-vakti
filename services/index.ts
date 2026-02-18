import { registerPlugin } from '@capacitor/core';
import type { DirectAlarmPlugin } from './directAlarm';

const DirectAlarm = registerPlugin<DirectAlarmPlugin>('DirectAlarm', {
  web: () => import('./directAlarm').then(m => new m.DirectAlarmWeb()),
});

export default DirectAlarm;

package com.sadeezanvakti.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

public class AlarmManagerPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        try {
            long time = call.getLong("time");
            String prayer = call.getString("prayer");
            String autoTrigger = call.getString("autoTrigger");
            String directLaunch = call.getString("directLaunch");
            String testMode = call.getString("testMode");

            // AlarmManager al
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);

            // Intent oluştur
            Intent intent = new Intent(getContext(), AlarmReceiver.class);
            intent.putExtra("prayer", prayer);
            intent.putExtra("autoTrigger", autoTrigger);
            intent.putExtra("directLaunch", directLaunch);
            intent.putExtra("testMode", testMode);

            // PendingIntent oluştur
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                getContext(),
                (int) (time / 1000),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Alarmı planla
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Alarm planlandı");
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Alarm planlanamadı: " + e.getMessage(), e);
        }
    }
}

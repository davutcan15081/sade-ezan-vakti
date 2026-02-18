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
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Date;

@CapacitorPlugin(name = "DirectAlarm")
public class DirectAlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        String prayer = call.getString("prayer");
        Long timestamp = call.getLong("timestamp");
        
        if (prayer == null || timestamp == null) {
            call.reject("Missing prayer or timestamp");
            return;
        }

        try {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(getContext(), AlarmReceiver.class);
            intent.putExtra("prayer", prayer);
            intent.putExtra("autoTrigger", "true");  // KRİTİK EKLEME
            intent.putExtra("directLaunch", "true"); // KRİTİK EKLEME
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                getContext(),
                prayer.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timestamp,
                    pendingIntent
                );
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timestamp,
                    pendingIntent
                );
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Alarm scheduled successfully");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to schedule alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        String prayer = call.getString("prayer");
        
        if (prayer == null) {
            call.reject("Missing prayer");
            return;
        }

        try {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(getContext(), AlarmReceiver.class);
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                getContext(),
                prayer.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            alarmManager.cancel(pendingIntent);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Alarm cancelled successfully");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to cancel alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAllAlarms(PluginCall call) {
        try {
            // Tüm namaz vakitleri için alarmları iptal et
            String[] prayers = {"imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"};
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            
            for (String prayer : prayers) {
                Intent intent = new Intent(getContext(), AlarmReceiver.class);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(),
                    prayer.hashCode(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                alarmManager.cancel(pendingIntent);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "All alarms cancelled successfully");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to cancel all alarms: " + e.getMessage());
        }
    }
}

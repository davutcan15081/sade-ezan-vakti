package com.sadeezanvakti.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.view.WindowManager;
import android.app.KeyguardManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String prayer = intent.getStringExtra("prayer");
        String autoTrigger = intent.getStringExtra("autoTrigger");
        String directLaunch = intent.getStringExtra("directLaunch");
        String testMode = intent.getStringExtra("testMode");
        
        if (prayer != null && "true".equals(autoTrigger) && "true".equals(directLaunch)) {
            System.out.println("AlarmReceiver tetiklendi: " + prayer);
            
            // WakeLock al - cihazı zorla uyandır
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | 
                PowerManager.FULL_WAKE_LOCK | 
                PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "EzanVakti:AlarmWakeLock"
            );
            wakeLock.acquire(10*60*1000L); // 10 dakika
            
            // Bildirim kanalını oluştur
            createNotificationChannel(context);
            
            // Tam ekran alarm activity'sini başlat
            Intent alarmIntent = new Intent(context, AlarmActivity.class);
            alarmIntent.putExtra("prayer", prayer);
            alarmIntent.putExtra("autoTrigger", autoTrigger);
            alarmIntent.putExtra("directLaunch", directLaunch);
            alarmIntent.putExtra("testMode", testMode);
            alarmIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK | 
                Intent.FLAG_ACTIVITY_CLEAR_TASK |
                Intent.FLAG_ACTIVITY_NO_USER_ACTION
            );
            
            // Bildirim için PendingIntent oluştur - BU ÇOK ÖNEMLİ
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                context, 
                (int) System.currentTimeMillis(), 
                alarmIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            // Bildirim oluştur - FULL SCREEN INTENT İLE
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "ezan_alarm_direct")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("🕌 EZAN VAKTİ")
                .setContentText(prayer + " vakti geldi!")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setFullScreenIntent(fullScreenPendingIntent, true) // BU SATIR KRİTİK
                .setContentIntent(fullScreenPendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            
            // Bildirimi göster - bu otomatik olarak AlarmActivity'yi açacak
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) 
                == PackageManager.PERMISSION_GRANTED) {
                notificationManager.notify((int) System.currentTimeMillis(), builder.build());
                System.out.println("Full screen bildirim gösterildi - AlarmActivity açılmalı");
            }
            
            // Yedek: 500ms sonra manuel başlat (bildirim çalışmazsa)
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    System.out.println("YEDEK: Manuel AlarmActivity başlatılıyor...");
                    context.startActivity(alarmIntent);
                    System.out.println("YEDEK: AlarmActivity başlatıldı!");
                } catch (Exception e) {
                    System.err.println("YEDEK başlatma hatası: " + e.getMessage());
                    e.printStackTrace();
                }
            }, 500);
            
            // WakeLock'i 10 saniye sonra serbest bırak
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (wakeLock.isHeld()) {
                    wakeLock.release();
                    System.out.println("WakeLock serbest bırakıldı");
                }
            }, 10000);
        }
    }
    
    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "ezan_alarm_direct",
                "Ezan Alarmı",
                NotificationManager.IMPORTANCE_MAX  // MAX ÖNEM SEVİYESİ
            );
            channel.setDescription("Namaz vakti geldiğinde tam ekran açılır");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setBypassDnd(true);
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setSound(null, null); // Ses AlarmActivity'de çalacak
            
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
            
            System.out.println("Bildirim kanalı oluşturuldu: IMPORTANCE_MAX");
        }
    }
}

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
            
            // Ekranı aç ve kilidi kaldır
            KeyguardManager keyguardManager = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                keyguardManager.requestDismissKeyguard(null, null);
            }
            
            // Uygulamayı açmak için Intent oluştur - MAKSİMUM GÜÇ
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.putExtra("prayer", prayer);
            launchIntent.putExtra("autoTrigger", autoTrigger);
            launchIntent.putExtra("directLaunch", directLaunch);
            launchIntent.putExtra("testMode", testMode);
            launchIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK | 
                Intent.FLAG_ACTIVITY_CLEAR_TOP | 
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT |
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                Intent.FLAG_ACTIVITY_NO_HISTORY |
                Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS |
                Intent.FLAG_ACTIVITY_NO_ANIMATION |
                Intent.FLAG_ACTIVITY_TASK_ON_HOME |
                Intent.FLAG_ACTIVITY_RETAIN_IN_RECENTS |
                Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY
            );
            
            // HEMEN BAŞLAT - 0.1 saniye sonra
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    System.out.println("UYGULAMA HEMEN BAŞLATILIYOR...");
                    context.startActivity(launchIntent);
                    System.out.println("UYGULAMA BAŞLATILDI!");
                } catch (Exception e) {
                    System.err.println("Hemen başlatma hatası: " + e.getMessage());
                    e.printStackTrace();
                }
            }, 100);
            
            // 1 saniye sonra TEKRAR DENE
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    System.out.println("UYGULAMA TEKRAR BAŞLATILIYOR...");
                    context.startActivity(launchIntent);
                    System.out.println("UYGULAMA TEKRAR BAŞLATILDI!");
                } catch (Exception e) {
                    System.err.println("Tekrar başlatma hatası: " + e.getMessage());
                    e.printStackTrace();
                }
            }, 1000);
            
            // 3 saniye sonra SON DENE
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    System.out.println("UYGULAMA SON DENEME BAŞLATILIYOR...");
                    context.startActivity(launchIntent);
                    System.out.println("UYGULAMA SON DENEME BAŞLATILDI!");
                } catch (Exception e) {
                    System.err.println("Son deneme başlatma hatası: " + e.getMessage());
                    e.printStackTrace();
                }
            }, 3000);
            
            // Bildirim kanalını oluştur
            createNotificationChannel(context);
            
            // Bildirim için PendingIntent oluştur
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                launchIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            // Bildirim oluştur - en güçlü ayarlar
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "ezan_alarm_direct")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("🔥 SON ÇARE ALARMI")
                .setContentText(prayer.toUpperCase() + " vakti geldi!")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setOngoing(false)
                .setOnlyAlertOnce(false)
                .setUsesChronometer(false)
                .setLocalOnly(false);
            
            // Bildirimi göster
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) 
                == PackageManager.PERMISSION_GRANTED) {
                notificationManager.notify((int) System.currentTimeMillis(), builder.build());
                System.out.println("Bildirim gösterildi");
            }
            
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
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Namaz vakti geldiğinde otomatik açılır");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setBypassDnd(true);
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
}

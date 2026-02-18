package com.sadeezanvakti.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.view.View;
import android.view.Window;
import android.widget.TextView;
import android.widget.Button;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.VibrationEffect;
import android.os.Vibrator;

public class AlarmActivity extends Activity {
    
    private Ringtone ringtone;
    private Vibrator vibrator;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Ekranı kilitle ekranının üzerinde göster
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                           WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                           WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                           WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                           WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON);
        }
        
        // Kilidi kaldır
        KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            keyguardManager.requestDismissKeyguard(this, null);
        }
        
        // Intent'ten verileri al
        Intent intent = getIntent();
        String prayer = intent.getStringExtra("prayer");
        if (prayer == null) prayer = "Namaz";
        
        // Layout oluştur
        setContentView(createAlarmView(prayer));
        
        // Ses ve titreşim başlat
        startAlarmSound();
        startVibration();
        
        // 2 dakika sonra otomatik kapat
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            stopAlarmSound();
            stopVibration();
            finish();
        }, 120000); // 2 dakika
    }
    
    private View createAlarmView(String prayer) {
        // Programatik olarak layout oluştur
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(0xFF1a237e); // Koyu mavi
        layout.setPadding(50, 50, 50, 50);
        
        // Başlık
        TextView titleView = new TextView(this);
        titleView.setText("🕌 EZAN VAKTİ 🕌");
        titleView.setTextSize(32);
        titleView.setTextColor(0xFFFFFFFF);
        titleView.setGravity(android.view.Gravity.CENTER);
        titleView.setPadding(20, 40, 20, 40);
        layout.addView(titleView);
        
        // Namaz adı
        TextView prayerView = new TextView(this);
        prayerView.setText(prayer.toUpperCase() + " VAKTİ");
        prayerView.setTextSize(48);
        prayerView.setTextColor(0xFFFFD700); // Altın sarısı
        prayerView.setGravity(android.view.Gravity.CENTER);
        prayerView.setPadding(20, 60, 20, 60);
        layout.addView(prayerView);
        
        // Mesaj
        TextView messageView = new TextView(this);
        messageView.setText("Namaz vaktiniz geldi!\nAllah kabul etsin.");
        messageView.setTextSize(20);
        messageView.setTextColor(0xFFFFFFFF);
        messageView.setGravity(android.view.Gravity.CENTER);
        messageView.setPadding(20, 40, 20, 60);
        layout.addView(messageView);
        
        // Kapat butonu
        Button dismissButton = new Button(this);
        dismissButton.setText("TAMAM");
        dismissButton.setTextSize(24);
        dismissButton.setPadding(60, 30, 60, 30);
        dismissButton.setOnClickListener(v -> {
            stopAlarmSound();
            stopVibration();
            
            // MainActivity'yi başlat
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.putExtra("prayer", prayer);
            mainIntent.putExtra("autoTrigger", "true");
            mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                              Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(mainIntent);
            
            finish();
        });
        layout.addView(dismissButton);
        
        return layout;
    }
    
    private void startAlarmSound() {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(this, alarmUri);
            ringtone.play();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void stopAlarmSound() {
        if (ringtone != null && ringtone.isPlaying()) {
            ringtone.stop();
        }
    }
    
    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = {0, 1000, 500, 1000, 500, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
    }
    
    private void stopVibration() {
        if (vibrator != null) {
            vibrator.cancel();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlarmSound();
        stopVibration();
    }
    
    @Override
    public void onBackPressed() {
        // Geri tuşunu engelle
    }
}

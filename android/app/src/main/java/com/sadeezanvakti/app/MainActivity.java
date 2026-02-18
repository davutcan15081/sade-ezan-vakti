package com.sadeezanvakti.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.app.AlarmManager;
import android.content.Context;
import android.os.Build;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        System.out.println("MainActivity onCreate çağrıldı");
        
        // Alarm intent'ini kontrol et
        handleAlarmIntent(getIntent());
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        System.out.println("MainActivity onNewIntent çağrıldı");
        handleAlarmIntent(intent);
    }
    
    private void handleAlarmIntent(Intent intent) {
        if (intent != null) {
            String prayer = intent.getStringExtra("prayer");
            String autoTrigger = intent.getStringExtra("autoTrigger");
            String directLaunch = intent.getStringExtra("directLaunch");
            
            System.out.println("Intent verileri: prayer=" + prayer + ", autoTrigger=" + autoTrigger + ", directLaunch=" + directLaunch);
            
            if (prayer != null && "true".equals(autoTrigger) && "true".equals(directLaunch)) {
                System.out.println("Alarm intent'i algılandı, alarm ekranı gösterilecek");
                
                // WebView yüklendikten sonra alarm ekranını göster
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (bridge != null && bridge.getWebView() != null) {
                        String js = String.format(
                            "console.log('Alarm JavaScript çalıştırılıyor: %s');" +
                            "if (window.showAlarmEvent) {" +
                            "  console.log('showAlarmEvent mevcut, çağrılıyor');" +
                            "  window.showAlarmEvent('%s');" +
                            "} else {" +
                            "  console.log('showAlarmEvent oluşturuluyor');" +
                            "  window.showAlarmEvent = function(prayer) {" +
                            "    console.log('showAlarmEvent çağrıldı: ' + prayer);" +
                            "    const event = new CustomEvent('showAlarm', { detail: { prayer: prayer } });" +
                            "    window.dispatchEvent(event);" +
                            "  };" +
                            "  window.showAlarmEvent('%s');" +
                            "}", prayer, prayer, prayer
                        );
                        
                        System.out.println("JavaScript çalıştırılıyor: " + js);
                        bridge.getWebView().evaluateJavascript(js, null);
                        
                        // Ekstra kontrol - 2 saniye sonra tekrar dene
                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                            String retryJs = String.format(
                                "console.log('Alarm tekrar deneniyor: %s');" +
                                "if (window.showAlarmEvent) {" +
                                "  window.showAlarmEvent('%s');" +
                                "} else {" +
                                "  console.log('showAlarmEvent hala mevcut değil');" +
                                "}", prayer, prayer
                            );
                            bridge.getWebView().evaluateJavascript(retryJs, null);
                        },2000);
                    } else {
                        System.err.println("Bridge veya WebView null!");
                    }
                }, 5000); // 5 saniye bekle WebView'in kesin yüklenmesi için
            }
        }
    }
    
    // Doğrudan AlarmManager metodu
    public void setDirectAlarm(PluginCall call) {
        try {
            System.out.println("setDirectAlarm çağrıldı!");
            
            JSObject data = call.getData();
            long time = data.getLong("time");
            String prayer = data.getString("prayer");
            
            System.out.println("Doğrudan alarm verileri: time=" + time + ", prayer=" + prayer);
            
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            
            Intent intent = new Intent(this, AlarmReceiver.class);
            intent.putExtra("prayer", prayer);
            intent.putExtra("autoTrigger", "true");
            intent.putExtra("directLaunch", "true");
            intent.putExtra("testMode", "true");
            
            android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                this,
                (int) (time / 1000),
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            );
            
            // En güçlü alarm tipi
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            }
            
            System.out.println("Doğrudan AlarmManager ile alarm planlandı: " + new java.util.Date(time));
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Doğrudan alarm planlandı");
            call.resolve(result);
            
        } catch (Exception e) {
            System.err.println("setDirectAlarm hatası: " + e.getMessage());
            e.printStackTrace();
            call.reject("Doğrudan alarm planlanamadı: " + e.getMessage(), e);
        }
    }
    
    // En basit alarm metodu
    public void setSimpleAlarm(PluginCall call) {
        try {
            System.out.println("setSimpleAlarm çağrıldı!");
            
            JSObject data = call.getData();
            long time = data.getLong("time");
            String prayer = data.getString("prayer");
            
            System.out.println("Alarm verileri: time=" + time + ", prayer=" + prayer);
            
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            
            Intent intent = new Intent(this, AlarmReceiver.class);
            intent.putExtra("prayer", prayer);
            intent.putExtra("autoTrigger", "true");
            intent.putExtra("directLaunch", "true");
            intent.putExtra("testMode", "true");
            
            android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                this,
                (int) (time / 1000),
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            );
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, time, pendingIntent);
            }
            
            System.out.println("Basit alarm planlandı: " + new java.util.Date(time));
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Basit alarm planlandı");
            call.resolve(result);
            
        } catch (Exception e) {
            System.err.println("setSimpleAlarm hatası: " + e.getMessage());
            e.printStackTrace();
            call.reject("Basit alarm planlanamadı: " + e.getMessage(), e);
        }
    }
}

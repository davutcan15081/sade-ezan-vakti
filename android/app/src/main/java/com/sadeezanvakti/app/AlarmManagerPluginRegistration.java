package com.sadeezanvakti.app;

import com.getcapacitor.BridgeActivity;

public class AlarmManagerPluginRegistration {
    public static void register(BridgeActivity activity) {
        activity.registerPlugin(AlarmManagerPlugin.class);
    }
}

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.lifemanager.app",
    appName: "Life Manager",
    webDir: "dist",
    plugins: {
        StatusBar: {
            overlaysWebView: false,
            backgroundColor: "#f7f9f7",
        },
    },
};

export default config;

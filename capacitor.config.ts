import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shopos.appliance',
  appName: 'ShopOS',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#F4F6F9'
  }
};

export default config;

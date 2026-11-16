# ShopOS Android APK build guide

This project wraps the existing ShopOS React/Vite prototype in a native Android shell using Capacitor.

## Requirements
- Windows, macOS or Linux computer
- Node.js 20+
- Android Studio (current stable release)
- Android SDK installed through Android Studio
- JDK 17 (Android Studio's bundled JBR is usually suitable)

An Android phone alone is not enough to compile the APK. You need a computer with Android Studio.

## 1. Extract and open the project
Extract the ZIP. Open a terminal in the project folder.

## 2. Install JavaScript dependencies
```bash
npm install
```

## 3. Build the web application
```bash
npm run build
```

## 4. Generate the native Android project
```bash
npx cap add android
```
If the `android` folder already exists, skip this command.

## 5. Copy the latest web build into Android
```bash
npx cap sync android
```

## 6. Open Android Studio
```bash
npx cap open android
```
Wait for Gradle sync to finish. Connect an Android phone with USB debugging enabled, or use an emulator, then press Run to test.

## 7. Generate an APK
In Android Studio:
1. Select **Build**.
2. Select **Build Bundle(s) / APK(s)**.
3. Select **Build APK(s)**.
4. When the build completes, use the notification's **locate** link.

The usual debug APK location is:
`android/app/build/outputs/apk/debug/app-debug.apk`

For a distributable signed APK, use **Build > Generate Signed Bundle / APK** and create a private signing key. Keep that key and its password secure. Do not share them in chat.

## Updating the app after editing the React code
```bash
npm run android:sync
npx cap open android
```
Then build a new APK.

## App identity
- Display name: ShopOS
- Android application ID: `com.shopos.appliance`
- Primary visual theme: professional navy and white

## Current limitations — read before using in a shop
This APK is only a native wrapper around the prototype. It does not yet provide:
- Supabase cloud sync or multi-user accounts
- Production-grade offline queue or conflict resolution
- Bill of Supply PDF generation approved for the composition scheme
- Bluetooth thermal printer integration
- WhatsApp document sharing workflow
- Supplier purchase/receipt, returns, repairs, serial-unit workflows
- Automated cloud backups or tested restore

The prototype's local browser storage is not a production database. Do not use it as the shop's only stock or billing record.

## Important GST configuration
The business selected the GST Composition Scheme. The production billing workflow must issue a Bill of Supply with the required composition declaration, not a regular GST tax invoice. Have the shop's CA verify eligibility, wording and document format before live use.

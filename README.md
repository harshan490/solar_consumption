# Solar Units v2 (Dark Mode Telemetry Edition) — React + Capacitor Android APK Project

This package contains the complete source code and automated cloud APK builder for **Solar Units** (Dark Mode Telemetry UI with `Space Grotesk`, `Plus Jakarta Sans`, and `JetBrains Mono` typography).

## Core Formula
$$E_{\text{house}} = E_{\text{solar}} + E_{\text{import}} - E_{\text{export}}$$

## Option 1: Zero-Setup Cloud APK Build (GitHub Actions — Recommended)
You do **not** need Android Studio or the Android SDK installed on your laptop:
1. Create a new GitHub repository and upload/push all files from this `.zip` (including the `.github/workflows/build-apk.yml` file).
2. Open the **Actions** tab in your GitHub repository.
3. Click the running **Build Android APK (React + Capacitor)** workflow.
4. In ~3 minutes, download **`solar-units-dark-apk`** from the **Artifacts** section at the bottom of the workflow summary page and install `app-debug.apk` on your Android phone.

## Option 2: Local APK Build (Ubuntu / WSL / Windows)
If you want to build locally on your machine:
```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```
Your compiled `.apk` will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

ionic cordova build android --prod --release

&'..\Android\Android Studio\jre\jre\bin\keytool.exe' -genkey -v -keystore my-release-key.keystore -alias ServiceONE -keyalg RSA -keysize 2048 -validity 20000

&'..\Android\Android Studio\jre\bin\jarsigner.exe' -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore C:\DEV\SERVICEONE\platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk ServiceONE

del -f C:\DEV\SERVICEONE\platforms\android\app\build\outputs\apk\release\ServiceONE.apk

&'..\Android\android-sdk\build-tools\28.0.3\zipalign.exe' -v 4 C:\DEV\SERVICEONE\platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk C:\DEV\SERVICEONE\platforms\android\app\build\outputs\apk\release\ServiceONE.apk

move C:\DEV\SERVICEONE\platforms\android\app\build\outputs\apk\release\ServiceONE.apk C:\Temp\
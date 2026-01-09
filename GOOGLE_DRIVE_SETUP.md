# ڕێنمایی پێکەوەکردنی Google Drive

## چۆنیەتی دروستکردنی Google Cloud Project

### هەنگاوی یەکەم: دروستکردنی Project لە Google Cloud Console

1. بڕۆ بۆ [Google Cloud Console](https://console.cloud.google.com/)
2. دوگمەی "Create Project" یان "New Project" کلیک بکە
3. ناوێک بۆ پڕۆژەکەت بنووسە (بۆ نموونە: "Debt Management App")
4. دوگمەی "Create" کلیک بکە

### هەنگاوی دووەم: چالاککردنی Google Drive API

1. لە مێنووی لای چەپ، بڕۆ بۆ "APIs & Services" > "Library"
2. بگەڕێ بۆ "Google Drive API"
3. دوگمەی "Enable" کلیک بکە

### هەنگاوی سێیەم: دروستکردنی OAuth 2.0 Credentials

#### بۆ Web (React Native Web):

1. بڕۆ بۆ "APIs & Services" > "Credentials"
2. دوگمەی "Create Credentials" > "OAuth client ID" کلیک بکە
3. "Application type" وەک "Web application" هەڵبژێرە
4. ناوێک بنووسە (بۆ نموونە: "Debt Manager Web")
5. لە "Authorized JavaScript origins" زیاد بکە:
   - `http://localhost:8081` (بۆ development)
   - `https://yourdomain.com` (بۆ production)
6. لە "Authorized redirect URIs" زیاد بکە:
   - `http://localhost:8081` (بۆ development)
   - `https://yourdomain.com` (بۆ production)
   - `myapp://` (بۆ deep linking)
7. دوگمەی "Create" کلیک بکە
8. **Client ID**ـەکە کۆپی بکە

#### بۆ iOS:

1. دوگمەی "Create Credentials" > "OAuth client ID" کلیک بکە
2. "Application type" وەک "iOS" هەڵبژێرە
3. ناوێک بنووسە (بۆ نموونە: "Debt Manager iOS")
4. **Bundle ID**ـی ئەپەکەت داخڵ بکە
5. دوگمەی "Create" کلیک بکە
6. **Client ID**ـەکە کۆپی بکە

#### بۆ Android:

1. دوگمەی "Create Credentials" > "OAuth client ID" کلیک بکە
2. "Application type" وەک "Android" هەڵبژێرە
3. ناوێک بنووسە (بۆ نموونە: "Debt Manager Android")
4. **Package name**ـی ئەپەکەت داخڵ بکە (بۆ نموونە: `com.yourcompany.debtmanager`)
5. بۆ دۆزینەوەی SHA-1 certificate fingerprint:
   ```bash
   # بۆ Debug keystore:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # بۆ Release keystore:
   keytool -list -v -keystore path/to/your/release.keystore -alias youralias
   ```
6. SHA-1 fingerprint داخڵ بکە
7. دوگمەی "Create" کلیک بکە
8. **Client ID**ـەکە کۆپی بکە

### هەنگاوی چوارەم: نوێکردنەوەی کۆدەکە

لە فایلی `utils/cloudStorage.ts`، نزیکەی لاینی 405-409، Client ID-کانت دابنێ:

```typescript
const clientId = Platform.select({
  ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',      // Client ID ـی iOS
  android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Client ID ـی Android
  default: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',  // Client ID ـی Web
});
```

### هەنگاوی پێنجەم: گۆڕینی Redirect URI Scheme

لە فایلی `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    ...
  }
}
```

ئەگەر بتەوێت scheme-ـەکە بگۆڕیت، دڵنیابە لەوەی لە کۆدەکە (لاینی 400 لە `utils/cloudStorage.ts`) و لە Google Cloud Console نوێی بکەیتەوە.

### هەنگاوی شەشەم: تاقیکردنەوە

1. ئەپەکە بکەرەوە
2. بڕۆ بۆ Settings > هەڵگرتنی هەوری
3. Google Drive هەڵبژێرە
4. دوگمەی "پەیوەست بکە بە Google Account" کلیک بکە
5. دەبێت صفحەی Login ـی Google بکرێتەوە
6. هەژمارەکەت هەڵبژێرە و ڕێگەپێدان بدە
7. دوای سەرکەوتنی پەیوەستبوون، دەتوانیت زانیاریەکانت بارکەیت و بیگەڕێنیتەوە

---

## چارەسەرکردنی کێشەکان (Troubleshooting)

### کێشە: "Error 400: redirect_uri_mismatch"

**چارەسەر:**
- دڵنیابە لەوەی redirect URI لە Google Cloud Console یەکسانە لەگەڵ ئەوەی لە کۆدەکە بەکاردێت
- لە React Native Web، redirect URI دەبێت `http://localhost:8081` یان URL-ـی پڕۆژەکەت بێت
- بۆ mobile، دەبێت `myapp://` یان scheme-ـەکەت + `://` بێت

### کێشە: "Error 401: invalid_client"

**چارەسەر:**
- Client ID-ـەکەت بە دروستی کۆپی کردبێت لە Google Cloud Console
- دڵنیابە لەوەی OAuth screen دروستکراوە و Status-ـەکەی "Published" بێت

### کێشە: "The user canceled the flow"

**چارەسەر:**
- ئەمە ئاساییە، بەکارهێنەر process-ـەکەی پاشگەزکردەوە
- هیچ کێشەیەک نییە، تەنها دووبارە هەوڵ بدەرەوە

### کێشە: پەیوەست دەبم بەڵام ناتوانم فایل بارکەم

**چارەسەر:**
- دڵنیابە لەوەی Google Drive API چالاککراوە
- سەیری Console.log بکە بۆ بینینی هەڵەکان
- دڵنیابە لەوەی access token بە دروستی پاشەکەوتکراوە

---

## تێبینی گرنگ

⚠️ **بۆ بەکارهێنانی Production:**

1. OAuth consent screen-ـەکەت publish بکە
2. Domain-ـی ئەپەکەت زیاد بکە بۆ authorized domains
3. Privacy Policy و Terms of Service زیاد بکە
4. ئەگەر دەتەوێت زیاتر لە 100 بەکارهێنەر هەبێت، پێویستە Verification Request بنێریت بۆ Google

---

## تێبینی ئاسایشی

🔒 **باشترین ڕێگاکان:**

1. Client ID-ـەکانت لە فایلی `.env` پاشەکەوت بکە، نەک ڕاستەوخۆ لە کۆدەکە
2. هەرگیز Client Secret لە client-side code دانەنێ
3. Token-ـەکان بە ئاسایشی پاشەکەوت بکە (ExpoSecureStore بەکاردێت بۆ mobile)
4. Scope-ـەکان بە کەمترین ڕێگاپێدان بهێڵەرەوە (تەنها `drive.file` بەکاربێنە نەک `drive`)

# VocabMaster Pro - Supabase Kurulum Rehberi

## 1. Supabase Projesini Kontrol Edin

Supabase Dashboard'a gidin: https://supabase.com/dashboard

Projenizi açın: `qcirfsxvdotvylvsphpj`

## 2. Veritabanı Tablolarını Oluşturun (ZORUNLU)

Bu adım olmadan uygulama çalışmaz!

1. Supabase Dashboard > **SQL Editor** sekmesine gidin
2. **New query** butonuna tıklayın
3. `database/schema.sql` dosyasının **tüm içeriğini** kopyalayıp yapıştırın
4. **Run** butonuna tıklayın
5. Hata yoksa tablolar oluşturulmuştur

### Kontrol:
- Sol menüden **Table Editor** sekmesine gidin
- Şu tabloları görmelisiniz:
  - `users`, `levels`, `words`, `user_level_progress`, `user_word_progress`
  - `translation_sentences`, `test_results`, `daily_stats`, `user_badges`
  - `game_rooms`, `game_participants`, `game_history`
  - `forum_topics`, `forum_posts`, `forum_comments`, `system_messages`

## 3. Google OAuth Ayarları (Gmail ile Giriş)

Gmail ile giriş yapabilmek için:

### Google Cloud Console:
1. https://console.cloud.google.com adresine gidin
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. **APIs & Services > Credentials** sekmesine gidin
4. **Create Credentials > OAuth 2.0 Client ID** seçin
5. Application type: **Web application**
6. Authorized redirect URIs'ye ekleyin:
   ```
   https://qcirfsxvdotvylvsphpj.supabase.co/auth/v1/callback
   ```
7. **Client ID** ve **Client Secret** değerlerini kopyalayın

### Supabase Dashboard:
1. **Authentication > Providers** sekmesine gidin
2. **Google** provider'ı bulun ve etkinleştirin
3. Google Cloud'dan aldığınız **Client ID** ve **Client Secret** değerlerini girin
4. **Save** butonuna tıklayın

## 4. Authentication Ayarları

1. **Authentication > URL Configuration** sekmesine gidin
2. **Site URL** alanına uygulamanızın URL'sini girin:
   - Yerel geliştirme: `http://localhost:3000` veya `http://127.0.0.1:5500`
   - Vercel: `https://your-app.vercel.app`
3. **Redirect URLs** alanına da aynı URL'yi ekleyin

## 5. API Anahtarını Kontrol Edin

1. **Settings > API** sekmesine gidin
2. **Project URL** değerinin `js/config.js` dosyasındaki `SUPABASE_URL` ile aynı olduğunu doğrulayın
3. **anon / public** key değerinin `js/config.js` dosyasındaki `SUPABASE_ANON_KEY` ile aynı olduğunu doğrulayın

Eğer farklıysa `js/config.js` dosyasını güncelleyin:
```javascript
SUPABASE_URL: 'https://qcirfsxvdotvylvsphpj.supabase.co',
SUPABASE_ANON_KEY: 'BURAYA_GERCEK_ANON_KEY_DEGERI',
```

## 6. Email Doğrulama Ayarları

1. **Authentication > Settings** sekmesine gidin
2. Test aşamasında email doğrulamayı kapatmak için:
   - **Enable email confirmations** seçeneğini kapatabilirsiniz
3. Canlı ortamda açık bırakın

## 7. Storage (Opsiyonel)

Kelime görselleri yüklemek için:
1. **Storage** sekmesine gidin
2. **New bucket** oluşturun: `word-images`
3. Bucket'ı **Public** yapın

## Sorun Giderme

### "Sisteme giriş yapamıyorum"
- API anahtarlarını kontrol edin (Adım 5)
- Email doğrulamayı kontrol edin (Adım 6)
- Tarayıcı konsolundaki hataları kontrol edin (F12 > Console)

### "Supabase'de hiçbir şey göremiyorum"
- SQL schema'yı çalıştırdığınızdan emin olun (Adım 2)
- Table Editor'de tabloları kontrol edin

### "Google ile giriş çalışmıyor"
- Google OAuth ayarlarını kontrol edin (Adım 3)
- Redirect URI'nin doğru olduğundan emin olun

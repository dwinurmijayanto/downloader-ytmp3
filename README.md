# YouTube MP3 Downloader API - Vercel Deployment

API untuk mendownload audio dari YouTube dalam format MP3 dengan fitur pencarian.

## 📁 Struktur Folder

```
project-root/
├── api/
│   └── ytmp3.js          # Main API handler
├── package.json          # Dependencies
├── vercel.json          # Vercel configuration
└── README.md            # Documentation
```

## 🚀 Cara Deploy ke Vercel

### Metode 1: Deploy via CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login ke Vercel**
```bash
vercel login
```

3. **Deploy Project**
```bash
# Navigate ke folder project
cd your-project-folder

# Install dependencies
npm install

# Deploy
vercel --prod
```

### Metode 2: Deploy via GitHub

1. Push code ke GitHub repository
2. Buka [vercel.com](https://vercel.com)
3. Login dengan GitHub
4. Import repository
5. Deploy otomatis akan berjalan

### Metode 3: Deploy via Drag & Drop

1. Buka [vercel.com/new](https://vercel.com/new)
2. Drag & drop folder project
3. Deploy otomatis akan berjalan

## 📡 Cara Menggunakan API

Setelah deploy, API akan tersedia di URL berikut:
```
https://your-project.vercel.app/api/ytmp3
```

### Endpoint

**GET/POST** `/api/ytmp3`

### Parameters

- `q` atau `query` atau `url` - Input URL YouTube atau kata kunci pencarian

### Contoh Penggunaan

#### 1. Download dengan URL YouTube
```bash
# GET Request
https://your-project.vercel.app/api/ytmp3?url=https://youtube.com/watch?v=dQw4w9WgXcQ

# POST Request
curl -X POST https://your-project.vercel.app/api/ytmp3 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

#### 2. Search dan Download
```bash
# GET Request
https://your-project.vercel.app/api/ytmp3?q=despacito

# POST Request
curl -X POST https://your-project.vercel.app/api/ytmp3 \
  -H "Content-Type: application/json" \
  -d '{"q": "never gonna give you up"}'
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "searchMode": false,
  "data": {
    "title": "Video Title",
    "duration": "3:45",
    "size": "5.2 MB",
    "videoId": "dQw4w9WgXcQ",
    "downloadUrl": "https://download-url.com/audio.mp3",
    "shortUrl": "http://zeink.cc/abc123",
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

**Error Response:**
```json
{
  "error": "Video not found",
  "message": "No video found for: \"keyword\"",
  "searchMode": true
}
```

## 🔧 Environment Variables (Opsional)

Jika ingin menggunakan API key sendiri, tambahkan di Vercel Dashboard:

```
RAPIDAPI_KEY=your_rapidapi_key_here
```

## 📝 Features

- ✅ Download audio dari YouTube URL
- ✅ Pencarian video dengan kata kunci
- ✅ Support berbagai format URL YouTube
- ✅ Automatic URL shortening
- ✅ CORS enabled
- ✅ Error handling
- ✅ RESTful API

## 🌐 Supported YouTube URLs

- `youtube.com/watch?v=`
- `youtube.com/shorts/`
- `youtu.be/`
- `youtube.com/live/`
- `m.youtube.com/`

## ⚙️ Configuration

### vercel.json
```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### package.json
```json
{
  "type": "module",
  "dependencies": {
    "node-fetch": "^3.3.2"
  }
}
```

## 🐛 Troubleshooting

### Error: Module not found
```bash
# Pastikan dependencies terinstall
npm install
```

### Error: Node version warning
Jika masih muncul warning tentang Node.js version:
1. Pastikan file `.nvmrc` ada dengan value `20`
2. Pastikan `package.json` memiliki `"node": "20"`
3. Clear Vercel cache: Settings → General → Clear Cache
4. Redeploy

### Error: Timeout
- Tingkatkan `maxDuration` di `vercel.json`
- Default Vercel free tier: 10 detik
- Pro tier: hingga 60 detik

### Error: Memory limit
- Vercel sekarang menggunakan Active CPU billing
- Memory auto-scaling, tidak perlu set manual

### Error: Build cache
Jika build menggunakan cache lama:
```bash
# Force clean deploy
vercel --prod --force
```

## 📊 Rate Limits

- Vercel Free: 100 GB bandwidth/month
- Function executions: 100,000/month (Free)
- API rate limit: Tergantung RapidAPI plan

## 🔒 Security

- CORS enabled untuk public access
- Tidak menyimpan data pengguna
- API key tersimpan di environment variables
- Input validation untuk URL

## 📄 License

MIT License

## 🤝 Contributing

Pull requests welcome!

## 📞 Support

Jika ada masalah, buat issue di GitHub atau hubungi developer.

---

**Deployment Status:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

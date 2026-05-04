# SIPS Mobile Web

Aplikasi web berbasis Next.js untuk manajemen dan pelacakan absensi, panen, pengangkutan, dan data operasional dengan dashboard analitik dan monitoring status real-time untuk PT. SKJ (Sukses Karya Jaya).

## Gambaran Proyek

SIPS Mobile Web adalah sistem manajemen absensi dan operasional komprehensif yang dibangun dengan teknologi web modern. Aplikasi ini menyediakan:

- **Manajemen Absensi**: Pelacakan absensi harian dengan berbagai kategori status (KJ, WH, WS, MK, ML, P1, KB, OT)
- **Pelacakan Panen**: Monitoring dan manajemen catatan panen dengan filter status
- **Manajemen Pengangkutan**: Pelacakan operasi pengangkutan dan metrik
- **Dashboard Analitik**: Dashboard real-time dengan chart, tren, dan analitik detail
- **Autentikasi Pengguna**: Login aman dengan kontrol akses berbasis peran (ADM, MGR, KSI, AST, dll.)
- **Tema Gelap/Terang**: Dukungan pengalihan tema untuk pengalaman pengguna yang lebih baik
- **Approval & LHM Report**: Sistem approval untuk panen dan laporan LHM
- **Upload & Upload Quality**: Fitur upload untuk absensi dan kualitas panen

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 14+ (App Router)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com)
- **UI Components**: React hooks, komponen kustom
- **Integrasi API**: Server-side proxies dengan autentikasi berbasis cookie
- **Penanganan Gambar**: Komponen Next.js Image dengan dukungan proxy
- **State Management**: TanStack Query untuk caching dan state
- **Testing**: Vitest untuk unit testing
- **Linting**: ESLint untuk kualitas kode

## Struktur Proyek

```
app/
├── (views)/              # Route grup menggunakan layout groups
│   ├── apk-upload/       # Halaman upload APK
│   ├── approval/         # Halaman approval panen
│   │   └── lhm-report/   # Laporan LHM
│   ├── attendance/       # Pelacakan absensi
│   │   ├── approval/     # Approval absensi
│   │   └── upload/       # Upload absensi
│   ├── change-password/  # Ganti password
│   ├── dashboard/        # Dashboard analitik
│   ├── harvest/          # Manajemen panen
│   │   └── upload/       # Upload panen
│   ├── harvesting-quality/ # Kualitas panen
│   │   └── upload/       # Upload kualitas panen
│   └── pengangkutan/     # Manajemen pengangkutan
├── api/                  # API route handlers (server proxies)
│   ├── apk-upload/       # Upload APK
│   ├── approval/         # Approval
│   │   └── lhm/          # LHM approval
│   ├── attendance/       # Absensi
│   ├── auth/             # Autentikasi
│   ├── business-units/   # Unit bisnis
│   ├── change-password/  # Ganti password
│   ├── harvest/          # Panen
│   ├── harvesting-quality/ # Kualitas panen
│   ├── image-proxy/      # Proxy gambar
│   ├── karyawans/        # Data karyawan
│   ├── lhm/              # LHM
│   ├── pengangkutans/    # Pengangkutan
│   ├── tph/              # TPH
│   └── user/             # Profil pengguna
├── components/           # Komponen React reusable
│   ├── auth-expiry-checker.tsx # Pengecekan expiry auth
│   ├── dashboard-chart.tsx     # Komponen chart
│   ├── drawer.tsx              # Drawer navigasi
│   ├── footer.tsx              # Footer
│   ├── language-switcher.tsx   # Pengalih bahasa
│   ├── navbar.tsx              # Navbar atas
│   ├── providers.tsx           # Providers
│   ├── skeletons.tsx           # Skeleton loading
│   ├── theme-provider.tsx      # Provider tema
│   ├── theme.tsx               # Komponen tema
│   └── ...
├── hooks/                # Custom React hooks
│   ├── usePermissions.ts # Hook permissions
│   ├── useTheme.ts       # Manajemen tema
│   └── useThemeEffect.ts # Effect tema
├── lib/                  # Library utilities
│   └── validations/      # Validasi schemas
├── messages/             # Internationalization
│   ├── en.json           # Bahasa Inggris
│   └── id.json           # Bahasa Indonesia
├── utils/                # Fungsi utility
│   ├── absensiProxy.ts   # Proxy absensi
│   ├── attendanceUploadService.ts # Service upload absensi
│   ├── authHelper.ts     # Helper autentikasi
│   ├── businessUnitService.ts    # Service unit bisnis
│   ├── cookieStore.ts    # Penyimpanan cookie
│   ├── datetime.test.ts  # Test datetime
│   ├── datetime.ts       # Helper datetime
│   ├── harvestingQualityService.ts # Service kualitas panen
│   ├── harvestingUploadService.ts  # Service upload panen
│   ├── imageHelper.ts    # Helper gambar
│   ├── mapHelper.ts      # Helper peta
│   ├── tableHelper.ts    # Helper tabel
│   ├── textManipulation.test.ts # Test manipulasi teks
│   └── textManipulation.ts       # Manipulasi teks
└── layout.tsx, page.tsx, globals.css, not-found.tsx, error.tsx
```

## Getting Started

### Prerequisites

- Node.js 16+ or compatible runtime
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application will hot-reload as you make changes to files.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Linting & Code Quality

```bash
# Run ESLint to check code quality
npm run lint
```

## Fitur Utama

### 1. Manajemen Absensi

- Filter catatan absensi berdasarkan rentang tanggal, departemen, dan status
- Lihat tren dan statistik absensi
- Tandai absensi dengan berbagai jenis status (KJ, WH, WS, MK, ML, P1, KB, OT)
- Update status real-time
- Upload absensi dengan file pendukung
- Approval absensi

### 2. Pelacakan Panen

- Catat rekaman panen dengan gambar dan detail
- Filter berdasarkan tanggal, FCBA, dan status panen
- Lacak output panen dan metrik
- Lihat timeline dan riwayat panen
- Exception case dan lampiran BA EXCA
- Approval panen dan laporan LHM

### 3. Manajemen Pengangkutan

- Monitor operasi pengangkutan
- Lacak catatan pengangkutan dengan bukti gambar
- Filter berdasarkan tanggal dan nomor pengangkutan
- Lihat JJG (total output) dan metrik

### 4. Kualitas Panen

- Upload dan tracking kualitas panen
- Monitoring parameter kualitas

### 5. Dashboard Analitik

- **Ringkasan Absensi**: Ringkasan harian, bulanan, dan tahunan
- **Breakdown Status**: Chart pie visual menunjukkan distribusi status
- **Analisis Tren**: Chart garis menunjukkan tren seiring waktu
- **Stat Panen & Transport**: Metrik dan KPI real-time
- **Chart Responsif**: Chart interaktif dengan komponen DaisyUI
- **Filter Berbasis Waktu**: Filter data berdasarkan rentang tanggal kustom atau periode yang telah ditentukan

### 6. Autentikasi & Keamanan

- Fungsi Login/Logout dengan sesi berbasis cookie
- Akses berbasis peran (ADM, MGR, KSI, AST, dll.)
- Kapabilitas force logout
- Fungsi ganti password

### 7. Dukungan Tema

- Toggle tema Gelap/Terang
- Preferensi tema persisten
- Integrasi tema DaisyUI

### 8. Internasionalisasi

- Dukungan bahasa Indonesia dan Inggris
- Pengalih bahasa di UI

## Endpoint API

Aplikasi menggunakan server-side proxies untuk berkomunikasi dengan backend:

### Autentikasi

- `POST /api/auth/login` - Login pengguna
- `GET /api/auth/logout` - Logout pengguna
- `POST /api/auth/force-logout` - Force logout pengguna
- `POST /api/auth/token` - Refresh token
- `POST /api/change-password` - Ganti password

### Operasi Data

- `GET /api/attendance` - Ambil catatan absensi
- `POST /api/attendance/submit` - Submit absensi
- `GET /api/attendance/[id]` - Detail absensi
- `POST /api/attendance/[id]/status` - Update status absensi
- `POST /api/attendance/upload` - Upload absensi
- `GET /api/harvest` - Ambil catatan panen
- `POST /api/harvest/submit` - Submit panen
- `GET /api/harvest/[id]` - Detail panen
- `POST /api/harvest/upload` - Upload panen
- `GET /api/pengangkutans` - Ambil catatan pengangkutan
- `GET /api/karyawans` - Ambil daftar karyawan
- `GET /api/business-units` - Ambil unit bisnis
- `GET /api/tph` - Ambil data TPH
- `GET /api/user/profile` - Ambil profil pengguna

### Approval & LHM

- `GET /api/approval/lhm` - Ambil data approval LHM
- `POST /api/approval/lhm/submit` - Submit approval LHM
- `GET /api/lhm` - Ambil data LHM

### Kualitas Panen

- `POST /api/harvesting-quality/submit` - Submit kualitas panen
- `POST /api/harvesting-quality/upload` - Upload kualitas panen

### Utilitas

- `GET /api/image-proxy?url=...` - Proxy permintaan gambar
- `POST /api/apk-upload` - Upload APK

## Scoping & Otorisasi

Aplikasi menggunakan otorisasi berbasis cookie dengan field scope pengguna berikut:

- `user_Level`: Tingkat peran pengguna (ADM, MGR, KSI, AST, dll.)
- `user_Fcba`: Identifier FCBA/section yang ditugaskan
- `user_Section`: Penugasan departemen atau section

Semua panggilan API secara otomatis menyertakan parameter scope ini dari cookie.

## Konfigurasi

### Variabel Lingkungan

Buat file `.env.local` di root proyek (jika diperlukan):

```env
# Tambahkan variabel lingkungan kustom di sini
# Contoh:
# NEXT_PUBLIC_API_BASE_URL=https://api.skj.my.id
```

### Tailwind & DaisyUI

Tailwind CSS dan DaisyUI telah dikonfigurasi sebelumnya di `tailwind.config.ts` dan `postcss.config.mjs`.

## Deployment

### Vercel (Direkomendasikan)

```bash
# Push ke repository Git
git push

# Deploy via platform Vercel
# (lihat https://vercel.com/new)
```

### Docker

```bash
# Build image Docker
docker build -t sips-mobile-web .

# Jalankan container
docker run -p 3000:3000 sips-mobile-web
```

### Platform Lain

Lihat [Dokumentasi Deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) untuk instruksi detail.

## Tips Pengembangan

### Pola Komponen

**Pola Server Proxy** (app/api/\*/route.ts):

```typescript
// Fetch dari upstream API dengan auth berbasis cookie
const response = await fetch(upstreamUrl, {
  headers: { Authorization: `Bearer ${authToken}` },
});
```

**Pola Halaman Client** (app/(views)/\*/page.tsx):

```typescript
"use client";
// Gunakan endpoint /api/... lokal untuk fetch data
// Agregasi data dan state management di client
```

### Menambah Halaman Baru

1. Buat folder baru di `app/(views)/`
2. Tambahkan `page.tsx` dengan directive `'use client'`
3. Buat proxy API di `app/api/*/route.ts` jika diperlukan
4. Tambahkan link navigasi di `app/components/drawer.tsx`
5. Import dan gunakan komponen reusable (navbar, footer, dll.)

### Menambah Chart Baru

Gunakan komponen dari `app/components/dashboard-chart.tsx`:

### Testing

```bash
# Jalankan unit test dengan Vitest
npm run test

# Jalankan test dengan coverage
npm run test:coverage
```

### Build & Lint

```bash
# Build untuk production
npm run build

# Jalankan linter
npm run lint

# Jalankan type checking
npm run type-check
```

```typescript
"use client";
// Use local /api/... endpoints to fetch data
// Data aggregation and state management on client
```

### Adding New Pages

1. Create a new folder under `app/(views)/`
2. Add `page.tsx` with `'use client'` directive
3. Create corresponding API proxy in `app/api/*/route.ts` if needed
4. Add navigation link in `app/components/drawer.tsx`
5. Import and use reusable components (navbar, footer, etc.)

### Adding New Charts

Use components from `app/components/dashboard-chart.tsx`:

- `SimplePieChart` - For composition/distribution
- `SimpleBarChart` - For comparisons
- `SimpleLineChart` - For trends over time

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors

```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### Theme Not Applying

- Ensure `ThemeProvider` wrapper is in layout
- Check DaisyUI theme configuration in `tailwind.config.ts`
- Clear browser cache and local storage

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run lint: `npm run lint`
4. Run build: `npm run build`
5. Commit and push: `git commit -m "..."` && `git push`
6. Create a Pull Request

## License

Proprietary - SIPS Project

## Support & Contact

For issues, questions, or feature requests, please contact the development team.

---

**Last Updated**: December 2025  
**Current Version**: 1.0.0

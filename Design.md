# Design Standards (Standar Desain)

Dokumen ini berisi standar desain UI yang **wajib** diikuti di seluruh codebase SIPS agar tampilan
antarmuka konsisten. Setiap komponen/form baru harus mengikuti aturan di bawah ini.

---

## 1. Tech Stack & Konvensi

| Layer | Teknologi |
|-------|-----------|
| UI | **daisyUI 5** + **Tailwind CSS 4** |
| Icons | inline SVG (Heroicons-style, `strokeWidth={2}`) |
| i18n | **next-intl** — semua teks UI harus via `useTranslations` (locale `id` + `en`) |
| Toast | `react-hot-toast` |
| Table | `react-data-table-component` (lazy via `dynamic`) |

**Aturan emas:** JANGAN hardcode teks bahasa Indonesia/Inggris di JSX. Selalu gunakan key
terjemahan. Pastikan key tersebut ada di `messages/id.json` **dan** `messages/en.json`.

---

## 2. Filter Form (Standar Wajib)

Filter digunakan di halaman tabel (LHM, Approval LHM, Open LHM, Attendance, Harvest,
Transport, Users, Dashboard).

### 2.1 Layout
- Filter ditampilkan sebagai **inline panel** (bukan modal) yang di-toggle oleh tombol
  `Tampilkan Filter` / `Sembunyikan Filter`.
- Bungkus dengan class:
  ```
  bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200
  ```
- Grid field: `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3`
- Tombol aksi di bawah grid:
  ```
  flex justify-start gap-2 pt-3 border-t border-base-200
  ```
- Beri `data-tour="filter-button"` pada container filter untuk integrasi AppTour.

### 2.2 Input / Select (SERAGAM — jangan dibedakan antar halaman)
Semua textbox, date, select pada filter **HARUS** menggunakan ukuran yang sama:

| Elemen | Class wajib |
|--------|-------------|
| Input text / date | `input input-bordered w-full` |
| Select | `select select-bordered w-full` |
| Input search (dengan icon) | `input input-bordered w-full pl-9 pr-10 ...` |

**DILARANG** menggunakan `input-sm` / `select-sm` pada filter kecuali untuk field display
read-only yang memang sengaja diperkecil.

### 2.3 Field Wajib (Required)
- Field wajib ditandai dengan tanda `*` berwarna error:
  ```
  <span className="text-error">*</span>
  ```
- Input wajib juga diberi atribut HTML `required`.
- Untuk filter LHM, **Tanggal Awal** dan **Tanggal Akhir** adalah field wajib.
- Validasi wajib dilakukan sebelum `setAppliedFilters(...)`; jika gagal, tampilkan
  `toast.error(<key terjemahan>)`. Contoh:
  ```tsx
  if (!filters.fddate && !filters.fddate_end) {
    toast.error(t('toastFilterDateRequired'));
    return;
  }
  ```

### 2.4 Tombol Filter
- `Terapkan Filter` → `btn btn-outline` (atau `btn-primary` bila di modal).
- `Reset` → `btn` (default).
- Kedua tombol menampilkan spinner `loading loading-spinner loading-xs` saat `loading=true`
  dan dinonaktifkan dengan `btn-disabled` + `disabled={loading}`.

---

## 3. Form di dalam Modal (Add / Edit / Delete)

- Gunakan wrapper daisyUI: `modal modal-open` → `modal-box max-w-4xl ...`.
- Header sticky dengan judul + tombol close (`btn btn-sm btn-ghost` berisi `✕`).
- Field dikelompokkan dengan `<fieldset>` + `<legend>` (atau `div` ber-label).
- Label field wajib diakhiri `*` (merah). Contoh untuk Harvest/Transport:
  `"FCBA *"`, `"Field Code *"`, `"Tanggal *"` (sudah ada di `messages/*` namespace
  terkait, jangan ubah).
- Validasi seragam:
  - Field wajib pakai atribut `required` (HTML5) — kecuali `<form>` memakai `noValidate`,
    maka validasi manual via fungsi `checkFormErrors()` + `toast.error`.
  - Pesan error wajib via `toast.error(t('...'))`, tidak pakai `alert()`.
- Tombol aksi di footer: `modal-action` → `btn` (Batal) + `btn btn-primary` (Simpan).
- Konfirmasi aksi destruktif (delete/approve/open) gunakan `toast`/konfirmasi eksplisit,
  bukan langsung eksekusi.

---

## 4. Tour / Petunjuk Penggunaan (AppTour)

Setiap halaman utama **wajib** memiliki tombol bantuan (AppTour) di action bar.

- Import: `import AppTour from '@/app/components/app-tour';`
- Letakkan `<AppTour steps={tourSteps} storageKey="tour-<nama-halaman>" />` di dalam
  div `data-tour="action-buttons"`.
- `tourSteps` didefinisikan dengan `useMemo` dan semua teks via `t('tourXxx')`.
- Target highlight wajib pakai `data-tour`:
  - `action-buttons` — baris tombol
  - `quick-search` — input pencarian
  - `filter-button` — panel/tombol filter
  - `total-cards` — kartu ringkasan
  - `data-table` — tabel data
- Key tour wajib ada di `messages/id.json` & `messages/en.json` (namespace sesuai halaman):
  `tourWelcomeTitle`, `tourWelcomeDesc`, `tourActionsTitle`, `tourActionsDesc`,
  `tourSearchTitle`, `tourSearchDesc`, `tourFilterTitle`, `tourFilterDesc`,
  `tourTableTitle`, `tourTableDesc` (dashboard tambah `tourChartsTitle/Desc`,
  change-password tambah `tourFormTitle/Desc`).

---

## 5. Buttons (Standar Ukuran & Varian)

| Keperluan | Class |
|-----------|-------|
| Aksi utama (primary) | `btn btn-primary btn-sm` |
| Aksi sekunder | `btn btn-outline btn-sm` |
| Batal / close | `btn btn-ghost btn-sm` |
| Toggle filter | `btn btn-outline btn-sm` |
| Loading state | `btn-disabled` + `disabled` + spinner |

Gunakan `btn-sm` secara konsisten di action bar halaman.

---

## 6. Quick Search Input

```tsx
<div className="relative w-full sm:w-72 md:w-80 group shrink-0">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    {/* svg search icon */}
  </div>
  <input
    className="input input-bordered w-full pl-9 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
    placeholder={t('searchPlaceholder')}
  />
  {/* tombol clear (✕) saat ada isi */}
</div>
```

---

## 7. Checklist Sebelum Merge

- [ ] Semua teks via `useTranslations` (ada di `id.json` & `en.json`).
- [ ] Filter input seragam: `input input-bordered w-full` / `select select-bordered w-full`
      (tidak ada `input-sm`/`select-sm` pada filter).
- [ ] Field wajib ada `*` merah + atribut `required`.
- [ ] Validasi filter/modal pakai `toast.error`, bukan `alert`.
- [ ] AppTour ada di action bar dengan `storageKey` unik.
- [ ] `data-tour` target sudah dipasang sesuai section 4.
- [ ] Build `npm run build` lulus tanpa warning `MISSING_MESSAGE`.

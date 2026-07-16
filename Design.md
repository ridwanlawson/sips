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

### 5.1 Toolbar — Button Group di Action Bar

Semua halaman **WAJIB** menggunakan komponen `<Toolbar>` (dari `@/app/components/ui/toolbar`)
untuk action bar. Komponen ini sudah menerapkan pola berikut secara otomatis:

| Aturan | Keterangan |
|--------|------------|
| **`join`** (tanpa `sm:`) | Button terlihat menyambung di semua ukuran layar, termasuk mobile |
| **`flex-1 sm:flex-none`** | Setiap button mendapat lebar sama di mobile (`flex-1`), kembali ke ukuran konten di `sm`+ |
| **`flex-wrap`** | Button otomatis turun baris jika tidak muat dalam satu baris |
| **`btn-sm`** | Semua button action pakai ukuran `btn-sm` |
| **`<span className="hidden sm:inline">`** | Label hanya muncul di `sm`+; di mobile hanya icon yang terlihat |

**Urutan button dalam `actions[]` HARUS:**
```
Filter → Refresh → Export → Add (primary, paling kanan)
```

**Jika tidak menggunakan `<Toolbar>`** (misal halaman Users, LHM, LHM Approval, LHM Open),
button group harus mengikuti pola yang sama secara manual:

```tsx
<div className="flex justify-start sm:justify-end flex-wrap w-full join">
  <button className="btn btn-outline btn-sm flex-1 sm:flex-none join-item" />
  <button className="btn btn-primary btn-sm flex-1 sm:flex-none join-item" />
</div>
```

**Kunci:** `join` (bukan `sm:join`), `flex-1 sm:flex-none`, `flex-wrap`, `btn-sm`.

---

## 6. Quick Search Input

### 6.1 Standar Input

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

### 6.2 Search + Gallery/Table View Toggle (satu baris)

Quick Search dan tombol Gallery/Table View HARUS berada dalam satu baris baik di mobile
maupun desktop, dengan search mengambil sisa lebar dan toggle tetap di kanan:

```tsx
<div className="mb-3 flex items-center gap-2">
  <div className="relative flex-1 md:flex-none md:max-w-96 group" data-tour="quick-search">
    {/* input search — lihat 6.1 */}
  </div>
  <div className="join flex-none">
    <button className="btn btn-outline join-item">   {/* ⚠️ tanpa btn-sm */}
      <Icon name="layout-grid" className="h-4 w-4" />
      <span className="hidden sm:inline">Gallery</span>
    </button>
  </div>
</div>
```

**Aturan penting:**
- Search input: `flex-1` (mobile) → `md:flex-none md:max-w-96` (desktop)
- View toggle button: **`btn btn-outline join-item`** (tanpa `btn-sm`) agar tingginya
  sama dengan search input (default `input` = default `btn`, sama-sama `h-12`)
- Container: `flex items-center gap-2` (default row, sebaris di semua layar)

### 6.3 Stat Cards + Search (Responsive Row)

Jika halaman memiliki total cards (Janjang & Brondolan, dll) di samping search,
gunakan pola **stack on mobile, same-row on desktop**:

```tsx
<div className="mb-3 flex flex-col md:flex-row md:items-center gap-4">
  {/* TOTAL CARDS */}
  <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
    {/* kartu statistik */}
  </div>

  {/* SEARCH + VIEW TOGGLE — pola 6.2 */}
  <div className="flex items-center gap-2 md:ml-auto">
    <div className="relative flex-1 md:flex-none md:max-w-96 group">
      {/* input search */}
    </div>
    <div className="join flex-none">
      {/* toggle button gallery/table */}
    </div>
  </div>
</div>
```

**Aturan:**
- Container luar: `flex flex-col md:flex-row md:items-center gap-4`
- Total cards: `w-full md:w-auto` (full width mobile, auto desktop)
- Search section: `md:ml-auto` (dorong ke kanan di desktop)
- Di mobile: cards di baris pertama, search+toggle di baris kedua

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
- [ ] Action bar button group pakai `join` (bukan `sm:join`) + `flex-1 sm:flex-none`.
- [ ] Urutan action button: Filter → Refresh → Export → Add (primary).
- [ ] Search + Gallery toggle dalam satu baris (`flex items-center gap-2`).
- [ ] View toggle button pakai default `btn` (tanpa `btn-sm`) agar sama tinggi dengan search.
- [ ] Stat cards + search: `flex-col md:flex-row` (stack mobile, same-row desktop).

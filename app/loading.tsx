import { getTranslations } from 'next-intl/server';

/**
 * 🎨 Palette Enhancement: Localized and visually pleasing root loading state.
 */
export default async function RootLoading() {
  const t = await getTranslations('Errors');

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-6 animate-fadeIn">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:2s]" />
          <span className="loading loading-spinner loading-lg text-primary relative z-10" />
        </div>
        <p className="text-base font-medium text-base-content/70 tracking-wide">
          {t('loadingApp')}
        </p>
      </div>
    </div>
  );
}

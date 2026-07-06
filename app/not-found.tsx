import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/**
 * 🎨 Palette Enhancement: Localized and accessible 404 page.
 */
export default async function NotFound() {
  const t = await getTranslations('Errors');
  const tCommon = await getTranslations('Common');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-base-200 animate-fadeIn">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div
          id="main-content"
          tabIndex={-1}
          className="card-body items-center text-center gap-4 focus:outline-none"
        >
          {/* Icon with themed background */}
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-warning/20 rounded-full animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center relative ring-8 ring-base-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-warning"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
          </div>

          <h1 className="card-title text-3xl font-bold text-base-content">
            {t('notFoundTitle')}
          </h1>

          <p className="text-base text-base-content/60 leading-relaxed mb-4">
            {t('notFoundDesc')}
          </p>

          <div className="card-actions w-full">
            <Link
              href="/"
              className="btn btn-primary btn-block rounded-full shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 mr-2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {tCommon('backToDashboard')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

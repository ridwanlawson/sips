import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Available locales
const locales = ['en', 'id'];

export default getRequestConfig(async () => {
  // Read the locale from the cookie or default to 'en'
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  // Use cookie locale if valid, otherwise default to 'en'
  const locale = (locales.includes(cookieLocale as string) ? cookieLocale : 'en') as string;

  try {
    const messages = (await import(`../messages/${locale}.json`)).default;
    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to English if the requested locale fails
    const fallbackMessages = (await import(`../messages/en.json`)).default;
    return {
      locale: 'en',
      messages: fallbackMessages,
    };
  }
});

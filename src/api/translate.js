import axios from 'axios';

/**
 * Dịch Anh → Việt dùng MyMemory API (không cần API key).
 * Docs: https://mymemory.translated.net/doc/spec.php
 */
export async function translateEnToVi(text) {
  const url = 'https://api.mymemory.translated.net/get';

  try {
    const res = await axios.get(url, {
      params: {
        q: text,
        langpair: 'en|vi',
      },
    });

    const translated = res.data?.responseData?.translatedText;
    if (!translated) {
      throw new Error('EMPTY_TRANSLATION');
    }

    return translated;
  } catch (err) {
    console.error('Translate error:', err);
    throw new Error('TRANSLATE_ERROR');
  }
}

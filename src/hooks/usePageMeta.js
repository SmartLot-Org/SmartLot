import { useEffect } from 'react';

export default function usePageMeta({ title, description, lang = 'es-AR' }) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevLang = document.documentElement.lang;
    const descTag = document.querySelector('meta[name="description"]');
    const prevContent = descTag?.getAttribute('content') ?? '';

    if (title) document.title = title;
    if (lang) document.documentElement.lang = lang;
    if (description && descTag) descTag.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      if (descTag) descTag.setAttribute('content', prevContent);
    };
  }, [title, description, lang]);
}

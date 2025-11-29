import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend) // carrega traduções via http (pode ser local ou remoto)
  .use(LanguageDetector) // detecta idioma do navegador automaticamente
  .use(initReactI18next) // conecta ao React
  .init({
    fallbackLng: 'en', // idioma padrão
    debug: false,

    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // caminho para os arquivos JSON de tradução
    },
  });

export default i18n;

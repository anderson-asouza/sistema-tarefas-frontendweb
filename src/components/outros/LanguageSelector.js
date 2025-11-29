import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css';
import br from '../../img/flags/br.svg';
import pt from '../../img/flags/pt.svg';
import us from '../../img/flags/us.svg';
import es from '../../img/flags/es.svg';

const languages = {
  ptBR: { name: 'Pt-Brasil', file: 'pt', flag: br },
  pt :  { name: 'Português', file: 'pt', flag: pt },
  en :  { name: 'English', file: 'en', flag: us },
  es:   { name: 'Español', file: 'es', flag: es},      
};

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLangKey, setSelectedLangKey] = useState(() => {

    const storedLangKey = localStorage.getItem('langKey');
    if (storedLangKey && languages[storedLangKey]) {
      return storedLangKey;
    }

    const langDetected = i18n.language.replace('-', "");
    const currentLang = (langDetected in languages) ?  languages[langDetected].file : 'en';

    return Object.keys(languages).find(
      key => languages[key].file === languages[currentLang].file
    ) || 'en';
  });

  const selectorRef = useRef(null);

  const toggleDropdown = () => setOpen(!open);

  const changeLanguage = (code) => {
    const lang = languages[code];
    i18n.changeLanguage(lang.file);
    localStorage.setItem('lng', lang.file);
    localStorage.setItem('langKey', code);
    setSelectedLangKey(code);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.selector} ref={selectorRef}>
      <button className={styles.flagButton} onClick={toggleDropdown}>
        <img
          src={languages[selectedLangKey].flag}
          alt={languages[selectedLangKey].name}
        />
      </button>

      {open && (
        <div className={styles.dropdown}>
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={styles.option}
            >
              <img src={lang.flag} alt={lang.name} /> {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
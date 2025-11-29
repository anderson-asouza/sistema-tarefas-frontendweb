import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesMenu from './Menu.module.css';
import styles from './MenuModelos.module.css';
import { TbTemplate } from "react-icons/tb";

function MenuUsuarios() {
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const mainMenuRef = useRef(null);   

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!((menuRef.current && menuRef.current.contains(e.target)) || (mainMenuRef.current && mainMenuRef.current.contains(e.target)))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function AbrirMenu() {
    setOpen(!open);
  }

  async function IrPara(path, modal = false) {
    setOpen(!open);

    if (modal) {
      navigate(path, { state: { backgroundLocation: location }});
    } else {
      navigate(path);
    }
  }

return (
    <>
      <div ref={mainMenuRef} className={stylesMenu.item} role="button" onClick={() => AbrirMenu()}>
        <TbTemplate style={{ transform: 'scale(1.1)', transformOrigin: 'center', marginRight: '0em' }} />
        <span>{t('menu.modelos')}</span>
      </div>

      { (open) && (
        <div ref={menuRef} className={`${stylesMenu.dropdown} ${styles.ajustaPosicao}`}>
          <button onClick={() => IrPara("/modelostarefa")}>{t('menuModelos.listarModelosTarefa')}</button>
          <button onClick={() => IrPara("/cadastromodelotarefa", true)}>{t('menuModelos.cadastrarModeloTarefa')}</button>
          <button onClick={() => IrPara("/modelostramite")}>{t('menuModelos.listarModeloTramite')}</button>
        </div>
      )}
    </>
  );
}

export default MenuUsuarios;

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesMenu from './Menu.module.css';
import styles from './MenuUsuarios.module.css';
import { SvgEUsuarios } from '../components/outros/Svg';

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
        <SvgEUsuarios style={{ transform: 'scale(1.15)', transformOrigin: 'center', marginRight: '0.2em' }} />
        <span>{t('menu.usuarios')}</span>
      </div>

      { (open) && (
        <div ref={menuRef} className={`${stylesMenu.dropdown} ${styles.ajustaPosicao}`}>
          <button onClick={() => IrPara("/usuarios")}>{t('menuUsuarios.listarUsuarios')}</button>
          <button onClick={() => IrPara("/cadastrousuario", true)}>{t('menuUsuarios.cadastrarUsuario')}</button>
          <button onClick={() => navigate("/login", { state: { backgroundLocation: location, trocarSenhaPeloAdm: true } })}>{t('menuUsuarios.forcarAlterarSenha')}</button>
        </div>
      )}
    </>
  );
}

export default MenuUsuarios;

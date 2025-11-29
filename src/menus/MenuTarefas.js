import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesMenu from './Menu.module.css';
import styles from './MenuTarefas.module.css';
import { GetDadosLogin } from '../util/servico';
import { SvgETarefas } from "../components/outros/Svg";

function MenuTarefas() {
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const mainMenuRef = useRef(null);
  const [nivel, setNivel] = useState(0);

  useEffect(() => {
    setNivel(GetDadosLogin("nivel"));
  },[]);

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
    setOpen(false);

    if (modal) {
      navigate(path, { state: { backgroundLocation: location }});
    } else {
      navigate(path);
    }
  }

  return (
    <>
      <div ref={mainMenuRef} className={stylesMenu.item} role="button" onClick={() => AbrirMenu()}>
        <SvgETarefas style={{ transform: 'scale(1.15)', transformOrigin: 'center', marginRight: '0.2em' }} />
        <span>{t('menu.tarefas')}</span>
      </div>

      { (open) && (
        <div ref={menuRef} className={`${stylesMenu.dropdown} ${styles.ajustaPosicao}`}>
          <button onClick={() => IrPara("/tarefas")}>{t('menuTarefas.listarTarefas')}</button>
          {nivel >= 1 && nivel <= 3 &&<button onClick={() => IrPara("/cadastrotarefa", true)}>{t('menuTarefas.cadastrarTarefa')}</button>}
          <button onClick={() => IrPara("/tramites")}>{t('menuTarefas.listarTramites')}</button>
          <button onClick={() => IrPara("/flags")}>{t('menuTarefas.listarFlags')}</button>
          {nivel >= 1 && nivel <= 2 &&<button onClick={() => IrPara("/cadastroflag", true)}>{t('menuTarefas.cadastrarFlag')}</button>}
        </div>
      )}
    </>
  );
}

export default MenuTarefas;

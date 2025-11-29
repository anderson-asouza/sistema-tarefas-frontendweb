import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { URL_API, URL_PROFILE } from '../util/config';
import { GetDadosLogin, ValidaRetornoAPI, ChamarSplash } from '../util/servico';
import { useTranslation } from 'react-i18next';
import stylesMenu from './Menu.module.css';
import styles from './MenuLogin.module.css';
import { usePerguntaDlg } from '../components/alerta/usePerguntaDlg';
import { useCustomAlerta } from '../components/alerta/useCustomAlerta';
import { FaUserAltSlash, FaUserAlt } from 'react-icons/fa';
import { RiUserForbidFill } from "react-icons/ri";


function MenuLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef();

  const [nivel, setNivel] = useState(-1);
  const [foto, setFoto] = useState("");
  const [token, setToken] = useState("");
  
  useEffect(() => {
      const nivelArmazenado = GetDadosLogin("nivel");
      const fotoArmazenada = GetDadosLogin("foto");
      const tokenArmazenado = GetDadosLogin("token");
      setNivel(nivelArmazenado);
      setFoto(fotoArmazenada);
      setToken(tokenArmazenado);

    function atualizarLogin() {
      const nivelArmazenado = GetDadosLogin("nivel");
      const fotoArmazenada = GetDadosLogin("foto");
      const tokenArmazenado = GetDadosLogin("token");
      setNivel(nivelArmazenado);
      setFoto(fotoArmazenada);
      setToken(tokenArmazenado);
    }

    atualizarLogin();
  
    window.addEventListener('atualizarLogin', atualizarLogin);

    return () => { window.removeEventListener('atualizarLogin', atualizarLogin); };
  }, []);

  const { Pergunta, ComponentePergunta } = usePerguntaDlg();
  const { Alerta, ComponenteAlerta } = useCustomAlerta();  

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const mainMenuRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!((menuRef.current && menuRef.current.contains(e.target)) || (mainMenuRef.current && mainMenuRef.current.contains(e.target)))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    
  }, []);

  async function AbrirLogin() {
    if (!token) {
      navigate("/login", { state: { backgroundLocation: location }});
    } else {
      setOpen(!open);
    }
  }

  async function LogOff() {
    setOpen(false);

    const confirmado = await Pergunta({ mensagem: t('menuLogin.desejaFazeLogoff')});
    if (!confirmado) return;

    sessionStorage.clear();

    window.dispatchEvent(new Event('atualizarLogin'));
    navigate("/", { replace: true });
  }

  async function AlterarFoto() {
    setOpen(false);
    inputRef.current.click();
  }

  async function handleCarregaImagem(event) {

    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/'))
      return;

    const formData = new FormData();
    const fileInput = document.getElementById("imagemInput");

    formData.append("imagem", fileInput.files[0]);

    const resposta = await fetch(URL_API+"Usuarios/upload-imagem-perfil", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    const { erro, dados } = await ValidaRetornoAPI(resposta, t);

    if (erro || !dados) {
      Alerta({ mensagem: erro || t('api.apiErro') });
      return;
    }

    sessionStorage.setItem("foto", dados.usuImagemPerfil);
    window.dispatchEvent(new Event('atualizarLogin'));
    ChamarSplash(t('menuLogin.fotoPerfilAdicionada'));
  }

  async function RemoverFoto() {
    setOpen(false);

    const confirmado = await Pergunta({mensagem :t('menuLogin.desejaRemoverFotoPerfil')});
    if (!confirmado) return;
    const resposta = await fetch(URL_API + 'Usuarios/remover-imagem-perfil', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
        }
      });

    const { erro, dados } = await ValidaRetornoAPI(resposta, t);

    if (erro || !dados) {
      Alerta({ mensagem: erro || t('api.apiErro') });
      return;
    }

    sessionStorage.setItem("foto", "");
    window.dispatchEvent(new Event('atualizarLogin'));
  }

  async function MudarUsuario() {
    setOpen(false);
    sessionStorage.clear();
    window.dispatchEvent(new Event('atualizarLogin'));
    navigate("/login", { replace: true, state: { backgroundLocation: location }});
  }

  async function AlterarSenha() {
    setOpen(false);
    navigate("/login", { state: { backgroundLocation: location }});
  }

  return (
    <>
      {ComponentePergunta}
      {ComponenteAlerta}
    
      <input
        type="file"
        accept="image/*"
        id="imagemInput"
        ref={inputRef}
        onChange={handleCarregaImagem}
        style={{ display: 'none' }}
      />

      <div>
        <div ref={mainMenuRef} className={stylesMenu.item} role="button" onClick={() => AbrirLogin()}>
          {(nivel < 0 || !token) ? 
            (<FaUserAltSlash/>)
          : (nivel === 0) ? 
            (<RiUserForbidFill style={{ transform: 'scale(1.1)', transformOrigin: 'center', marginRight: '0.1em' }}/>)
          : 
            (!foto) ? 
            ( <FaUserAlt style={{ transform: 'scale(0.93)', transformOrigin: 'center', marginRight: '0.1em' }}/> )
          : 
            (<img src={`${URL_PROFILE}${foto}?t=${Date.now()}`} className={stylesMenu.fotoIcone} alt="" />)           
          }           
          <span>{t('menu.login')}</span>
        </div>

        {open && (
          <div ref={menuRef} className={`${stylesMenu.dropdown} ${styles.ajustaPosicao}`}>
            <button onClick={() => MudarUsuario()}>{t('menuLogin.mudarUsuario')}</button>
            <button onClick={() => AlterarFoto()}>{ (!foto) ? (<>{t('menuLogin.adicionarImagemPerfil')}</>) : (<>{t('menuLogin.alterarImagemPerfil')}</>)}</button>
            { (foto) && <button onClick={() => RemoverFoto()}>{t('menuLogin.removerImagemPerfil')}</button>}
            <button onClick={() => AlterarSenha()}>{t('menuLogin.alterarSenha')}</button>
            <button onClick={() => LogOff()}>{t('menuLogin.logoff')}</button>
          </div>
        )}
      </div>
    </>
  );
}

export default MenuLogin;

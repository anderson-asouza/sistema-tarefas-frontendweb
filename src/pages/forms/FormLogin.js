import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomAlerta } from  '../../components/alerta/useCustomAlerta';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';
import { URL_API } from '../../util/config'
import { SalvaDadosLogin, GetDadosLogin, ChamarSplash, ValidaRetornoAPI, TraduzMensagemErroBackend } from '../../util/servico';
import { FaUserAlt } from 'react-icons/fa';
import { FaUserCog } from 'react-icons/fa';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,  
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '2rem',
};

const pageStyle = {
  padding: '2rem',
};

function FormLogin() {
  const location = useLocation();
  const state = location.state;
  const isModal = !!state?.backgroundLocation;
  const trocarSenhaPeloAdm = location.state?.trocarSenhaPeloAdm ?? false;  
    
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { Alerta, ComponenteAlerta } = useCustomAlerta();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoNovaSenha, setConfirmacaoNovaSenha] = useState('');

  const [id, setId] = useState(0);  
  const [token, setToken] = useState('');
  const [obrigatorioNovaSenha, setObrigatorioNovaSenha] = useState(false);

  useEffect(() => {
    setId(GetDadosLogin("id"));    
    setToken(GetDadosLogin("token"));
  }, []);

  function handleClose() {
      if (token) {
        navigate(-1);
      } else {
        navigate("/", { replace: true});
      }
  }  

  function ValidarCampos() {
    if (token && !novaSenha)
      return t('usuarios.msgInformeNovaSenha');

    if (!login || (!trocarSenhaPeloAdm && !senha))
      return t('frmLogin.msgInformeCredenciais');

    if (novaSenha !== confirmacaoNovaSenha)
      return t('usuarios.msgConfirmacaoDiferente');

    return "";
  }
  
  async function handleSubmit(e) {
    e.preventDefault();

    const erro = ValidarCampos();

    if (erro !== "") {
      Alerta({ mensagem: erro });
      return;
    }

    try
    {
      const url = (!token) ? `${URL_API}Usuarios/logar` : `${URL_API}Usuarios/alterar-senha?trocarSenhaPeloAdm=${trocarSenhaPeloAdm}`;

      const resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          login,
          senha,
          novaSenha,
          confirmacaoNovaSenha
        })
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        if (dados && (dados.errorCode.toUpperCase().includes("USUARIOS_SENHA_EXPIROU") || dados.errorCode.toUpperCase().includes("USUARIOS_USUARIO_DEVE_TROCAR_SENHA")))
          setObrigatorioNovaSenha(true);

        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

      if (!token)
      {
        if (dados.usuId !== id) {
          sessionStorage.clear();
        }

        SalvaDadosLogin(dados.usuId, dados.usuLogin, dados.usuNome, dados.usuNivel, dados.usuMatricula, dados.usuImagemPerfil, dados.usuToken);
        window.dispatchEvent(new Event('atualizarLogin'));
      }
      else
      {
        ChamarSplash(t('frmLogin.msgSenhaAlteradaSucesso'));
      }

      if (dados.usuId === id) {
        navigate(-1);
      } else {
        navigate("/");
      }

    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }
  
  return (
  <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
    <div className={`${stylesModal.larguraModal} ${isModal ? stylesModal.modalContent : ''}`}>

      {ComponenteAlerta}     

      <h1>
        {!trocarSenhaPeloAdm ? (
          <FaUserAlt style={{ transform: 'scale(1.2)', transformOrigin: 'center', marginRight: '0.4em' }}/>
        ) : (
          <FaUserCog style={{ transform: 'scale(1.40)', transformOrigin: 'center', marginRight: '0.4em' }} />
        )}

        {!token ? 
        (<>{t('frmLogin.facaLogin')}</>) : 
        (<>{t('frmLogin.alterarSenha')}</>) }
      </h1>
    <form onSubmit={handleSubmit}>
      <label htmlFor="login">{t('frmLogin.login')}</label>
      <input
        type="text"
        id="login"
        name="login"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder={t('frmLogin.loginHolder')}
      />

      {!trocarSenhaPeloAdm && <>
        <label htmlFor="senha">{t('frmLogin.senha')}</label>
        <input
          type="password"
          id="senha"
          name="senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder={t('frmLogin.senhaHolder')}
        />
      </>}

      { (obrigatorioNovaSenha || token) &&
      <>
      <label htmlFor="novaSenha">{t('frmLogin.novaSenha')}</label>
      <input
        type="password"
        id="novaSenha"
        name="novaSenha"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        placeholder={t('frmLogin.novaSenhaHolder')}
      />

      <label htmlFor="confirmacaoNovaSenha">{t('frmLogin.confirmacaoNovaSenha')}</label>
      <input
        type="password"
        id="confirmacaoNovaSenha"
        name="confirmacaoNovaSenha"
        value={confirmacaoNovaSenha}
        onChange={(e) => setConfirmacaoNovaSenha(e.target.value)}
        placeholder={t('frmLogin.confirmacaoNovaSenhaHolder')}
      />
      </>
      }

      <div className='colunas'>
        <button type="submit">{!token ? t('frmLogin.logar') : t('frmLogin.alterar')}</button>
        <button type="button" onClick={() => handleClose()}>{t('fechar')}</button>
      </div>
    </form>
    </div>
    </div>
   )
}

export default FormLogin;
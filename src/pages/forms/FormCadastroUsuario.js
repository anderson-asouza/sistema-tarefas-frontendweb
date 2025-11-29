import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';
import { URL_API } from '../../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend, ChamarSplash, MAX_CAMPO } from '../../util/servico';
import { ValidarEmail } from '../../util/validacao';
import { usePerguntaDlg } from  '../../components/alerta/usePerguntaDlg';
import { useCustomAlerta } from  '../../components/alerta/useCustomAlerta';
import { SvgEUsuarios } from '../../components/outros/Svg';

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

function FormCadastroUsuario() {
  const location = useLocation();
  const state = location.state;
  const isModal = !!state?.backgroundLocation;
  const itemSelecionado = location.state?.itemSelecionado;
    
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const handleClose = () => navigate(-1);
  const [token, setToken] = useState("");

  const [id, setId] = useState(0);
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [nivel, setNivel] = useState();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');

  const [erros, setErros] = useState({});

  useEffect(() => {
    setToken(GetDadosLogin("token"));

    if (itemSelecionado)
    {
      setId(itemSelecionado.usuId);
      setLogin(itemSelecionado.usuLogin);
      setNivel(itemSelecionado.usuNivel);
      setNome(itemSelecionado.usuNome);
      setEmail(itemSelecionado.usuEmail);
      setMatricula(itemSelecionado.usuMatricula);
    }

  }, [itemSelecionado]);

  function ValidarFormulario() {
    const novosErros = {};

    if (!login.trim()) {      
      novosErros.login = t('preenchimentoObrigatorio');
    }

    if (id === 0 && !senha.trim()) {
      novosErros.senha = t('preenchimentoObrigatorio');
    }

    const nivelInt = parseInt(nivel, 10);
    if (isNaN(nivelInt) || nivelInt < 0 || nivelInt > 4) {
      novosErros.nivel = t('frmCadastroUsuario.msgNivel');
    }

    if (!nome.trim()) {
      novosErros.nome = t('preenchimentoObrigatorio');
    }

    if (!ValidarEmail(email)) {
      novosErros.email = t('frmCadastroUsuario.emailInvalido');
    }

    if (!matricula.trim()) {
      novosErros.matricula = t('preenchimentoObrigatorio');
    }     

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }
  
  async function handleSubmit(e) {
    e.preventDefault();

    // Validação extra além do required no input
    if (!ValidarFormulario()) {
      Alerta({ mensagem: t('camposObrigatorios') });
      return;
    }

    try
    {
      const confirmado = await Pergunta({ mensagem: (id === 0) ?  t('desejaCadastar') : t('desejaAtualizar')});
      if (!confirmado) return;

      if (id === 0) {
      const resposta = await fetch(URL_API+'Usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            usuLogin: login,
            usuSenha: senha,
            usuNivel: nivel,
            usuNome: nome,
            usuEmail: email,
            usuMatricula: matricula
          })
        });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

      } else {
        const url = new URL(`${URL_API}Usuarios/${id}`);
        const resposta = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuNivel: nivel,
          usuNome: nome,
          usuEmail: email,
          usuMatricula: matricula
        })
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }
          
    }

      ChamarSplash(id === 0 ? t('cadastroSalvo') : t('cadastroAtualizado'));

      window.dispatchEvent(new Event("atualizarListaUsuarios"));
      navigate(-1);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }
  
  return (
  <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
    <div className={`${stylesModal.larguraModal} ${isModal ? stylesModal.modalContent : ''}`}>

    {ComponenteAlerta}
    {ComponentePergunta}

    <h1>
      <SvgEUsuarios style={{ transform: 'scale(1.25)', transformOrigin: 'center', marginRight: '0.2em' }} /> { id === 0 ? t('frmCadastroUsuario.tituloCadastro') : t('frmCadastroUsuario.tituloAtualizar') }
    </h1>

    <form onSubmit={handleSubmit}>

      <label htmlFor="login">{t('frmCadastroUsuario.login')}</label>
      <input
        type="text"
        id="login"
        name="login"
        required
        aria-required="true"
        maxLength={MAX_CAMPO}
        placeholder={t('frmCadastroUsuario.loginHolder')}
        value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                if (erros.login) setErros(prev => ({ ...prev, login: null }));
              }}        
        className={erros.login ? stylesModal.inputErro : ''}
        disabled={!!itemSelecionado} 
      />
      {erros.login && <span className={stylesModal.msgErro} role="alert">{erros.login}</span>}

      <label htmlFor="senha">{ id === 0 ? t('frmCadastroUsuario.senhaInicial') : t('frmCadastroUsuario.senha') }</label>
      <input
        type="password"
        id="senha"
        name="senha"
        aria-required="true"        
        maxLength={60}
        placeholder= { id === 0 ? t('frmCadastroUsuario.senhaHolder') : t('frmCadastroUsuario.senhaAtualizacaoHolder') }
        value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                if (erros.senha) setErros(prev => ({ ...prev, senha: null }));
              }}
        className={erros.senha ? stylesModal.inputErro : ''}
        disabled={!!itemSelecionado}
      />
      {erros.senha && <span className={stylesModal.msgErro} role="alert">{erros.senha}</span>}

      <label htmlFor="nivel">{t('frmCadastroUsuario.nivel')}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="\d*"
        id="nivel"
        name="nivel"
        required
        aria-required="true"        
        value={nivel}
        onChange={(e) => {
          const valor = e.target.value.toString().replace(/[^\d]/g, '');
          if (valor.length <= 1) {
            const numero = Number(valor);
            if (numero >= 0 && numero <= 4) {
              setNivel(Number(valor));
              if (erros.nivel) setErros(prev => ({ ...prev, nivel: null }));
            }
          }
        }}
        placeholder={t('frmCadastroUsuario.nivelHolder')}
        min={0}
        max={4}
        step={1}
        className={erros.nivel ? stylesModal.inputErro : ''}
        />
        {erros.nivel && <span className={stylesModal.msgErro} role="alert">{erros.nivel}</span>}

      <label htmlFor="nome">{t('frmCadastroUsuario.nome')}</label>
      <input
        type="text"
        id="nome"
        name="nome"
        required
        aria-required="true"        
        maxLength={100}
        placeholder={t('frmCadastroUsuario.nomeHolder')}
        value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erros.nome) setErros(prev => ({ ...prev, nome: null }));
              }}        
        className={erros.nome ? stylesModal.inputErro : ''}
      />
      {erros.nome && <span className={stylesModal.msgErro} role="alert">{erros.nome}</span>}

      <label htmlFor="email">{t('frmCadastroUsuario.email')}</label>
      <input
        type="text"
        id="email"
        name="email"
        required
        aria-required="true"        
        maxLength={100}
        placeholder={t('frmCadastroUsuario.emailHolder')}
        value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (erros.email) setErros(prev => ({ ...prev, email: null }));
              }}        
        className={erros.email ? stylesModal.inputErro : ''}
      />
      {erros.email && <span className={stylesModal.msgErro} role="alert">{erros.email}</span>}

      <label htmlFor="matricula">{t('frmCadastroUsuario.matricula')}</label>
      <input
        type="text"
        id="matricula"
        name="matricula"
        required
        aria-required="true"
        maxLength={30}
        placeholder={t('frmCadastroUsuario.matriculaHolder')}
        value={matricula}
              onChange={(e) => {
                setMatricula(e.target.value);
                if (erros.matricula) setErros(prev => ({ ...prev, matricula: null }));
              }}        
        className={erros.matricula ? stylesModal.inputErro : ''}
      />
      {erros.matricula && <span className={stylesModal.msgErro} role="alert">{erros.matricula}</span>}

      <div className='colunas'>
        <button type="submit"> {id === 0 ? t('cadastrar') : t('atualizar')}</button>
        <button type="button" onClick={handleClose}>{t('fechar')}</button>
      </div>
    </form>
    </div>
    </div>
   )
}

export default FormCadastroUsuario;
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';
import { URL_API } from '../../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend, ChamarSplash, MAX_CAMPO } from '../../util/servico';
import { usePerguntaDlg } from  '../../components/alerta/usePerguntaDlg';
import { useCustomAlerta } from  '../../components/alerta/useCustomAlerta';
import { SvgEFlags, SvgBloqueado } from '../../components/outros/Svg';

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

function FormCadastroFlag() {
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
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('');

  const [erros, setErros] = useState({});

  useEffect(() => {
    setToken(GetDadosLogin("token"));

    if (itemSelecionado)
    {
      setId(itemSelecionado.flaId);      
      setNome(itemSelecionado.flaRotulo);
      setCor(itemSelecionado.flaCor);
    }

  }, [itemSelecionado]);

  function ValidarFormulario() {
    const novosErros = {};

    if (!nome.trim()) {
      novosErros.nome = t('preenchimentoObrigatorio');
    }

    if (!cor.match(/^#[0-9A-Fa-f]{6}$/)) {
      novosErros.cor = t('preenchimentoObrigatorio');
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
      const resposta = await fetch(URL_API+'Flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            flaRotulo: nome,
            flaCor: cor
          })
        });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

      } else {
        const url = new URL(`${URL_API}Flags/${id}`);
        const resposta = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flaRotulo: nome,
          flaCor: cor
        })
        });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

      }

      ChamarSplash(id === 0 ? t('cadastroSalvo') : t('cadastroAtualizado'));

      window.dispatchEvent(new Event("atualizarListaFlags"));
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
      <SvgEFlags style={{ transform: 'scale(1.25)', transformOrigin: 'center', marginRight: '0.2em' }} /> { id === 0 ? t('frmCadastroFlag.tituloCadastro') : t('frmCadastroFlag.tituloAtualizar') }
    </h1>

    <form onSubmit={handleSubmit}>

      <label htmlFor="nome">{t('frmCadastroFlag.nome')}</label>
      <input
        type="text"
        id="nome"
        name="nome"
        required
        aria-required="true"
        maxLength={MAX_CAMPO}
        placeholder={t('frmCadastroFlag.nomeHolder')}
        value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erros.nome) setErros(prev => ({ ...prev, nome: null }));
              }}        
        className={erros.nome ? stylesModal.inputErro : ''}
      />
      {erros.nome && <span className={stylesModal.msgErro} role="alert">{erros.nome}</span>}

      <label htmlFor="cor">{t('frmCadastroFlag.cor')}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        <input
          type="color"
          value={cor}
          onChange={(e) => setCor(e.target.value.toUpperCase())}
          style={{ width: '35px', height: '35px', border: 'none', cursor: 'pointer' }}
        />
        <input
          type="text"
          id="cor"
          name="cor"
          required
          aria-required="true"
          maxLength={7}
          placeholder={t('frmCadastroFlag.corHolder')}
          value={cor}
          onChange={(e) => { setCor(e.target.value.toUpperCase());
            if (erros.cor) setErros(prev => ({ ...prev, cor: null }));
          }} 
          className={erros.cor ? stylesModal.inputErro : ''}
        />        
        {!cor.match(/^#[0-9A-Fa-f]{6}$/) &&
        <SvgBloqueado style={{ transform: 'scale(1.25)', transformOrigin: 'center', marginLeft: '0.2em' }} /> 
        }
      </div>
      {erros.cor && <span className={stylesModal.msgErro} role="alert">{erros.cor}</span>}

      <div className='colunas'>
        <button type="submit"> {id === 0 ? t('cadastrar') : t('atualizar')}</button>
        <button type="button" onClick={handleClose}>{t('fechar')}</button>
      </div>
    </form>
    </div>
    </div>
   )
}

export default FormCadastroFlag;
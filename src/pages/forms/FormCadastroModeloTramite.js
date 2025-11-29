import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';
import { URL_API } from '../../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend, ChamarSplash, MAX_CAMPO, MAX_DESCRICAO } from '../../util/servico';
import { usePerguntaDlg } from  '../../components/alerta/usePerguntaDlg';
import { useCustomAlerta } from  '../../components/alerta/useCustomAlerta';
import { TbTemplate } from "react-icons/tb";

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

function FormCadastroModeloTramite() {
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
  const [nomeTramite, setNomeTramite] = useState('');
  const [descricaoTramite, setDescricaoTramite] = useState('');
  const [duracaoPrevistaDias, setDuracaoPrevistaDias] = useState(0);
  const [usuIdIndicacao, setUsuIdIndicacao] = useState(0);
  const [usuIdRevisor, setUsuIdRevisor] = useState(0);
  const [mtraMtarId, setMtraMtarId] = useState(0);
  const [ordem, setOrdem] = useState(0);
  
  const [usuariosRevisor, setUsuariosRevisor] = useState([]);
  const [selectedRevisorId, setSelectedRevisorId] = useState(0);
  const [usuariosIndicacao, setUsuariosIndicacao] = useState([]);
  const [selectedIndicacaoId, setSelectedIndicacaoId] = useState(0);

  const [erros, setErros] = useState({});

  useEffect(() => {
    if (!itemSelecionado) {
      navigate(-1);
      return;
    }

    async function carregarUsuarios() {
      try {
        const tokenAtual = GetDadosLogin("token");
        setToken(tokenAtual);

        const resposta = await fetch(URL_API + 'Usuarios', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${tokenAtual}`
          }
        });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

        const lista = [
          { usuId: 0, usuNome: 'NENHUM' },
          ...dados
        ];

        setUsuariosRevisor(lista);
        setUsuariosIndicacao(lista);
      } catch (e) {
        Alerta({ mensagem: t('api.apiErro') });
      }
    }

    carregarUsuarios();

    if (itemSelecionado.mtraId > 0) {
      setId(itemSelecionado.mtraId);
      setNomeTramite(itemSelecionado.mtraNomeTramite);
      setDescricaoTramite(itemSelecionado.mtraDescricaoTramite);
      setDuracaoPrevistaDias(itemSelecionado.mtraDuracaoPrevistaDias);
      setUsuIdRevisor(itemSelecionado.mtraUsuIdRevisor);
      setUsuIdIndicacao(itemSelecionado.mtraUsuIdIndicacao);
      setSelectedRevisorId(itemSelecionado.mtraUsuIdRevisor);
      setSelectedIndicacaoId(itemSelecionado.mtraUsuIdIndicacao);
      setMtraMtarId(itemSelecionado.mtraMtarId);
      setOrdem(itemSelecionado.mtraOrdem);
    } else {
      setId(0);
      setMtraMtarId(itemSelecionado?.mtraMtarId ?? 0);
    }

  }, [itemSelecionado, Alerta, t, navigate, mtraMtarId]);

  function ValidarFormulario() {
    const novosErros = {};

    if (!nomeTramite?.trim()) {      
      novosErros.nomeTramite = t('preenchimentoObrigatorio');
    }

    if (!descricaoTramite?.trim()) {
      novosErros.descricaoTramite = t('preenchimentoObrigatorio');
    }
    
    if (!duracaoPrevistaDias || duracaoPrevistaDias < 1) {
      novosErros.duracaoPrevistaDias = t('preenchimentoObrigatorio');
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
        const resposta = await fetch(URL_API+'ModelosTramite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              mtraNomeTramite: nomeTramite,
              mtraDescricaoTramite: descricaoTramite,
              mtraDuracaoPrevistaDias: duracaoPrevistaDias,
              mtraUsuIdRevisor: usuIdRevisor || 0,
              mtraUsuIdIndicacao: usuIdIndicacao || 0,
              mtraMtarId: mtraMtarId
            })
          });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

      } else {
        const url = new URL(`${URL_API}ModelosTramite/${id}`);
        const resposta = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mtraNomeTramite: nomeTramite,
          mtraDescricaoTramite: descricaoTramite,
          mtraDuracaoPrevistaDias: duracaoPrevistaDias,
          mtraUsuIdRevisor: usuIdRevisor || 0,
          mtraUsuIdIndicacao: usuIdIndicacao || 0
        })
        });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }
      }
    
      const msg = id === 0 ? t('cadastroSalvo') : t('cadastroAtualizado');
      ChamarSplash(msg + ": " + nomeTramite);

      window.dispatchEvent(new Event("atualizarListaModelosTramite"));
      navigate(-1);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }
  
  const handleChangeRevisor = (e) => {
    const idSelecionado = parseInt(e.target.value);
    setSelectedRevisorId(idSelecionado);
    setUsuIdRevisor(idSelecionado);
  };

  const handleChangeIndicacao = (e) => {
    const idSelecionado = parseInt(e.target.value);
    setSelectedIndicacaoId(idSelecionado);
    setUsuIdIndicacao(idSelecionado);    
  };  
  
  return (
  <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
    <div className={`${stylesModal.larguraModal} ${isModal ? stylesModal.modalContent : ''}`}>

    {ComponenteAlerta}
    {ComponentePergunta}

    <h1>
      <TbTemplate style={{ transform: 'scale(1.3)', transformOrigin: 'center', marginRight: '0.4em' }} /> { id === 0 ? t('frmCadastroModeloTramite.tituloCadastro') : t('frmCadastroModeloTramite.tituloAtualizar') }
    </h1>

    <form onSubmit={handleSubmit}>

      <div className="colunas">
      <label htmlFor="nomeTramite">{t('frmCadastroModeloTramite.nomeTramite')}</label>
      <label >{ordem > 0 && `${t('frmCadastroModeloTramite.ordem')}: ${ordem}`}</label>
      </div>
      <input
        type="text"
        id="nomeTramite"
        name="nomeTramite"
        required
        aria-required="true"        
        maxLength={MAX_CAMPO}
        placeholder={t('frmCadastroModeloTramite.nomeTramiteHolder')}
        value={nomeTramite}
              onChange={(e) => {
                setNomeTramite(e.target.value);
                if (erros.nomeTramite) setErros(prev => ({ ...prev, nomeTramite: null }));
              }}        
        className={erros.nomeTramite ? stylesModal.inputErro : ''}
      />
      {erros.nomeTramite && <span className={stylesModal.msgErro} role="alert">{erros.nomeTramite}</span>}

      <label htmlFor="descricaoTramite">{t('frmCadastroModeloTramite.descricaoTramite')}</label>
      <input
        type="text"
        id="descricaoTramite"
        name="descricaoTramite"
        required
        aria-required="true"        
        maxLength={MAX_DESCRICAO}
        placeholder={t('frmCadastroModeloTramite.descricaoTramiteHolder')}
        value={descricaoTramite}
              onChange={(e) => {
                setDescricaoTramite(e.target.value);
                if (erros.descricaoTramite) setErros(prev => ({ ...prev, descricaoTramite: null }));
              }}        
        className={erros.descricaoTramite ? stylesModal.inputErro : ''}
      />
      {erros.descricaoTramite && <span className={stylesModal.msgErro} role="alert">{erros.descricaoTramite}</span>}

      <label htmlFor="duracaoPrevistaDias">{t('frmCadastroModeloTramite.duracaoPrevistaDias')}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="\d*"
        id="duracaoPrevistaDias"
        name="duracaoPrevistaDias"
        required
        aria-required="true"        
        value={duracaoPrevistaDias}
        onChange={(e) => {
          const valor = e.target.value.toString().replace(/[^\d]/g, '');
          const numero = Number(valor);
          if (numero > 0) {
            setDuracaoPrevistaDias(Number(valor));
            if (erros.duracaoPrevistaDias) setErros(prev => ({ ...prev, duracaoPrevistaDias: null }));
          }
        }}
        placeholder={t('frmCadastroModeloTramite.duracaoPrevistaDiasHolder')}
        min={0}
        step={1}
        className={erros.duracaoPrevistaDias ? stylesModal.inputErro : ''}
        />
        {erros.duracaoPrevistaDias && <span className={stylesModal.msgErro} role="alert">{erros.duracaoPrevistaDias}</span>}

        <label htmlFor="usuarioRevisor">{t('frmCadastroModeloTramite.usuarioRevisor')}</label>
        <select id="usuarioRevisor" value={selectedRevisorId} onChange={handleChangeRevisor}>
          {usuariosRevisor.map(usuariosRevisor => (
            <option key={usuariosRevisor.usuId} value={usuariosRevisor.usuId}>
              {usuariosRevisor.usuNome}
            </option>
          ))}
        </select>
        {erros.usuarioRevisor && <span className={stylesModal.msgErro} role="alert">{erros.usuarioRevisor}</span>}

        <label htmlFor="usuarioIndicacao">{t('frmCadastroModeloTramite.usuarioIndicacao')}</label>
        <select id="usuarioIndicacao" value={selectedIndicacaoId} onChange={handleChangeIndicacao}>
          {usuariosIndicacao.map(usuariosIndicacao => (
            <option key={usuariosIndicacao.usuId} value={usuariosIndicacao.usuId}>
              {usuariosIndicacao.usuNome}
            </option>
          ))}
        </select>
        {erros.usuarioIndicacao && <span className={stylesModal.msgErro} role="alert">{erros.usuarioIndicacao}</span>}

      <div className='colunas'>
        <button type="submit"> {id === 0 ? t('cadastrar') : t('atualizar')}</button>
        <button type="button" onClick={handleClose}>{t('fechar')}</button>
      </div>
    </form>
    </div>
    </div>
   )
}

export default FormCadastroModeloTramite;
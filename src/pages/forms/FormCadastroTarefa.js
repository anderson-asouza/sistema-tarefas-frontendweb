import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';
import { URL_API } from '../../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend, ChamarSplash, MAX_CAMPO, MAX_DESCRICAO } from '../../util/servico';
import { usePerguntaDlg } from  '../../components/alerta/usePerguntaDlg';
import { useCustomAlerta } from  '../../components/alerta/useCustomAlerta';
import Loading from '../../components/outros/Loading';
import { SvgETarefas } from '../../components/outros/Svg';

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

function FormCadastroTarefa() {
  const location = useLocation();
  const state = location.state;
  const isModal = !!state?.backgroundLocation;
  const itemSelecionado = location.state?.itemSelecionado;
    
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [ativaLoading, setAtivaLoading] = useState(false);  
  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const handleClose = () => navigate(-1);
  const [token, setToken] = useState("");

  const [id, setId] = useState(0);
  const [nomeTarefa, setNomeTarefa] = useState('');
  const [descricaoTarefa, setDescricaoTarefa] = useState('');

  const [modelosTarefa, setModelosTarefa] = useState([]);  
  const [selectedModeloTarefaId, setSelectedModeloTarefaId] = useState(0);  
  const [descricaoModeloTarefa, setDescricaoModeloTarefa] = useState('');

  const [erros, setErros] = useState({});

  useEffect(() => {
    try {
      const tokenAtual = GetDadosLogin("token");
      setToken(tokenAtual);

      async function carregarTarefas() {
        try {
          const resposta = await fetch(URL_API + 'ModelosTarefa', {
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

          setModelosTarefa(dados);

          if (dados.length === 0)
          {
            ChamarSplash(t('frmCadastroTarefa.naoHaModelosTarefa'), "erro", 5);
            navigate(-1);
            return;
          }

          if (!itemSelecionado) {
            setSelectedModeloTarefaId(dados[0].mtarId);
            setDescricaoModeloTarefa(dados[0].mtarDescricao || '');
          }
        } catch (e) {
          Alerta({ mensagem: t('api.apiErro') });
        }
      }

      carregarTarefas();

      if (itemSelecionado)
      {
        setId(itemSelecionado.tarId);
        setNomeTarefa(itemSelecionado.tarNomeTarefa);
        setDescricaoTarefa(itemSelecionado.tarDescricao);

        setSelectedModeloTarefaId(itemSelecionado.tarMtarId);
        setDescricaoModeloTarefa(itemSelecionado.mtarDescricao || '');
      }
    } catch (err) {
      Alerta({ mensagem: t('api.apiErro') });
    } finally {
      setAtivaLoading(false);
    }

  }, [token, itemSelecionado, Alerta, navigate, t]);

  function ValidarFormulario() {
    const novosErros = {};

    if (!nomeTarefa?.trim()) {
      novosErros.nomeTarefa = t('preenchimentoObrigatorio');
    }

    if (!descricaoTarefa?.trim()) {
      novosErros.descricaoTarefa = t('preenchimentoObrigatorio');
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
        const resposta = await fetch(URL_API+'Tarefas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              tarNomeTarefa: nomeTarefa,
              tarDescricao: descricaoTarefa,
              tarMtarId: selectedModeloTarefaId
            })
          });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

      } else {

        const url = new URL(`${URL_API}Tarefas/${id}`);
        const resposta = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tarNomeTarefa: nomeTarefa,
          tarDescricao: descricaoTarefa
        })
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

    }
    
      ChamarSplash(id === 0 ? t('cadastroSalvo') : t('cadastroAtualizado'));

      window.dispatchEvent(new Event("atualizarListaTarefas"));
      navigate(-1);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  const handleChangeModeloTarefas = (e) => {
    const idSelecionado = parseInt(e.target.value);
    setSelectedModeloTarefaId(idSelecionado);

    const modeloTarefaSelecionada = modelosTarefa.find(t => t.mtarId === idSelecionado);
    setDescricaoModeloTarefa(modeloTarefaSelecionada?.mtarDescricao || '');
  };  
  
  return (
  <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
    <div className={`${stylesModal.larguraModal} ${isModal ? stylesModal.modalContent : ''}`}>

    {ComponenteAlerta}
    {ComponentePergunta}

    <h1>
      <SvgETarefas style={{ transform: 'scale(1.3)', transformOrigin: 'center', marginRight: '0.4em' }} /> { id === 0 ? t('frmCadastroTarefa.tituloCadastro') : t('frmCadastroTarefa.tituloAtualizar') }
    </h1>

    {ativaLoading ? (<Loading />) :
    (
    <form onSubmit={handleSubmit}>

      <div>
        <label htmlFor="modeloTarefas">{t('frmCadastroTarefa.selecioneModeloTarefa')}</label>
        <select id="modeloTarefas" value={selectedModeloTarefaId} onChange={handleChangeModeloTarefas} disabled={id > 0}>
          {modelosTarefa.map(modelosTarefa => (
            <option key={modelosTarefa.mtarId} value={modelosTarefa.mtarId}>
              {modelosTarefa.mtarNome}
            </option>
          ))}
        </select>
        <span className="centraliza negrito">{t('frmCadastroTarefa.descricaoModeoTarefa')}</span>
        <div style={{ minHeight: '3em', display: 'flex', alignItems: 'center' }}>{descricaoModeloTarefa}</div>
        <hr />
        <div>&nbsp;</div>
      </div>

      <label htmlFor="nomeTarefa">{t('frmCadastroTarefa.nomeTarefa')}</label>
      <input
        type="text"
        id="nomeTarefa"
        name="nomeTarefa"
        required
        aria-required="true"
        maxLength={MAX_CAMPO}
        placeholder={t('frmCadastroTarefa.nomeTarefaHolder')}
        value={nomeTarefa}
              onChange={(e) => {
                setNomeTarefa(e.target.value);
                if (erros.nomeTarefa) setErros(prev => ({ ...prev, nomeTarefa: null }));
              }}        
        className={erros.nomeTarefa ? stylesModal.inputErro : ''}
      />
      {erros.nomeTarefa && <span className={stylesModal.msgErro} role="alert">{erros.nomeTarefa}</span>}

      <label htmlFor="nome">{t('frmCadastroTarefa.descricaoTarefa')}</label>
      <input
        type="text"
        id="descricaoTarefa"
        name="descricaoTarefa"
        required
        aria-required="true"        
        maxLength={MAX_DESCRICAO}
        placeholder={t('frmCadastroTarefa.descricaoTarefaHolder')}
        value={descricaoTarefa}
              onChange={(e) => {
                setDescricaoTarefa(e.target.value);
                if (erros.descricaoTarefa) setErros(prev => ({ ...prev, descricaoTarefa: null }));
              }}        
        className={erros.descricaoTarefa ? stylesModal.inputErro : ''}
      />
      {erros.descricaoTarefa && <span className={stylesModal.msgErro} role="alert">{erros.descricaoTarefa}</span>}

      <div className='colunas'>
        <button type="submit"> {id === 0 ? t('cadastrar') : t('atualizar')}</button>
        <button type="button" onClick={handleClose}>{t('fechar')}</button>
      </div>
    </form>
    )}
    </div>
    </div>
   )
}

export default FormCadastroTarefa;
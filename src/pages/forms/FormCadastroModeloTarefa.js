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

function FormCadastroModeloTarefa() {
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
  const [nomeTarefa, setNomeTarefa] = useState('');
  const [descricaoTarefa, setDescricaoTarefa] = useState('');

  const [erros, setErros] = useState({});

  useEffect(() => {
    setToken(GetDadosLogin("token"));
    if (itemSelecionado)
    {
      setId(itemSelecionado.mtarId);
      setNomeTarefa(itemSelecionado.mtarNome);
      setDescricaoTarefa(itemSelecionado.mtarDescricao);
    }

  }, [itemSelecionado]);

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
        const resposta = await fetch(URL_API+'ModelosTarefa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              mtarNome: nomeTarefa,
              mtarDescricao: descricaoTarefa
            })
          });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

      } else {
        const url = new URL(`${URL_API}ModelosTarefa/${id}`);
        const resposta = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mtarNome: nomeTarefa,
          mtarDescricao: descricaoTarefa
        })
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

    }
    
      ChamarSplash(id === 0 ? t('cadastroSalvo') : t('cadastroAtualizado'));

      window.dispatchEvent(new Event("atualizarListaModelosTarefa"));
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
      <TbTemplate style={{ transform: 'scale(1.3)', transformOrigin: 'center', marginRight: '0.4em' }} /> { id === 0 ? t('frmCadastroModeloTarefa.tituloCadastro') : t('frmCadastroModeloTarefa.tituloAtualizar') }
    </h1>

    <form onSubmit={handleSubmit}>

      <label htmlFor="nomeTarefa">{t('frmCadastroModeloTarefa.nomeTarefa')}</label>
      <input
        type="text"
        id="nomeTarefa"
        name="nomeTarefa"
        required
        aria-required="true"        
        maxLength={MAX_CAMPO}
        placeholder={t('frmCadastroModeloTarefa.nomeTarefaHolder')}
        value={nomeTarefa}
              onChange={(e) => {
                setNomeTarefa(e.target.value);
                if (erros.nomeTarefa) setErros(prev => ({ ...prev, nomeTarefa: null }));
              }}        
        className={erros.nomeTarefa ? stylesModal.inputErro : ''}
      />
      {erros.nomeTarefa && <span className={stylesModal.msgErro} role="alert">{erros.nomeTarefa}</span>}

      <label htmlFor="nome">{t('frmCadastroModeloTarefa.descricaoTarefa')}</label>
      <input
        type="text"
        id="descricaoTarefa"
        name="descricaoTarefa"
        required
        aria-required="true"        
        maxLength={MAX_DESCRICAO}
        placeholder={t('frmCadastroModeloTarefa.descricaoTarefaHolder')}
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
    </div>
    </div>
   )
}

export default FormCadastroModeloTarefa;
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomAlerta } from  '../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../components/alerta/usePerguntaDlg';
import { useTranslation } from 'react-i18next';
import stylesLst from './listas/Lst.module.css';
import stylesModal from './forms/FormModal.module.css';
import { URL_API, FLAGS } from '../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend, ChamarSplash } from '../util/servico';
import { SvgFlag, SvgEFlags } from "../components/outros/Svg";
import { FaRegSquare } from "react-icons/fa6";
import Loading from '../components/outros/Loading';


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

function EscolhaFlag() {
  const location = useLocation();   
  const navigate = useNavigate();

  const state = location.state;  
  const isModal = !!state?.backgroundLocation;

  const { t } = useTranslation();
  const [ativaLoading, setAtivaLoading] = useState(false);

  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const idTarefa = location.state?.idTarefa ?? 0;  
  const [token, setToken] = useState('');

  const [itemSelecionado, setItemSelecionado] = useState({});  
  const [dados, setDados] = useState([]);

  useEffect(() => {
    if (!idTarefa || idTarefa < 1) {
      navigate(-1);
      return null;
    }

    const token = GetDadosLogin("token");
    setToken(token);

    const delay = (tempo) => new Promise(resolve => setTimeout(resolve, tempo));
  
    const buscarDados = async () => {
      setAtivaLoading(true);
      try {       
        let url = new URL(`${URL_API}Flags`);
  
        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
  
        const { erro, dados } = await ValidaRetornoAPI(resposta, t);
  
        if (erro) {
          if (dados && dados.errorCode === "REGISTRO_NAO_ENCONTRADO")
          {
            ChamarSplash("Flag - "+TraduzMensagemErroBackend(erro, dados, t), "erro");
            navigate(-1);
          }

          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          setDados([]);

          return;
        }
  
        if (FLAGS.TESTE_LOADING) 
          await delay(5000);
  
        setDados(dados);
      } catch (ex) {
        Alerta({ mensagem: t('api.apiErro') });
      } finally {
        setAtivaLoading(false);
      }
    };
  
    buscarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idTarefa, navigate]);  

  function handleClose() {
    if (isModal) {
      navigate(-1);
    } else {
      if (token) {
        navigate("/cards", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }  

  async function handleSubmit(item) {
    setItemSelecionado(item);
    const id = item.flaId || 0;

    const confirmado = await Pergunta({ mensagem: id > 0 ? t('escolhaFlag.desejaAtribuirEssaFlag') +'\n'+ item.flaRotulo  : t('escolhaFlag.desejaRemoverFlag') });
    
    if (!confirmado) return;

    try
    {
      let url = new URL(`${URL_API}Tarefas/marcar-flag/${idTarefa}`);
      
      url.searchParams.append("idFlag", id);

      const resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

      ChamarSplash(item.flaId > 0 ? <>{t('escolhaFlag.flagAtribuidaTarefa')}: {item.flaRotulo}</> : t('escolhaFlag.flagRemovida'));

      window.dispatchEvent(new Event("atualizarCards"));
      //navigate(-1);//
      handleClose();      
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }
  
  return (
    <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
      <div style={{ width: '20em' }} className={`${isModal ? stylesModal.modalContent : ''}`}>

        {ComponentePergunta}
        {ComponenteAlerta}

        <h1>
          <SvgEFlags /> {t('escolhaFlag.marcacaoFlagTarefa')}
        </h1>

        {ativaLoading ? (<Loading />) :
        (
          <div>
            <table className={stylesLst.listaItens}>
              <thead>
                <tr>
                  <th>{t('escolhaFlag.nomeRotulo')}</th>
                  <th style={{ width: '3em' }}>{t('escolhaFlag.flag')}</th>
                </tr>
              </thead>
              <tbody>
                <tr onClick={() => handleSubmit({flaId : 0})} className={itemSelecionado?.['flaId'] === 0 ? stylesLst.linhaSelecionada : ''}>                  
                  <td>{t('escolhaFlag.removerFlag')}</td>
                  <td className={stylesLst.celulaCentralizada}><FaRegSquare style={{ transform: 'scale(1.2)' }} /></td>
                </tr>

                {dados.map((item) => {
                  const primaryKey = Object.keys(item)[0];
                  const isSelecionado = itemSelecionado?.[primaryKey] === item[primaryKey];

                  return (
                    <tr onClick={() => handleSubmit(item)} className={isSelecionado ? stylesLst.linhaSelecionada : ''}>
                      <td>{item.flaRotulo}</td>
                      <td className={stylesLst.celulaCentralizada}><SvgFlag style={item.flaCor ? { transform: 'scale(1.2)', color: `${item.flaCor}` } : {}} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button onClick={handleClose}>{t('fechar')}</button>
          </div>
        )
        }

      </div>
    </div>
  )
}

export default EscolhaFlag;
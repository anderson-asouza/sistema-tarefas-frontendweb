import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomAlerta } from  '../components/alerta/useCustomAlerta';
import { useTranslation } from 'react-i18next';
import { isMobile } from "../util/DeviceContext";
import stylesModal from './forms/FormModal.module.css';
import styles from './CardDetalhe.module.css';
import Loading from '../components/outros/Loading';
import { URL_API } from '../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend, tMobile, AlertaVencimento, PRAZO_ALERTA_TAREFA, PRAZO_ALERTA_TRAMITE } from '../util/servico';
import { FormatarData } from '../util/formatacao';
import { FLAGS } from '../util/config';
import { GiMagnifyingGlass } from "react-icons/gi";
import { SvgFlag } from '../components/outros/Svg';

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

function CardDetalhe() {
  const location = useLocation();   
  const navigate = useNavigate();

  const state = location.state;  
  const isModal = !!state?.backgroundLocation;

  const traTarId = location.state?.traTarId ?? -1;

  const { t } = useTranslation();

  const [ativaLoading, setAtivaLoading] = useState(false);
  const { Alerta, ComponenteAlerta } = useCustomAlerta();

  const [dados, setDados] = useState([]);
  const [item, setItem] = useState({});
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (!traTarId || traTarId < 1) {
      navigate(-1);
    }

    const delay = (tempo) => new Promise(resolve => setTimeout(resolve, tempo));
  
    const buscarDados = async () => {
      setAtivaLoading(true);
      try {
        const token = GetDadosLogin("token");      
  
        let url = new URL(`${URL_API}Tramites`);
        url.searchParams.append("idTarefa", traTarId);
  
        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
  
        const { erro, dados, count } = await ValidaRetornoAPI(resposta, t);
  
        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }
  
        if (FLAGS.TESTE_LOADING) 
          await delay(5000);

        if (count === 0)
          handleClose();
  
        setDados(dados);
        setItem(dados[count -1]);
        setIndice(count -1);
      } catch (err) {
        Alerta({ mensagem: t('api.apiErro') });
      } finally {
        setAtivaLoading(false);
      }
    };
  
    buscarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traTarId, navigate]);

  useEffect(() => {
    if (dados && dados.length > 0) {
      setItem(dados[indice]);
    } else {
      setItem({});
    }
  }, [indice, dados]);

  const [expandido, setExpandido] = useState({});

  const alternarExpandir = (campo) => {
    setExpandido(expandido === campo ? null : campo);
  };

  const avancar = () => {
    if (indice < dados.length - 1) {
      setIndice(indice + 1);
      setExpandido({});
    }
  };

  const voltar = () => {
    if (indice > 0) {
      setIndice(indice - 1);
      setExpandido({});
    }
  };

  function handleClose() {
    if (isModal) {
      navigate(-1);
    } else {
      if (GetDadosLogin("token")) {
        navigate("/cards", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }
  
  
  return (
    <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
      <div className={`${stylesModal.larguraModal} ${isModal ? stylesModal.modalContent : ''}`}>

        {ComponenteAlerta}

        <div className={styles.container}>
          {dados.length === 0 || ativaLoading ? (<Loading />) :
          (
            <div>
              <div className={`${styles.campoTitulo} centraliza ${expandido === "tarNomeTarefa" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("tarNomeTarefa")}>
                <AlertaVencimento data={dados[0].tarDataFinalPrevista} diasPraVencer={PRAZO_ALERTA_TAREFA} />
                {dados[0].flaRotulo && <><SvgFlag style={dados[0].flaCor ? { transform: 'scale(1.2)', color: `${dados[0].flaCor}` } : {}} title={dados[0].flaRotulo || undefined}/> &nbsp; </>}
                {dados[0].tarNomeTarefa} &nbsp; <GiMagnifyingGlass />
              </div>

              <label>{t('cardDetalhe.descricaoTarefa')}</label>
              <div className={`${styles.campo} ${expandido === "tarDescricao" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("tarDescricao")}>
                {dados[0].tarDescricao}
              </div>

              <div className="colunas">
                <div>
                  <label>{t('cardDetalhe.tramite')}</label>
                  <div className={`${styles.campo} ${dados[0].traRepetido ? 'vermelho' : ''} ${expandido === "traRepetido" ? styles.itemExpandido : styles.itemCondensado}`} 
                  onClick={() => alternarExpandir("traRepetido")}>
                    {dados[0].traRepetido ? t('cardDetalhe.tramiteRepetido') : t('cardDetalhe.tramiteNormal')}
                  </div>
                </div>
                <div>
                  <label>{tMobile(t, "cardDetalhe.dataComeco", isMobile)}</label>
                  <div className={`${styles.campo} ${expandido === "tarDataComeco" ? styles.itemExpandido : styles.itemCondensado}`} 
                  onClick={() => alternarExpandir("tarDataComeco")}>
                    {FormatarData(dados[0].tarDataComeco)}
                  </div>
                </div>
                <div>
                  <label>{tMobile(t, "cardDetalhe.dataFinalPrevista", isMobile)}</label>
                  <div className={`${styles.campo} ${expandido === "tarDataFinalPrevista" ? styles.itemExpandido : styles.itemCondensado}`} 
                  onClick={() => alternarExpandir("tarDataFinalPrevista")}>
                    {FormatarData(dados[0].tarDataFinalPrevista)}
                  </div>
                </div>
              </div>

              <label>{t('cardDetalhe.responsavel')}</label>
              <div className={`${styles.campo} ${expandido === "usuNomeResponsavel" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("usuNomeResponsavel")}>
                {dados[0].usuNomeResponsavel}
              </div>

              <p><hr/></p>

              <label>{t('cardDetalhe.nomeTramite')}</label>
              <div className={`${styles.campo} ${expandido === "mtraNome" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("mtraNome")}>
                <AlertaVencimento data={item.traDataPrevisaoTermino} diasPraVencer={PRAZO_ALERTA_TRAMITE}  /> {item.mtraNome}
              </div>

              <label>{t('cardDetalhe.descricaoTramite')}</label>
              <div className={`${styles.campo} ${expandido === "mtraDescricao" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("mtraDescricao")}>
                {item.mtraDescricao}
              </div>

              <div className="colunas">
                <div>
                  <label>{tMobile(t, "cardDetalhe.dataInicio", isMobile)}</label>
                  <div className={isMobile ? styles.campoSimples : styles.campo}>
                    {FormatarData(item.traDataInicio)}
                  </div>
                </div>
                <div>
                  <label>{tMobile(t, "cardDetalhe.dataPrevista", isMobile)}</label>
                  <div className={isMobile ? styles.campoSimples : styles.campo}>
                    {FormatarData(item.traDataPrevisaoTermino)}
                  </div>
                </div>
                <div>
                  <label>{tMobile(t, "cardDetalhe.dataExecutado", isMobile)}</label>
                  <div className={isMobile ? styles.campoSimples : styles.campo}>
                    {item.traDataExecucao ? FormatarData(item.traDataExecucao) : "-"}
                  </div>
                </div>
                <div>
                  <label>{tMobile(t, "cardDetalhe.dataRevisao", isMobile)}</label>
                  <div className={isMobile ? styles.campoSimples : styles.campo}>
                    {(item.usuNomeRevisor) ? (item.traDataRevisao) ? FormatarData(item.traDataRevisao) : "-" : "******"}
                  </div>
                </div>

              </div>

              <label>{t('cardDetalhe.tramitador')}</label>
              <div className={`${styles.campo} ${expandido === "usuNomeTramitador" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("usuNomeTramitador")}>
                {item.usuNomeTramitador ? item.usuNomeTramitador : t('lstTramites.semTramitador')}
              </div>

              <label>{t('cardDetalhe.notaTramitador')}</label>
              <div className={`${styles.campo} ${expandido === "traNotaTramitador" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("traNotaTramitador")}>
                {item.traNotaTramitador ? item.traNotaTramitador : "\u00A0"}
              </div>

              <label>{t('cardDetalhe.revisor')}</label>
              <div className={`${styles.campo} ${expandido === "usuNomeRevisor" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("usuNomeRevisor")}>
                {item.usuNomeRevisor ? item.usuNomeRevisor : t('lstTramites.semRevisor')}
              </div>

              { item.usuNomeRevisor && <>
              <label>{t('cardDetalhe.notaRevisor')}</label>
              <div className={`${styles.campo} ${expandido === "traNotaRevisor" ? styles.itemExpandido : styles.itemCondensado}`} 
              onClick={() => alternarExpandir("traNotaRevisor")}>
                {item.traNotaRevisor ? item.traNotaRevisor : "\u00A0"}
              </div></>}

            </div>
          )}
          <div className='colunas'>
            { (dados.length > 0 && ativaLoading === false) &&
              <>
              <button type="button" onClick={() => voltar()}>◀ {!isMobile && t('cardDetalhe.anterior')}</button>
              <label>{t('cardDetalhe.ordemTramite')}: {indice+1} / {dados.length}</label>
              <button type="button" onClick={() => avancar()}>{!isMobile && t('cardDetalhe.proximo')} ▶</button>
              </>
            }
            <button type="button" onClick={() => handleClose()}>{t('fechar')}</button>
          </div>

        </div>

      </div>
    </div>
  )
}

export default CardDetalhe;
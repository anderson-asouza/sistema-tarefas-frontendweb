import { useState, useEffect } from "react";
import { URL_API } from '../util/config';
import styles from './Cards.module.css';
import { useCustomAlerta } from '../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../components/alerta/usePerguntaDlg';
import { SvgResponsavel, SvgRevisor, SvgTramitador, SvgTarefaOK, SvgTarefaFalha, SvgFlag, SvgEFlags } from "../components/outros/Svg";
import { useNavigate, useLocation  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../components/outros/Loading';
import { ValidaRetornoAPI, TraduzMensagemErroBackend, GetDadosLogin, ChamarSplash, statusTramites, AlertaVencimento, PRAZO_ALERTA_TAREFA, PRAZO_ALERTA_TRAMITE } from '../util/servico';
import { GiMagnifyingGlass, GiPriceTag } from "react-icons/gi";
import { FaTag } from "react-icons/fa6";
import { GrTag } from "react-icons/gr";

function Dashboard() {
  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const [ativaLoading, setAtivaLoading] = useState(false);
  const [dados, setDados] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  //const handleClose = () => navigate(-1);
  
  const [token, setToken] = useState('');
  const [id, setId] = useState(-1);

  const [forcarAtualizacao, setForcarAtualizacao] = useState(false);

  useEffect(() => {      
    const tokenAtual = GetDadosLogin("token");
    setId(GetDadosLogin("id"));

    setToken(tokenAtual);

    async function carregarCards() {
      try {
        setAtivaLoading(true);

        const url = new URL(`${URL_API}Tramites/buscar-tramites-usuario`);

        url.searchParams.append('ordenarDataComeco', true);

        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${tokenAtual}`
          }
        });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {          
          if (!(dados && dados.errorCode === "REGISTRO_NAO_ENCONTRADO"))
          {            
            Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
            return;
          }

          setDados([]);
        } else {
          setDados(dados);
        }

      } catch (e) {
        Alerta({ mensagem: t('api.apiErro') });
      } finally {
        setAtivaLoading(false);
      }
    }

    carregarCards();

    window.addEventListener("atualizarCards", carregarCards);

    return () => {window.removeEventListener("atualizarCards", carregarCards);};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, Alerta, navigate, forcarAtualizacao]);

  async function handleAssumirTramite(item) {
    const confirmado = await Pergunta({ mensagem: t('cards.desejaAssumir') });
    
    if (!confirmado) return;
    
    try {
      const url = new URL(`${URL_API}Tramites/assumir-tramite/${item.traId}`);
    
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
    
      ChamarSplash(t('cards.tramiteAssumido')+": "+item.mtraNome);
        
      setForcarAtualizacao(!forcarAtualizacao);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  async function handleComecarTramite(item) {

    const confirmado = await Pergunta({ mensagem: t('cards.desejaComecarTramite') });
      
    if (!confirmado) return;
    
    try {
      const url = new URL(`${URL_API}Tramites/comecar-execucao-tramite/${item.traId}`);
    
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
    
      ChamarSplash(t('lstTramites.tramiteIncluido')+": "+item.mtraNome);
        
      setForcarAtualizacao(!forcarAtualizacao);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  return (
    <>
      {ComponenteAlerta}
      {ComponentePergunta}

      <div className={styles.container}>
        {ativaLoading ? (<Loading />) :
        (
          <>
          {dados.length === 0 && <h1>{t('cards.naoHaCards')}</h1>}
          <div className={styles.listaCards}>
            {dados.map((item) => {
            const IconComponent = statusTramites(item.traStatus);

            return (              
              <div key={item.traId} className={styles.card}>
                <div className={styles.titulo}>
                <div><AlertaVencimento data={item.tarDataFinalPrevista} diasPraVencer={PRAZO_ALERTA_TAREFA} /> {item.flaRotulo && <><SvgFlag style={item.flaCor ? { transform: 'scale(1.2)', color: `${item.flaCor}` } : {}} title={item.flaRotulo || undefined}/> &nbsp; </>}
                {item.tarNomeTarefa}</div>
                <p><AlertaVencimento data={item.traDataPrevisaoTermino} diasPraVencer={PRAZO_ALERTA_TRAMITE}  /> {item.mtraNome}</p>
                </div>
                <div className={styles.categoria}>
                  {<IconComponent title={item.traStatusDescricao} />}
                  {item.traStatusDescricao}
                  {item.tarUsuIdResponsavelTarefa === id && <SvgResponsavel title={t('cards.hintResponsavel')} />}
                  {item.traUsuIdRevisor === id && <SvgRevisor title={t('cards.hintRevisor')} />}
                  {item.traUsuIdTramitador === id && <SvgTramitador  title={t('cards.hintTramitador')} />}
                </div>
                <ul>
                  {(item.traUsuIdTramitador === 0 && item.traUsuIdRevisor !== id) && <li role="button" aria-label={t('cards.hintAssumirTramite')} >
                    <FaTag onClick={() => handleAssumirTramite(item)} title={t('cards.hintAssumirTramite')} />
                  </li>}
                  {(item.traUsuIdTramitador === id && item.traStatus === 1) && <li role="button" aria-label={t('cards.hintComecarTramite')} >
                    <GrTag onClick={() => handleComecarTramite(item)} title={t('cards.hintComecarTramite')} />
                  </li>}
                  {(item.traUsuIdTramitador === id && item.traStatus === 2) && <li role="button" aria-label={t('cards.hintTerminarExecucaoTramite')} >
                    <GiPriceTag onClick={() => navigate("/nota", { state: { backgroundLocation: location, elemento: item, modo: "E" } })} title={t('cards.hintTerminarExecucaoTramite')} />
                  </li>}
                  {(item.traUsuIdRevisor === id && item.traStatus === 3) && <li role="button" aria-label={t('cards.hintAprovarTramite')} >
                    <SvgTarefaOK onClick={() => navigate("/nota", { state: { backgroundLocation: location, elemento: item, modo: "A" } })} title={t('cards.hintAprovarTramite')} />
                  </li>}
                  {(item.traUsuIdRevisor === id && item.traStatus === 3) && <li role="button" aria-label={t('cards.hintReprovarTramite')} >
                    <SvgTarefaFalha onClick={() => navigate("/nota", { state: { backgroundLocation: location, elemento: item, modo: "R" } })} title={t('cards.hintReprovarTramite')} />
                  </li>}                  
                  {(item.tarUsuIdResponsavelTarefa === id) && <li role="button" aria-label={t('cards.marcarFlag')} >
                    <SvgEFlags onClick={() => navigate("/escolhaflag", { state: { backgroundLocation: location, idTarefa: item.traTarId } })} title={t('cards.marcarFlag')} />
                  </li>}
                  <li role="button" aria-label={t('cards.detalhe')} >
                    <GiMagnifyingGlass  onClick={() => navigate("/carddetalhe", { state: { backgroundLocation: location, traTarId: item.traTarId } })} title={t('cards.detalhe')} />
                  </li>
                </ul>
              </div>
            );
            })}
          </div>
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
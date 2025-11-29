import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomAlerta } from  '../../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../../components/alerta/usePerguntaDlg';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';
import { URL_API } from '../../util/config'
import { GetDadosLogin, ValidaRetornoAPI, TraduzMensagemErroBackend } from '../../util/servico';
import { LuNotebookPen } from "react-icons/lu";
import { SvgTarefaOK, SvgTarefaFalha } from "../../components/outros/Svg";


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

function FormNotas() {
  const location = useLocation();   
  const navigate = useNavigate();

  const state = location.state;  
  const isModal = !!state?.backgroundLocation;

  const elemento = location.state?.elemento ?? {};
  const modo = location.state?.modo ?? "";

  const { t } = useTranslation();

  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();  

  const [nota, setNota] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!modo || modo.trim() === "") {
      navigate(-1);
    }

    setToken(GetDadosLogin("token"));
  }, [modo, navigate]);

  if (!modo || modo.trim() === "") {
    return null;
  }

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

  async function handleSubmit(e) {
    e.preventDefault();

    const confirmado = await Pergunta({ mensagem: t('frmNotas.desejaGravarNota') });
    
    if (!confirmado) return;    

    if (!nota || nota.trim() === "") {
      Alerta({ mensagem: t('frmNotas.notaObrigatoria') });
      return;
    }

    try
    {
      let url;

      if (modo === "E") {
        url = `${URL_API}Tramites/finalizar-execucao-tramite`;
      } else {
        const aprovado = (modo === "A");
        url = `${URL_API}Tramites/revisar-tramite/${aprovado}`;
      }
            
      const idTramite = elemento.traId;

      const resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idTramite,
          nota
        })
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

      window.dispatchEvent(new Event("atualizarCards"));
      //navigate(-1);//
      handleClose();
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }
  
  return (
    <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>    
      <div className={`${stylesModal.larguraModal} ${isModal ? stylesModal.modalContent : ''}`}>

        {ComponentePergunta}
        {ComponenteAlerta}

        <h1>
          {modo === 'E' ? <><LuNotebookPen /> {t('frmNotas.terminarExecucaoTramite')}</> :
          modo === 'A' ? 
          <><SvgTarefaOK color="green"/> {t('frmNotas.tramiteAprovado')}</> : 
          <><SvgTarefaFalha color="red"/> {t('frmNotas.tramiteReprovado')}</> }
        </h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nota">{t('frmNotas.nota')}</label>
        <textarea
          id="nota"
          name="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={t('frmNotas.notaHolder')}
          maxLength={500}
          rows={5}
        />

        <div className='colunas'>
          <button type="submit">{t('ok')}</button>
          <button type="button" onClick={() => handleClose()}>{t('fechar')}</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default FormNotas;
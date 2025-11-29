import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomAlerta } from  '../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../components/alerta/usePerguntaDlg';
import { useSplashMessage } from '../components/alerta/useSplashMessage';
import { useTranslation } from 'react-i18next';
import stylesModal from './FormModal.module.css';

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

function FormModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const isModal = !!state?.backgroundLocation;   
 
  const { t } = useTranslation();

  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();
  const { Splash, ComponenteSplashMessage } = useSplashMessage();
  
  const handleClose = () => navigate(-1);

  return (
  <div className={stylesModal.container} style={isModal ? modalOverlayStyle : pageStyle}>
    <div className={isModal ? stylesModal.modalContent : ''}>
      {ComponenteAlerta}
      <h1>
        Form
      </h1>
      <button onClick={handleClose}>{t('fechar')}</button>
      </div>
    </div>
   )
}

export default FormModal;
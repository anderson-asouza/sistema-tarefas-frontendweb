import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Container from '../layout/Container.js';
import { GetDadosLogin } from '../util/servico';
import { useCustomAlerta } from  '../components/alerta/useCustomAlerta';
import { useSplashMessage } from '../components/alerta/useSplashMessage';
import { useTranslation } from 'react-i18next';
import { DeviceProvider } from "../util/DeviceContext";
import Home from '../pages/Home.js';
import FormLogin from '../pages/forms/FormLogin.js';
import FormCadastroUsuario from '../pages/forms/FormCadastroUsuario.js';
import FormCadastroModeloTarefa from '../pages/forms/FormCadastroModeloTarefa.js';
import FormCadastroModeloTramite from '../pages/forms/FormCadastroModeloTramite.js';
import FormCadastroTarefa from '../pages/forms/FormCadastroTarefa.js';
import FormFlag from '../pages/forms/FormCadastroFlag.js';
import LstUsuarios from '../pages/listas/LstUsuarios.js';
import LstModelosTarefa from '../pages/listas/LstModelosTarefa.js';
import LstModelosTramite from '../pages/listas/LstModelosTramite.js';
import LstTarefas from '../pages/listas/LstTarefas.js';
import LstTramites from '../pages/listas/LstTramites.js';
import LstFlags from '../pages/listas/LstFlags.js';
import Cards from '../pages/Cards.js';
import FormNotas from '../pages/forms/FormNotas.js';
import CardDetalhe from '../pages/CardDetalhe.js';
import EscolhaFlag from '../pages/EscolhaFlag.js';


function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const { t } = useTranslation();

  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Splash, ComponenteSplashMessage } = useSplashMessage();

  const backgroundLocation = state?.backgroundLocation;
  const isModal = !!backgroundLocation;

  const [token, setToken] = useState("");

  function tokenExpirado() {
    const token = GetDadosLogin("token");
    if (!token) return true;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  }
  
  useEffect(() => {
    function atualizarLogin() {
      const novoToken = sessionStorage.getItem("token") || "";
      setToken(novoToken);
    }

    atualizarLogin();
  
    window.addEventListener('atualizarLogin', atualizarLogin);

    return () => { window.removeEventListener('atualizarLogin', atualizarLogin); };
  }, [navigate, location]);

  useEffect(() => {
  const intervalo = setInterval(() => {
    if (token && tokenExpirado()) {
      Alerta({ mensagem: t("api.tokenExpirado") });

      sessionStorage.setItem("token", '');
      window.dispatchEvent(new Event('atualizarLogin'));
    }
  }, 60000);

    return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [token]);
  
  useEffect(() => {
    let splashTimeout;

    function chamarSplash(event) {
      if (splashTimeout) return;

      const { mensagem, tipo, segundos } = event.detail; 

      Splash({ mensagem, tipo, segundos });

      splashTimeout = setTimeout(() => {
        splashTimeout = null;
      }, segundos * 1000);
    }

    window.addEventListener("chamarSplash", chamarSplash);

    return () => {
      window.removeEventListener("chamarSplash", chamarSplash);
    };
  }, [Splash]);

  return (
    <>
      {ComponenteAlerta}
      {ComponenteSplashMessage}

      { (token) ? (
        
      <Container>
        <DeviceProvider>
        <Routes location={backgroundLocation || location}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<FormLogin />} />
          <Route path="/cadastrousuario" element={<FormCadastroUsuario />} />
          <Route path="/usuarios" element={<LstUsuarios />} />
          <Route path="/cadastromodelotarefa" element={<FormCadastroModeloTarefa />} />
          <Route path="/modelostarefa" element={<LstModelosTarefa />} />
          <Route path="/cadastromodelotramite" element={<FormCadastroModeloTramite />} />
          <Route path="/modelostramite" element={<LstModelosTramite />} />
          <Route path="/cadastrotarefa" element={<FormCadastroTarefa />} />
          <Route path="/cadastroflag" element={<FormFlag />} />
          <Route path="/tarefas" element={<LstTarefas />} />
          <Route path="/tramites" element={<LstTramites />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/nota" element={<FormNotas />} />
          <Route path="/carddetalhe" element={<CardDetalhe />} />
          <Route path="/escolhaflag" element={<EscolhaFlag />} />
          <Route path="/flags" element={<LstFlags />} />
        </Routes>

      {isModal && (
        <Routes>
          <Route path="/login" element={<FormLogin isModal />} />
          <Route path="/cadastrousuario" element={<FormCadastroUsuario isModal />} />
          <Route path="/cadastromodelotarefa" element={<FormCadastroModeloTarefa isModal />} />
          <Route path="/cadastromodelotramite" element={<FormCadastroModeloTramite isModal />} />
          <Route path="/cadastrotarefa" element={<FormCadastroTarefa isModal />} />
          <Route path="/cadastroflag" element={<FormFlag isModal />} />
          <Route path="/nota" element={<FormNotas isModal />} />
          <Route path="/carddetalhe" element={<CardDetalhe isModal />} />
          <Route path="/escolhaflag" element={<EscolhaFlag isModal />} />
        </Routes>      
      )}
      </DeviceProvider>
      </Container>

      ) : (
        <Container>
        <DeviceProvider>

          {(location.pathname !== "/"  && location.pathname !== "/login") && (<Home />)}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<FormLogin />} />
        </Routes>
        {isModal && (
        <Routes>
          <Route path="/login" element={<FormLogin isModal/>} />
        </Routes>      
        )}

        </DeviceProvider>
        </Container>
      )
    }
    </>
  );
}

export default AppRoutes;
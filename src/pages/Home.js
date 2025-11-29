import { useState, useEffect } from 'react';
import styles from './Home.module.css';
import publicidade from '../img/pub.png';
import { useLocation, useNavigate } from 'react-router-dom';
import {TITULO} from '../util/config';
import { useTranslation } from 'react-i18next';
import { GetDadosLogin } from '../util/servico';

function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setToken] = useState("");
  
    useEffect(() => {
      setToken(GetDadosLogin("token") || "");
    }, []);    

    async function Logar() {
        navigate("/login", { state: { backgroundLocation: location }});
    }
    
    return (
        <section className={styles.container }>
            <h1>
                {t('home.bemVindoAo')}<span>{TITULO}</span>
            </h1>
            <div className="colunas quebraLinhaMobile">                
                <div>{t('home.comece')}</div>
                <div>{ !token && <button onClick={Logar}>{t('home.efetueLogin')}</button>}</div>
            </div>
            <p>
                <img src={publicidade} alt={TITULO} className="imgFull" />            
            </p>
        </section>
    )
}

export default Home
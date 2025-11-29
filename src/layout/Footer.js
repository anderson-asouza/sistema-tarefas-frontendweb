import {  FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import {TITULO} from '../util/config';
import styles from './Footer.module.css';
import LanguageSelector from '../components/outros/LanguageSelector';

function Footer() {
    return (       
        <footer className={`largurapagina ${styles.footer}`}>
            <div className={styles.medidas}>
            <ul className={styles.social_list}>
                <li>
                    <a href="https://anderson-asouza.github.io/" target="_blank" rel="noopener noreferrer">
                        <FaGithub  />
                    </a>
                </li>   
                <li>
                    <a href="https://www.linkedin.com/in/anderson-asouza/" target="_blank" rel="noopener noreferrer">
                        <FaLinkedin />
                    </a>
                </li>
                <li>
                    <a href="https://instagram.com/souza.anderson.1" target="_blank" rel="noopener noreferrer">
                        <FaInstagram />
                    </a>
                </li>                
            </ul>
            </div>
            <div className={styles.medidas}>
            <div className="colunas">
                <div className={styles.espaco}>
                    &nbsp;
                </div>
                <div className={styles.copyright}>
                <span>{TITULO}</span> © 2025
                </div>
                <div>
                <LanguageSelector />
                </div>
            </div>
            </div>
        </footer>
    );
}

export default Footer;

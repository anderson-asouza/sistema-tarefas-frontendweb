import { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import styles from './NavBar.module.css';
import logo from '../img/logo.png';
import { TITULO } from '../util/config';
import {GetDadosLogin} from '../util/servico';
import MenuLogin from '../menus/MenuLogin';
import MenuUsuarios from '../menus/MenuUsuarios';
import MenuModelos from '../menus/MenuModelos';
import MenuTarefas from '../menus/MenuTarefas';
import MenuCards from '../menus/MenuCards';

function NavBar() {
  
  const [nivel, setNivel] = useState(-1);
  const [token, setToken] = useState('');
  
  useEffect(() => {
    function atualizarLogin() {
      setNivel(GetDadosLogin("nivel"));
      setToken(GetDadosLogin("token"));
    }

    atualizarLogin();
  
    window.addEventListener('atualizarLogin', atualizarLogin);

    return () => { window.removeEventListener('atualizarLogin', atualizarLogin); };
  }, []);
  
  return (      
    <nav className={`largurapagina ${styles.navbar}`}>
      <Link to="/"><img src={logo} alt={TITULO} className={styles.logo} /></Link>      
      <ul className={styles.list}>

        {token && <>
          {(nivel >= 1 && nivel <= 3) && (
            <>
            <li className={styles.item}>
            <MenuCards />
            </li>
            </>
          )}

          {nivel === 1 && (
            <>
            <li className={styles.item}>
            <MenuUsuarios />
            </li>
            <li className={styles.item}>
            <MenuModelos />
            </li>
            </>
          )}
      
          {(nivel >= 1 && nivel <= 4) && (
            <>
            <li className={styles.item}>
            <MenuTarefas />
            </li>
            </>
          )}
        </>}
        <li className={styles.item}>
          <MenuLogin />
        </li>
       </ul>
    </nav>
    )
  }

export default NavBar
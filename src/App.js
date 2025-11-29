import { BrowserRouter as Router } from 'react-router-dom';
import NavBar from './layout/NavBar.js';
import AppRoutes from './routes/AppRoutes.js';
import Footer from './layout/Footer.js';
import styles from './layout/Container.module.css';
import { useEffect } from 'react';
import { TITULO } from './util/config';
import './i18n';

function App() {

  useEffect(() => {
    document.title = TITULO;
  }, []);

  return (
    <div className="App">
      <Router>
        <div className={`${styles.fundo}`}>
          <NavBar className={`${styles.container}`} />
        </div>
        <div className="main-content">
          <AppRoutes />
        </div>
        <Footer />
      </Router>
    </div>
  );
}

export default App;

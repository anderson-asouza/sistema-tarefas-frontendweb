import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import stylesMenu from './Menu.module.css';
import { SvgEDashboard } from "../components/outros/Svg";

function MenuCards() {
  const navigate = useNavigate();
  const { t } = useTranslation();

return (
    <div className={stylesMenu.item} role="button" onClick={() => navigate("/dashboard")}>
      <SvgEDashboard style={{ transform: 'scale(1.15)', transformOrigin: 'center', marginRight: '0.2em' }} />
      <span>{t('menu.dashboard')}</span>
    </div>
  );
}

export default MenuCards;
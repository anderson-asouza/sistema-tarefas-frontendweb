import styles from './Loading.module.css';
import loading from '../../img/loading.svg'
import { useTranslation } from 'react-i18next';

function Loading() {
    const { t } = useTranslation();

    return (
        <div id="loading" className={styles.container}>
            <img src={loading} alt={t('carregando')} />
            <h1>{t('carregando')}</h1>
        </div>
    )
}

export default Loading
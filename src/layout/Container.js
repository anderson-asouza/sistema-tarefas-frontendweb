import styles from './Container.module.css';

function Container(props) {
    return (
        <div className={`largurapagina ${styles.container} ${styles[props.customClass]}`}>
            {props.children}
        </div>
    )
}

export default Container
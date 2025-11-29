import "./alerta.css";

const icones = {
  info: "ℹ️",
  erro: "❌",
  sucesso: "✅",
  aviso: "⚠️"
};

const SplashMessage = ({ mensagem, tipo = "info" }) => {
  return (
    <div className={`splash-message splash-${tipo}`}>
      <span className="splash-icon">{icones[tipo]}</span>
      <span className="splash-text">{mensagem}</span>
    </div>
  );
};

export default SplashMessage;
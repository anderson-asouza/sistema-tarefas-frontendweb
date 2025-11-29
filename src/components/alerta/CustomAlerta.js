import { useEffect } from "react";
import "./alerta.css";

const icones = {
  info: "ℹ️",
  erro: "❌",
  sucesso: "✅",
  aviso: "⚠️",
};

const CustomAlerta = ({ titulo, mensagem, onClose, visible, tipo }) => {
  useEffect(() => {
    if (!visible) return;

    function handleKeyDown(e) {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="custom-alert-overlay">
      <div className={`custom-alert custom-alert-${tipo}`}>
        <div className="custom-alert-content">
          <span className="custom-alert-icon">{icones[tipo]}</span>
          <div className="custom-alert-title">{titulo}</div>
        </div>

        <div className="custom-alert-message">{mensagem}</div>

        <button onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </div>
  );
};

export default CustomAlerta;
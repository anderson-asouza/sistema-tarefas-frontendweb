import { useEffect } from "react";
import "./alerta.css";

const PerguntaDlg = ({ 
  visible, 
  title, 
  message,
  sim,
  nao,
  onConfirm, 
  onCancel 
}) => {
  useEffect(() => {
    if (!visible) return;

    function handleKeyDown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onConfirm, onCancel]);

  if (!visible) return null;

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert custom-alert-info">
        <div className="custom-alert-content">
          <span className="custom-alert-icon">❔</span>
          <div className="custom-alert-title">{title}</div>
        </div>

        <div className="custom-alert-message">{message}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: "25px" }}>
          <button onClick={onConfirm} autoFocus>
            {sim}
          </button>
          <button onClick={onCancel}>{nao}</button>
        </div>
      </div>
    </div>
  );
};

export default PerguntaDlg;

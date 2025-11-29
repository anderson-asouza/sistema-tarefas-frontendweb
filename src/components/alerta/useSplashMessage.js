import { useState } from "react";
import SplashMessage from "./SplashMessage";

export function useSplashMessage() {
  const [mensagem, setMensagem] = useState(null);

  const Splash = ({ mensagem, tipo = "sucesso", segundos = 4 }) => {
    setMensagem({ mensagem, tipo });

    setTimeout(() => {
      setMensagem(null);
    }, segundos * 1000);
  };

  const ComponenteSplashMessage = mensagem ? (
    <SplashMessage mensagem={mensagem.mensagem} tipo={mensagem.tipo} />
  ) : null;

  return { Splash, ComponenteSplashMessage };
}

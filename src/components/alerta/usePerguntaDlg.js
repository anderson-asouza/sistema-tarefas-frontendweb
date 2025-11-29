import { useState } from "react";
import PerguntaDlg from "./PerguntaDlg";
import { useTranslation } from 'react-i18next';

export function usePerguntaDlg() {
  const [visivel, setVisivel] = useState(false);
  const [dados, setDados] = useState({
    titulo: "",
    mensagem: "",
  });

  const [resolver, setResolver] = useState(null);
  const { t } = useTranslation();

  const Pergunta = ({ titulo = t('dlg.confirmacao'), mensagem, sim = t('dlg.sim'), nao = t('dlg.nao') }) => {
    return new Promise((resolve) => {
      setDados({ titulo, mensagem, sim, nao });
      setVisivel(true);
      setResolver(() => resolve);
    });
  };

  const handleConfirmar = () => {
    setVisivel(false);
    if (resolver) resolver(true);
  };

  const handleCancelar = () => {
    setVisivel(false);
    if (resolver) resolver(false);
  };

  const ComponentePergunta = visivel ? (
    <PerguntaDlg
      visible={true}
      title={dados.titulo}
      message={dados.mensagem}
      sim={dados.sim}
      nao={dados.nao}
      onConfirm={handleConfirmar}
      onCancel={handleCancelar}
    />
  ) : null;

  return { Pergunta, ComponentePergunta };
}

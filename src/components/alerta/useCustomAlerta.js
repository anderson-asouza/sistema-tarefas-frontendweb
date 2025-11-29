import { useState, useCallback, useMemo } from "react";
import CustomAlerta from "./CustomAlerta";
import { useTranslation } from 'react-i18next';

export function useCustomAlerta() {

  const { t } = useTranslation();

  const [alerta, setAlerta] = useState({
    visible: false,
    titulo: "",
    mensagem: "",
    tipo: "erro"
  });

const titulos = useMemo(() => ({
  info: t('dlg.info'),
  erro: t('dlg.erro'),
  sucesso: t('dlg.sucesso'),
  aviso: t('dlg.aviso')
}), [t]);

  const Alerta = useCallback(({ titulo = "", mensagem, tipo = "erro" }) => {
    
    if (titulo === null || titulo === "")
      titulo = titulos[tipo];

    setAlerta({
      visible: true,
      titulo,
      mensagem,
      tipo
    });
  }, [titulos]);

  const ComponenteAlerta = alerta.visible ? (
    <CustomAlerta
      titulo={alerta.titulo}
      mensagem={alerta.mensagem}
      tipo={alerta.tipo}
      visible={true}
      onClose={() => setAlerta((prev) => ({ ...prev, visible: false }))}
    />
  ) : null;

  return { Alerta, ComponenteAlerta };
}

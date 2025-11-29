import React, { useState, useEffect, useRef, useMemo } from "react";
import { URL_API } from '../../util/config';
import stylesLst from './Lst.module.css';
import { useCustomAlerta } from '../../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../../components/alerta/usePerguntaDlg';
import { SvgPrinter, SvgRetroceder, SvgCancel, SvgAdd, SvgFlag, SvgETramites } from "../../components/outros/Svg";
import { useNavigate  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/outros/Loading';
import { ValidaRetornoAPI, TraduzMensagemErroBackend, GetDadosLogin, ChamarSplash, AlertaVencimento, ITENS_POR_PAGINA, PRN_MARGEM, DEF_MASSA_TRAMITES, PRAZO_ALERTA_TAREFA, PRAZO_ALERTA_TRAMITE } from '../../util/servico';
import { FormatarData } from '../../util/formatacao';
import clsx from 'clsx';
import logo from '../../img/logo.png';

function LstTramites() {
  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const [ativaLoading, setAtivaLoading] = useState(true);
  const [dados, setDados] = useState([]);
  const countMassaDados = useRef(-1);
  const [itemSelecionado, setItemSelecionado] = useState({});
  const [imagemBase64, setImagemBase64] = useState();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClose = () => navigate(-1);

  const [nivel, setNivel] = useState(0);
  const [token, setToken] = useState('');
  
  const [forcarAtualizacao, setForcarAtualizacao] = useState(false);
  const [statusTarefa, setStatusTarefa] = useState('');
  const [filtroIdTarefa, setFiltroIdTarefa] = useState(0);
  const [filtroEffectIdTarefa, setFiltroEffectIdTarefa] = useState(0);
 
  const [tarefas, setTarefas] = useState([]);
  const [nomeTarefa, setNomeTarefa] = useState('');
  const [descricaoTarefa, setDescricaoTarefa] = useState('');

  const [selectedTarefaId, setSelectedTarefaId] = useState(0);

  const itensFiltrados = useMemo(() => {

    if (countMassaDados.current > DEF_MASSA_TRAMITES) {
      setFiltroEffectIdTarefa(filtroIdTarefa);
    }

    return dados?.filter((c) =>
      c.traTarId === filtroIdTarefa
    ) || [];
  }, [dados, filtroIdTarefa]);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = ITENS_POR_PAGINA;

  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina);

  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itensFiltrados.slice(inicio, inicio + itensPorPagina);

  }, [itensFiltrados, paginaAtual, itensPorPagina]);

  const [filtros, setFiltros] = useState({
      statusTarefa: ''
  });

  const irParaPaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  };

  const irParaProximaPagina = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  };

  const inicioItem = (paginaAtual - 1) * itensPorPagina + 1;
  const fimItem = Math.min(paginaAtual * itensPorPagina, itensFiltrados.length);

  useEffect(() => {
    try {
      setAtivaLoading(true);
      const tokenAtual = GetDadosLogin("token");
      setToken(tokenAtual);
      setNivel(GetDadosLogin("nivel"));

      async function carregarTarefas() {
        try {
          const resposta = await fetch(URL_API + 'Tarefas', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${tokenAtual}`
            }
          });

        const { erro, dados } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          return;
        }

        setTarefas(dados);

        if (dados.length === 0)
        {
          ChamarSplash(t('frmCadastroModeloTramite.naoHaModelosTarefa'), "erro");
          navigate(-1);
          return;
        }
 
      } catch (e) {
        Alerta({ mensagem: t('api.apiErro') });
      }
    }

      carregarTarefas();

      setStatusTarefa('A');
      setFiltros((prev) => ({
        ...prev,
        statusTarefa: 'A'
      }));

      fetch(logo)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagemBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      });

    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    } finally {
    }
  }, [t, Alerta, navigate]);


  useEffect(() => {
    try {
      setAtivaLoading(true);
      const tokenAtual = GetDadosLogin("token");      

      async function carregarTramites() {
      try {       

        let url = new URL(`${URL_API}Tramites`);
        if (countMassaDados.current > DEF_MASSA_TRAMITES) {
          url.searchParams.append("idTarefa", filtroEffectIdTarefa || 0);
        }

        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${tokenAtual}`
          }
        });

        const { erro, dados, count } = await ValidaRetornoAPI(resposta, t);

        if (erro) {
          Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
          setDados([]);
          return;
        }

        if (dados.length === 0)
        {
          ChamarSplash(t('lstTramites.naoHaTramites'), "erro");
          navigate(-1);
          return;
        }

        setDados(dados);

        if (countMassaDados.current === -1) {
          countMassaDados.current = count;
        }
      } catch (e) {
        Alerta({ mensagem: t('api.apiErro') });
      }
    }
      carregarTramites();

    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    } finally {
      setAtivaLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEffectIdTarefa, forcarAtualizacao]);

  const getCellClass = (item) => {
    const primaryKey = Object.keys(item)[0];
    const isSelecionado = itemSelecionado && itemSelecionado[primaryKey] === item[primaryKey];

    return clsx(
      stylesLst.itemCondensado,
      isSelecionado && stylesLst.expandeItem,
      isSelecionado && stylesLst.linhaSelecionada
    );
  };

  function handImprimir() {
    if (countMassaDados.current < 1)
    {
        Alerta({ mensagem: t('lst.semDadosImprimir') });
        return;
    }

    const linhaFiltro = (nomeTarefa) ? " Tarefa: " + nomeTarefa : "";    

    gerarPdf(linhaFiltro);
  }

  const gerarPdf = async () => {
    const pdfMake = (await import('pdfmake/build/pdfmake.min.js')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts.js')).default;

    pdfMake.vfs = pdfFonts;

    const docDefinition = {
      pageMargins: [0, 95, 0, PRN_MARGEM * 2],
      header: {
        columns: [
          {
            image: imagemBase64,
            width: 60,
            margin: [PRN_MARGEM, PRN_MARGEM, 0, 0],
            alignment: 'left',
          },
          {
            stack: [
              { text: t('lstTramites.titulo'), style: 'header', alignment: 'left', margin: [PRN_MARGEM+5, PRN_MARGEM, PRN_MARGEM, 0] },
              { text: `${t('lst.gerado')}: ${new Date().toLocaleString()}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
              { text: `${t('lstTramites.filtroTarefa')}:  ${itensFiltrados[0].tarNomeTarefa}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
              { text: `${t('lstTramites.statusTarefa')}: ${itensFiltrados[0].tarStatusDescricao}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 0]
      },

      content: [
        ...(descricaoTarefa && descricaoTarefa.trim() !== '' ? [{
            stack: [
            {
            text: [
              { text: `${itensFiltrados[0].flaRotulo ? `${t('lstTramites.flag')}:  ` : ""}`, color: 'black' },
              { text: `${itensFiltrados[0].flaRotulo}`, color: itensFiltrados[0].flaCor || 'black' },
              { text: `${itensFiltrados[0].flaRotulo ? "    " : ""}`, color: 'black' },
              { text: `${t('lstTramites.dataComeco')}:  ${FormatarData(itensFiltrados[0].tarDataComeco)}    ${t('lstTramites.dataPrevisao')}: ${FormatarData(itensFiltrados[0].tarDataFinalPrevista)}    ${t('lstTramites.dataFinal')}:  ${FormatarData(itensFiltrados[0].tarDataFinal)}`, margin: [PRN_MARGEM, 10, PRN_MARGEM, 0] },
            ],
              style: 'subHeader',
              alignment: 'left',
              margin: [PRN_MARGEM, PRN_MARGEM / 2, PRN_MARGEM, 0]
            },
            { text: `${t('lstTramites.descricaoTarefa')}: ${descricaoTarefa}`, alignment: 'left', margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] }
          ],
        }] : []),

        
        { text: `${t('lstTramites.tramites')}:`, style: 'sectionTitle', margin: [PRN_MARGEM, PRN_MARGEM / 2, PRN_MARGEM, 0] },
        ...itensFiltrados.map((item) => ({
          stack: [
            { text: `#${item.traOrdem} - ${item.traStatusDescricao}${item.traRepetido ? ` - [${t('lstTramites.repetido')}]` : ""} - ${item.mtraNome}`, style: 'tramiteTitle', margin: [PRN_MARGEM, PRN_MARGEM / 2, PRN_MARGEM, 0] },
            { text: `${t('lstTramites.dataInicio')}: ${FormatarData(item.traDataInicio)}    ${t('lstTramites.dataPrevisao')}: ${FormatarData(item.traDataPrevisaoTermino)}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },
            { text: `${t('lstTramites.descricaoTramite')}:`, margin: [PRN_MARGEM, 2, PRN_MARGEM, 0] },
            { text: `${item.mtraDescricao || '—'}`, margin: [PRN_MARGEM, 2, PRN_MARGEM, 0] },
            { text: `${t('lstTramites.nomeTramitador')}: ${item.usuNomeTramitador || '—'}    ${t('lstTramites.dataExecucao')}: ${FormatarData(item.traDataExecucao) || `${t('lstTramites.naoExecutado')}`}`, margin: [PRN_MARGEM, 10, PRN_MARGEM, 0] },
            { text: `${t('lstTramites.notaTramitador')}:`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },
            { text: `${item.traNotaTramitador || '—'}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0], noWrap: false },
            { text: `${t('lstTramites.nomeRevisor')}: ${item.usuNomeRevisor}    ${t('lstTramites.dataRevisao')}: ${FormatarData(item.traDataRevisao)}`, bold: true, margin: [PRN_MARGEM, 10, PRN_MARGEM, 0] },
            { text: `${item.traNotaRevisor ? `${t('lstTramites.notaRevisor')}:` : ""}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },
            { text: `${item.traNotaRevisor || ''}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0], noWrap: false },
          ]
        }))
      ],

      styles: {
        header: { fontSize: 18, bold: true },
        subHeader: { fontSize: 12, margin: [0, 0, 0, 10] },
        sectionTitle: { fontSize: 13, bold: true },
        tramiteTitle: { fontSize: 12, bold: true },
        tableBody: { fontSize: 11, color: 'black' }, 
        tableHeader: { bold: true, fontSize: 13, color: 'black' },
      },

      footer: function (currentPage, pageCount) {
        return {
          text: `${t('lst.pagina')} ${currentPage} ${t('lst.de')} ${pageCount}`,
          alignment: 'right',
          fontSize: 9, bold: true,
          margin: [0, PRN_MARGEM, PRN_MARGEM, PRN_MARGEM],
        };
      },

      defaultStyle: { fontSize: 11, color: 'black' },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  function handleDesmarcar() {
    setItemSelecionado({});
  }

  async function handleAdicionar() {
    if (selectedTarefaId < 1)
    {
      Alerta({ mensagem: t('tarefas.selecioneTarefa') });
      return;
    }

    const confirmado = await Pergunta({ mensagem: t('lstTramites.desejaIncluir') });

    if (!confirmado) return;

    try {
      const url = new URL(`${URL_API}Tramites/incluir-tramite/${selectedTarefaId}`);

      const resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

      ChamarSplash(t('lstTramites.tramiteIncluido')+": "+dados.mtraNome);
    
      setForcarAtualizacao(!forcarAtualizacao);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }  

  async function handleRetroceder() {

    const confirmado = await Pergunta({ mensagem: t('lstTramites.desejaRetroceder') });

    if (!confirmado) return;

    try {
      const primaryKey = Object.keys(itemSelecionado)[0];
      const url = new URL(`${URL_API}Tramites/retroceder-tramite/${itemSelecionado?.[primaryKey]}`);

      const resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const { erro, dados } = await ValidaRetornoAPI(resposta, t);

      if (erro) {
        Alerta({ mensagem: TraduzMensagemErroBackend(erro, dados, t) });
        return;
      }

      ChamarSplash(t('lstTramites.retrocedido') + ': ' + itemSelecionado.mtraNome, "aviso");

      setForcarAtualizacao(!forcarAtualizacao);
      handleDesmarcar();
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  function handleChangeStatusTarefas(e) {
    setStatusTarefa(e.target.value);

    setFiltros((prev) => ({
      ...prev,
      statusTarefa: e.target.value
    }));
  }

  const tarefasFiltradas = useMemo(() => {
    handleDesmarcar();
    if (!tarefas) return [];

    let resultado = tarefas;

    if (filtros.statusTarefa) {
      resultado = resultado.filter((c) => c.tarStatus === filtros.statusTarefa);
    }

    if (resultado.length > 0)
    {
      setSelectedTarefaId(resultado[0].tarId);
      setFiltroIdTarefa(resultado[0].tarId);
      setNomeTarefa(resultado[0].tarNomeTarefa);
      setDescricaoTarefa(resultado[0].tarDescricao);
    } else {
      setSelectedTarefaId(0);
      setFiltroIdTarefa(0);
      setNomeTarefa('');
      setDescricaoTarefa('');
    }    

    return resultado;

  }, [tarefas, filtros]);
  
  const handleChangeTarefas = (e) => {
    handleDesmarcar();
    const idSelecionado = parseInt(e.target.value);
    setSelectedTarefaId(idSelecionado);

    if (countMassaDados.current > DEF_MASSA_TRAMITES)
      setFiltroEffectIdTarefa(idSelecionado);

    setFiltroIdTarefa(idSelecionado);

    const tarefaSelecionada = tarefas.find(t => t.tarId === idSelecionado);
    setNomeTarefa(tarefaSelecionada?.tarNome || '');
    setDescricaoTarefa(tarefaSelecionada?.tarDescricao || '');
  };

  return (
    <>
      {ComponenteAlerta}
      {ComponentePergunta}

      <div className={stylesLst.container}>
        <h1> <SvgETramites style={{ transform: 'scale(1.4)', transformOrigin: 'center', marginRight: '0.4em' }} /> {t('lstTramites.titulo')}</h1>
        <div className="colunas quebraLinhaMobile">        
          <div className="colunaEsquerda">
            
            <div>
              <label className={stylesLst.labels} htmlFor="statusTarefa">{t('lstTarefas.filtroStatus')}:</label>
              <select id="statusTarefa" name="statusTarefa" value={statusTarefa} style={{ minWidth: '9em' }} onChange={handleChangeStatusTarefas}>
                <option key={0} value={''}>{t('lstTarefas.statusTodas')}</option>
                <option key={1} value={'A'}>{t('lstTarefas.statusAbertas')}</option>
                <option key={2} value={'D'}>{t('lstTarefas.statusDesativadas')}</option>
                <option key={3} value={'F'}>{t('lstTarefas.statusFinalizadas')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="tarefas">{t('lstTramites.filtroTarefas')}</label>
              <select id="tarefas" value={selectedTarefaId} onChange={handleChangeTarefas}>
                {tarefasFiltradas.map(tarefas => (
                  <option key={tarefas.tarId} value={tarefas.tarId}>
                    {tarefas.tarNomeTarefa}
                  </option>
                ))}
              </select>
            </div>

          </div>
          <div className="colunaCentralizada">
            <div  className={stylesLst.svgBtn}><SvgPrinter onClick={handImprimir} /></div>

            {(Object.keys(itemSelecionado).length === 0 && nivel === 1) ? (
              <div className={stylesLst.svgBtn}><SvgAdd onClick={handleAdicionar} /></div>
              ) : (
              <div className={stylesLst.svgDesabilitados}><SvgAdd /></div>
            )}
            { (Object.keys(itemSelecionado).length > 0 && nivel === 1) ? (
              <div className={stylesLst.svgBtn}><SvgRetroceder onClick={handleRetroceder}/> </div>
            ) : (
              <div className={stylesLst.svgDesabilitados}><SvgRetroceder /></div>
            )}

            {Object.keys(itemSelecionado).length > 0 ? (
            <div className={stylesLst.svgBtn}><SvgCancel  onClick={handleDesmarcar}/></div>
            ) : (
            <div className={stylesLst.svgDesabilitados}><SvgCancel /></div>
            )}
          </div>
          <div className="colunaDireita">
            <button onClick={handleClose}>{t('fechar')}</button>
          </div>
        </div>
        <div className="colunas quebraLinhaMobile">
          <div className="esquerda"><h3 className={stylesLst.h3}>{t('lstTramites.descricaoTarefa')}</h3></div>
          <div className="esquerda">
            {(itensFiltrados && itensFiltrados.length > 0) && <div>
            <AlertaVencimento data={itensFiltrados[0].tarDataFinalPrevista} diasPraVencer={PRAZO_ALERTA_TAREFA} escreve={true} /> &nbsp;
            {itensFiltrados[0].flaRotulo && <><SvgFlag style={itensFiltrados[0].flaCor ? { transform: 'scale(1.2)', color: `${itensFiltrados[0].flaCor}` } : {}} title={itensFiltrados[0].flaRotulo || undefined}/> &nbsp; {itensFiltrados[0].flaRotulo || undefined}</>}
            </div>}
          </div>
        </div>
        <div className="esquerda">{descricaoTarefa}</div>

        {ativaLoading ? (<Loading />) :
        (
          <div className="esquerda">
            { itensFiltrados.length > 0 ? (              
              <table id="elementoLst" className={stylesLst.listaItens}>
                <thead>
                  <tr>
                    <th style={{ width: '3em' }}>{t('lstTramites.ordem')}</th>
                    <th style={{ width: '5em' }}>{t('lstTramites.status')}</th>
                    <th style={{ width: '19em' }}>{t('lstTramites.nome')}</th>
                    <th style={{ width: '20em' }}>{t('lstTramites.descricaoTramite')}</th>
                    <th style={{ width: '12em' }}>{t('lstTramites.nomeRevisor')}</th>
                    <th style={{ width: '12em' }}>{t('lstTramites.nomeTramitador')}</th>
                    <th style={{ width: '6em' }}>{t('lstTramites.dataInicio')}</th>
                    <th style={{ width: '6em' }}>{t('lstTramites.dataPrevisao')}</th>
                    <th style={{ width: '6em' }}>{t('lstTramites.dataExecucao')}</th>
                    <th style={{ width: '6em' }}>{t('lstTramites.dataRevisao')}</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPaginados.map((item) => {
                    const primaryKey = Object.keys(item)[0];
                    const isSelecionado = itemSelecionado?.[primaryKey] === item[primaryKey];

                    return (
                      <tr key={item[primaryKey]} className={isSelecionado ? stylesLst.linhaSelecionada : ''} onClick={() => setItemSelecionado(item)}>
                        <td className={getCellClass(item)}>{item.traOrdem}</td>
                        <td className={getCellClass(item)}>{item.traStatusDescricao}</td>
                        <td className={getCellClass(item)}><AlertaVencimento data={item.traDataPrevisaoTermino} diasPraVencer={PRAZO_ALERTA_TRAMITE} /> {item.mtraNome}</td>
                        <td className={getCellClass(item)}>{item.mtraDescricao}</td>
                        <td className={getCellClass(item)}>{item.usuNomeRevisor ? item.usuNomeRevisor : t('lstTramites.semRevisor')}</td>
                        <td className={getCellClass(item)}>{item.usuNomeTramitador ? item.usuNomeTramitador : t('lstTramites.semTramitador')}</td>
                        <td className={getCellClass(item)}>{FormatarData(item.traDataInicio)}</td>
                        <td className={getCellClass(item)}>{FormatarData(item.traDataPrevisaoTermino)}</td>
                        <td className={getCellClass(item)}>{FormatarData(item.traDataExecucao)}</td>
                        <td className={getCellClass(item)}>{FormatarData(item.traDataRevisao)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="colunaEsquerda">
                      {t('lst.exibindoItens')} {itensFiltrados.length > 0 ? inicioItem : 0} {t('lst.ate')} {fimItem} {t('lst.total')}: {itensFiltrados.length.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="colunas">
                      <button onClick={irParaPaginaAnterior} disabled={paginaAtual === 1}>
                        ◀ {t('lst.anterior') || 'Anterior'}
                      </button>
                      <span> {t('lst.pagina')} </span>
                      <input type="text" inputMode="numeric" pattern="\d*" id="paginaAtual" name="paginaAtual" min={1} max={totalPaginas} value={paginaAtual}
                        onChange={(e) => {
                          const valor = e.target.value.toString().replace(/[^\d]/g, '');
                          const numero = Number(valor);
                          if (numero >= 1 && numero <= totalPaginas) {
                            setPaginaAtual(Number(valor));
                          }
                      }} />
                      <span>{t('lst.de')} {totalPaginas === 0 ? 1 : totalPaginas} </span>
                      <button onClick={irParaProximaPagina} disabled={paginaAtual === totalPaginas}>                      
                        {t('lst.proxima') || 'Próxima'} ▶
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <h2>{t('lstTramites.semTramites')}</h2>
            )}
          </div>
        )
        }
        
      </div>
    </>
  );
}

export default LstTramites;

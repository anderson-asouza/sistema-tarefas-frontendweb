import { useState, useEffect, useRef, useMemo } from "react";
import { isMobile } from "../../util/DeviceContext";
import { URL_API, FLAGS } from '../../util/config';
import { FormatarData } from '../../util/formatacao';
import stylesLst from './Lst.module.css';
import { useCustomAlerta } from '../../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../../components/alerta/usePerguntaDlg';
import { SvgPrinter, SvgEdit, SvgTrash, SvgCancel, SvgETarefas, SvgAtivarTarefa, SvgDesativarTarefa, SvgTarefaFinalizada } from "../../components/outros/Svg";
import { useLocation, useNavigate  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/outros/Loading';
import { ValidaRetornoAPI, TraduzMensagemErroBackend, GetDadosLogin, ChamarSplash, ITENS_POR_PAGINA, MAX_CAMPO, PRN_MARGEM, DEF_MASSA_TAREFAS } from '../../util/servico';
import clsx from 'clsx';
import logo from '../../img/logo.png';

function LstTarefas() {
  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const [ativaLoading, setAtivaLoading] = useState(true);
  const [dados, setDados] = useState([]);
  const countMassaDados = useRef(-1);
  const [itemSelecionado, setItemSelecionado] = useState({});
  const [imagemBase64, setImagemBase64] = useState();

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClose = () => navigate(-1);  

  const [token, setToken] = useState('');
  const [nivel, setNivel] = useState(-1);
  const [nomeTarefa, setNomeTarefa] = useState('');
  const [statusTarefa, setStatusTarefa] = useState('A');
  const [ordenarPorData, setOrdenarPorData] = useState(false);
  
  const gerarPdf = async (linhaFiltro1, linhaFiltro2) => {
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
              { text: t('lstTarefas.titulo'), style: 'header', alignment: 'left', margin: [PRN_MARGEM+5, PRN_MARGEM, PRN_MARGEM, 0] },
              { text: `${t('lst.gerado')}: ${new Date().toLocaleString()}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
              { text: `${linhaFiltro1}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
              { text: `${linhaFiltro2}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 0]
      },

      content: [
        { text: '', style: 'sectionTitle', margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },

        ...itensFiltrados.map((item) => ({
          stack: [
            { text: `${t('lstTarefas.nome')}: ${item.tarNomeTarefa}    ${t('lstTarefas.statusDescricao')}: ${item.tarStatusDescricao}`, style: 'tramiteTitle', margin: [PRN_MARGEM, 5, PRN_MARGEM, 2] },
            { text: `${t('lstTarefas.descricao')}: ${item.tarDescricao || '—'}`, margin: [PRN_MARGEM, 2, PRN_MARGEM, 0] },
            { text: `${t('lstTarefas.dataComeco')}:  ${FormatarData(item.tarDataComeco)}    ${t('lstTarefas.dataFinalPrevista')}: ${FormatarData(item.tarDataFinalPrevista)}    ${t('lstTarefas.dataFinal')}:  ${FormatarData(item.tarDataFinal)}`, margin: [PRN_MARGEM, 10, PRN_MARGEM, 0] },
            { text: `${t('lstTarefas.responsavel')}: ${item.usuNomeUsuarioResponsavelTarefa}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },
            { text: `${t('lstTarefas.mtarNome')}: ${item.mtarNome}`, style: 'tramiteTitle', margin: [PRN_MARGEM, 5, PRN_MARGEM, 2] },
            { text: `${t('lstTarefas.mtarDescricao')}:`, style: 'tramiteTitle', margin: [PRN_MARGEM, 2, PRN_MARGEM, 0] },
            { text: `${item.mtarDescricao || '—'}`, margin: [PRN_MARGEM, 2, PRN_MARGEM, 0] },
            {
              canvas: [
                { type: 'line', x1: PRN_MARGEM, y1: 0, x2: 570, y2: 0, lineWidth: 1, lineColor: '#cccccc' }
              ],
              margin: [0, 10, 0, 10]
            }
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

  function handImprimir() {
    if (countMassaDados.current < 1) {
        Alerta({ mensagem: t('lst.semDadosImprimir') });
        return;
    }    

    const porData = (filtros.ordenarPorData) ? t('sim') : t('nao');
    const porStatus = (filtros.statusTarefa) === "" ? t('lstTarefas.statusTodas') : 
                      (filtros.statusTarefa) === "A" ? t('lstTarefas.statusAbertas') : 
                      (filtros.statusTarefa) === "D" ? t('lstTarefas.statusDesativadas') : 
                      t('lstTarefas.statusFinalizadas');

    const linhaFiltro1 = `${t('lstTarefas.filtroStatus')}: ${porStatus}    ${t('lstTarefas.filtroImpressaoOrdenarPorData')}: `+porData;
    const linhaFiltro2 = (filtros.nomeTarefa) ? `${t('lstTarefas.filtroNomeTarefa')}: ${filtros.nomeTarefa}` : "";

    gerarPdf(linhaFiltro1, linhaFiltro2);
  }

  const [filtros, setFiltros] = useState({
    nomeTarefa: '',
    statusTarefa: '',
    ordenarPorData: false,
  });  

  const [filtrosEffect, setFiltrosEffect] = useState({
    nomeTarefa: '',
    statusTarefa: '',
    ordenarPorData: false,
  });

  const itensFiltrados = useMemo(() => {
    if (!dados) return [];

    let resultado = dados.filter((c) =>
      c.tarNomeTarefa.toLowerCase().includes(filtros.nomeTarefa.toLowerCase())
    );

    if (filtros.statusTarefa) {
      resultado = resultado.filter((c) => c.tarStatus === filtros.statusTarefa);
    }

    if (filtros.ordenarPorData) {
      resultado = resultado.sort(
        (a, b) => new Date(a.tarDataComeco) - new Date(b.tarDataComeco)
      );
    }

    return resultado;
  }, [dados, filtros]);


  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = ITENS_POR_PAGINA;

  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina);

  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itensFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [itensFiltrados, paginaAtual, itensPorPagina]);

  const irParaPaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  };

  const irParaProximaPagina = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  };

  const inicioItem = (paginaAtual - 1) * itensPorPagina + 1;
  const fimItem = Math.min(paginaAtual * itensPorPagina, itensFiltrados.length);
 
  useEffect(() => {
    const delay = (tempo) => new Promise(resolve => setTimeout(resolve, tempo));

    const buscarDados = async () => {
      setAtivaLoading(true);
      try {
        const tokenAtual = GetDadosLogin("token");
        setToken(tokenAtual);
        setNivel(GetDadosLogin("nivel"));

        const url = new URL(`${URL_API}Tarefas`);
        if (countMassaDados.current > DEF_MASSA_TAREFAS) {
          url.searchParams.append("nomeTarefa", filtrosEffect.nomeTarefa || "");
          url.searchParams.append("statusBusca", filtrosEffect.statusTarefa || "");
          url.searchParams.append("ordenarPelaDataInicial", filtrosEffect.ordenarPorData || false);
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

        if (FLAGS.TESTE_LOADING) 
          await delay(5000);

        setDados(dados);

        if (countMassaDados.current === -1) {
          countMassaDados.current = count;
        }
      } catch (err) {
        Alerta({ mensagem: t('api.apiErro') });
      } finally {
        setAtivaLoading(false);
      }
    };

    buscarDados();

    window.addEventListener("atualizarListaTarefas", buscarDados);

    return () => {  window.removeEventListener("atualizarListaTarefas", buscarDados);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosEffect]);

  useEffect(() => {
    fetch(logo)
    .then(res => res.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemBase64(reader.result);
      };
      reader.readAsDataURL(blob);
    });

    Filtrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCellClass = (item) => {
    const primaryKey = Object.keys(item)[0];
    const isSelecionado = itemSelecionado && itemSelecionado[primaryKey] === item[primaryKey];

    return clsx(
      stylesLst.itemCondensado,
      isSelecionado && stylesLst.expandeItem,
      isSelecionado && stylesLst.linhaSelecionada
    );
  };

  async function handleExcluir() {
    if (nivel !== 1) {
      Alerta({ mensagem: t('somentePerfilAdministrador') });
      return;
    }

    const confirmado = await Pergunta({ mensagem: t('lstTarefas.desejaExcluir') });

    if (!confirmado) return;

    try {
      const primaryKey = Object.keys(itemSelecionado)[0];
      const url = new URL(`${URL_API}Tarefas/${itemSelecionado?.[primaryKey]}`);

      const resposta = await fetch(url, {
        method: 'DELETE',
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

      setDados(prev => prev.filter(c => c?.[primaryKey] !== itemSelecionado?.[primaryKey]));

      ChamarSplash(t('lstTarefas.excluido') + ': ' + itemSelecionado.tarNomeTarefa, "aviso");
      handleDesmarcar();
    } catch (err) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  async function handleAtivarDesativar() {
    try {
      if (nivel !== 1) {
        Alerta({ mensagem: t('somentePerfilAdministrador') });
        return;
      }

      const ativar = (itemSelecionado.tarStatus === "D");

      const msg = (ativar) ? t('lstTarefas.desejaAtivar') : t('lstTarefas.desejaDesativar');

      const confirmado = await Pergunta({ mensagem: msg });
      if (!confirmado) return;

      const primaryKey = Object.keys(itemSelecionado)[0];
      let url = new URL(`${URL_API}Tarefas/ativar-desativar/${itemSelecionado?.[primaryKey]}`);

      url.searchParams.append("ativar", ativar);

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

      const msgSplash = ativar ? t('lstTarefas.tarefaAtivada') : t('lstTarefas.tarefaDesativada');

      ChamarSplash(msgSplash + ': ' + itemSelecionado.tarNomeTarefa, "aviso");
      handleDesmarcar();
      Filtrar(true);
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  function handleDesmarcar() {
    setItemSelecionado({});
  }

  function handleEditar() {
    navigate("/cadastroTarefa", { state: { backgroundLocation: location, itemSelecionado }});
    handleDesmarcar();
  }

  function Filtrar(recarregar = false) {
    const novosFiltros = { nomeTarefa, statusTarefa, ordenarPorData };

    if (recarregar === true || countMassaDados.current > DEF_MASSA_TAREFAS) {
      if (recarregar || JSON.stringify(filtrosEffect) !== JSON.stringify(novosFiltros)) {
        setFiltrosEffect(novosFiltros);
      }
    } 
     
    if (recarregar === true || JSON.stringify(filtros) !== JSON.stringify(novosFiltros)) {
      setFiltros(novosFiltros);
    }
  }  

  return (
    <>
      {ComponenteAlerta}
      {ComponentePergunta}

      <div className={stylesLst.container}>
        <h1> <SvgETarefas style={{ transform: 'scale(1.4)', transformOrigin: 'center', marginRight: '0.4em' }} /> {t('lstTarefas.titulo')}</h1>
        <div className="colunas quebraLinhaMobile">
          <div className="colunaEsquerda">
            <label className={stylesLst.labels} htmlFor="tarefa">{t('lstTarefas.filtroNomeTarefa')}:</label>
            <input type="text" id="tarefa" name="tarefa" style={{ minWidth: '9em' }} placeholder={t('lstTarefas.filtroTarefaHolder')} maxLength={MAX_CAMPO} onChange={(e) => setNomeTarefa(e.target.value)} className={stylesLst.filtro} />

            <label className={stylesLst.labels} htmlFor="statusTarefa">{t('lstTarefas.filtroStatus')}:</label>
            <select id="statusTarefa" name="statusTarefa" value={statusTarefa} onChange={(e) => setStatusTarefa(e.target.value)}>
              <option key={0} value={''}>{t('lstTarefas.statusTodas')}</option>
              <option key={1} value={'A'}>{t('lstTarefas.statusAbertas')}</option>
              <option key={2} value={'D'}>{t('lstTarefas.statusDesativadas')}</option>
              <option key={3} value={'F'}>{t('lstTarefas.statusFinalizadas')}</option>
            </select>
          </div>
          <div className="colunaEsquerdaOuCentralizada">
            <label className={stylesLst.labels} htmlFor="ordenarPorData">{t('lstTarefas.filtroOrdenarPorData')}:</label>
            <input type="checkbox" id="ordenarPorData" name="ordenarPorData" checked={ordenarPorData} onChange={(e) => setOrdenarPorData(e.target.checked)} className={stylesLst.filtro} />
           
            <button onClick={Filtrar}>{t('lst.listar')}</button>            
          </div>
          <div className="colunaCentralizada">
            <div  className={stylesLst.svgBtn}><SvgPrinter onClick={handImprimir} /></div>
            {(Object.keys(itemSelecionado).length > 0 && itemSelecionado.tarStatus !== "F")? (
              <div className={stylesLst.svgBtn}>
                <SvgEdit onClick={handleEditar} />&nbsp; 
                {(itemSelecionado.tarStatus === "A" && nivel === 1) ? <SvgDesativarTarefa onClick={handleAtivarDesativar} /> :
                 (itemSelecionado.tarStatus === "D" && nivel === 1) ? <><SvgAtivarTarefa onClick={handleAtivarDesativar} /> <SvgTrash onClick={handleExcluir}/>
                 </> : <></>}
                &nbsp;<SvgCancel  onClick={handleDesmarcar}/>
              </div>
            ) : (
              <>
              <div className={stylesLst.svgDesabilitados}><SvgEdit /> <SvgAtivarTarefa /> <SvgCancel /></div>
              {(itemSelecionado.tarStatus === "F") && <><SvgTarefaFinalizada style={{ transform: 'scale(1.4)'}} /> {t('lstTarefas.tarefaFinalizada')}</>}
              </>
            )}
          </div>
          <div className="colunaDireita">
            <button onClick={handleClose}>{t('fechar')}</button>
          </div>
        </div>
        {ativaLoading ? (<Loading />) :
        (
          <div className="esquerda">
            <table className={stylesLst.listaItens} style={{ width: '100%', overflowX: 'auto' }}>
              <thead>
                <tr>
                  <th style={!isMobile ? { width: '15em' } : { width: '11em' }}>{t("lstTarefas.nome")}</th>
                  <th style={!isMobile ? { width: '15em' } : { width: '11em' }}>{t("lstTarefas.descricao")}</th>
                  <th style={!isMobile ? { width: '6em' } : { width: '6em' }}>{t('lstTarefas.dataComeco')}</th>
                  <th style={!isMobile ? { width: '6em' } : { width: '6em' }}>{t('lstTarefas.dataFinalPrevista')}</th>
                  <th style={!isMobile ? { width: '6em' } : { width: '6em' }}>{t('lstTarefas.dataFinal')}</th>
                  <th style={!isMobile ? { width: '6em' } : { width: '6em' }}>{t('lstTarefas.statusDescricao')}</th>
                  <th style={!isMobile ? { width: 'auto' } : { width: '10em' }}>{t('lstTarefas.mtarNome')}</th>
                  <th style={!isMobile ? { width: 'auto' } : { width: '10em' }}>{t('lstTarefas.mtarDescricao')}</th>
                  <th style={!isMobile ? { width: 'auto' } : { width: '10em' }}>{t('lstTarefas.responsavel')}</th>
                </tr>
              </thead>
              <tbody>
                {itensPaginados.map((item) => {
                  const primaryKey = Object.keys(item)[0];
                  const isSelecionado = itemSelecionado?.[primaryKey] === item[primaryKey];

                  return (
                    <tr key={item[primaryKey]} className={isSelecionado ? stylesLst.linhaSelecionada : ''} onClick={() => setItemSelecionado(item)} >
                      <td className={getCellClass(item)} style={item.flaCor ? { borderLeft: `4px solid ${item.flaCor}` } : {}} title={item.flaRotulo || undefined}>
                        {item.tarStatus === "D" && <SvgDesativarTarefa title={t('lstTarefas.tarefaDesativada')} /> } {item.tarNomeTarefa}
                      </td>
                      <td className={getCellClass(item)}>{item.tarDescricao}</td>
                      <td className={getCellClass(item)}>{FormatarData(item.tarDataComeco)}</td>
                      <td className={getCellClass(item)}>{FormatarData(item.tarDataFinalPrevista)}</td>
                      <td className={getCellClass(item)}>{FormatarData(item.tarDataFinal)}</td>
                      <td className={getCellClass(item)}>{item.tarStatusDescricao}</td>
                      <td className={getCellClass(item)}>{item.mtarNome}</td>
                      <td className={getCellClass(item)}>{item.mtarDescricao}</td>
                      <td className={getCellClass(item)}>{item.usuNomeUsuarioResponsavelTarefa}</td>
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
                      ◀ {t('lst.anterior')}
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
                      {t('lst.proxima')} ▶
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
        }
        
      </div>
    </>
  );
}

export default LstTarefas;
import { useState, useEffect, useRef, useMemo } from "react";
import { URL_API, FLAGS } from '../../util/config';
import stylesLst from './Lst.module.css';
import { useCustomAlerta } from '../../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../../components/alerta/usePerguntaDlg';
import { TbTemplate } from "react-icons/tb";
import { SvgPrinter, SvgEdit, SvgTrash, SvgCancel, SvgAdd } from "../../components/outros/Svg";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/outros/Loading';
import { ValidaRetornoAPI, TraduzMensagemErroBackend, GetDadosLogin, ChamarSplash, ITENS_POR_PAGINA, PRN_MARGEM, DEF_MASSA_MODELOSTRAMITE } from '../../util/servico';
import clsx from 'clsx';
import logo from '../../img/logo.png';

function LstModelosTramite() {
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

  const [filtroIdModeloTarefa, setFiltroIdModeloTarefa] = useState(0);
  const [filtroEffectIdModeloTarefa, setFiltroEffectIdModeloTarefa] = useState(0); 
 
  const [tarefas, setTarefas] = useState([]);
  const [nomeTarefa, setNomeTarefa] = useState('');
  const [descricaoTarefa, setDescricaoTarefa] = useState('');

  const [selectedTarefaId, setSelectedTarefaId] = useState(0);

  const itensFiltrados = useMemo(() => {
    return dados?.filter((c) =>
      c.mtraMtarId === filtroIdModeloTarefa
    ) || [];
  }, [dados, filtroIdModeloTarefa]);

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
    try {
      setAtivaLoading(true);
      const token = GetDadosLogin("token");

      async function carregarTarefas() {
        try {
          const resposta = await fetch(URL_API + 'ModelosTarefa', {
            method: 'GET',
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

        setTarefas(dados);

        if (dados.length === 0)
        {
          ChamarSplash(t('frmCadastroModeloTramite.naoHaModelosTarefa'), "erro");
          navigate(-1);
          return;
        }

        setSelectedTarefaId(dados[0].mtarId);
        setFiltroIdModeloTarefa(dados[0].mtarId);
        setNomeTarefa(dados[0].mtarNome);
        setDescricaoTarefa(dados[0].mtarDescricao);
      } catch (e) {
        Alerta({ mensagem: t('api.apiErro') });
      }
    }

      carregarTarefas();

      fetch(logo)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagemBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      });

    } catch (err) {
      Alerta({ mensagem: t('api.apiErro') });
    } finally {
      setAtivaLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAtivaLoading(true);
    const token = GetDadosLogin("token");
    const delay = (tempo) => new Promise(resolve => setTimeout(resolve, tempo));

    const buscarDados = async () => {
      try {

        const url = new URL(`${URL_API}ModelosTramite`);
      
        if (countMassaDados.current > DEF_MASSA_MODELOSTRAMITE)
          url.searchParams.append("idModeloTarefa", filtroEffectIdModeloTarefa || 0);

        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
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

    window.addEventListener("atualizarListaModelosTramite", buscarDados);

    return () => {  window.removeEventListener("atualizarListaModelosTramite", buscarDados);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEffectIdModeloTarefa]);

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

    const linhaFiltro = (nomeTarefa) ? `${t('lstModelosTramite.filtro')}: ` + nomeTarefa : "";    

    gerarPdf(linhaFiltro);
  }

  const gerarPdf = async (linhaFiltro) => {
    const pdfMake = (await import('pdfmake/build/pdfmake.min.js')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts.js')).default;

    pdfMake.vfs = pdfFonts;

    const docDefinition = {
      pageMargins: [0, 90, 0, PRN_MARGEM * 2],
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
              { text: t('lstModelosTramite.titulo'), style: 'header', alignment: 'left', margin: [PRN_MARGEM+5, PRN_MARGEM, PRN_MARGEM, 0] },
              { text: `${t('lst.gerado')}: ${new Date().toLocaleString()}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 1, PRN_MARGEM, 0] },
              { text: `${linhaFiltro}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 1, PRN_MARGEM, 0] },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 0]
      },

      content: [        
        ...(descricaoTarefa && descricaoTarefa.trim() !== '' ? [{
          text: `${t('lstModelosTramite.descricao')}: ${descricaoTarefa}`,
          style: 'subHeader',
          alignment: 'left',
          margin: [PRN_MARGEM, 5, PRN_MARGEM, 10],
        }] : []),
        
        { text: `${t('lstModelosTramite.tramites')}:`, style: 'sectionTitle', margin: [PRN_MARGEM, 0, PRN_MARGEM, PRN_MARGEM / 2] },

        ...itensFiltrados.map((item) => ({
          stack: [
            { text: `#${item.mtraOrdem} - ${item.mtraNomeTramite}`, style: 'tramiteTitle', margin: [PRN_MARGEM, 0, PRN_MARGEM, 2] },
            { text: `${t('lstModelosTramite.descricao')}: ${item.mtraDescricaoTramite || '—'}`, margin: [PRN_MARGEM, 2, PRN_MARGEM, 0] },
            { text: `${t('lstModelosTramite.duracaoPrevista')}: ${item.mtraDuracaoPrevistaDias !== null ? item.mtraDuracaoPrevistaDias + ` ${t('lstModelosTramite.diaDias')}` : '—'}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },
            { text: `${t('lstModelosTramite.nomeRevisor')}: ${item.usuNomeRevisor || '—'}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 0] },
            { text: `${t('lstModelosTramite.nomeIndicacao')}: ${item.usuNomeIndicacao || '—'}`, margin: [PRN_MARGEM, 0, PRN_MARGEM, 8] },
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

  async function handleExcluir() {
    const confirmado = await Pergunta({ mensagem: t('lstModelosTramite.desejaExcluir') });

    if (!confirmado) return;

    try {
      const token = GetDadosLogin("token");

      const primaryKey = Object.keys(itemSelecionado)[0];
      const url = new URL(`${URL_API}ModelosTramite/${itemSelecionado?.[primaryKey]}`);

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

      ChamarSplash(t('lstModelosTramite.excluido') + ' ' + itemSelecionado.mtraNomeTramite, "aviso");
      handleDesmarcar();
    } catch (err) {
      Alerta({ mensagem: err });
    }
  }

  function handleDesmarcar() {
    setItemSelecionado({});
  }

  function handleAdicionar() {
    itemSelecionado.mtraId = 0;
    itemSelecionado.mtraMtarId = selectedTarefaId;
    
    navigate("/cadastromodelotramite", { state: { backgroundLocation: location, itemSelecionado }});
    handleDesmarcar();
  }

  function handleEditar() {
    navigate("/cadastromodelotramite", { state: { backgroundLocation: location, itemSelecionado }});
    handleDesmarcar();
  }
  
  const handleChangeTarefas = (e) => {
    const idSelecionado = parseInt(e.target.value);
    setSelectedTarefaId(idSelecionado);

    if (countMassaDados.current > DEF_MASSA_MODELOSTRAMITE)
      setFiltroEffectIdModeloTarefa(idSelecionado);

    setFiltroIdModeloTarefa(idSelecionado);

    const tarefaSelecionada = tarefas.find(t => t.mtarId === idSelecionado);
    setNomeTarefa(tarefaSelecionada?.mtarNome || '');
    setDescricaoTarefa(tarefaSelecionada?.mtarDescricao || '');
  };

  return (
    <>
      {ComponenteAlerta}
      {ComponentePergunta}

      <div className={stylesLst.container}>
        <h1> <TbTemplate style={{ transform: 'scale(1.4)', transformOrigin: 'center', marginRight: '0.4em' }} /> {t('lstModelosTramite.titulo')}</h1>
        <div className="colunas quebraLinhaMobile">        
          <div className="colunaEsquerda">
            <label htmlFor="tarefas">{t('lstModelosTramite.filtroTarefas')}</label>
            <select id="tarefas" value={selectedTarefaId} onChange={handleChangeTarefas}>
              {tarefas.map(tarefas => (
                <option key={tarefas.mtarId} value={tarefas.mtarId}>
                  {tarefas.mtarNome}
                </option>
              ))}
            </select>
          </div>
          <div className="colunaCentralizada">
            <div  className={stylesLst.svgBtn}><SvgPrinter onClick={handImprimir} /></div>
            { Object.keys(itemSelecionado).length === 0 ? (
              <div className={stylesLst.svgBtn}><SvgAdd onClick={handleAdicionar} /></div>
              ) : (
              <div className={stylesLst.svgDesabilitados}><SvgAdd /></div>
            )}
            { Object.keys(itemSelecionado).length > 0 ? (
              <div className={stylesLst.svgBtn}><SvgEdit onClick={handleEditar} /> <SvgTrash onClick={handleExcluir}/> <SvgCancel  onClick={handleDesmarcar}/></div>
            ) : (
              <div className={stylesLst.svgDesabilitados}><SvgEdit /> <SvgTrash /> <SvgCancel /></div>
            )}
          </div>
          <div className="colunaDireita">
            <button onClick={handleClose}>{t('fechar')}</button>
          </div>
        </div>
        <div className="esquerda"><h3 className={stylesLst.h3}>{t('lstModelosTramite.descricaoTarefa')}</h3></div>
        <div className="esquerda">{descricaoTarefa}</div>

        {ativaLoading ? (<Loading />) :
        (
          <div className="esquerda">
            { itensFiltrados.length > 0 ? (              
              <table className={stylesLst.listaItens}>
                <thead>
                  <tr>
                    <th style={{ width: '2em' }}>{t('lstModelosTramite.ordem')}</th>
                    <th style={{ width: '22em' }}>{t('lstModelosTramite.nome')}</th>
                    <th style={{ width: '3em' }}>{t('lstModelosTramite.duracaoPrevistaDias')}</th>
                    <th style={{ width: '12em' }}>{t('lstModelosTramite.nomeRevisor')}</th>
                    <th style={{ width: '12em' }}>{t('lstModelosTramite.nomeIndicacao')}</th>
                    <th style={{ width: '12em' }}>{t('lstModelosTramite.descricao')}</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPaginados.map((item) => {
                    const primaryKey = Object.keys(item)[0];
                    const isSelecionado = itemSelecionado?.[primaryKey] === item[primaryKey];

                    return (
                      <tr key={item[primaryKey]} className={isSelecionado ? stylesLst.linhaSelecionada : ''} onClick={() => setItemSelecionado(item)}>
                        <td className={getCellClass(item)}>{item.mtraOrdem}</td>
                        <td className={getCellClass(item)}>{item.mtraNomeTramite}</td>
                        <td className={getCellClass(item)}>{item.mtraDuracaoPrevistaDias}</td>
                        <td className={getCellClass(item)}>{item.usuNomeRevisor ? item.usuNomeRevisor : t('lstModelosTramite.semRevisor')}</td>
                        <td className={getCellClass(item)}>{item.usuNomeIndicacao ? item.usuNomeIndicacao : t('lstModelosTramite.semIndicacaoTramitador')}</td>
                        <td className={getCellClass(item)}>{item.mtraDescricaoTramite}</td>
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
              <h2>{t('lstModelosTramite.semTramites')}</h2>
            )}
          </div>
        )
        }
        
      </div>
    </>
  );
}

export default LstModelosTramite;

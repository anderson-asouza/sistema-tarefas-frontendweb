import { useState, useEffect, useRef, useMemo } from "react";
import { URL_API, FLAGS } from '../../util/config';
import stylesLst from './Lst.module.css';
import { useCustomAlerta } from '../../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../../components/alerta/usePerguntaDlg';
import { TbTemplate } from "react-icons/tb";
import { SvgPrinter, SvgEdit, SvgTrash, SvgCancel, SvgFlag } from "../../components/outros/Svg";
import { useLocation, useNavigate  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/outros/Loading';
import { ValidaRetornoAPI, TraduzMensagemErroBackend, GetDadosLogin, ChamarSplash, ITENS_POR_PAGINA, MAX_CAMPO, PRN_MARGEM, DEF_MASSA_FLAGS } from '../../util/servico';
import { isMobile } from "../../util/DeviceContext";
import clsx from 'clsx';
import logo from '../../img/logo.png';

function LstFlags() {
  const { Alerta, ComponenteAlerta } = useCustomAlerta();
  const { Pergunta, ComponentePergunta } = usePerguntaDlg();

  const [ativaLoading, setAtivaLoading] = useState(true);
  const countMassaDados = useRef(-1);
  const [itemSelecionado, setItemSelecionado] = useState({});
  const [imagemBase64, setImagemBase64] = useState();

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClose = () => navigate(-1);  

  const [dados, setDados] = useState([]);

  const [filtroRotuloFlag, setFiltroRotuloFlag] = useState('');
  const [filtroEffectRotuloFlag, setFiltroEffectRotuloFlag] = useState('');
  
  const [rotuloFlag, setRotuloFlag] = useState('');

  const itensFiltrados = useMemo(() => {
    return dados?.filter((c) =>
      c.flaRotulo.toLowerCase().includes(filtroRotuloFlag.toLowerCase())
    ) || [];
  }, [dados, filtroRotuloFlag]);  

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = ITENS_POR_PAGINA;

  const inicioItem = (paginaAtual - 1) * itensPorPagina + 1;
  const fimItem = Math.min(paginaAtual * itensPorPagina, itensFiltrados.length);  

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

  }, [setImagemBase64]);


  useEffect(() => {
    const delay = (tempo) => new Promise(resolve => setTimeout(resolve, tempo));

    const buscarDados = async () => {
      setAtivaLoading(true);
      try {
        const token = GetDadosLogin("token");

        const url = new URL(`${URL_API}Flags`);
        if (countMassaDados.current > DEF_MASSA_FLAGS)
          url.searchParams.append("rotuloFlag", filtroEffectRotuloFlag || "");

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
        Alerta({ mensagem: err });
      } finally {
        setAtivaLoading(false);
      }
    };
    buscarDados();

    window.addEventListener("atualizarListaFlags", buscarDados);

    return () => {  window.removeEventListener("atualizarListaFlags", buscarDados);
  };
  }, [t, Alerta, filtroEffectRotuloFlag]);

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

    const linhaFiltro = (filtroRotuloFlag) ? `${t('lst.filtro')}: ${filtroRotuloFlag}` : "";

    gerarPdf(linhaFiltro);
  }

  const gerarPdf = async (linhaFiltro) => {
    const pdfMake = (await import('pdfmake/build/pdfmake.min.js')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts.js')).default;

    pdfMake.vfs = pdfFonts;

    const body = [];

    body.push([
      { text: t('lstFlags.nomeFlag'), style: 'tableHeader' },
      { text: t('lstFlags.cor'), style: 'tableHeader' },
    ]);

    itensFiltrados.forEach(item => {
      body.push([
        { text: item.flaRotulo },
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w: 12, h: 12, r: 3, color: item.flaCor || '#CCCCCC', },
          ], margin: [0, 2, 0, 2],
        },
      ]);
    });

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
              { text: t('lstFlags.titulo'), style: 'header', alignment: 'left', margin: [PRN_MARGEM+5, PRN_MARGEM, PRN_MARGEM, 0] },
              { text: `${t('lst.gerado')}: ${new Date().toLocaleString()}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
              { text: `${linhaFiltro}`, style: 'subHeader', alignment: 'left', margin: [PRN_MARGEM+5, 0, PRN_MARGEM, 0] },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 0]
      },

      content: [
        {
          style: 'tableBody',
          table: {
            headerRows: 1,
            widths: [300, '*'],
            body: body,
          },
          layout: 'lightHorizontalLines',
          alignment: 'left',
          margin: [PRN_MARGEM, 0, PRN_MARGEM, 0],
        },
      ],

      styles: {
        header: { fontSize: 18, bold: true },
        tableBody: { fontSize: 11, color: 'black' },
        tableHeader: { bold: true, fontSize: 13, color: 'black' },
        subHeader: { bold: false, fontSize: 12, color: 'black' },
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
    const confirmado = await Pergunta({ mensagem: t('lstFlags.desejaExcluir') });

    if (!confirmado) return;

    try {
      const token = GetDadosLogin("token");

      const primaryKey = Object.keys(itemSelecionado)[0];
      const url = new URL(`${URL_API}Flags/${itemSelecionado?.[primaryKey]}`);

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

      ChamarSplash(t('lstFlags.excluido') + ' ' + itemSelecionado.flaRotulo, "aviso");
      handleDesmarcar();
    } catch (err) {
      Alerta({ mensagem: err });
    }
  }

  function handleDesmarcar() {
    setItemSelecionado({});
  }

  function handleEditar() {
    navigate("/cadastroflag", { state: { backgroundLocation: location, itemSelecionado }});
    handleDesmarcar();
  }

  function Filtrar()
  {
    setFiltroRotuloFlag(rotuloFlag);

    if (countMassaDados.current > DEF_MASSA_FLAGS)
      setFiltroEffectRotuloFlag(rotuloFlag);
  }

  return (
    <>
      {ComponenteAlerta}
      {ComponentePergunta}

      <div className={stylesLst.container}>
        <h1> <TbTemplate style={{ transform: 'scale(1.4)', transformOrigin: 'center', marginRight: '0.4em' }} /> {t('lstFlags.titulo')}</h1>
        <div className="colunas quebraLinhaMobile">        
          <div className="colunaEsquerda">
            <label className={stylesLst.labels} htmlFor="RotuloFlag">{t('lst.filtro')}:</label>
            <input type="text" id="RotuloFlag" name="RotuloFlag" placeholder={t('lstFlags.filtroFlagHolder')} maxLength={MAX_CAMPO} value={rotuloFlag} onChange={(e) => setRotuloFlag(e.target.value)} className={stylesLst.filtro} />
            <button onClick={Filtrar}>{t('lst.listar')}</button>
          </div>
          <div className="colunaCentralizada">
            <div  className={stylesLst.svgBtn}><SvgPrinter onClick={handImprimir} /></div>
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
        {ativaLoading ? (<Loading />) :
        (
          <div className="esquerda">
            <table className={stylesLst.listaItens}>
              <thead>
                <tr>
                  <th style={!isMobile ? { width: '40em' } : { width: '16em' }}>{t('lstFlags.nomeFlag')}</th>
                  <th style={!isMobile ? { width: 'auto' } : { width: '3em' } }>{t('lstFlags.cor')}</th>
                </tr>
              </thead>
              <tbody>
                {itensPaginados.map((item) => {
                  const primaryKey = Object.keys(item)[0];
                  const isSelecionado = itemSelecionado?.[primaryKey] === item[primaryKey];

                  return (
                    <tr key={item[primaryKey]} className={isSelecionado ? stylesLst.linhaSelecionada : ''} onClick={() => setItemSelecionado(item)}>
                      <td className={getCellClass(item)}>{item.flaRotulo}</td>
                      <td className={getCellClass(item)}><SvgFlag style={item.flaCor ? { transform: 'scale(1.2)', color: `${item.flaCor}` } : {}} title={item.flaRotulo || undefined}/></td>
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

          </div>
        )
        }
        
      </div>
    </>
  );
}

export default LstFlags;

import { useState, useEffect, useRef, useMemo } from "react";
import { isMobile } from "../../util/DeviceContext";
import { URL_API, FLAGS } from '../../util/config';
import stylesLst from './Lst.module.css';
import { useCustomAlerta } from '../../components/alerta/useCustomAlerta';
import { usePerguntaDlg } from '../../components/alerta/usePerguntaDlg';
import { SvgPrinter, SvgEdit, SvgTrash, SvgCancel, SvgEUsuarios } from "../../components/outros/Svg";
import { useLocation, useNavigate  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/outros/Loading';
import { ValidaRetornoAPI, TraduzMensagemErroBackend, GetDadosLogin, ChamarSplash, ITENS_POR_PAGINA, MAX_CAMPO, PRN_MARGEM, DEF_MASSA_USUARIOS } from '../../util/servico';
import clsx from 'clsx';
import logo from '../../img/logo.png';

function LstUsuarios() {
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

  const [filtroNomeUsuario, setFiltroNomeUsuario] = useState('');
  const [filtroEffectNomeUsuario, setFiltroEffectNomeUsuario] = useState('');
  
  const [nomeUsuario, setNomeUsuario] = useState('');

  const itensFiltrados = useMemo(() => {
    return dados?.filter((c) =>
      c.usuNome.toLowerCase().includes(filtroNomeUsuario.toLowerCase())
    ) || [];
  }, [dados, filtroNomeUsuario]);

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

        const url = new URL(`${URL_API}Usuarios`);
        if (countMassaDados.current > DEF_MASSA_USUARIOS)
          url.searchParams.append("nomeUsuario", filtroEffectNomeUsuario || "");

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
      } catch (ex) {
        Alerta({ mensagem: t('api.apiErro') });
      } finally {
        setAtivaLoading(false);
      }
    };

    buscarDados();

    window.addEventListener("atualizarListaUsuarios", buscarDados);

    return () => {  window.removeEventListener("atualizarListaUsuarios", buscarDados);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEffectNomeUsuario]);

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
    if (countMassaDados.current < 1) {
        Alerta({ mensagem: t('lst.semDadosImprimir') });
        return;
    }

    const linhaFiltro = (filtroNomeUsuario) ? `${t('lstUsuarios.filtro')}: ${filtroNomeUsuario}` : "";    

    gerarPdf(linhaFiltro);
  }

  const gerarPdf = async (linhaFiltro) => {
    const pdfMake = (await import('pdfmake/build/pdfmake.min.js')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts.js')).default;

    pdfMake.vfs = pdfFonts;

    const body = [];

    body.push([
      { text: t('lstUsuarios.id'), style: 'tableHeader' },
      { text: t('lstUsuarios.nome'), style: 'tableHeader' },
      { text: t('lstUsuarios.login'), style: 'tableHeader' },
      { text: t('lstUsuarios.nivel'), style: 'tableHeader' },
      { text: t('lstUsuarios.matricula'), style: 'tableHeader' },
      { text: t('lstUsuarios.email'), style: 'tableHeader' },
    ]);

    itensFiltrados.forEach(item => {
      body.push([
        item.usuId,
        item.usuNome,
        item.usuLogin,
        item.usuNivel,
        item.usuMatricula,
        item.usuEmail,
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
              { text: t('lstUsuarios.titulo'), style: 'header', alignment: 'left', margin: [PRN_MARGEM+5, PRN_MARGEM, 0, 0] },
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
            widths: ['auto', 150, 'auto', 'auto', 'auto', 'auto'],
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
    const confirmado = await Pergunta({ mensagem: t('lstUsuarios.desejaExcluir') });

    if (!confirmado) return;

    try {
      const token = GetDadosLogin("token");
      
      const primaryKey = Object.keys(itemSelecionado)[0];
      const url = new URL(`${URL_API}Usuarios/${itemSelecionado?.[primaryKey]}`);

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

      ChamarSplash(t('lstUsuarios.excluido') + ' ' + itemSelecionado.usuNome, "aviso");
      handleDesmarcar();
    } catch (ex) {
      Alerta({ mensagem: t('api.apiErro') });
    }
  }

  function handleDesmarcar() {
    setItemSelecionado({});
  }

  function handleEditar() {
    navigate("/cadastrousuario", { state: { backgroundLocation: location, itemSelecionado }});
    handleDesmarcar();
  }

  function Filtrar()
  {
    setFiltroNomeUsuario(nomeUsuario);

    if (countMassaDados.current > DEF_MASSA_USUARIOS)
      setFiltroEffectNomeUsuario(nomeUsuario);
  }

  return (
    <>
      {ComponenteAlerta}
      {ComponentePergunta}

      <div className={stylesLst.container}>
        <h1><SvgEUsuarios style={{ transform: 'scale(1.25)', transformOrigin: 'center', marginRight: '0.2em' }} /> {t('lstUsuarios.titulo')}</h1>
        <div className="colunas quebraLinhaMobile">        
          <div className="colunaEsquerda">
            <label className={stylesLst.labels} htmlFor="nomeUsuario">{t('lstUsuarios.filtro')}:</label>
            <input type="text" id="nomeUsuario" name="nomeUsuario" placeholder={t('lstUsuarios.filtroUsuariosHolder')} maxLength={MAX_CAMPO} onChange={(e) => setNomeUsuario(e.target.value)} className={stylesLst.filtro} />
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
                  <th style={{ width: '3em' }}>{t('lstUsuarios.id')}</th>
                  <th style={!isMobile ? { width: '22em' } : { width: '15em' }}>{t('lstUsuarios.nome')}</th>
                  <th style={{ width: '9em' }}>{t('lstUsuarios.login')}</th>
                  <th style={{ width: '3em' }}>{t('lstUsuarios.nivel')}</th>
                  <th style={{ width: '8em' }}>{t('lstUsuarios.matricula')}</th>
                  <th style={{ width: '12em' }}>{t('lstUsuarios.email')}</th>
                </tr>
              </thead>
              <tbody>
                {itensPaginados.map((item) => {
                  const primaryKey = Object.keys(item)[0];
                  const isSelecionado = itemSelecionado?.[primaryKey] === item[primaryKey];

                  return (
                    <tr key={item[primaryKey]} className={isSelecionado ? stylesLst.linhaSelecionada : ''} onClick={() => setItemSelecionado(item)}>
                      <td className={getCellClass(item)}>{item.usuId}</td>
                      <td className={getCellClass(item)}>{item.usuNome}</td>
                      <td className={getCellClass(item)}>{item.usuLogin}</td>
                      <td className={getCellClass(item)}>{item.usuNivel}</td>
                      <td className={getCellClass(item)}>{item.usuMatricula}</td>
                      <td className={getCellClass(item)}>{item.usuEmail}</td>
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

export default LstUsuarios;

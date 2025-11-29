import { FaQuestionCircle } from 'react-icons/fa';
import { SvgAFazer, SvgEmProgresso, SvgAuardandoRevisao, SvgTarefaFalha, SvgTarefaOK, SvgPrazoTarefaAcabando, SvgPrazoTarefaAcabou } from '../components/outros/Svg';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { isMobile } from "./DeviceContext";

export const DEF_MASSA_USUARIOS = 100;
export const DEF_MASSA_MODELOSTAREFA = 100;
export const DEF_MASSA_MODELOSTRAMITE = 1000;
export const DEF_MASSA_TAREFAS = 10000;
export const DEF_MASSA_TRAMITES = 100000;
export const DEF_MASSA_FLAGS = 1000;

export const ITENS_POR_PAGINA = 15;

export const PRAZO_ALERTA_TAREFA = 7;
export const PRAZO_ALERTA_TRAMITE = 0;
export const MAX_CAMPO = 50;
export const MAX_DESCRICAO = 500;

export const PRN_MARGEM = 28.35;

export function SalvaDadosLogin (id, login, nome, nivel, matricula, foto, token) {
  sessionStorage.setItem("id", id);
  sessionStorage.setItem("login", login);
  sessionStorage.setItem("nome", nome);
  sessionStorage.setItem("nivel", String(nivel));
  sessionStorage.setItem("matricula", matricula);
  sessionStorage.setItem("foto", foto);
  sessionStorage.setItem("token", token);
}

export function GetDadosLogin(dado) {
  try {
    dado = dado.toLowerCase().trim();

    const id = parseInt(sessionStorage.getItem("id"), 10);
    const nivel = parseInt(sessionStorage.getItem("nivel"), 10);

    const c = {
      "id": Number.isNaN(id) ? -1 : id,
      "login": sessionStorage.getItem("login") || "",
      "nome": sessionStorage.getItem("nome") || "",
      "nivel": Number.isNaN(nivel) ? -1 : nivel,
      "matricula": sessionStorage.getItem("matricula") || "",
      "foto": sessionStorage.getItem("foto") || "",
      "token": sessionStorage.getItem("token") || ""
    };
    
    return dado in c ? c[dado] : null;
  } catch {
    return null;
  }
}

export async function ValidaRetornoAPI(resposta, t) {
  let dados = null;

  try {   
    const contentType = resposta.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        dados = await resposta.json();

      } catch (ex) {
        return { erro: t("api.apiErro") };
      }
    }

    if (resposta.status === 401) {      
      const msg = dados?.rm || dados?.detail || dados?.message || "";
      const msgLower = msg.toLowerCase();

      if (msgLower.includes("expired")) {
        sessionStorage.clear();
        window.dispatchEvent(new Event('atualizarLogin'));
        return { erro: t("api.tokenExpirado") };
      }

      if (msgLower.includes("unauthorized") || msgLower.includes("invalid")) {
        return { erro: t("api.loginNaoAutorizado") };
      }

      if (dados) {
        return { erro: msg || t("api.loginNaoAutenticado"), dados };
      }
      
      return { erro: msg || t("api.loginNaoAutenticado") };
    }

    if (resposta.status === 403) {
      const msg = dados?.rm || dados?.detail || dados?.message || "";

      if (dados) {
        return { erro: msg || t("api.autenticadoSemPermissao"), dados };
      }

      return { erro: msg || t("api.autenticadoSemPermissao") };
    }

    if (resposta.status === 404 && !dados) {
      return { erro: t("api.metodoInvalidoAPI") };
    }    

    if (!dados || typeof dados !== "object") {
      return { erro: t("api.apiErro") };
    }

    try {
      if (!Array.isArray(dados) && !dados.ok) {
        return { erro: dados.rm || t("api.apiErro"), dados };
        
      } else if (Array.isArray(dados) && dados.length > 0 && !dados[0].ok) {
        return { erro: dados[0].rm || t("api.apiErro"), dados };
      }

    } catch (ex) {
      return { erro: t("api.apiErro"), dados };
    }

    return {
      erro:
        dados?.dados?.ok === false
          ? dados.dados.rm || t("api.apiErro")
          : dados?.ok === false
            ? dados.rm || t("api.apiErro")
            : undefined,
      dados: dados.dados ?? dados,
      count: Array.isArray(dados)
        ? dados.length
        : dados.count ?? dados.dados?.length ?? 0
    };
  } catch (ex) {
    return { erro: t("api.apiErro"), dados };
  }
}

export function TraduzMensagemErroBackend(erro, dados, t) {
  if (!erro && !dados) return null;

  let resposta = ""; 
  
  if (dados && dados.errorCode) {
    const m = dados.errorCode.toUpperCase();

    if (m.includes("MSG_EXCEPTION")) return t('api.apiErro');
    if (m.includes("INTEGRIDADE_REFERENCIAL")) resposta += t("api.msgIntegridadeReferencial") + '\n';    
    if (m.includes("REGISTRO_NAO_ENCONTRADO")) return t("api.msgRegistroNaoEncontrado");
    if (m.includes("REQUISICAO_INCORRETA")) return t("api.msgRequisicaoIncorreta");
    if (m.includes("ENTIDADE_NAO_PROCESSAVEL")) return t("api.msgEntidadeNaoProcessavel");
    if (m.includes("CONFLITO_ENTIDADE")) return t("api.msgConflitoEntidade");
    if (m.includes("NOME_EM_USO")) resposta += t("api.msgNomeEmUso") + '\n';
    if (m.includes("MSG_EXCEDE_TAMANHO")) resposta += t("api.msgTamanhoCampoExcedido") + '\n';
    if (m.includes("ID_IRREGULAR")) resposta += t("api.msgIdIrregular") + '\n';
    if (m.includes("PREECHIMENTO_OBRIGATORIO")) resposta += t("camposObrigatorios") + '\n';
    
    if (m.includes("USUARIOS_CREDENCIAIS_INVALIDAS")) return t("usuarios.msgCredenciaisInvalidas");
    if (m.includes("USUARIOS_NOVASENHA_DEVE_SER_DIFERENTE_SENHAATUAL")) return t("usuarios.msgNovaSenhaDeveSerDiferenteSenhaAtual");
    if (m.includes("USUARIOS_INFORME_NOVASENHA")) return t("usuarios.msgInformeNovaSenha");
    if (m.includes("USUARIOS_LOGIN_SENHA")) return t("usuarios.msgInformeLoginSenha");
    if (m.includes("USUARIOS_NOVASENHA_DIFERENTE_CONFIRMACAO")) return t("usuarios.msgConfirmacaoDiferente");
    if (m.includes("USUARIOS_BLOQUEADO")) return t("usuarios.msgBloqueado");
    if (m.includes("USUARIOS_SENHA_EXPIROU")) return t("usuarios.msgSenhaExpirada");
    if (m.includes("USUARIOS_USUARIO_DEVE_TROCAR_SENHA")) return t("usuarios.msgUsuarioDeveTrocarSenha");
    if (m.includes("USUARIOS_LOGIN_JA_EXISTE")) resposta += t("usuarios.msgLoginJaExiste") + '\n';
    if (m.includes("USUARIOS_MATRICULA_JA_EXISTE")) resposta += t("usuarios.msgMatriculaJaExiste") + '\n';
    if (m.includes("USUARIOS_SENHA_INICIAL")) resposta += t("usuarios.msgSenhaInicial") + '\n';
    if (m.includes("USUARIOS_NIVEL_INVALIDO")) resposta += t("usuarios.msgNivelInvalido") + '\n';
    if (m.includes("FLAGS_COR_INCORRETA")) resposta += t("usuarios.msgCorIncorreta") + '\n';    

    if (m.includes("TAREFAS")) resposta += t("tarefas.msgTarefas") + '\n';
    if (m.includes("TAREFAS_VALIDACAO_NOME_TAREFA_EM_USO")) resposta += t("tarefas.msgNomeTarefaEmUso") + '\n';
    if (m.includes("TAREFAS_VALIDACAO_MODELO_TAREFA_NAO_ENCONTRADO")) resposta += t("tarefas.msgModeloTarefaNaoEncontrado") + '\n';
    if (m.includes("TAREFAS_CADASTRAR_NAO_HA_TRAMITES_VALIDOS_MODELO")) return t("tarefas.msgNaoHaTramitesValidosNoModelo");
    if (m.includes("TAREFAS_INICIAL_NAO_GRAVADO")) return t("tarefas.msgTramiteInicialNaoGravado");
    if (m.includes("TAREFAS_SOMENTE_RESPONSAVEL_MUDAR_FLAG")) return t("tarefas.msgSomenteResponsavelMudarFlag");
    if (m.includes("TAREFAS_FINALIZADA_NAO_PODE_ATIVAR")) return t("tarefas.msgFinalizadaNaoPodeAtivar");

    if (m.includes("TRAMITES_MODELOS_TAREFA")) resposta += t("modelosTramite.msgTramitesModelosTarefa") + '\n';//nome errado
    if (m.includes("MODELOS_TRAMITE_NOME_OBRIGATORIO")) resposta += t("modelosTramite.msgNomeObrigatorio") + '\n';
    if (m.includes("MODELOS_TRAMITE_DURACAO_OBRIGATORIA")) resposta += t("modelosTramite.msgDuracaoObrigatoria") + '\n';
    if (m.includes("MODELOS_TRAMITE_OBRIGATORIO_MODELO_TAREFA")) resposta += t("modelosTramite.msgModeloTarefaObrigatorio") + '\n';
    if (m.includes("MODELOS_TRAMITE_REVISOR_TRAMITADOR_IGUAIS")) resposta += t("modelosTramite.msgRevisorTramitadorIguais") + '\n';
    if (m.includes("MODELOS_TRAMITE_NAO_ENCONTRADO")) resposta += t("modelosTramite.msgModeloTramiteNaoEncontrado") + '\n';
    if (m.includes("MODELOS_TRAMITE_SO_PODE_EXCLUIR_ULTIMO")) resposta += t("modelosTramite.msgSoPodeExcluirUltimo") + '\n';
    if (m.includes("MODELOS_TRAMITE_NAO_EXISTE_MODELO_TAREFA")) resposta += t("modelosTramite.msgNaoExisteModeloTarefa") + '\n';    
    if (m.includes("MODELOS_TRAMITE_NOME_PARA_TRAMITE_EM_USO_NA_TAREFA")) resposta += t("modelosTramite.msgNomeParaTramiteJaEmUso") + '\n';
    if (m.includes("MODELOS_TRAMITE_USUARIO_TRAMITADOR_NAO_ENCONTRADO")) resposta += t("modelosTramite.msgNomeTramitadorNaoEncontrado") + '\n';
    if (m.includes("MODELOS_TRAMITE_USUARIO_RESPONSAVEL_NAO_ENCONTRADO")) resposta += t("modelosTramite.msgNomeRevisorNaoEncontrado") + '\n';

    if (m.includes("TRAMITES")) resposta += t("tramites.msgTramites") + '\n';
    if (m.includes("TRAMITES_NAO_PODE_INCLUIR_TRAMITE")) return t("tramites.msgNaoPodeIncluirTramite");
    if (m.includes("TRAMITES_TRAMITE_JA_ASSOCIADO_UM_USUARIO")) return t("tramites.msgTramiteAssociadoUmUsuario");
    if (m.includes("TRAMITES_REVISOR_TRAMITADOR_IGUAIS")) return t("tramites.msgRevisorTramitadorIguais");
    if (m.includes("TRAMITES_USUARIO_NAO_TRAMITADOR")) return t("tramites.msgUsuarioNaoTramitador");
    if (m.includes("TRAMITES_TRAMITE_JA_ESTA_COM_O_STATUS")) return t("tramites.msgTramiteJaEstaComStatus");
    if (m.includes("TRAMITES_TRAMITE_JA_FINALIZADO")) return t("tramites.msgTramiteJaFinalizado");
    if (m.includes("TRAMITES_TRAMITE_DEVE_ESTAR_COM_STATUS_EM_ANDAMENTO")) return t("tramites.msgTramiteDeveEstaComStatusEmAndamento");
    if (m.includes("TRAMITES_TRAMITE_DEVE_ESTAR_COM_STATUS_AGUARDANDO_REVISAO")) return t("tramites.msgTramiteDeveEstarComStatusAguardandoRevisao");
    if (m.includes("TRAMITES_PROXIMO_NAO_GRAVADO")) return t("tramites.msgProximoTramiteNaoGravado");
    if (m.includes("TRAMITES_REPETIDO_NAO_GRAVADO")) return t("tramites.msgTramiteRepetidoNaoGravado");
    if (m.includes("TRAMITES_JA_TERMINADO")) return t("tramites.msgTramiteJaTerminado");
    if (m.includes("TRAMITES_USUARIO_NAO_REVISOR")) return t("tramites.msgUsuarioNaoRevisor");
    if (m.includes("TRAMITES_MODELOSTRAMITE_NAO_ENCONTRADO")) return t("tramites.msgModeloTramiteNaoEncontrado");
    if (m.includes("TRAMITES_TRAMITE_INICIADO_NAO_PODE_RETROCEDER")) return t("tramites.msgNaoPodeRetrocederTramiteIniciado");
    if (m.includes("TRAMITES_SO_PODE_RETROCEDER_ULTIMO")) return t("tramites.msgSoPodeRetrocederUltimo");
  }

  if (!resposta && erro && !dados)
    return erro;

  if (!resposta)
    return t('api.apiErro');

  return resposta;
}

export function NiveisAcesso (nivel) {
  const n = {
    0: "Bloqueado",
    1: "Administrador",
    2: "Supervisor",
    3: "Operador",
    4: "Somente Leitura"
  }
  return n[nivel] || "LOGAR";
};

export function statusTramites (id) {
  const st = {
    1: SvgAFazer, // A Fazer
    2: SvgEmProgresso, // Em Andamento
    3: SvgAuardandoRevisao, // Aguardando Revisão
    4: SvgTarefaFalha, // Falha
    5: SvgTarefaOK // OK
  }

  return st[id] || FaQuestionCircle;
};

export function ChamarSplash(mensagem, tipo = "sucesso", segundos = 3) {
  window.dispatchEvent(
    new CustomEvent("chamarSplash", {
      detail: { mensagem, tipo, segundos },
    })
  );
}

export function tMobile(t, key) {
  return t(`${key}${isMobile ? "Mobile" : ""}`);
}

export function AlertaVencimento({ data, diasPraVencer = 0, escreve = false }) {
  const { t } = useTranslation();

  if (!data) return null;  

  const dataTermino = parseISO(data);
  const hoje = new Date();
  const diffDias = differenceInCalendarDays(dataTermino, hoje);

  const prazoEncerrado = diffDias < 0;
  const prazoAcabando = diffDias <= diasPraVencer && diffDias >= 0;

  if (prazoEncerrado) {
    return (
      <>
      <SvgPrazoTarefaAcabou
        style={{
          transform: 'scale(1.5)',
          transformOrigin: 'center',
          marginRight: '0.5em',
          color: '#e53935',
        }}
        title={t('vencimento.prazoEncerrado')}
      />
      &nbsp;
      {escreve && t('vencimento.prazoEncerrado')}
      </>
    );
  }

  if (prazoAcabando) {
    const titulo = diffDias === 0 ? 
            t('vencimento.venceHoje')
            : diffDias === 1
              ? t('vencimento.venceEmDia', { count: diffDias })
              : t('vencimento.venceEmDias', { count: diffDias })  

    return (
      <>
      <SvgPrazoTarefaAcabando
        style={{
          transform: 'scale(1.5)',
          transformOrigin: 'center',
          marginRight: '0.5em',
          color: '#fbc02d',
        }}
        title={ titulo }
      />
      &nbsp;
      {escreve && titulo}
      </>      
    );
  }

  return null;
}
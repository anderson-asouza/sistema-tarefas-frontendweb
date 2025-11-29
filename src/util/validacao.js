
export function ValidarEmail(email) {
  if (!email)  return  null;

  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

export function CPFValido(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.charAt(10));
}

export function TelefoneValido(telefone) {
  const regex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
  return regex.test(telefone);
}

export function DataValida(dataStr) {
  const [dia, mes, ano] = dataStr.split('/').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

export function SenhaForte(senha) {
  const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(senha);
}

export function dadoPreenchido(dado) {
  return dado != null && dado.toString().trim() !== '';
}

const cacheCNPJs = new Map(); // cache em memória

export async function CNPJValido(cnpj, validarNaBase = false) {
  const cnpjLimpo = cnpj.replace(/[^\d]+/g, '');

  if (cnpjLimpo.length !== 14 || /^(\d)\1{13}$/.test(cnpjLimpo)) {
    return { valido: false, nome: null, mensagem: 'Formato inválido' };
  }

  const calc = (cnpj, pos) => {
    const pesos = pos === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;

    for (let i = 0; i < pesos.length; i++) {
      soma += parseInt(cnpj.charAt(i)) * pesos[i];
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const dig1 = calc(cnpjLimpo, 12);
  const dig2 = calc(cnpjLimpo, 13);

  if (!(dig1 === parseInt(cnpjLimpo.charAt(12)) && dig2 === parseInt(cnpjLimpo.charAt(13)))) {
    return { valido: false, nome: null, mensagem: 'Dígitos verificadores inválidos' };
  }

  if (!validarNaBase) {
    return { valido: true, nome: null, mensagem: null };
  }

  // Consulta já feita? Usa o cache
  if (cacheCNPJs.has(cnpjLimpo)) {
    return cacheCNPJs.get(cnpjLimpo);
  }

  try {
    const resposta = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
    const dados = await resposta.json();

    let resultado;

    if (dados?.status === 'OK') {
      resultado = {
        valido: true,
        nome: dados.nome,
        mensagem: null
      };
    } else {
      resultado = {
        valido: false,
        nome: null,
        mensagem: 'CNPJ não encontrado na base'
      };
    }

    // Salva no cache
    cacheCNPJs.set(cnpjLimpo, resultado);
    return resultado;

  } catch (erro) {
    console.error('Erro ao consultar CNPJ:', erro);
    return { valido: false, nome: null, mensagem: 'Erro na consulta externa' };
  }
}

const cacheCEPs = new Map(); // fora da função, permanece na memória da aplicação

export async function CEPConsultar(cep, validarNaBase = false) {
  const cepLimpo = cep.replace(/\D/g, '');

  // Validação de formato
  if (!/^\d{8}$/.test(cepLimpo)) {
    return { valido: false, mensagem: 'Formato de CEP inválido', dados: null };
  }

  // Sem consulta externa, apenas formato válido
  if (!validarNaBase) {
    return { valido: true, mensagem: null, dados: null };
  }

  // Verifica se já está no cache
  if (cacheCEPs.has(cepLimpo)) {
    return cacheCEPs.get(cepLimpo);
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      const resultado = { valido: false, mensagem: 'CEP não encontrado', dados: null };
      cacheCEPs.set(cepLimpo, resultado); // cache de erro também
      return resultado;
    }

    const resultado = {
      valido: true,
      mensagem: null,
      dados: {
        uf: dados.uf,
        cidade: dados.localidade,
        bairro: dados.bairro,
        rua: dados.logradouro,
        complemento: dados.complemento || null,
        cep: dados.cep
      }
    };

    cacheCEPs.set(cepLimpo, resultado);
    return resultado;

  } catch (erro) {
    console.error('Erro ao consultar CEP:', erro);
    return { valido: false, mensagem: 'Erro na consulta externa', dados: null };
  }
}

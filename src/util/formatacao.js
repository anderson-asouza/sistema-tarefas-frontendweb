import {MOEDA} from './config';

export function FormataMoeda(valor, moedaImpressa = MOEDA, local = null) {
  const locale = local || navigator.language || 'en-US';

  const formattedValue = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);

  return moedaImpressa ? `${moedaImpressa} ${formattedValue}` : formattedValue;
}

export function FormatarData(data, locale = undefined) {
  if (!data) return '';

  const dataObj = new Date(data);
  if (isNaN(dataObj)) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dataObj);
}

/** ISO-3166 alpha-2 codes grouped by continent. Keep in sync with apps/web/src/lib/geo.ts */
export const CONTINENTS: Record<string, string> = {
  AF: 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW',
  AS: 'AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE IO CX CC',
  EU: 'AX AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG VA HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB',
  NA: 'AI AG AW BS BB BZ BM BQ VG CA KY CR CU CW DM DO SV GL GD GP GT HT HN JM MQ MX MS NI PA PR BL KN LC MF PM VC SX TT TC US VI UM',
  SA: 'AR BO BV BR CL CO EC FK GF GY PY PE GS SR UY VE',
  OC: 'AS AU CK FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV VU WF',
  AN: 'AQ TF HM',
};

export const COUNTRY_CODES: string[] = Object.values(CONTINENTS)
  .flatMap((s) => s.split(' '))
  .filter((c, i, a) => a.indexOf(c) === i);

export function continentOf(country: string): string {
  const cc = country.toUpperCase();
  for (const [k, v] of Object.entries(CONTINENTS)) if (v.split(' ').includes(cc)) return k;
  return 'NA';
}

export function countryName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Sensible default currency for a country; visitor can always change it. */
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', CO: 'COP', AR: 'ARS', CL: 'CLP', PE: 'PEN',
  GB: 'GBP', CH: 'CHF', AE: 'AED', SA: 'SAR', CN: 'CNY', JP: 'JPY', KR: 'KRW', IN: 'INR',
  AU: 'AUD', NZ: 'NZD', SG: 'SGD',
};
const EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'MXN', 'BRL', 'COP', 'ARS', 'CLP', 'PEN', 'CHF', 'AED', 'SAR', 'CNY', 'JPY', 'KRW', 'INR', 'AUD', 'NZD', 'SGD'];
export function currencyFor(country: string) {
  if (EURO.includes(country)) return 'EUR';
  return CURRENCY_BY_COUNTRY[country] ?? 'USD';
}

export function flag(cc: string) {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

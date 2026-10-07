import { normalizeLocale, pickTranslation } from './locale';
import { continentOf } from './geo';

describe('pickTranslation', () => {
  const t = { en: { title: 'Arm', summary: 'Six axes' }, es: { title: 'Brazo', summary: '' } };

  it('returns the requested locale', () => {
    expect(pickTranslation(t, 'es').title).toBe('Brazo');
  });
  it('falls back field-by-field to English for empty values', () => {
    expect(pickTranslation(t, 'es').summary).toBe('Six axes');
  });
  it('falls back to English for unknown locales', () => {
    expect(pickTranslation(t, 'de').title).toBe('Arm');
  });
  it('accepts region subtags', () => {
    expect(pickTranslation(t, 'es-mx').title).toBe('Brazo');
  });
});

describe('normalizeLocale', () => {
  it('rejects junk', () => expect(normalizeLocale('<script>')).toBe('en'));
  it('keeps valid tags', () => expect(normalizeLocale('PT-br')).toBe('pt-br'));
});

describe('continentOf', () => {
  it.each([
    ['CO', 'SA'],
    ['DE', 'EU'],
    ['US', 'NA'],
    ['AE', 'AS'],
    ['AU', 'OC'],
    ['NG', 'AF'],
  ])('%s → %s', (cc, cont) => expect(continentOf(cc)).toBe(cont));
});

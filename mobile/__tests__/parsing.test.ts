import { decodeJwtExp, isTokenExpired, parseRecords } from '../src/domain/parsing';

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (exp: number) => `${b64({ alg: 'HS256' })}.${b64({ exp, sub: '1' })}.firma`;

describe('parseo de datos', () => {
  it('descarta elementos corruptos', () => {
    const out = parseRecords([
      { id: 1, type: 'allergy', title: 'Polen', critical: 1 },
      { id: 2, type: 'hack', title: 'x' },
      null,
      { type: 'allergy', title: 'sin id' },
      'basura',
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].critical).toBe(true);
  });
  it('devuelve [] si no es arreglo', () => {
    expect(parseRecords({ a: 1 })).toEqual([]);
    expect(parseRecords(undefined)).toEqual([]);
  });
});

describe('validación de tokens', () => {
  it('lee exp', () => expect(decodeJwtExp(jwt(1234))).toBe(1234));
  it('detecta expirado y vigente', () => {
    const now = Date.now();
    expect(isTokenExpired(jwt(Math.floor(now / 1000) - 10), now)).toBe(true);
    expect(isTokenExpired(jwt(Math.floor(now / 1000) + 3600), now)).toBe(false);
  });
  it('trata tokens malformados como expirados', () => {
    expect(isTokenExpired('abc')).toBe(true);
    expect(isTokenExpired(null)).toBe(true);
    expect(decodeJwtExp('a.b.c')).toBeNull();
  });
});

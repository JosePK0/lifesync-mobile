import { fromOsStatus, isUsable, transition } from '../src/core/permissions/permissionMachine';

describe('máquina de estados de permisos', () => {
  it('flujo feliz', () => {
    let s = transition('undetermined', 'REQUEST');
    expect(s).toBe('requesting');
    s = transition(s, 'GRANT');
    expect(s).toBe('granted');
    expect(isUsable(s)).toBe(true);
  });
  it('denegado permite reintentar; bloqueado no', () => {
    expect(transition('requesting', 'DENY')).toBe('denied');
    expect(transition('denied', 'REQUEST')).toBe('requesting');
    expect(transition('blocked', 'REQUEST')).toBe('blocked');
  });
  it('transiciones inválidas se ignoran sin fallar', () => {
    expect(transition('granted', 'REQUEST')).toBe('granted');
  });
  it('mapea respuesta del S.O.', () => {
    expect(fromOsStatus('granted', true)).toBe('GRANT');
    expect(fromOsStatus('denied', true)).toBe('DENY');
    expect(fromOsStatus('denied', false)).toBe('BLOCK');
    expect(isUsable('denied')).toBe(false);
  });
});

// MÁQUINA DE ESTADOS para la solicitud asíncrona de permisos de hardware.
//
//  undetermined --REQUEST--> requesting --GRANT--> granted
//                                   |--DENY (puede volver a preguntar)--> denied --REQUEST--> requesting
//                                   |--BLOCK (denegado permanentemente)--> blocked
//  granted --REVOKE--> denied | blocked   (el usuario cambió ajustes del S.O.)
export type PermissionState = 'undetermined' | 'requesting' | 'granted' | 'denied' | 'blocked';
export type PermissionEvent = 'REQUEST' | 'GRANT' | 'DENY' | 'BLOCK' | 'REVOKE';

const table: Record<PermissionState, Partial<Record<PermissionEvent, PermissionState>>> = {
  undetermined: { REQUEST: 'requesting', GRANT: 'granted', DENY: 'denied', BLOCK: 'blocked' },
  requesting: { GRANT: 'granted', DENY: 'denied', BLOCK: 'blocked' },
  granted: { REVOKE: 'denied', BLOCK: 'blocked' },
  denied: { REQUEST: 'requesting', GRANT: 'granted', BLOCK: 'blocked' },
  blocked: { GRANT: 'granted' }, // solo se sale desde Ajustes del sistema
};

export function transition(state: PermissionState, event: PermissionEvent): PermissionState {
  return table[state][event] ?? state; // transición inválida => se ignora, nunca falla
}

export function fromOsStatus(status: string, canAskAgain: boolean): PermissionEvent {
  if (status === 'granted') return 'GRANT';
  return canAskAgain ? 'DENY' : 'BLOCK';
}

export function isUsable(state: PermissionState): boolean {
  return state === 'granted';
}

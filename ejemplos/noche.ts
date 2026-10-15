import { DateTime } from 'luxon';

/**
 * La noche de juego no termina a las 00:00 sino a mediodía: por la mañana suena la alarma
 * y la pareja quiere ver quién ganó. Si cambiara a medianoche, el resultado desaparecería
 * justo cuando se despiertan para verlo.
 */
export const HORA_NUEVA_NOCHE = 12;

/** Fecha ISO (YYYY-MM-DD) de la noche de juego a la que pertenece `momento`, en su hora local. */
export function fechaDeLaNoche(momento: DateTime): string {
  if (!momento.isValid) throw new Error(`Fecha no válida: ${momento.invalidReason}`);
  const yaEsNocheNueva = momento.hour >= HORA_NUEVA_NOCHE;
  return (yaEsNocheNueva ? momento : momento.minus({ days: 1 })).toISODate()!;
}

// Las noches son fechas sin hora: se cuentan en UTC para que un cambio de hora no
// convierta un día en 23 o 25 horas y descuadre la resta.
const comoFecha = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' });

/**
 * Noches seguidas jugadas que terminan en `nocheActual`. Si esta noche todavía no se
 * ha jugado, cuenta desde la anterior: la racha no se pierde hasta que pasa el día.
 */
export function rachaDeNoches(jugadas: readonly string[], nocheActual: string): number {
  const actual = comoFecha(nocheActual);
  if (!actual.isValid) throw new Error(`Noche no válida: ${nocheActual}`);

  const noches = new Set(
    jugadas.map(comoFecha).filter((d) => d.isValid).map((d) => d.toISODate()!),
  );
  let cursor = noches.has(actual.toISODate()!) ? actual : actual.minus({ days: 1 });
  let racha = 0;
  while (noches.has(cursor.toISODate()!)) {
    racha += 1;
    cursor = cursor.minus({ days: 1 });
  }
  return racha;
}

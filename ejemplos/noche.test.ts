import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { fechaDeLaNoche, rachaDeNoches } from './noche';

const madrid = (iso: string) => DateTime.fromISO(iso, { zone: 'Europe/Madrid' });

describe('fechaDeLaNoche', () => {
  it('por la noche es la fecha de ese día', () => {
    expect(fechaDeLaNoche(madrid('2026-10-14T23:30'))).toBe('2026-10-14');
  });

  it('de madrugada y por la mañana sigue siendo la noche anterior', () => {
    expect(fechaDeLaNoche(madrid('2026-10-15T00:00'))).toBe('2026-10-14');
    expect(fechaDeLaNoche(madrid('2026-10-15T07:00'))).toBe('2026-10-14');
    expect(fechaDeLaNoche(madrid('2026-10-15T11:59'))).toBe('2026-10-14');
  });

  it('a las doce empieza la noche nueva', () => {
    expect(fechaDeLaNoche(madrid('2026-10-15T12:00'))).toBe('2026-10-15');
  });

  it('aguanta los cambios de hora', () => {
    // 25-10-2026: a las 3:00 vuelven a ser las 2:00. 29-03-2026: de 2:00 se salta a 3:00.
    expect(fechaDeLaNoche(madrid('2026-10-25T02:30'))).toBe('2026-10-24');
    expect(fechaDeLaNoche(madrid('2026-03-29T10:00'))).toBe('2026-03-28');
  });

  it('rechaza una fecha no válida', () => {
    expect(() => fechaDeLaNoche(DateTime.invalid('prueba'))).toThrow();
  });
});

describe('rachaDeNoches', () => {
  it('sin noches jugadas no hay racha', () => {
    expect(rachaDeNoches([], '2026-10-14')).toBe(0);
  });

  it('cuenta las noches seguidas que acaban en la de hoy', () => {
    expect(rachaDeNoches(['2026-10-12', '2026-10-13', '2026-10-14'], '2026-10-14')).toBe(3);
  });

  it('si hoy aún no se ha jugado, la racha de ayer sigue viva', () => {
    expect(rachaDeNoches(['2026-10-12', '2026-10-13'], '2026-10-14')).toBe(2);
  });

  it('un hueco corta la racha', () => {
    expect(rachaDeNoches(['2026-10-10', '2026-10-11', '2026-10-13', '2026-10-14'], '2026-10-14')).toBe(2);
    expect(rachaDeNoches(['2026-10-11', '2026-10-12'], '2026-10-14')).toBe(0);
  });

  it('da igual el orden, los repetidos y las fechas rotas', () => {
    expect(rachaDeNoches(['2026-10-14', 'basura', '2026-10-13', '2026-10-14'], '2026-10-14')).toBe(2);
  });

  it('cruza el cambio de hora sin perder un día', () => {
    expect(rachaDeNoches(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26')).toBe(3);
  });

  it('rechaza una noche actual no válida', () => {
    expect(() => rachaDeNoches([], 'ayer')).toThrow();
  });
});

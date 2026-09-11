import { describe, expect, it } from 'vitest';

import { PASSWORD_MIN_LENGTH, passwordErrors, quickRatio } from '@/lib/auth/password';

function codes(password: string, attributes = {}) {
  return passwordErrors(password, attributes).map((error) => error.code);
}

describe('passwordErrors', () => {
  it('accepts a password that passes every client-side validator', () => {
    expect(passwordErrors('Chaco-2026!', { username: 'analista' })).toEqual([]);
  });

  it('rejects fewer than 8 characters (MinimumLengthValidator)', () => {
    expect(codes('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toEqual(['too-short']);
    expect(codes('a'.repeat(PASSWORD_MIN_LENGTH))).toEqual([]);
  });

  it('rejects an entirely numeric password (NumericPasswordValidator)', () => {
    expect(codes('12345678')).toEqual(['numeric']);
    expect(codes('1234567a')).toEqual([]);
  });

  it('reports every broken rule, in Django order', () => {
    expect(codes('1234')).toEqual(['too-short', 'numeric']);
  });

  it('phrases messages in Spanish with the configured minimum', () => {
    const [error] = passwordErrors('abc');

    expect(error.message).toBe(
      `Esta contraseña es demasiado corta. Debe contener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    );
  });
});

describe('quickRatio', () => {
  it("matches Python's difflib quick_ratio: order-blind multiset overlap", () => {
    expect(quickRatio('abcd', 'bcda')).toBe(1);
    expect(quickRatio('abcd', 'abxy')).toBe(0.5);
    expect(quickRatio('aaa', 'a')).toBe(0.5);
    expect(quickRatio('abc', 'xyz')).toBe(0);
  });

  it('is 1 for two empty strings, as difflib', () => {
    expect(quickRatio('', '')).toBe(1);
  });

  it('counts an accented letter as one unit', () => {
    expect(quickRatio('ñ', 'ñ')).toBe(1);
  });
});

describe('similarity (UserAttributeSimilarityValidator)', () => {
  it('rejects a password built on the username, case-insensitively', () => {
    expect(codes('Analista1!', { username: 'analista' })).toEqual(['similar']);
  });

  it('checks each part of a multi-word attribute, as Django splits on non-word characters', () => {
    expect(codes('gonzalez99', { lastName: 'Pérez González' })).toEqual(['similar']);
  });

  it('checks the email and names too, naming the offending attribute in Spanish', () => {
    const [error] = passwordErrors('analista2026', { email: 'analista@agora.py' });

    expect(error.code).toBe('similar');
    expect(error.message).toBe('La contraseña es demasiado similar a tu correo electrónico.');
  });

  it('accepts an unrelated password', () => {
    expect(codes('Chaco-2026!', { username: 'analista', firstName: 'Ana' })).toEqual([]);
  });
});

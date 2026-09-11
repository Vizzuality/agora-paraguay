/**
 * Client-side mirror of Django's `AUTH_PASSWORD_VALIDATORS`, so the reset form can
 * tell the user before the round trip. The server stays authoritative — it also runs
 * `CommonPasswordValidator` (a ~20k-entry list that is not worth shipping), so its
 * errors must still be surfaced.
 */

/** `MinimumLengthValidator` — Django default. */
export const PASSWORD_MIN_LENGTH = 8;

/** `UserAttributeSimilarityValidator` — Django default `max_similarity`. */
export const PASSWORD_MAX_SIMILARITY = 0.7;

/** What the similarity check compares against. Unknown attributes are simply skipped. */
export type UserAttributes = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type PasswordErrorCode = 'too-short' | 'numeric' | 'similar';

export type PasswordError = {
  code: PasswordErrorCode;
  /** User-facing, Spanish. */
  message: string;
};

/** Spanish labels for Django's `verbose_name` in the similarity message. */
const ATTRIBUTE_LABELS: Record<keyof UserAttributes, string> = {
  username: 'nombre de usuario',
  email: 'correo electrónico',
  firstName: 'nombre',
  lastName: 'apellido',
};

/**
 * Python's `difflib.SequenceMatcher.quick_ratio()`: an upper bound on `ratio()` that
 * ignores ordering. Returns `2 * M / T`, where `M` is the size of the multiset
 * intersection of the two strings' characters and `T` the sum of their lengths.
 * `1` for two empty strings, matching difflib. Exactly what Django's validator calls.
 */
export function quickRatio(a: string, b: string): number {
  const total = [...a].length + [...b].length;

  if (total === 0) return 1;

  // Character counts of `b`; every character of `a` still available in it is a match.
  // `for...of` walks code points, as Python does — an accented letter is one unit.
  const available = new Map<string, number>();

  for (const character of b) {
    available.set(character, (available.get(character) ?? 0) + 1);
  }

  let matches = 0;

  for (const character of a) {
    const count = available.get(character) ?? 0;

    if (count > 0) {
      available.set(character, count - 1);
      matches += 1;
    }
  }

  return (2 * matches) / total;
}

/**
 * `UserAttributeSimilarityValidator`: Django compares the lower-cased password with each
 * attribute value AND with each of its parts split on non-word characters, rejecting
 * when any `quick_ratio` reaches `max_similarity`.
 */
function tooSimilar(password: string, value: string): boolean {
  const lowered = password.toLowerCase();
  // Unicode-aware split: Python's `\W` keeps accented letters inside a word, JS's does not.
  const parts = [value.toLowerCase(), ...value.toLowerCase().split(/[^\p{L}\p{N}_]+/u)];

  return parts.some((part) => part !== '' && quickRatio(lowered, part) >= PASSWORD_MAX_SIMILARITY);
}

/** Every rule the password breaks, in Django's validator order. Empty means valid here. */
export function passwordErrors(password: string, attributes: UserAttributes = {}): PasswordError[] {
  const errors: PasswordError[] = [];

  for (const key of Object.keys(ATTRIBUTE_LABELS) as (keyof UserAttributes)[]) {
    const value = attributes[key];

    if (value && tooSimilar(password, value)) {
      errors.push({
        code: 'similar',
        message: `La contraseña es demasiado similar a tu ${ATTRIBUTE_LABELS[key]}.`,
      });
      break;
    }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push({
      code: 'too-short',
      message: `Esta contraseña es demasiado corta. Debe contener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    });
  }

  // `NumericPasswordValidator`: entirely digits.
  if (/^\d+$/.test(password)) {
    errors.push({ code: 'numeric', message: 'Esta contraseña es completamente numérica.' });
  }

  return errors;
}

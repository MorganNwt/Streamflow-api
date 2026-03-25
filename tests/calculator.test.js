const { add, subtract, multiply, divide, isEven, clamp } = require('../src/calculator');

describe('Calculator', () => {

  // ── beforeEach ──────────────────────────────────────────────
  // Ici inutile car fonctions pures, mais on montre le pattern
  beforeEach(() => {
    // Rien à réinitialiser sur des fonctions pures
    // Sur un objet avec état, on remettrait à zéro ici
  });

  // ── add() ───────────────────────────────────────────────────
  describe('add()', () => {

    it('retourne la somme de deux entiers positifs', () => {
      // toBe — égalité stricte, parfait pour les primitives
      expect(add(3, 5)).toBe(8);
    });

    it('fonctionne avec des nombres négatifs', () => {
      expect(add(-2, 5)).toBe(3);
      expect(add(-3, -7)).toBe(-10);
    });

    it('fonctionne avec des décimaux', () => {
      // toBeCloseTo — indispensable pour les flottants (0.1 + 0.2 !== 0.3 en JS)
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });

  });

  // ── subtract() ──────────────────────────────────────────────
  describe('subtract()', () => {

    it('retourne la différence', () => {
      expect(subtract(10, 4)).toBe(6);
    });

    it('retourne un nombre négatif si b > a', () => {
      // toBeGreaterThan / toBeLessThan
      expect(subtract(3, 10)).toBeLessThan(0);
    });

  });

  // ── multiply() ──────────────────────────────────────────────
  describe('multiply()', () => {

    it('retourne le produit', () => {
      expect(multiply(4, 5)).toBe(20);
    });

    it('retourne 0 si un des facteurs est 0', () => {
      expect(multiply(99, 0)).toBe(0);
    });

  });

  // ── divide() ────────────────────────────────────────────────
  describe('divide()', () => {

    it('retourne le quotient', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('lève une erreur si le diviseur est 0', () => {
      // toThrow — doit recevoir un callback, jamais l'appel direct
      expect(() => divide(10, 0)).toThrow('Division par zéro');
      expect(() => divide(10, 0)).toThrow(Error);
    });

  });

  // ── isEven() ────────────────────────────────────────────────
  describe('isEven()', () => {

    it('retourne true pour un nombre pair', () => {
      // toBeTruthy / toBeFalsy
      expect(isEven(4)).toBeTruthy();
      expect(isEven(4)).toBe(true);
    });

    it('retourne false pour un nombre impair', () => {
      expect(isEven(7)).toBeFalsy();
      expect(isEven(7)).toBe(false);
    });

  });

  // ── clamp() ─────────────────────────────────────────────────
  describe('clamp()', () => {

    it('retourne la valeur si elle est dans la plage', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('retourne le minimum si la valeur est trop basse', () => {
      // toBeGreaterThanOrEqual / toBeLessThanOrEqual
      const result = clamp(-5, 0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBe(0);
    });

    it('retourne le maximum si la valeur est trop haute', () => {
      expect(clamp(99, 0, 10)).toBe(10);
    });

  });


});

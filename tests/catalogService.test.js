const catalogService = require('../src/services/catalogService');
const { __reset: resetContentModel } = require('../src/models/content');

describe('catalogService', () => {
  beforeEach(() => {
    catalogService.__reset();
    resetContentModel();
  });

  describe('addContent()', () => {
    it('ajoute un contenu valide', () => {
      const content = catalogService.addContent({
        title: 'Inception',
        type: 'movie',
        genre: ['sci-fi', 'thriller'],
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
        year: 2010,
        duration: 148,
        rating: 'PG-13',
        plan: 'premium'
      });

      expect(content.id).toBe(1);
      expect(content.title).toBe('Inception');
      expect(content.type).toBe('movie');
      expect(content.score).toBe(0);
      expect(content.viewCount).toBe(0);
      expect(content.status).toBe('active');
    });

    it('lève une erreur si le contenu existe déjà (même titre + même année)', () => {
      catalogService.addContent({
        title: 'Inception',
        type: 'movie',
        genre: ['sci-fi'],
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio'],
        year: 2010,
        duration: 148,
        rating: 'PG-13',
        plan: 'premium'
      });

      expect(() =>
        catalogService.addContent({
          title: 'Inception',
          type: 'movie',
          genre: ['thriller'],
          director: 'Christopher Nolan',
          cast: ['Leonardo DiCaprio'],
          year: 2010,
          duration: 148,
          rating: 'PG-13',
          plan: 'premium'
        })
      ).toThrow('Contenu déjà existant');
    });

    it('autorise deux contenus avec le même titre mais une année différente', () => {
      const first = catalogService.addContent({
        title: 'Dune',
        type: 'movie',
        genre: ['sci-fi'],
        director: 'Denis Villeneuve',
        cast: ['Timothée Chalamet'],
        year: 2021,
        duration: 155,
        rating: 'PG-13',
        plan: 'premium'
      });

      const second = catalogService.addContent({
        title: 'Dune',
        type: 'movie',
        genre: ['sci-fi'],
        director: 'David Lynch',
        cast: ['Kyle MacLachlan'],
        year: 1984,
        duration: 137,
        rating: 'PG-13',
        plan: 'standard'
      });

      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });
  });

  describe('getContentById()', () => {
    it('retourne le contenu correspondant à l’id', () => {
      const created = catalogService.addContent({
        title: 'Interstellar',
        type: 'movie',
        genre: ['sci-fi'],
        director: 'Christopher Nolan',
        cast: ['Matthew McConaughey'],
        year: 2014,
        duration: 169,
        rating: 'PG-13',
        plan: 'premium'
      });

      const found = catalogService.getContentById(created.id);

      expect(found).toEqual(created);
    });

    it('lève une erreur si le contenu est introuvable', () => {
      expect(() => catalogService.getContentById(999)).toThrow('Contenu introuvable');
    });
  });

  describe('searchCatalog()', () => {
    beforeEach(() => {
      catalogService.addContent({
        title: 'Inception',
        type: 'movie',
        genre: ['sci-fi', 'thriller'],
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio'],
        year: 2010,
        duration: 148,
        rating: 'PG-13',
        plan: 'premium'
      });

      catalogService.addContent({
        title: 'Breaking Bad',
        type: 'series',
        genre: ['crime', 'drama'],
        director: 'Vince Gilligan',
        cast: ['Bryan Cranston'],
        year: 2008,
        duration: 62,
        rating: 'R',
        plan: 'standard'
      });

      catalogService.addContent({
        title: 'The Matrix',
        type: 'movie',
        genre: ['sci-fi', 'action'],
        director: 'Lana Wachowski',
        cast: ['Keanu Reeves'],
        year: 1999,
        duration: 136,
        rating: 'R',
        plan: 'basic'
      });
    });

    it('retourne tous les contenus paginés si aucun filtre', () => {
      const result = catalogService.searchCatalog({}, 1, 20);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('filtre par type', () => {
      const result = catalogService.searchCatalog({ type: 'movie' }, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((item) => item.type === 'movie')).toBe(true);
    });

    it('filtre par genre', () => {
      const result = catalogService.searchCatalog({ genre: 'sci-fi' }, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((item) => item.genre.includes('sci-fi'))).toBe(true);
    });

    it('filtre par plan', () => {
      const result = catalogService.searchCatalog({ plan: 'basic' }, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('The Matrix');
    });

    it('filtre par yearFrom', () => {
      const result = catalogService.searchCatalog({ yearFrom: 2000 }, 1, 20);

      expect(result.data).toHaveLength(2);
    });

    it('filtre par yearTo', () => {
      const result = catalogService.searchCatalog({ yearTo: 2000 }, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('The Matrix');
    });

    it('applique une recherche textuelle sur le titre', () => {
      const result = catalogService.searchCatalog({ query: 'matrix' }, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('The Matrix');
    });

    it('applique une recherche textuelle sur le réalisateur', () => {
      const result = catalogService.searchCatalog({ query: 'nolan' }, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Inception');
    });

    it('la recherche textuelle est insensible à la casse', () => {
      const result = catalogService.searchCatalog({ query: 'BREAKING' }, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Breaking Bad');
    });

    it('combine plusieurs filtres', () => {
      const result = catalogService.searchCatalog(
        { type: 'movie', genre: 'sci-fi', yearFrom: 2000 },
        1,
        20
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Inception');
    });
  });

  describe('updateContent()', () => {
    it('met à jour les champs autorisés', () => {
      const content = catalogService.addContent({
        title: 'Avatar',
        type: 'movie',
        genre: ['sci-fi'],
        director: 'James Cameron',
        cast: ['Sam Worthington'],
        year: 2009,
        duration: 162,
        rating: 'PG-13',
        plan: 'premium'
      });

      const updated = catalogService.updateContent(content.id, {
        title: 'Avatar Updated',
        plan: 'standard'
      });

      expect(updated.title).toBe('Avatar Updated');
      expect(updated.plan).toBe('standard');
    });

    it('ignore les champs non modifiables', () => {
      const content = catalogService.addContent({
        title: 'Titanic',
        type: 'movie',
        genre: ['drama'],
        director: 'James Cameron',
        cast: ['Leonardo DiCaprio'],
        year: 1997,
        duration: 194,
        rating: 'PG-13',
        plan: 'basic'
      });

      const updated = catalogService.updateContent(content.id, {
        id: 999,
        createdAt: '2000-01-01T00:00:00.000Z',
        score: 10,
        viewCount: 500,
        title: 'Titanic Remastered'
      });

      expect(updated.id).toBe(1);
      expect(updated.title).toBe('Titanic Remastered');
      expect(updated.score).toBe(0);
      expect(updated.viewCount).toBe(0);
      expect(updated.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
    });

    it('lève une erreur si le contenu est introuvable', () => {
      expect(() =>
        catalogService.updateContent(999, { title: 'Unknown' })
      ).toThrow('Contenu introuvable');
    });
  });

  describe('archiveContent()', () => {
    it('archive un contenu actif', () => {
      const content = catalogService.addContent({
        title: 'Gladiator',
        type: 'movie',
        genre: ['action'],
        director: 'Ridley Scott',
        cast: ['Russell Crowe'],
        year: 2000,
        duration: 155,
        rating: 'R',
        plan: 'standard'
      });

      const archived = catalogService.archiveContent(content.id);

      expect(archived.status).toBe('archived');
    });

    it('lève une erreur si le contenu est déjà archivé', () => {
      const content = catalogService.addContent({
        title: 'Alien',
        type: 'movie',
        genre: ['sci-fi'],
        director: 'Ridley Scott',
        cast: ['Sigourney Weaver'],
        year: 1979,
        duration: 117,
        rating: 'R',
        plan: 'premium'
      });

      catalogService.archiveContent(content.id);

      expect(() => catalogService.archiveContent(content.id)).toThrow(
        'Contenu déjà archivé'
      );
    });

    it('lève une erreur si le contenu est introuvable', () => {
      expect(() => catalogService.archiveContent(999)).toThrow('Contenu introuvable');
    });
  });

  describe('getContentByPlan()', () => {
    beforeEach(() => {
      catalogService.addContent({
        title: 'Basic Movie',
        type: 'movie',
        genre: ['comedy'],
        director: 'Director A',
        cast: ['Actor A'],
        year: 2020,
        duration: 100,
        rating: 'PG',
        plan: 'basic'
      });

      catalogService.addContent({
        title: 'Standard Series',
        type: 'series',
        genre: ['drama'],
        director: 'Director B',
        cast: ['Actor B'],
        year: 2021,
        duration: 10,
        rating: 'PG-13',
        plan: 'standard'
      });

      catalogService.addContent({
        title: 'Premium Movie',
        type: 'movie',
        genre: ['thriller'],
        director: 'Director C',
        cast: ['Actor C'],
        year: 2022,
        duration: 120,
        rating: 'R',
        plan: 'premium'
      });
    });

    it('retourne seulement les contenus basic pour un plan basic', () => {
      const result = catalogService.getContentByPlan('basic');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Basic Movie');
    });

    it('retourne les contenus basic et standard pour un plan standard', () => {
      const result = catalogService.getContentByPlan('standard');

      expect(result).toHaveLength(2);
      expect(result.map((item) => item.title)).toEqual(
        expect.arrayContaining(['Basic Movie', 'Standard Series'])
      );
    });

    it('retourne tous les contenus pour un plan premium', () => {
      const result = catalogService.getContentByPlan('premium');

      expect(result).toHaveLength(3);
    });

    it('n’inclut pas les contenus archivés', () => {
      const all = catalogService.getAllContents();
      const premiumMovie = all.find((item) => item.title === 'Premium Movie');

      catalogService.archiveContent(premiumMovie.id);

      const result = catalogService.getContentByPlan('premium');

      expect(result).toHaveLength(2);
      expect(result.find((item) => item.title === 'Premium Movie')).toBeUndefined();
    });
  });
});
const request = require('supertest');
const app = require('../src/app');
const catalogService = require('../src/services/catalogService');

describe('App routes', () => {
  beforeEach(() => {
    catalogService.__reset();
  });

  it('GET / retourne le message de santé de l’API', async () => {
    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: 'StreamFlow API is running'
    });
  });

  it('GET /catalog retourne un tableau vide au départ', async () => {
    const response = await request(app).get('/catalog');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('POST /catalog crée un contenu', async () => {
    const payload = {
      title: 'Inception',
      type: 'movie',
      genre: ['sci-fi', 'thriller'],
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
      year: 2010,
      duration: 148,
      rating: 'PG-13',
      plan: 'premium'
    };

    const response = await request(app)
      .post('/catalog')
      .send(payload);

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe('Inception');
    expect(response.body.type).toBe('movie');
    expect(response.body.plan).toBe('premium');
    expect(response.body.id).toBe(1);
  });

  it('POST /catalog retourne 400 si les données sont invalides', async () => {
    const payload = {
      title: '',
      type: 'movie',
      year: 2010,
      duration: 148,
      rating: 'PG-13',
      plan: 'premium'
    };

    const response = await request(app)
      .post('/catalog')
      .send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain('Données de contenu invalides');
  });
});
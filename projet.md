# Projet – StreamFlow API
**Formation CDA – Intégration Continue & CI/CD**
**Durée : 2 jours | Node.js / Jest / Jenkins**
**Accès autorisé : notes de cours, internet, documentation officielle**

---

## Contexte

Vous intégrez l'équipe backend de **StreamFlow**, une plateforme de streaming
en pleine croissance. Votre mission est de développer l'API REST du cœur
métier : gestion du catalogue, des abonnements, de la lecture et des
recommandations. L'API doit être entièrement testée, versionnée proprement
et déployée via un pipeline CI/CD Jenkins.

---

## Structure attendue du projet
```
streamflow-api/
├── src/
│   ├── models/
│   │   ├── content.js         ← films et séries
│   │   ├── subscription.js    ← abonnements utilisateurs
│   │   └── watchSession.js    ← sessions de visionnage
│   ├── services/
│   │   ├── catalogService.js      ← gestion du catalogue
│   │   ├── subscriptionService.js ← gestion des abonnements
│   │   ├── playerService.js       ← lecture et progression
│   │   ├── recommendService.js    ← moteur de recommandation
│   │   └── statsService.js        ← statistiques et scores
│   ├── utils/
│   │   ├── paginator.js       ← pagination générique
│   │   ├── validator.js       ← validation des entrées
│   │   └── pricingEngine.js   ← calcul des prix et remises
│   ├── routes/
│   │   ├── catalog.js
│   │   ├── subscriptions.js
│   │   ├── player.js
│   │   └── recommendations.js
│   └── app.js
├── tests/
│   ├── services/
│   │   ├── catalogService.test.js
│   │   ├── subscriptionService.test.js
│   │   ├── playerService.test.js
│   │   ├── recommendService.test.js
│   │   └── statsService.test.js
│   └── utils/
│       ├── paginator.test.js
│       ├── validator.test.js
│       └── pricingEngine.test.js
├── Jenkinsfile
├── jest.config.js
├── eslint.config.js
├── package.json
├── .gitignore
└── README.md
```

---

## Partie 1 – Développement

### Données en mémoire

Toute la persistance se fait via des tableaux en haut de chaque service.
Pas de base de données — l'objectif est la logique métier et les tests.
```js
// Exemple de structure en mémoire dans catalogService.js
let contents = [];
let nextId = 1;
```

---

### 1.1 Modèles

#### `src/models/content.js`

`createContent(data)`

Retourne un objet contenu avec la structure suivante :
```js
{
  id: 1,
  title: 'Inception',
  type: 'movie',           // 'movie' | 'series'
  genre: ['sci-fi', 'thriller'],
  director: 'Christopher Nolan',
  cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
  year: 2010,
  duration: 148,           // en minutes (movie) ou nb d'épisodes (series)
  rating: 'PG-13',         // 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  plan: 'premium',         // 'basic' | 'standard' | 'premium'
  score: 0,                // score calculé dynamiquement
  viewCount: 0,
  status: 'active',        // 'active' | 'archived' | 'coming_soon'
  createdAt: '2026-01-01T00:00:00.000Z'
}
```

**Validations :**
- `title` non vide
- `type` doit être `'movie'` ou `'series'`
- `year` entre 1888 et l'année en cours
- `duration` entier strictement positif
- `rating` doit être l'une des valeurs autorisées
- `plan` doit être `'basic'`, `'standard'` ou `'premium'`
- Lève `'Données de contenu invalides'` avec le détail du champ manquant

---

#### `src/models/subscription.js`

`createSubscription(userId, plan)`
```js
{
  id: 1,
  userId: 'user_123',
  plan: 'standard',        // 'basic' | 'standard' | 'premium'
  status: 'active',        // 'active' | 'suspended' | 'cancelled' | 'expired'
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-02-01T00:00:00.000Z',  // startDate + 30 jours
  renewalDate: '2026-02-01T00:00:00.000Z',
  price: 9.99,             // calculé par pricingEngine
  discountApplied: 0,
  paymentHistory: []
}
```

---

#### `src/models/watchSession.js`

`createWatchSession(userId, contentId)`
```js
{
  id: 1,
  userId: 'user_123',
  contentId: 1,
  startedAt: '2026-01-01T10:00:00.000Z',
  lastPosition: 0,         // en secondes
  completed: false,
  completedAt: null,
  device: 'web'            // 'web' | 'mobile' | 'tv'
}
```

---

### 1.2 Utilitaires

#### `src/utils/pricingEngine.js`

Moteur de calcul des prix des abonnements.

**Plans de base :**
```js
const BASE_PRICES = {
  basic:    4.99,
  standard: 9.99,
  premium:  14.99
};
```

`calculatePrice(plan, options)`

`options` peut contenir :
- `promoCode` — code promo à appliquer
- `isAnnual` — abonnement annuel (remise de 20%)
- `isStudentVerified` — statut étudiant vérifié (remise de 30%)
- `isFirstSubscription` — première souscription (premier mois offert)

**Codes promo valides :**
```js
const PROMO_CODES = {
  'WELCOME10':  { discount: 10, type: 'percent' },
  'SUMMER20':   { discount: 20, type: 'percent' },
  'FLAT5':      { discount: 5,  type: 'fixed'   }
};
```

**Règles de calcul :**
- Les remises ne se cumulent pas — appliquer la plus avantageuse uniquement
- `isFirstSubscription` = prix à 0 pour le premier mois, remise non applicable
- Remise annuelle : prix mensuel × 12 × 0.80
- Remise étudiant : prix mensuel × 0.70
- Code promo `percent` : prix × (1 - discount/100)
- Code promo `fixed` : prix - discount (minimum 0)
- Retourne `{ finalPrice, basePrice, discount, discountType, isAnnual }`
- Lève `'Plan invalide'` si le plan n'existe pas
- Lève `'Code promo invalide'` si le code n'existe pas dans la liste

`calculateAnnualSavings(plan)`
- Retourne le montant économisé sur un an avec l'abonnement annuel vs mensuel

`applyLatePaymentPenalty(price, daysLate)`
- Ajoute 1.5% par jour de retard, plafonné à 20% du prix initial
- Lève `'Jours de retard invalides'` si daysLate < 0

---

#### `src/utils/paginator.js`

`paginate(array, page, limit)`
- `page` commence à 1
- `limit` entre 1 et 100, défaut 20
- Retourne :
```js
{
  data: [...],          // éléments de la page courante
  pagination: {
    total: 150,         // total d'éléments
    page: 2,
    limit: 20,
    totalPages: 8,
    hasNextPage: true,
    hasPrevPage: true
  }
}
```

- Lève `'Page invalide'` si page < 1
- Lève `'Limite invalide'` si limit < 1 ou > 100
- Retourne une page vide si page > totalPages (pas d'erreur)

`buildFilter(params)`
- Prend un objet `params` avec des filtres optionnels
- Retourne une fonction de filtre applicable sur un tableau
- Filtres supportés : `type`, `genre`, `plan`, `status`, `yearFrom`, `yearTo`, `minScore`
```js
// Exemple d'usage
const filter = buildFilter({ type: 'movie', yearFrom: 2010, minScore: 7 });
const results = contents.filter(filter);
```

---

#### `src/utils/validator.js`

`isValidPlan(plan)` — vérifie que plan est basic, standard ou premium

`isValidStatus(status, allowedStatuses)` — vérifie que status est dans la liste

`isValidRating(rating)` — vérifie que rating est dans les valeurs autorisées

`isPositiveInteger(value)` — vérifie que value est un entier > 0

`isValidUserId(userId)` — vérifie que userId est une string non vide

---

### 1.3 Services

#### `src/services/catalogService.js`

`addContent(data)`
- Crée via `createContent`, vérifie les doublons sur le titre + année
- Lève `'Contenu déjà existant'` si doublon
- Retourne le contenu créé

`getContentById(id)`
- Lève `'Contenu introuvable'` si id inexistant

`searchCatalog(params, page, limit)`
- Applique `buildFilter(params)` sur le catalogue
- Applique `paginate()` sur les résultats filtrés
- Trie par score décroissant par défaut
- `params` peut contenir : `query` (recherche textuelle titre/réalisateur), `type`, `genre`, `plan`, `yearFrom`, `yearTo`, `minScore`, `status`
- La recherche textuelle est insensible à la casse

`updateContent(id, updates)`
- Champs non modifiables : `id`, `createdAt`, `viewCount`, `score`
- Lève `'Contenu introuvable'` si id inexistant

`archiveContent(id)`
- Passe le status à `'archived'`
- Lève `'Contenu introuvable'` si id inexistant
- Lève `'Contenu déjà archivé'` si déjà archivé

`getContentByPlan(plan)`
- Retourne tous les contenus actifs accessibles pour un plan donné
- Règle d'accès : basic voit basic, standard voit basic+standard, premium voit tout

---

#### `src/services/subscriptionService.js`

**Transitions d'état autorisées :**
```
active      → suspended  (impayé détecté)
active      → cancelled  (résiliation volontaire)
active      → expired    (date de fin dépassée)
suspended   → active     (paiement régularisé)
suspended   → cancelled  (résiliation depuis suspension)
cancelled   → (aucune transition possible)
expired     → active     (renouvellement)
```

`subscribe(userId, plan, options)`
- Vérifie qu'il n'y a pas d'abonnement `active` ou `suspended` pour ce userId
- Lève `'Abonnement déjà actif'` si c'est le cas
- Calcule le prix via `pricingEngine.calculatePrice`
- Crée l'abonnement, le retourne

`changeStatus(subscriptionId, newStatus, reason)`
- Vérifie que la transition est autorisée selon la table ci-dessus
- Lève `'Transition invalide : X → Y'` si non autorisée
- Enregistre la raison dans un champ `lastStatusReason`
- Retourne l'abonnement mis à jour

`upgradePlan(subscriptionId, newPlan)`
- Vérifie que le nouvel abonnement est supérieur au plan actuel
- Ordre : basic < standard < premium
- Lève `'Rétrogradation non autorisée via upgrade'` si newPlan est inférieur ou égal
- Calcule la différence de prix au prorata du temps restant sur le mois
- Met à jour le plan et le prix, retourne l'abonnement

`getActiveSubscription(userId)`
- Retourne l'abonnement actif ou suspended pour un userId
- Retourne `null` si aucun

`processRenewal(subscriptionId)`
- Vérifie que renewalDate est dépassée
- Lève `'Renouvellement non échu'` si la date n'est pas dépassée
- Crée un nouveau paiement dans `paymentHistory`
- Recalcule endDate et renewalDate (+30 jours)
- Retourne l'abonnement mis à jour

---

#### `src/services/playerService.js`

`startSession(userId, contentId, device)`
- Vérifie que l'utilisateur a un abonnement actif via `subscriptionService`
- Vérifie que le contenu existe et est `active` via `catalogService`
- Vérifie que le contenu est accessible selon le plan de l'abonnement
- Lève `'Abonnement requis'` si pas d'abonnement actif
- Lève `'Contenu non disponible'` si contenu archivé ou coming_soon
- Lève `'Plan insuffisant'` si le plan ne donne pas accès à ce contenu
- Crée une session, incrémente `viewCount` du contenu
- Retourne la session créée

`updateProgress(sessionId, position)`
- Met à jour `lastPosition`
- Si position ≥ 95% de la durée du contenu : passe `completed` à true, enregistre `completedAt`
- Lève `'Session introuvable'` si sessionId inexistant
- Lève `'Position invalide'` si position < 0
- Retourne la session mise à jour

`getUserHistory(userId, page, limit)`
- Retourne l'historique paginé des sessions d'un utilisateur
- Triées par `startedAt` décroissant

`getResumePoint(userId, contentId)`
- Retourne la dernière session non complétée pour ce contenu et cet utilisateur
- Retourne `null` si aucune session ou si toutes complétées

---

#### `src/services/statsService.js`

`computeContentScore(contentId)`
- Récupère toutes les sessions complétées pour ce contenu
- Score = (nb sessions complétées / nb sessions totales) × 10, arrondi à 1 décimale
- Si 0 sessions : score = 0
- Met à jour le champ `score` du contenu
- Retourne le score calculé

`getTopContent(limit, type)`
- Retourne les `limit` contenus actifs avec le meilleur score
- Filtre par `type` si fourni (`'movie'` ou `'series'`)
- En cas d'égalité de score, trier par viewCount décroissant

`getUserStats(userId)`
- Retourne un objet de statistiques pour un utilisateur :
```js
{
  totalSessions: 12,
  completedSessions: 9,
  completionRate: 75,        // en pourcentage, arrondi
  totalWatchTime: 1320,      // somme des lastPosition en secondes
  favoriteGenre: 'sci-fi',   // genre le plus regardé (via les contenus)
  mostWatchedType: 'movie'   // 'movie' ou 'series'
}
```

`getSubscriptionStats()`
- Retourne des statistiques globales sur les abonnements :
```js
{
  total: 150,
  byStatus: { active: 120, suspended: 10, cancelled: 15, expired: 5 },
  byPlan:   { basic: 40, standard: 70, premium: 40 },
  revenue: {
    monthly: 1249.30,        // somme des prix des abonnements actifs
    projected_annual: 14991.60
  }
}
```

---

#### `src/services/recommendService.js`

`getRecommendations(userId, limit)`
- Récupère l'historique de visionnage de l'utilisateur
- Détermine les 3 genres les plus regardés
- Retourne les `limit` contenus actifs qui :
  - Correspondent à au moins un des genres favoris
  - N'ont pas encore été regardés par l'utilisateur
  - Sont accessibles selon son plan d'abonnement
  - Sont triés par score décroissant
- Si l'utilisateur n'a pas d'historique : retourner les top contenus par score
- Lève `'Utilisateur sans abonnement actif'` si pas d'abonnement

`getSimilarContent(contentId, limit)`
- Retourne les `limit` contenus actifs les plus similaires
- Similarité basée sur : genres en commun (poids 3), même type (poids 2), même décennie (poids 1)
- Score de similarité = somme des poids des critères correspondants
- Triés par score de similarité décroissant, puis par score StreamFlow décroissant
- Exclure le contenu lui-même des résultats

---

## Partie 2 – Tests unitaires

### Exigences

- **Couverture minimale : 80% lines, 70% branches, 85% functions**
- `beforeEach` obligatoire pour réinitialiser les tableaux en mémoire entre chaque test
- Mocker les dépendances entre services avec `jest.mock()`
- Couvrir systématiquement les cas nominaux, les cas limites et les cas d'erreur

### Tests prioritaires par fichier

**`pricingEngine.test.js`** — minimum 20 tests
```
calculatePrice()
  ✓ retourne le prix de base sans options
  ✓ applique la remise annuelle (×12 ×0.80)
  ✓ applique la remise étudiant (×0.70)
  ✓ retourne 0 pour isFirstSubscription
  ✓ applique un code promo percent
  ✓ applique un code promo fixed
  ✓ ne cumule pas les remises — applique la plus avantageuse
  ✓ code promo fixed ne descend pas sous 0
  ✓ lève une erreur pour plan invalide
  ✓ lève une erreur pour code promo invalide

applyLatePaymentPenalty()
  ✓ calcule 1.5% par jour
  ✓ plafonne à 20% du prix initial
  ✓ retourne le prix inchangé pour 0 jours
  ✓ lève une erreur pour jours négatifs

calculateAnnualSavings()
  ✓ retourne le bon montant d'économie par plan
```

**`paginator.test.js`** — minimum 15 tests
```
paginate()
  ✓ retourne la première page correctement
  ✓ retourne la dernière page (potentiellement incomplète)
  ✓ hasNextPage et hasPrevPage corrects
  ✓ retourne une page vide si page > totalPages
  ✓ totalPages calculé correctement
  ✓ lève une erreur si page < 1
  ✓ lève une erreur si limit > 100

buildFilter()
  ✓ filtre par type
  ✓ filtre par genre (contenu dans le tableau de genres)
  ✓ filtre par yearFrom et yearTo
  ✓ filtre par minScore
  ✓ combine plusieurs filtres
  ✓ retourne tout si aucun filtre
```

**`subscriptionService.test.js`** — minimum 20 tests
```
subscribe()
  ✓ crée un abonnement et retourne l'objet
  ✓ isFirstSubscription détecté correctement
  ✓ lève une erreur si abonnement déjà actif
  ✓ lève une erreur si abonnement suspendu existant

changeStatus()
  ✓ active → suspended autorisé
  ✓ active → cancelled autorisé
  ✓ suspended → active autorisé
  ✓ cancelled → active refusé (transition invalide)
  ✓ lève 'Transition invalide : X → Y' avec les bons noms

upgradePlan()
  ✓ basic → standard autorisé
  ✓ basic → premium autorisé
  ✓ standard → basic refusé
  ✓ premium → premium refusé
  ✓ calcule un prix au prorata

processRenewal()
  ✓ renouvelle si renewalDate dépassée
  ✓ lève une erreur si renewalDate non atteinte
  ✓ ajoute une entrée dans paymentHistory
```

**`playerService.test.js`** — minimum 15 tests
```
startSession()
  ✓ crée une session et incrémente viewCount
  ✓ lève 'Abonnement requis' si pas d'abonnement
  ✓ lève 'Plan insuffisant' pour contenu premium sur plan basic
  ✓ lève 'Contenu non disponible' pour contenu archivé

updateProgress()
  ✓ met à jour lastPosition
  ✓ marque completed si position >= 95% de la durée
  ✓ ne marque pas completed si position < 95%
  ✓ lève une erreur si position négative

getResumePoint()
  ✓ retourne la session non complétée
  ✓ retourne null si toutes complétées
  ✓ retourne null si aucune session
```

**`statsService.test.js`** — minimum 15 tests
```
computeContentScore()
  ✓ score = 10 si toutes sessions complétées
  ✓ score = 0 si aucune session complétée
  ✓ score = 0 si aucune session du tout
  ✓ arrondi à 1 décimale

getUserStats()
  ✓ completionRate calculé correctement
  ✓ favoriteGenre identifié correctement
  ✓ totalWatchTime = somme des lastPosition
  ✓ retourne des zéros si aucune session

getSubscriptionStats()
  ✓ byStatus comptabilisé correctement
  ✓ revenue mensuel = somme des prix actifs
  ✓ projected_annual = monthly × 12
```

**`recommendService.test.js`** — minimum 10 tests
```
getRecommendations()
  ✓ retourne des contenus des genres favoris
  ✓ exclut les contenus déjà vus
  ✓ respecte le plan de l'abonnement
  ✓ retourne les top contenus si pas d'historique
  ✓ lève une erreur sans abonnement actif

getSimilarContent()
  ✓ score de similarité calculé correctement
  ✓ exclut le contenu lui-même
  ✓ trie par similarité puis par score
```

---

## Partie 3 – Git

### Règles obligatoires

- Conventional Commits sur tous les commits
- Jamais de commit direct sur `main` ou `develop`
- Une Pull Request par branche feature avec description

### Branches attendues
```
main
 └── develop
      ├── feature/models
      ├── feature/pricing-engine
      ├── feature/paginator
      ├── feature/validator
      ├── feature/catalog-service
      ├── feature/subscription-service
      ├── feature/player-service
      ├── feature/stats-service
      ├── feature/recommend-service
      ├── feature/express-routes
      ├── feature/tests-utils
      ├── feature/tests-services
      └── feature/jenkinsfile
```

### Exemples de commits attendus
```bash
feat(models): add createContent with plan and status validation
feat(pricing): implement calculatePrice with discount rules
feat(pricing): add promoCode support and cumulation prevention
feat(subs): implement subscription state machine transitions
feat(subs): add upgradePlan with prorata price calculation
feat(player): add startSession with plan access control
feat(player): mark session completed at 95% progress threshold
feat(stats): compute content score from completed sessions
feat(recommend): implement genre-based recommendation engine
feat(recommend): add getSimilarContent with weighted similarity
test(pricing): cover all discount combinations and edge cases
test(subs): cover all valid and invalid status transitions
fix(player): prevent negative position in updateProgress
chore: configure jest coverage thresholds
chore: add jenkinsfile with conditional deploy stages
```

### Historique minimal

- Minimum **20 commits** répartis sur au moins **8 branches feature**
- Le `git log --oneline --graph` doit montrer un historique structuré
- Tag `v1.0.0` sur `main` en fin de projet

---

## Partie 4 – Pipeline Jenkins

### Comportement par branche

| Branche | Stages exécutés |
|---------|-----------------|
| `feature/*` | Install → Lint → Test |
| `develop` | Install → Lint → Test → Build |
| `main` | Install → Lint → Test → Build → Deploy |

### `Jenkinsfile`
```groovy
pipeline {
    agent {
        docker {
            image 'node:20'
            args '-u root'
        }
    }

    environment {
        NODE_ENV = 'test'
        APP_NAME = 'streamflow-api'
    }

    stages {

        stage('Install') {
            steps {
                echo "=== ${APP_NAME} — Build #${BUILD_NUMBER} ==="
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test -- --coverage'
            }
            post {
                always {
                    junit 'junit.xml'
                }
            }
        }

        stage('Build') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                sh 'npm run build'
                sh '''
                    VERSION=${BUILD_NUMBER}-${GIT_COMMIT:0:7}
                    tar -czf ${APP_NAME}-${VERSION}.tar.gz dist/
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: '*.tar.gz', fingerprint: true
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Déployer StreamFlow en production ?', ok: 'Déployer'
                sh 'mkdir -p deployed && cp -r dist/* deployed/'
                echo "🚀 ${APP_NAME} v${BUILD_NUMBER} déployé"
            }
        }

    }

    post {
        success {
            echo "✅ Pipeline réussi — Build #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Pipeline échoué — Build #${BUILD_NUMBER}"
        }
        always {
            echo "Durée : ${currentBuild.durationString}"
        }
    }
}
```

### Scripts `package.json`
```json
{
  "scripts": {
    "start":  "node src/app.js",
    "build":  "mkdir -p dist && cp -r src/* dist/",
    "test":   "jest --ci --reporters=default --reporters=jest-junit",
    "lint":   "eslint src/ tests/"
  }
}
```

### Vérifications Jenkins attendues

**Sur `feature/*`**
- Install ✅ Lint ✅ Test ✅
- Build et Deploy ignorés
- Onglet Test Results visible

**Sur `develop`**
- Install ✅ Lint ✅ Test ✅ Build ✅
- Artefact `streamflow-api-N-xxxxxxx.tar.gz` téléchargeable
- Deploy ignoré

**Sur `main`**
- Tous les stages s'exécutent
- Pipeline en pause sur `input` avant Deploy
- Après validation : déploiement effectué

---

## Critères de validation

### Développement
- Les 7 modules sont implémentés et fonctionnels
- Les transitions d'état des abonnements sont correctement gardées
- Le moteur de prix applique la meilleure remise sans cumul
- `npm start` démarre sans erreur
- `npm run lint` passe sans erreur

### Tests
- `npm test` → 0 failing
- Couverture ≥ 80% lines, ≥ 70% branches, ≥ 85% functions
- Les mocks `jest.mock()` sont utilisés pour isoler les services
- Minimum 95 tests au total répartis sur les 8 fichiers

### Git
- Minimum 20 commits Conventional Commits
- Minimum 8 branches feature visibles dans `git log --graph`
- Aucun commit direct sur `main`
- Tag `v1.0.0` présent sur `main`

### Jenkins
- Pipeline vert sur `main`
- Comportement conditionnel correct selon la branche
- Artefact versionné téléchargeable sur `develop`
- Onglet Test Results visible dans Jenkins

---

## Barème

| Partie | Points |
|--------|--------|
| Développement — modèles, utilitaires | 3 pts |
| Développement — services métier | 7 pts |
| Tests unitaires (couverture + qualité) | 5 pts |
| Workflow Git (commits + branches) | 2 pts |
| Pipeline Jenkins | 3 pts |
| **Total** | **20 pts** |

---

## Ressources

- [Jest Documentation](https://jestjs.io/fr/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/fr/)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Express.js](https://expressjs.com/fr/)
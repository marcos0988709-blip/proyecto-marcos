# FUT14 Cards API

API de un juego de cartas de fútbol de tipo "pack opener" para móvil: base de datos de jugadores, **cartas especiales de la era 13/14 y promos modernas**, sobres con probabilidades, **SBCs** de varios retos, **drafts** con torneo y club del usuario.

- Node.js ≥ 22.13, **sin dependencias** (HTTP y SQLite nativos de Node).
- Datos en SQLite (`data/game.db`, configurable con `DB_PATH`).

## Arranque rápido

```bash
npm run seed      # genera una base de demo (≈1.900 jugadores ficticios, ≈2.500 cartas)
npm start         # http://localhost:3000  (PORT para cambiarlo)
npm test          # tests end-to-end
```

## Cargar tu propia base de jugadores (p. ej. temporada 13/14)

```bash
npm run seed -- ruta/jugadores.csv
```

Formato (ver `data/players.template.csv`):

```
name,nation,league,club,position,alt_positions,age,rating,pac,sho,pas,dri,def,phy,is_legend
```

El importador también acepta las columnas típicas de los datasets públicos de jugadores
(`short_name`, `nationality_name`, `club_name`, `league_name`, `player_positions`, `overall`,
`pace`, `shooting`, `passing`, `dribbling`, `defending`, `physic`…), y normaliza posiciones
(`LWB→LB`, `CF→ST`, etc.). Con `is_legend=1` el jugador recibe solo carta de Leyenda.

> La demo usa jugadores, clubes y ligas **ficticios**. Los datos reales del juego oficial
> (medias, plantillas) son propiedad de su editor: si importas una base, asegúrate de tener
> derecho a usarla.

## Cartas

Al importar se generan automáticamente todas las versiones (`src/config/promos.js`):

| Versión | Era | Cómo se asigna |
|---|---|---|
| Bronce / Plata / Oro (+ raro) | base | por media (<65 / 65-74 / 75+) |
| In-Form, Man of the Match | 13/14 | muestra aleatoria, +1 a +3 |
| Ones to Watch | 13/14 | jóvenes ≤23 |
| Record Breaker, Halloween, Winter Special | 13/14 | +3 a +6 |
| Team of the Season | 13/14 | mejor 11 (4-3-3) de cada liga, +5 a +8 |
| Team of the Year | 13/14 | mejor 11 global, +7 a +10 |
| Legend | 13/14 | jugadores con `is_legend=1` |
| Future Stars, Flashback, Hero | moderna | jóvenes / veteranos / aleatorio con boost alto |
| SBC Premium | moderna | top jugadores, solo vía SBC de jugador |

## Mecánicas

- **Química moderna**: máx. 3 por jugador / 33 equipo. Club 2/4/7, Liga 3/5/8, Nación 2/5/8. Fuera de posición = 0. Leyendas: 3 de química, doble para su nación, +1 a cada liga.
- **Media de equipo**: fórmula clásica (bonus por jugadores por encima de la media).
- **Sobres** (`src/config/packs.js`): bronce, plata, oro, oro premium, promo (especial garantizada), jumbo raros, raros 80+, leyenda. Las medias altas salen con menor probabilidad; el RNG de sobres es criptográfico.
- **SBCs**: estáticos (híbridos, mejoras 83+/86+, "Final de temporada" con 3 retos), uno por liga ("Maestro de liga") y uno por cada carta SBC Premium (3 retos). Recompensas por reto y por completar el grupo. `dryRun: true` valida sin consumir cartas.
- **Draft**: 5 formaciones → 5 capitanes → 5 opciones por hueco → 4 partidos (rivales 80/83/86/89). La probabilidad de ganar depende de media + química. Recompensas de 0 a 4 victorias. Modo `practice` gratis y sin premios.

## Endpoints

Autenticación: `Authorization: Bearer <token>` (lo devuelve `/auth/register`).

### Catálogo (público)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | estado |
| GET | `/versions` | versiones de carta y nº de cartas |
| GET | `/meta` | naciones, ligas, clubes, posiciones |
| GET | `/formations` | formaciones y posiciones |
| GET | `/cards` | buscar: `search, nation, league, club, position, version (a,b), special, minRating, maxRating, sort (rating\|name\|pac), page, limit` |
| GET | `/cards/:id` | carta + otras versiones del jugador |
| GET | `/players/:id` | todas las versiones de un jugador |
| GET | `/packs` | tienda de sobres |
| GET | `/sbcs?category=` · `/sbcs/:id` | SBCs |
| POST | `/squad/evaluate` | `{formation, cardIds[11]}` → media y química |

### Usuario
| Método | Ruta | Body |
|---|---|---|
| POST | `/auth/register` | `{username}` → token, 50.000 monedas + 2 sobres |
| GET | `/me` | |
| GET | `/me/club` | mismos filtros que `/cards` |
| POST | `/me/club/quicksell` | `{userCardIds: []}` |
| GET | `/me/packs` | sobres sin abrir |
| POST | `/me/packs/:userPackId/open` | |
| POST | `/store/packs/:packId/buy` | `{open: false}` para guardarlo sin abrir |
| GET | `/me/sbcs` | SBCs con tu progreso |
| POST | `/sbcs/:id/submit` | `{challengeId?, formation, squad: [userCardId x11], dryRun?}` |
| POST | `/drafts` | `{mode: "single" \| "practice"}` |
| GET | `/drafts` · `/drafts/:id` | |
| POST | `/drafts/:id/formation` | `{formation}` |
| POST | `/drafts/:id/captain` | `{cardId}` |
| POST | `/drafts/:id/pick` | `{slot, cardId}` |
| POST | `/drafts/:id/play` | juega el siguiente partido |
| POST | `/drafts/:id/forfeit` | abandona y cobra según victorias |

### Ejemplo

```bash
TOKEN=$(curl -s -X POST localhost:3000/auth/register -d '{"username":"marcos"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
curl -s -X POST -H "Authorization: Bearer $TOKEN" localhost:3000/store/packs/promo_pack/buy
```

## Estructura

```
src/
  app.js            rutas HTTP
  server.js         arranque (siembra demo si la BD está vacía)
  db.js             esquema SQLite
  cardStore.js      caché de cartas + sorteo ponderado
  config/           versiones, promos, sobres, SBCs, formaciones (equilibrado del juego)
  services/         usuarios, sobres, química/media, SBCs, drafts
  seed/             generador demo, importador CSV, generador de cartas especiales
scripts/seed.js     CLI de importación
test/               tests end-to-end
```

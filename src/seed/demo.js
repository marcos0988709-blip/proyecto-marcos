import { seededRandom, randInt, pickOne, clamp } from '../lib/rng.js';

/**
 * Base de datos de DEMO con jugadores, clubes y ligas FICTICIOS.
 * Sirve para probar la API sin datos externos. Para cargar tu propia base
 * (p. ej. un CSV con jugadores de la temporada 13/14) usa `npm run seed -- ruta.csv`.
 */
const LEAGUES = [
  { name: 'Liga Ibérica', nation: 'España', strength: 80, clubs: ['CD Puerto Real', 'Atlético Meseta', 'Unión Cantábrica', 'Real Sierra CF', 'Deportivo Levante Sur', 'CF Ribera', 'Sporting Duero', 'UD Alhambra', 'Racing Montaña', 'CD Bahía', 'Real Olivar', 'Club Tajo'] },
  { name: 'Premier Isles', nation: 'Inglaterra', strength: 81, clubs: ['Northbridge FC', 'Riverside United', 'Kingsford City', 'Ashton Rovers', 'Harbour Athletic', 'Millgate Town', 'Westmoor FC', 'Crown Park', 'Elmstead United', 'Fenwick Albion', 'Stonehill City', 'Bayside Wanderers'] },
  { name: 'Serie Azzurra', nation: 'Italia', strength: 79, clubs: ['AC Vesuvio', 'Inter Lago', 'Juve Alpina', 'Roma Antica', 'Fiorentina Arno', 'Atalanta Valle', 'Torino Po', 'Genova Mare', 'Sampdoria Riviera', 'Udine Nord', 'Lazio Colle', 'Verona Arena'] },
  { name: 'Bundesliga Nord', nation: 'Alemania', strength: 79, clubs: ['FC Rheinstadt', 'Borussia Talheim', 'VfB Waldsee', 'SV Hafenburg', 'Eintracht Bergdorf', 'TSV Sonnfeld', 'FC Grünwald', 'SC Eichenau', 'Union Flussheim', 'Werder Nordsee', 'Hertha Spree', 'Fortuna Altstadt'] },
  { name: 'Ligue Bleue', nation: 'Francia', strength: 77, clubs: ['Olympique Azur', 'Paris Rive', 'AS Provence', 'Girondins Océan', 'Stade Bretagne', 'RC Lumière', 'FC Alsace', 'OGC Riviera', 'Montpellier Sud', 'Lille Nord', 'Toulouse Garonne', 'Nantes Loire'] },
  { name: 'Eredivisie Polder', nation: 'Países Bajos', strength: 74, clubs: ['Ajax Grachten', 'PSV Lichtstad', 'Feyenoord Haven', 'AZ Kaasdorp', 'FC Tulpen', 'Vitesse Rijn', 'Heerenveen Fries', 'Twente Oost'] },
  { name: 'Liga Portuguesa Atlântica', nation: 'Portugal', strength: 73, clubs: ['SL Tejo', 'FC Douro', 'Sporting Atlântico', 'SC Minho', 'Vitória Algarve', 'Boavista Norte'] },
  { name: 'Superliga Sur', nation: 'Argentina', strength: 72, clubs: ['Club Pampa', 'Atlético Río', 'Racing Andino', 'Estudiantes Plata', 'Independiente Sur', 'Gimnasia Litoral'] },
];

const NAMES = {
  España: [['Álvaro', 'Iker', 'Sergio', 'Pablo', 'Dani', 'Rubén', 'Marcos', 'Hugo', 'Jorge', 'Raúl', 'Adrián', 'Nacho'], ['Galán', 'Montero', 'Robles', 'Ibáñez', 'Cuesta', 'Vidal', 'Peña', 'Herrera', 'Soler', 'Navas', 'Lozano', 'Prieto']],
  Inglaterra: [['Jack', 'Harry', 'Oliver', 'George', 'Callum', 'Mason', 'Reece', 'Tom', 'Luke', 'Danny', 'Kyle', 'Ben'], ['Whitmore', 'Ashby', 'Holloway', 'Pritchard', 'Kendall', 'Barlow', 'Thornton', 'Fletcher', 'Rowe', 'Lambert', 'Hughes', 'Carver']],
  Italia: [['Luca', 'Marco', 'Andrea', 'Federico', 'Lorenzo', 'Matteo', 'Davide', 'Simone', 'Alessio', 'Giorgio', 'Fabio', 'Riccardo'], ['Moretti', 'Bianchi', 'Ferraro', 'Galli', 'Conti', 'Marchetti', 'Rinaldi', 'Ferri', 'Caruso', 'Lombardi', 'Santoro', 'Greco']],
  Alemania: [['Lukas', 'Jonas', 'Felix', 'Max', 'Leon', 'Tim', 'Niklas', 'Julian', 'Florian', 'Kai', 'Timo', 'Jan'], ['Brandt', 'Keller', 'Hoffmann', 'Weber', 'Krüger', 'Lang', 'Vogel', 'Busch', 'Wolff', 'Hartmann', 'Engel', 'Seidel']],
  Francia: [['Antoine', 'Hugo', 'Lucas', 'Théo', 'Kylian', 'Benjamin', 'Raphaël', 'Adrien', 'Moussa', 'Florian', 'Yanis', 'Mathis'], ['Laurent', 'Mercier', 'Dubois', 'Fontaine', 'Girard', 'Lefèvre', 'Rousseau', 'Diallo', 'Bonnet', 'Chevalier', 'Traoré', 'Morel']],
  'Países Bajos': [['Daan', 'Sem', 'Lars', 'Bram', 'Jesse', 'Thijs', 'Ruben', 'Stijn', 'Joris', 'Niels'], ['de Vries', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Boer', 'Dekker', 'Jansen', 'van Dijk', 'Kuipers']],
  Portugal: [['João', 'Tiago', 'Rafael', 'Diogo', 'André', 'Gonçalo', 'Rui', 'Nuno', 'Bruno', 'Pedro'], ['Silva', 'Costa', 'Ferreira', 'Pereira', 'Almeida', 'Carvalho', 'Moreira', 'Sousa', 'Teixeira', 'Lopes']],
  Argentina: [['Lautaro', 'Facundo', 'Nicolás', 'Matías', 'Gonzalo', 'Ezequiel', 'Franco', 'Agustín', 'Joaquín', 'Thiago'], ['Fernández', 'Acosta', 'Romero', 'Benítez', 'Sosa', 'Medina', 'Godoy', 'Paredes', 'Ledesma', 'Aguirre']],
  Brasil: [['Gabriel', 'Lucas', 'Vinícius', 'Thiago', 'Rafael', 'Douglas', 'Felipe', 'Renan'], ['Santos', 'Oliveira', 'Souza', 'Lima', 'Ribeiro', 'Barbosa', 'Rocha', 'Cardoso']],
  Uruguay: [['Diego', 'Federico', 'Nahitan', 'Sebastián', 'Maxi'], ['Cáceres', 'Olivera', 'Suárez', 'Viera', 'Arrascaeta']],
  Bélgica: [['Thibault', 'Axel', 'Dries', 'Youri', 'Arthur'], ['Peeters', 'Janssens', 'Maes', 'Claes', 'Wouters']],
  Croacia: [['Luka', 'Ivan', 'Mateo', 'Josip', 'Marko'], ['Horvat', 'Kovač', 'Babić', 'Perić', 'Jurić']],
};

const SQUAD_TEMPLATE = ['GK', 'GK', 'CB', 'CB', 'CB', 'CB', 'LB', 'LB', 'RB', 'RB', 'CDM', 'CDM', 'CM', 'CM', 'CM', 'CAM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'ST', 'ST'];

// Perfil de stats (offset sobre la media) por posición: pac, sho, pas, dri, def, phy
const PROFILE = {
  GK: [-2, -1, 0, 1, -3, 0], CB: [-12, -35, -15, -18, 3, 2], LB: [4, -25, -6, -4, -3, -6], RB: [4, -25, -6, -4, -3, -6],
  CDM: [-14, -18, -3, -6, 1, 1], CM: [-8, -6, 2, 0, -12, -6], CAM: [-2, 0, 2, 4, -40, -16], LM: [5, -6, -2, 3, -35, -14],
  RM: [5, -6, -2, 3, -35, -14], LW: [7, -3, -4, 5, -45, -18], RW: [7, -3, -4, 5, -45, -18], ST: [3, 4, -12, 0, -50, -2],
};
const ALT = { CB: ['CDM'], LB: ['LM'], RB: ['RM'], CDM: ['CM', 'CB'], CM: ['CDM', 'CAM'], CAM: ['CM'], LM: ['LW'], RM: ['RW'], LW: ['LM', 'ST'], RW: ['RM', 'ST'], ST: [] , GK: [] };

function makeStats(position, rating, rnd) {
  return Object.fromEntries(['pac', 'sho', 'pas', 'dri', 'def', 'phy'].map((k, i) => [k, clamp(rating + PROFILE[position][i] + randInt(-4, 4, rnd), 20, 99)]));
}

export function generateDemoPlayers(seed = 2014) {
  const rnd = seededRandom(seed);
  const players = [];
  const used = new Set();
  const nameFor = (nation) => {
    const [first, last] = NAMES[nation] ?? NAMES.España;
    for (let tries = 0; tries < 50; tries++) {
      const n = `${pickOne(first, rnd)} ${pickOne(last, rnd)}`;
      if (!used.has(n)) { used.add(n); return n; }
    }
    // Nombres agotados: doble apellido (estilo ibérico)
    for (;;) {
      const n = `${pickOne(first, rnd)} ${pickOne(last, rnd)} ${pickOne(last, rnd)}`;
      if (!used.has(n)) { used.add(n); return n; }
    }
  };
  const foreign = Object.keys(NAMES);

  for (const league of LEAGUES) {
    league.clubs.forEach((club, clubIdx) => {
      const clubStrength = league.strength - Math.floor(clubIdx * 0.9) + randInt(-1, 1, rnd);
      SQUAD_TEMPLATE.forEach((position, slot) => {
        const nation = rnd() < 0.6 ? league.nation : pickOne(foreign, rnd);
        const starter = slot % 2 === 0 || position === 'CAM' || position === 'ST';
        const rating = clamp(clubStrength + randInt(-6, starter ? 6 : 1, rnd) + (rnd() < 0.03 ? randInt(4, 9, rnd) : 0), 48, 94);
        const alt = ALT[position].filter(() => rnd() < 0.5);
        players.push({
          name: nameFor(nation), nation, league: league.name, club, position,
          alt_positions: alt.join('|'), age: randInt(17, 36, rnd), rating,
          ...makeStats(position, rating, rnd), is_legend: 0,
        });
      });
    });
  }

  // Leyendas ficticias (carta única "legend").
  const legendPositions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'CAM', 'LW', 'RW', 'ST', 'ST', 'ST', 'LM', 'RM', 'CB', 'CM', 'ST'];
  legendPositions.forEach((position) => {
    const nation = pickOne(foreign, rnd);
    const rating = randInt(86, 95, rnd);
    players.push({
      name: nameFor(nation), nation, league: 'Leyendas', club: 'Leyendas', position,
      alt_positions: ALT[position].join('|'), age: randInt(38, 55, rnd), rating,
      ...makeStats(position, rating, rnd), is_legend: 1,
    });
  });
  return players;
}

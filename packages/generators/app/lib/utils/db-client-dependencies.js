'use strict';

const sqlClientModule = {
  mysql: { mysql: '2.18.1' },
  mysql2: { mysql2: '2.3.3' },
  postgres: { pg: '8.6.0' },
  'better-sqlite3': { 'better-sqlite3': '7.5.0' },
  sqlite3: { '@vscode/sqlite3': '5.0.7' },
};

/**
 * Client dependencies
 */
module.exports = ({ client }) => {
  switch (client) {
    case 'sqlite3':
    case 'better-sqlite3':
    case 'postgres':
    case 'mysql':
    case 'mysql2':
      return {
        ...sqlClientModule[client],
      };

    default:
      throw new Error(`Invalid client "${client}"`);
  }
};

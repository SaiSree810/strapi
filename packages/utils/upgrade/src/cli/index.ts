import os from 'os';
import chalk from 'chalk';
import { program } from 'commander';

import { version as packageJSONVersion } from '../../package.json';
import { Version } from '../modules/version';

import type { CLIOptions } from './types';

const addReleaseUpgradeCommand = (releaseType: Version.ReleaseType, description: string) => {
  program
    .command(releaseType)
    .description(description)
    .option('-p, --project-path <project-path>', 'Path to the Strapi project')
    .option('-n, --dry', 'Simulate the upgrade without updating any files', false)
    .option('-d, --debug', 'Get more logs in debug mode', false)
    .option('-s, --silent', "Don't log anything", false)
    .option(
      '-y, --yes',
      'Automatically answer "yes" to any prompts that the CLI might print on the command line.',
      false
    )
    .action(async (options: CLIOptions) => {
      const { upgrade } = await import('./commands/upgrade.js');

      return upgrade({ ...options, target: releaseType });
    });
};

program
  .command('codemods')
  .description(
    'Run the upgrade process with the selected codemods without updating the Strapi dependencies'
  )
  .option('-p, --project-path <project-path>', 'Path to the Strapi project')
  .action(async (options) => {
    const { upgrade } = await import('./commands/upgrade.js');
    // TODO: Change this to target major version
    return upgrade({ ...options, codemodsOnly: true, target: Version.ReleaseType.Minor });
  });

addReleaseUpgradeCommand(
  Version.ReleaseType.Major,
  'Upgrade to the next available major version of Strapi'
);

addReleaseUpgradeCommand(
  Version.ReleaseType.Minor,
  'Upgrade to the latest minor and patch version of Strapi for the current major'
);

addReleaseUpgradeCommand(
  Version.ReleaseType.Patch,
  'Upgrade to latest patch version of Strapi for the current major and minor'
);

program
  .usage('<command> [options]')
  .on('command:*', ([invalidCmd]) => {
    console.error(
      chalk.red(
        `[ERROR] Invalid command: ${invalidCmd}.${os.EOL} See --help for a list of available commands.`
      )
    );

    process.exit(1);
  })
  .helpOption('-h, --help', 'Print command line options')
  .addHelpCommand('help [command]', 'Print options for a specific command')
  .version(packageJSONVersion)
  .parse(process.argv);

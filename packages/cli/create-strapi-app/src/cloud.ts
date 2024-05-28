import inquirer from 'inquirer';
import { resolve } from 'node:path';
import { cli as cloudCli, services as cloudServices } from '@strapi/cloud-cli';
import parseToChalk from './utils/parse-to-chalk';

interface CloudError {
  response: {
    status: number;
    data: string | object;
  };
}

function assertCloudError(e: unknown): asserts e is CloudError {
  if ((e as CloudError).response === undefined) {
    throw Error('Expected CloudError');
  }
}

export async function handleCloudProject(projectName: string): Promise<void> {
  let cloudApiService = cloudServices.cloudApiFactory();
  const { data: config } = await cloudApiService.config();
  console.log(parseToChalk(config.projectCreation.introText));
  const { userChoice } = await inquirer.prompt<{ userChoice: string }>([
    {
      type: 'list',
      name: 'userChoice',
      message: `Please log in or sign up.`,
      choices: ['Login/Sign up', 'Skip'],
    },
  ]);

  if (userChoice !== 'Skip') {
    const logger = cloudServices.createLogger({
      silent: false,
      debug: process.argv.includes('--debug'),
      timestamp: false,
    });
    const cliContext = {
      logger,
      cwd: process.cwd(),
    };
    const tokenService = cloudServices.tokenServiceFactory(cliContext);
    const projectCreationSpinner = logger.spinner('Creating project on Strapi Cloud');

    try {
      await cloudCli.login.action(cliContext);
      logger.debug('Retrieving token');
      const token = await tokenService.retrieveToken();

      cloudApiService = cloudServices.cloudApiFactory(token);

      logger.debug('Retrieving config');
      const { data: config } = await cloudApiService.config();
      logger.debug('config', config);
      const defaultProjectValues = config.projectCreation?.defaults || {};
      logger.debug('default project values', defaultProjectValues);
      projectCreationSpinner.start();
      const { data: project } = await cloudApiService.createProject({
        nodeVersion: process.versions?.node?.slice(1, 3) || '20',
        region: 'NYC',
        plan: 'trial',
        ...defaultProjectValues,
        name: projectName,
      });
      projectCreationSpinner.succeed('Project created on Strapi Cloud');
      const projectPath = resolve(projectName);
      logger.debug(project, projectPath);
      cloudServices.local.save({ project }, { directoryPath: projectPath });
    } catch (e: Error | CloudError | unknown) {
      logger.debug(e);
      try {
        assertCloudError(e);
        if (e.response.status === 403) {
          const message =
            typeof e.response.data === 'string'
              ? e.response.data
              : 'We are sorry, but we are not able to create a Strapi Cloud project for you at the moment.';
          if (projectCreationSpinner.isSpinning) {
            projectCreationSpinner.fail(message);
          } else {
            logger.warn(message);
          }
          return;
        }
      } catch (e) {
        /* empty */
      }
      const defaultErrorMessage =
        'An error occurred while trying to interact with Strapi Cloud. Use strapi deploy command once the project is generated.';
      if (projectCreationSpinner.isSpinning) {
        projectCreationSpinner.fail(defaultErrorMessage);
      } else {
        logger.error(defaultErrorMessage);
      }
    }
  }
}

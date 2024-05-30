import axios, { AxiosResponse, AxiosError } from 'axios';
import { tokenServiceFactory, cloudApiFactory } from '../services';
import type { CloudCliConfig, CLIContext } from '../types';

const openModule = import('open');

export default async (ctx: CLIContext) => {
  const { logger } = ctx;
  const tokenService = tokenServiceFactory(ctx);
  const existingToken = await tokenService.retrieveToken();
  const cloudApiService = cloudApiFactory(existingToken || undefined);

  const trackFailedLogin = async () => {
    try {
      await cloudApiService.track('didNotLogin', { loginMethod: 'cli' });
    } catch (e) {
      logger.debug('Failed to track failed login', e);
    }
  };

  if (existingToken) {
    const isTokenValid = await tokenService.isTokenValid(existingToken);
    if (isTokenValid) {
      try {
        const userInfo = await cloudApiService.getUserInfo();
        const { email } = userInfo.data.data;
        if (email) {
          logger.log(`You are already logged into your account (${email}).`);
        } else {
          logger.log('You are already logged in.');
        }
        return;
      } catch (e) {
        logger.debug('Failed to fetch user info', e);
        // If the token is invalid and request failed, we should proceed with the login process
      }
    }
  }

  let cliConfig: CloudCliConfig;
  try {
    logger.info('🔌 Connecting to the Strapi Cloud API...');
    const config = await cloudApiService.config();
    cliConfig = config.data;
  } catch (e: unknown) {
    logger.error('🥲 Oops! Something went wrong while logging you in. Please try again.');
    logger.debug(e);
    return;
  }

  try {
    await cloudApiService.track('willLoginAttempt', {});
  } catch (e) {
    logger.debug('Failed to track login attempt', e);
  }

  logger.debug('🔐 Creating device authentication request...', {
    client_id: cliConfig.clientId,
    scope: cliConfig.scope,
    audience: cliConfig.audience,
  });
  const deviceAuthResponse = (await axios
    .post(cliConfig.deviceCodeAuthUrl, {
      client_id: cliConfig.clientId,
      scope: cliConfig.scope,
      audience: cliConfig.audience,
    })
    .catch((e: AxiosError) => {
      logger.error('There was an issue with the authentication process. Please try again.');
      if (e.message) {
        logger.debug(e.message, e);
      } else {
        logger.debug(e);
      }
    })) as AxiosResponse;

  openModule.then((open) => {
    open.default(deviceAuthResponse.data.verification_uri_complete).catch((e: Error) => {
      logger.error('We encountered an issue opening the browser. Please try again later.');
      logger.debug(e.message, e);
    });
  });

  logger.log('If a browser tab does not open automatically, please follow the next steps:');
  logger.log(
    `1. Open this url in your device: ${deviceAuthResponse.data.verification_uri_complete}`
  );
  logger.log(
    `2. Enter the following code: ${deviceAuthResponse.data.user_code} and confirm to login.\n`
  );

  const tokenPayload = {
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: deviceAuthResponse.data.device_code,
    client_id: cliConfig.clientId,
  };

  let isAuthenticated = false;

  const authenticate = async () => {
    const spinner = logger.spinner('Waiting for authentication');
    spinner.start();
    const spinnerFail = () => spinner.fail('Authentication failed!');

    while (!isAuthenticated) {
      try {
        const tokenResponse = await axios.post(cliConfig.tokenUrl, tokenPayload);
        const authTokenData = tokenResponse.data;

        if (tokenResponse.status === 200) {
          // Token validation
          try {
            logger.debug('🔐 Validating token...');
            await tokenService.validateToken(authTokenData.id_token, cliConfig.jwksUrl);
            logger.debug('🔐 Token validation successful!');
          } catch (e: any) {
            logger.debug(e);
            spinnerFail();
            throw new Error('Unable to proceed: Token validation failed');
          }
          const cloudApiService = cloudApiFactory(authTokenData.access_token);

          logger.debug('🔍 Fetching user information...');
          // Call to get user info to create the user in DB if not exists
          await cloudApiService.getUserInfo();
          logger.debug('🔍 User information fetched successfully!');

          try {
            logger.debug('📝 Saving login information...');
            await tokenService.saveToken(authTokenData.access_token);
            logger.debug('📝 Login information saved successfully!');
            isAuthenticated = true;
          } catch (e) {
            logger.error(
              'There was a problem saving your login information. Please try logging in again.'
            );
            logger.debug(e);
            spinnerFail();
            return;
          }
        }
      } catch (e: any) {
        if (e.message === 'Unable to proceed: Token validation failed') {
          logger.error(
            'There seems to be a problem with your login information. Please try logging in again.'
          );
          spinnerFail();
          await trackFailedLogin();
          return;
        }
        if (
          e.response?.data.error &&
          !['authorization_pending', 'slow_down'].includes(e!.response.data.error)
        ) {
          logger.debug(e);
          spinnerFail();
          await trackFailedLogin();
          return;
        }
        // Await interval before retrying
        await new Promise((resolve) => {
          setTimeout(resolve, deviceAuthResponse.data.interval * 1000);
        });
      }
    }
    spinner.succeed('Authentication successful!');
    logger.log('You are now logged into Strapi Cloud.');
    try {
      await cloudApiService.track('didLogin', { loginMethod: 'cli' });
    } catch (e) {
      logger.debug('Failed to track login', e);
    }
  };

  await authenticate();
};

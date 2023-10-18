import { build as nodeBuild, BuildOptions } from '../../node/build';
import { handleUnexpectedError } from '../../node/core/errors';

interface BuildCLIOptions extends BuildOptions {
  /**
   * @deprecated use `minify` instead
   */
  optimization?: boolean;
}

const build = async (options: BuildCLIOptions) => {
  try {
    if (typeof process.env.STRAPI_ENFORCE_SOURCEMAPS !== 'undefined') {
      options.logger.warn(
        "[@strapi/strapi]: you've set STRAPI_ENFORCE_SOURCEMAPS, this is now deprecated. You can enable sourcemaps by passing '--sourcemaps' to the build command."
      );
    }
    if (typeof options.optimization !== 'undefined') {
      options.logger.warn(
        "[@strapi/strapi]: you've set the optimization argument, this is now deprecated. Use '--minifiy' instead."
      );
    }

    const envSourceMaps = process.env.STRAPI_ENFORCE_SOURCEMAPS === 'true';

    await nodeBuild({
      ...options,
      minify: options.optimization ?? options.minify,
      sourcemaps: options.sourcemaps || envSourceMaps,
    });
  } catch (err) {
    handleUnexpectedError(err);
  }
};

export { build };
export type { BuildCLIOptions };

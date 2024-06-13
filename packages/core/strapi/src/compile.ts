import tsUtils from '@strapi/typescript-utils';

interface Options {
  appDir?: string;
  ignoreDiagnostics?: boolean;
}

export default async function compile(options?: Options) {
  const { appDir = process.cwd(), ignoreDiagnostics = false } = options ?? {};
  const [isTSProject, outDir] = await Promise.all([
    tsUtils.isUsingTypeScript(appDir),
    tsUtils.resolveOutDir(appDir),
  ]);

  if (isTSProject) {
    await tsUtils.compile(appDir, {
      configOptions: { options: { incremental: true }, ignoreDiagnostics },
    });
  }

  const distDir = isTSProject ? outDir : appDir;

  return { appDir, distDir };
}

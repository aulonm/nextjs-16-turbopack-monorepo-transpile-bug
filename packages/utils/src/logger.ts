import pino, {
  type Logger,
  type LoggerOptions as PinoLoggerOptions,
} from 'pino';

// We're using namespace to allow other top level exports
// See comment at bottom of this file and see https://blog.andrewbran.ch/default-exports-in-commonjs-libraries/#the-simplest-solution
namespace logger {
  export type LoggerOptions = {
    /**  Whether we're running in development mode or not. Uses `process.env.NODE_ENV` to set a default if not provided. */
    development?: boolean;
  } & PinoLoggerOptions;
}

function logger(opts: logger.LoggerOptions = {}): Logger {
  const { development = process.env.NODE_ENV !== 'production', ...pinoOpts } =
    opts;

  // turn off the base, it includes the hostname and the process id which we don't really care about
  pinoOpts.base ??= null;
  // set the log level based on the environment variable. If not set, we default to 'info'
  pinoOpts.level ??= process.env.LOG_LEVEL ?? 'info';

  // If we're in development mode, we want to use pino-pretty to make the logs more readable
  // Note that pino-pretty is an optional dev dependency (because we don't want it to be included in productions builds)
  // so we have a try catch around the require...This is why we only output the bundled logger as CJS, as it supports inline requires.
  // With ESM we would have to make the logger async to support this... :/
  if (development) {
    try {
      return pino(pinoOpts, require('pino-pretty')());
    } catch (_e) {
      console.warn(
        '@code-obos/logger: Running in development mode, but pino-pretty is not installed. Run `npm install --save-dev pino-pretty` to get pretty logs in development.',
      );
    }
  }

  // if we're not in development mode, we want to output the string representation of the log level instead of a number
  // this is because the logs will be consumed by Splunk in Azure and it's easier to search for "INFO" than "30"
  pinoOpts.formatters = {
    level: (label) => ({
      level: label.toUpperCase(),
    }),
  };

  // set the timestamp to ISO format for readability (default is epoch time)
  pinoOpts.timestamp ??= pino.stdTimeFunctions.isoTime;

  return pino(pinoOpts);
}

// Create a default export so that the logger can be imported as a function
// We bundle as CJS to support inline requires in development mode
// This outputs a default export which is consumable from both CJS and ESM and bundlers
// See https://blog.andrewbran.ch/default-exports-in-commonjs-libraries/#the-simplest-solution
// Run `pnpm dlx @arethetypeswrong/cli --pack` to verify the output
export = logger;
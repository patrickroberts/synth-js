'use strict';

const camelCase = /^[\w]|\B[A-Z]/g;
const beginning = /^(.).*$/;

/**
 * @param {string} argument
 */
function argumentToVerboseFlag(argument) {
  return argument.replace(camelCase, (character, index) => `-${'-'.charAt(index)}${character.toLowerCase()}`);
}

/**
 * @param {string} argument
 */
function argumentToConciseFlag(argument) {
  return argument.replace(beginning, (_, character) => `-${character}`);
}

/**
 * utility function to convert
 * command-line arguments to object
 * @param {Array<string>} argv
 * @returns {{ help?: boolean; input?: string; verbose?: boolean; DryRun?: boolean; output?: string; }}
 */
module.exports = function getArguments(argv) {
  const argumentNames = [
    'input',
    'output',
    'sampleRate',
    'bitsPerSample',
    'duration',
    'Skip',
    'verbose',
    'DryRun',
    'help'
  ];

  const defaultArgs = require('../defaults.json');

  const flagToArgument = {};

  argumentNames.forEach((argumentName) => {
    flagToArgument[argumentToVerboseFlag(argumentName)] = argumentName;
    flagToArgument[argumentToConciseFlag(argumentName)] = argumentName;
  });

  const args = {};

  for (let i = 2; i < argv.length; i++) {
    let flag = argv[i];
    let arg = flagToArgument[flag];

    switch (arg) {
    case 'input':
    case 'output':
      args[arg] = argv[++i];
      break;
    case 'verbose':
    case 'DryRun':
    case 'help':
      args[arg] = true;
      break;
    case 'Skip':
      try {
        args[arg] = JSON.parse(argv[++i]);
      } catch (error) {
        try {
          args[arg] = require(process.cwd() + '/' + argv[i]);
        } catch (error) {
          throw new SyntaxError(`unable to parse argument for ${flag}: ${argv[i]}`);
        }
      }

      break;
    case 'sampleRate':
    case 'bitsPerSample':
    case 'duration':
      args[arg] = +argv[++i];

      if (isNaN(args[arg])) {
        try {
          args[arg] = require(process.cwd() + '/' + argv[i]);
        } catch (error) {
          throw new TypeError(`invalid argument for ${flag}: ${argv[i]}`);
        }
      }

      break;
    default:
      throw new ReferenceError(`unrecognized flag: ${flag}`);
    }
  }

  // default to default arguments
  // default output is same as input, verbose is same as DryRun
  // specified arguments will override defaults
  return Object.assign({}, defaultArgs, {output: args.input, verbose: args.DryRun}, args);
};

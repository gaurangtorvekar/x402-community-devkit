#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { fundCommand } from './commands/fund';
import { createCommand } from './commands/create';

const program = new Command();

program
  .name('x402-devkit')
  .description('Development toolkit for x402 protocol')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(fundCommand);
program.addCommand(createCommand);

program.parse();
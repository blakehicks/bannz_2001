#! /usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

//LIST OF COMMANDS
const usage = '\nUsage: bannz [command]'
yargs(hideBin(process.argv))
  .usage(usage)
  .command(require('../lib/setup'))
  .command(require('../lib/watch'))
  .command(require('../lib/deploy'))
  .demandCommand(
    1,
    "//Hey, dude. Let me know what you want to do from the above list. I'm waitin'.\n"
  )
  .help('h')
  .alias('help', 'h')
  .wrap(90).argv

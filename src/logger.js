const chalk = require("chalk");

function formatThread(threadId) {
  return `[THREAD-${threadId}]`;
}

const logger = {
  info(threadId, msg) {
    console.log(chalk.cyan(`${formatThread(threadId)} ${msg}`));
  },
  success(threadId, msg) {
    console.log(chalk.green(`${formatThread(threadId)} ${msg}`));
  },
  warn(threadId, msg) {
    console.log(chalk.yellow(`${formatThread(threadId)} ${msg}`));
  },
  error(threadId, msg) {
    console.log(chalk.red(`${formatThread(threadId)} ${msg}`));
  },
  debug(threadId, msg) {
    console.log(chalk.gray(`${formatThread(threadId)} ${msg}`));
  },
  search(msg) {
    console.log(chalk.blue(`[SEARCH] ${msg}`));
  },
  progress(success, fail, total) {
    console.log(
      chalk.magenta(
        `=== Progress: ${success} success / ${fail} fail / ${total} total ===`
      )
    );
  },
  header(threadId) {
    console.log(chalk.cyan(`\n========== THREAD-${threadId} ==========\n`));
  },
  system(msg) {
    console.log(chalk.white(`[SYSTEM] ${msg}`));
  },
};

module.exports = logger;

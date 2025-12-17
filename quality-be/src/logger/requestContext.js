const { AsyncLocalStorage } = require("async_hooks");

const als = new AsyncLocalStorage();

function runWithContext(ctx, fn) {
  return als.run(ctx, fn);
}

function getContext() {
  return als.getStore() || {};
}

module.exports = { runWithContext, getContext };

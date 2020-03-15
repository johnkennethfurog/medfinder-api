const memCache = require("node-cache");
const cache = new memCache({
  stdTTL: ttlSeconds,
  checkperiod: ttlSeconds * 0.2,
  useClones: false
});

exports.get = (key, storeFunction) => {
    this.cache.get()
};

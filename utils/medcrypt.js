const crypto = require("crypto");

exports.encrypt = (password, length = 16) => {
  const salt = crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice();

  const hash = crypto.createHmac("sha512", salt);
  hash.update(password);

  const passwordHash = hash.digest("hex");
  return {
    salt,
    passwordHash
  };
};

exports.compare = (password, usersPassword, salt) => {
  const hash = crypto.createHmac("sha512", salt);
  hash.update(password);

  const passwordHash = hash.digest("hex");

  return usersPassword === passwordHash;
};



module.exports = {
  '*.{js,ts,jsx,tsx}': ['prettier --write', 'eslint --fix'],
  '*.{json,md}': ['prettier --write'],
};

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "@mui/material": "@mui/material/node",
    "@mui/styled-engine": "@mui/styled-engine/node",
  };
  return config;
};

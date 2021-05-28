module.exports = {
  apps: [
    {
      name: "mju-polynounce",
      script: "./src",
      instances: 0,
      exec_mode: "cluster",
    }
  ],
};

const { randomBytes } = require("crypto");
const fs = require("fs");

const envFile = ".env";

function generateSecret() {
  return randomBytes(128).toString("utf-8").replace(/\s/g, "");
}

if (fs.existsSync(envFile)) {
  console.log(`Environment variable file "${envFile}" already exists`);
} else {
  let envData = "";

  envData += "# App Configuration" + "\n";
  envData += "NODE_ENV=development" + "\n";
  envData += "#NODE_ENV=production" + "\n";
  envData += "#PORT=" + "\n";
  envData += "" + "\n";
  envData += "# Secrets" + "\n";
  envData += "SESSION_SECRET=" + generateSecret() + "\n";
  envData += "" + "\n";
  envData += "# MySQL Configuration" + "\n";
  envData += "MYSQL_HOST=127.0.0.1" + "\n";
  envData += "MYSQL_PORT=3306" + "\n";
  envData += "MYSQL_USER=" + "\n";
  envData += "MYSQL_PASSWORD=" + "\n";
  envData += "MYSQL_DATABASE=" + "\n";
  envData += "" + "\n";
  envData += "# SSH Tunnel & Forward Configuration" + "\n";
  envData += "# (Applied only if USE_SSH is true)" + "\n";
  envData += "USE_SSH=false" + "\n";
  envData += "SSH_HOST=" + "\n";
  envData += "SSH_PORT=" + "\n";
  envData += "SSH_USERNAME=" + "\n";
  envData += "SSH_PASSWORD=" + "\n";
  envData += "SSH_VALID_FORWARD_SRC_PORT=3306" + "\n";
  envData += "" + "\n";

  fs.writeFileSync(envFile, envData, "utf-8");

  console.log(`${envFile} generated successfully`);
}

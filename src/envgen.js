const { randomBytes } = require("crypto");
const fs = require("fs");

const envFile = ".env";

function generateSecret(len = 128, sliceLen = 0) {
  return randomBytes(len).toString("base64").slice(sliceLen);
}

if (fs.existsSync(envFile)) {
  console.log(`Environment variable file "${envFile}" already exists`);
} else {
  let envData = "";

  envData += "# App Configuration" + "\n";
  envData += "NODE_ENV=development" + "\n";
  envData += "#NODE_ENV=production" + "\n";
  envData += "#PORT=" + "\n";
  envData += "#BASE_URL=" + "\n";
  envData += "BASE_URL=localhost" + "\n";
  envData += "" + "\n";
  envData += "# Nodemailer Configuration" + "\n";
  envData += "MAILER_SERVICE=" + "\n";
  envData += "MAILER_EMAIL=" + "\n";
  envData += "MAILER_HOST=" + "\n";
  envData += "MAILER_PORT=" + "\n";
  envData += "MAILER_USER=" + "\n";
  envData += "MAILER_PASSWORD=" + "\n";
  envData += "" + "\n";
  envData += "# Secrets" + "\n";
  envData += "SESSION_SECRET=" + generateSecret() + "\n";
  envData += "PASSWD_SECRET=" + generateSecret(32, 12) + "\n";
  envData += "JWT_SECRET=" + generateSecret() + "\n";
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

  fs.writeFileSync(envFile, envData, "utf-8");

  console.log(`${envFile} generated successfully`);
}

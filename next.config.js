/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the server + only required deps into .next/standalone -> slim Docker
  // image run via `node server.js`. Required for the Meticulous Docker path.
  output: "standalone",
};

module.exports = nextConfig;

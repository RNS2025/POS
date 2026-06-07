import { createApp } from './app.js';
import { config } from './infra/config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

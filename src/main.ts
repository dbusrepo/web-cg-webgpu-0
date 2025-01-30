import './css/app.css';
import { App } from './app/app';

window.addEventListener('load', async () => {
  // console.log("isolated:" + self.crossOriginIsolated);
  const app = new App();
  await app.init();
  app.run();
});

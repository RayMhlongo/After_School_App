import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/sora/latin-600.css';
import '@fontsource/sora/latin-700.css';
import './styles.css';
import { PlannerApp } from './app.js';

const root = document.querySelector('#app');
const app = new PlannerApp(root);

app.init().catch((error) => {
  console.error(error);
  root.innerHTML = `
    <div class="fatal-screen">
      <h1>After School Planner</h1>
      <p>The app could not start.</p>
      <pre>${error.message}</pre>
    </div>
  `;
});

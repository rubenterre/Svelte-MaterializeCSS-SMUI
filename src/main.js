import App from './App.svelte';
import '../node_modules/materialize-css/dist/css/materialize.css'
import '../public/global.css'
import '../node_modules/materialize-css/dist/js/materialize.js'


const app = new App({
	target: document.body

});

M.AutoInit()
export default app;
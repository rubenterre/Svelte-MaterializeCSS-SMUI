<script>
	import Router from 'svelte-spa-router'
  import { link } from 'svelte-spa-router'
  import routes from './routes.js'
  
  function share(){
    Website2APK.shareIntent();
  }
  
</script>

<main>

    <!-- navbar bottom -->
    <nav class="navbarbaja">
      <div class="nav-fixed">
          <a href="/" use:link class="brand-logo center"><img src="img/Icon_menu/inicio.svg" alt="inicio" width="80%"></a>
          
          <ul id="nav-mobile left">
              <li><a href="/Informacion" use:link ><i class="material-icons brown-text darken-2-text">info_outline</i></a></li>
          </ul>

          <ul class="nav-mobile right">
              <li><a on:click={() => share()} ><i class="material-icons brown-text darken-2-text">share</i></a></li>
          </ul>

      </div>
  </nav>

<Router {routes} />


</main>

<style>
/* Estilos generales */

:global(body) {
    background: url(../img/Fondo.png);
    background-repeat: no-repeat;
    background-size: cover;
    background-color: #111518;
    height: 100%;
}



:global(.menu_abajo){
	background-color: white;
	bottom: 0px;
	position: fixed;
	width: 100%;
  display: inline-flex;
  justify-content: center;
}

:global(.menu_abajo li){
  color: black;

}

/* barra baja */
.navbarbaja {
    background-color: #DFD7C3;
    overflow: hidden;
    position: fixed;
    bottom: 0px;
    width: 100%;
    z-index: 999;
    margin: 0 auto;
    padding: 5px;
    border-radius: 30px 30px 0px 0px;
    -moz-border-radius: 30px 30px 0px 0px;
    -webkit-border-radius: 30px 30px 0px 0px;
    border: 0px solid;

}

</style>
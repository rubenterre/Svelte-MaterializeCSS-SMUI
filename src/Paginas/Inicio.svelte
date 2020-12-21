<script>
	import Jupiter from '../Componentes/Jupiter.svelte';
	import Juno from '../Componentes/Juno.svelte';
	import Neptuno from '../Componentes/Neptuno.svelte';
	import Venus from '../Componentes/Venus.svelte';
	import Marte from '../Componentes/Marte.svelte';
	import Apolo from '../Componentes/Apolo.svelte';
	import Vulcano from '../Componentes/Vulcano.svelte';
	import Hades from '../Componentes/Pluton.svelte';
	import Mercurio from '../Componentes/Mercurio.svelte';
    import Header from '../Componentes/Header.svelte';

	import {
    link
  } from 'svelte-spa-router'

	import List, {
		Item,
		Text,
		Graphic,
		Separator,
		Subheader
	} from '@smui/list';

	import { blur } from 'svelte/transition';


	let jupiter = false;
	let juno = false;
	let neptuno = false;
	let venus = false;
	let marte = false;
	let apolo = false;
	let vulcano = false;
	let hades = false;
	let mercurio = false;

	$: if (jupiter) {
		jupiter = true;
		juno = false;
		neptuno = false;
		venus = false;
		marte = false;
		apolo = false;
		vulcano = false;
		hades = false;
		mercurio = false;
	}

	$: if (juno) {
		jupiter = false;
		juno = true;
		neptuno = false;
		venus = false;
		marte = false;
		apolo = false;
		vulcano = false;
		hades = false;
		mercurio = false;
	}

	$: if (neptuno) {
		jupiter = false;
		juno = false;
		neptuno = true;
		venus = false;
		marte = false;
		apolo = false;
		vulcano = false;
		hades = false;
		mercurio = false;
	}

	$: if (venus) {
		jupiter = false;
		juno = false;
		neptuno = false;
		venus = true;
		marte = false;
		apolo = false;
		vulcano = false;
		hades = false;
		mercurio = false;
	}

	$: if (marte) {
		jupiter = false;
		juno = false;
		neptuno = false;
		venus = false;
		marte = true;
		apolo = false;
		vulcano = false;
		hades = false;
		mercurio = false;
	}

	$: if (apolo) {
		jupiter = false;
		juno = false;
		neptuno = false;
		venus = false;
		marte = false;
		apolo = true;
		vulcano = false;
		hades = false;
		mercurio = false;
	}

	$: if (vulcano) {
		jupiter = false;
		juno = false;
		neptuno = false;
		venus = false;
		marte = false;
		apolo = false;
		vulcano = true;
		hades = false;
		mercurio = false;
	}

	$: if (mercurio) {
		jupiter = false;
		juno = false;
		neptuno = false;
		venus = false;
		marte = false;
		apolo = false;
		vulcano = false;
		hades = false;
		mercurio = true;
	}

	$: if (hades) {
		jupiter = false;
		juno = false;
		neptuno = false;
		venus = false;
		marte = false;
		apolo = false;
		vulcano = false;
		hades = true;
		mercurio = false;
	}
</script>

<Header/>

<nav class="botones_dioses">
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Jupiter_boton" class="btn-dios transparent" on:click={()=> jupiter = true}
			><img src="../img/dioses romanos_btn/Jupiter_btn.svg" alt=""></button>
	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Juno_boton" class="btn-dios transparent" on:click={()=> juno = true} ><img
				src="../img/dioses romanos_btn/Juno_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Neptuno_boton" class="btn-dios transparent" on:click={()=> neptuno = true}
			><img src="../img/dioses romanos_btn/Neptuno_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Venus_boton" class="btn-dios transparent" on:click={()=> venus = true}
			><img src="../img/dioses romanos_btn/Venus_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Apolo_boton" class="btn-dios transparent" on:click={()=> apolo = true}
			><img src="../img/dioses romanos_btn/Apolo_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Vulcano_boton" class="btn-dios transparent" on:click={()=> vulcano = true}
			><img src="../img/dioses romanos_btn/Vulcano_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Marte_boton" class="btn-dios transparent" on:click={()=> marte = true}
			><img src="../img/dioses romanos_btn/Marte_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Mercurio_boton" class="btn-dios transparent" on:click={()=> mercurio =
			true} ><img src="../img/dioses romanos_btn/Mercurio_btn.svg" alt=""></button>

	</div>
	<div class="btn_dioses">
		<button href="javascript:void(0)" id="Hades_boton" class="btn-dios transparent" on:click={()=> hades = true}
			><img src="../img/dioses romanos_btn/Hades_btn.svg" alt=""></button>

	</div>
</nav>


<section class="dioses">
	<div class="container">

		{#if jupiter}
			<div class="dioses_card" transition:blur="{{amount: 10}}">
				<div class="row" style="margin-bottom: 0px!important;">
					<div class="col s12">
						<Jupiter/>
					</div>
					<button>
						<a href="/JupiterPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4> </a>
					</button>
			</div>
			</div>
		{:else if juno}
			<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Juno/>
			</div>
					<button>
						<a href="/JunoPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
			</div>
			</div>
		{:else if neptuno}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Neptuno/>
					</div>
					<button>
						<a href="/NeptunoPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
				  </div>
						{:else if venus}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Venus/>
					</div>
					<button>
						<a href="/VenusPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
				  </div>
						{:else if apolo}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Apolo/>
					</div>
					<button>
						<a href="/ApoloPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
						</div>
						{:else if vulcano}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Vulcano/>
					</div>
					<button>
						<a href="/VulcanoPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
						</div>
						{:else if marte}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Marte/>
					</div>
					<button>
						<a href="/MartePerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
						</div>
						{:else if mercurio}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Mercurio/>
					</div>
					<button>
						<a href="/MercurioPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
						</div>
						{:else if hades}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Hades/>
					</div>
					<button>
						<a href="/PlutonPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
						</div>
						{:else}
						<div class="dioses_card" transition:blur="{{amount: 10}}">
							<div class="row" style="margin-bottom: 0px!important;">
								<div class="col s12">
						<Venus/>
					</div>
					<button>
						<a href="/VenusPerfil" use:link ><h4 class="txt_sabermas">SABER MÁS</h4></a>
					</button>
				  </div>
						</div>
						{/if}
		</div>
	
	  </section>



    <style>

/* Botones dioses */

.botones_dioses {
    overflow: auto;
    white-space: nowrap;
    /*background:rgba(33, 34, 38, 0.8);*/
    background-color: transparent;
    padding-top: 10px;
    padding-bottom: 10px;
    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    height: 200px;
	position: absolute;
	font-family: 'Lora', serif;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.botones_dioses::-webkit-scrollbar {
    display: none;
}

.btn_dioses {
    display: inline-block;
    width: 100px;
}

.btn_dioses::-webkit-scrollbar {
    display: none;
}

.btn-dios {
    border: 0px;
}

      /* Dioses */

	  .dioses {
    margin-top: 220px;
    color: white;
}

.dioses_card {
    margin: 0px auto;
	display: flex;
	border: 2px solid #DFD7C3;
	border-radius: 28px;
	
}

.dioses_card button{
	width: 100%;
	background-color: #DFD7C3;
	border-radius: 0px 0px 23px 23px;
}

.txt_sabermas{
	font-family: Palatino-Bold;
	font-size: 14px;
	color: #1A1C20;
	text-align: center;
}

.dios_img {
    width: 300px;
    display: block;
    margin: 0px auto;
}



.dioses_tit {
    font-family: Georgia, 'Times New Roman', Times, serif;
}

.card-content {
    height: 100px;
    margin-bottom: 60px;
}

.card-content p{
    font-size: 10px;
    text-align: justify;
}

nav{
	top: 70px!important;
	box-shadow: 0 0px 0px 0 rgba(0, 0, 0, 0), 0 0px 0px 0px rgba(0, 0, 0, 0.0), 0 0px 0px 0 rgba(0, 0, 0, 0.0) !important;
    webkit-box-shadow: 0 0px 0px 0 rgba(0, 0, 0, 0), 0 0px 0px 0px rgba(0, 0, 0, 0.0), 0 0px 0px 0 rgba(0, 0, 0, 0.0) !important;
}
    </style>
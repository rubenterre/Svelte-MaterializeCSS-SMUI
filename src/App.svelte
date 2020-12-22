<script>
	export let name;

	import Card, {Content, PrimaryAction, Media, MediaContent, Actions, ActionButtons, ActionIcons} from '@smui/card';
  import Button, {Label} from '@smui/button';
  import IconButton, {Icon} from '@smui/icon-button';
  import List, {Item, Text} from '@smui/list';
  let clicked = 0;
</script>

<main>
	<div class="container">
		<h1 class="center">Hello {name}!</h1>
		<div class="card-panel teal lighten-2">Play with Materialize CSS </div>
		<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	
	
		<div class="card-container short">
			<Card style="width: 320px;">
			  <Content>Play with SMUI</Content>
			  <Actions fullBleed>
				<Button on:click={() => clicked++}>
				  <Label>Action</Label>
				  <i class="material-icons" aria-hidden="true">arrow_forward</i>
				</Button>
			  </Actions>
			</Card>
		  </div>
	</div>


</main>

<style>

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.card-container {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    min-height: 500px;
    min-width: 380px;
    margin-right: 20px;
    margin-bottom: 20px;
  }
  .card-container.short {
    min-height: 200px;
  }
  * :global(.card-media-16x9) {
    background-image: url(https://via.placeholder.com/320x180.png?text=16x9);
  }
  * :global(.card-media-square) {
    background-image: url(https://via.placeholder.com/320x320.png?text=square);
  }
</style>
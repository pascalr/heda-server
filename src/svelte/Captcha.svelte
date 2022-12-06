<input type='checkbox' name='not-a-robot' bind:value={notARobot} /> <label for='not-a-robot'>{t('I_am_not_a_robot')}</label><br/><br/>
<input type='hidden' name='captcha' value={selected?.id} />
{#if notARobot}
  <p>{@html question}</p>
  <div class='captcha'>
    {#each choices as choice}
      <button type='button' class='plain-btn' on:click={(e) => imageClicked(e, choice)}>
        <img src={'/imgs/small/'+choice.image_slug} alt='FIXME DOES NOT WORK FOR BLIND PEOPLE' />
      </button>
    {/each}
    <br/><br/>
  </div>
{/if}

<script>
  import { getLocale } from "../lib";
  import { translate } from "../translate";

  export let choices;
  export let question;
  let notARobot = false;
  let selectedRef, selected;

  function imageClicked(e, choice) {
    if (selectedRef && selectedRef != e.target) {
      selectedRef.classList.remove('selected')
    }
    selectedRef = e.target
    selectedRef.classList.toggle('selected')
    if (selectedRef.classList.contains('selected')) {
      selected = choice
    }
  }

  let t = translate(getLocale())
</script>

<style>
  img {
    width: 130px;
    border: 3px solid white;
  }
  :global(img.selected) {
    border: 3px solid blue;
  }
</style>
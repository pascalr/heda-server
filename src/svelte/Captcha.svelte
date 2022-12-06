<input type='checkbox' name='not-a-robot' bind:checked={notARobot} /> <label for='not-a-robot'>{t('I_am_not_a_robot')}</label><br/><br/>
<input type='hidden' name='captcha' value={selected?.id} />
{#if notARobot}
  <p>{@html question}</p>
  <div class='captcha'>
    {#each choices as choice}
      <button type='button' class='plain-btn' on:click={(e) => imageClicked(e, choice)}>
        <img src={'/imgs/small/'+choice.image_slug} alt='FIXME DOES NOT WORK FOR BLIND PEOPLE' />
      </button>
    {/each}
    <p class='mt-2'><i>
      {t('Are_you_having_difficulty')}?
      <br/>
      {#if attempts < maxAttempts}
        <button type='button' class='btn btn-outline-primary btn-sm' on:click={fetchCaptcha}>{t('New_images')}</button>
      {:else}
        <p style='color: red'>{t('Maximum_limit_reached')}.</p>
      {/if}
    </i></p>
    <br/>
  </div>
{/if}

<script>
  import { getLocale } from "../lib";
  import { translate } from "../translate";
	import { onMount } from 'svelte';

  let choices = [];
  let question = '';
  let fetchedData = false
  let notARobot = false;
  let selectedRef, selected;
  let attempts = 0;
  let maxAttempts = 5;

  $: if (notARobot && !fetchedData) {
    fetchedData = true
    fetchCaptcha()
  }

  function removePreviousSelection() {

  }
  
  async function fetchCaptcha() {
    selected = null
    if (selectedRef) {
      selectedRef.classList.remove('selected')
    }
    if (attempts < maxAttempts) {
      attempts += 1
      const res = await fetch(`/fetch_captcha`);
      const json = await res.json();
      question = json.question
      choices = json.choices
    }
  }

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
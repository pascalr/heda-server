{#if !window.gon.captchaAlreadyValidated}
  <button type='button' class='plain-btn' on:click={showCaptcha}>
    <img class='icon' src={captchaValidated ? '/icons/check-square-green.svg' : '/icons/square.svg'} alt='Captcha checkbox' /> {t('I_am_not_a_robot')}<br/><br/>
  </button>
  {#if captchaShowned && !captchaValidated}
    <div class='captcha pt-2'>
      {#if captchaError}
        <p class='inform-error'>{captchaError}.</p>
      {/if}
      {#if !serverError}
        <p>{@html question || ''}</p>
        {#each choices || [] as choice}
          <button type='button' class='plain-btn' on:click={(e) => imageClicked(e, choice)}>
            <img src={'/imgs/small/'+choice.image_slug} alt='FIXME DOES NOT WORK FOR BLIND PEOPLE' />
          </button>
        {/each}
        <p class='mt-2'><i>
          <button type='button' class='btn btn-outline-primary btn' on:click={validateCaptcha}>{t('Validate')}</button>
          <button type='button' class='btn btn-outline-secondary btn' on:click={fetchCaptcha}>{t('Other_question')}</button>
        </i></p>
      {/if}
    </div>
    <br/>
  {/if}
{/if}

<script>
  import { getLocale, ajax } from "../lib";
  import { translate } from "../translate";
  import { localeHref } from "../utils";

  let choices = [];
  let question = '';
  let fetchedData = false
  let captchaShowned = false;
  let selectedRef, selected;
  let captchaValidated = gon.captchaAlreadyValidated || false;
  let captchaError = ''
  let serverError = false

  function showCaptcha() {
    captchaShowned = true
    if (!captchaValidated && !fetchedData) {
      fetchedData = true
      fetchCaptcha()
    }
  }

  function deselect() {
    selected = null
    if (selectedRef) {
      selectedRef.classList.remove('selected')
    }
  }

  async function validateCaptcha() {
    
    if (selected) {
      ajax({url: localeHref('/validate_captcha'), method: 'POST', data: {captcha: selected.id}, success: (res) => {
        handleResponse(res, t('Wrong_answer'))
      }})
    }
  }

  function handleResponse(res, error) {
    if (res.validated) {
      captchaValidated = true
    } else {
      deselect()
      serverError = !!res.error
      captchaError = res.error || error
      question = res.question
      choices = res.choices
    }
  }

  async function fetchCaptcha() {
    deselect()
    const res = await fetch(localeHref(`/fetch_captcha`));
    const json = await res.json();
    handleResponse(json)
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
    width: 138px;
    border: 3px solid white;
  }
  :global(img.selected) {
    border: 3px solid blue;
  }
  .captcha {
    margin: 0 -1em;
    border: 2px solid black;
    border-radius: 0.5em;
    padding: 0.5em;
  }
  .icon {
    width: 2em;
  }
</style>
<div class="form-container">
  <h2><a href={urlWithLocale('/', locale)}>HedaCuisine {t('beta')}</a></h2>
  <h1>{t('Sign_up')}</h1>
  {#if errors?.length}
    {#each errors as error}
      <div class="inform-error">{error}</div><br/>
    {/each}
  {/if}
  <form action={urlWithLocale('/signup', locale)} method="post" on:submit={submitForm}>
    <LoginFormInput field="username" label={t('Username')+' (public)'} autocomplete="username" validate={validateUsername} bind:validateInput={validateUsernameInput} {t} />
    <LoginFormInput field="email" label={t('Email')} autocomplete="email" validate={validateEmail} bind:validateInput={validateEmailInput} {t} />
    <LoginFormInput field="password" label={t('Password')} autocomplete="new-password" validate={validatePassword} bind:validateInput={validatePasswordInput} {t} />
    <input type='checkbox' name='not-a-robot' bind:value={notARobot} /> <label for='not-a-robot'>{t('I_am_not_a_robot')}</label><br/><br/>
    {#if notARobot}
      <p>{@html question}</p>
      <div class='captcha'>
        {#each choices as choice}
          <img src={'/imgs/small/'+choice.image_slug} alt='FIXME DOES NOT WORK FOR BLIND PEOPLE' />
        {/each}
        <br/><br/>
      </div>
    {/if}
    <input type="hidden" name="_csrf" value={csrf}>
    <button id="create" class="btn btn-primary form-control" type="submit">{t('Sign_up')}</button>
  </form>
  <hr>
  <p class="help">
    {t('Help_login')}
    <a href={urlWithLocale('/login', locale)}>{t('Login')}</a>
  </p>
</div>

<script>
  import { urlWithLocale } from '../utils'
  import { translate } from '../translate'
  import LoginFormInput from './partials/LoginFormInput.svelte'
  import { validateEmail, validatePassword, validateUsername, getLocale, getCsrf } from '../lib'

  let locale = getLocale()
  console.log('locale', locale)
  let csrf = getCsrf()
  let {errors, choices, question} = window.gon
  let t = translate(locale)
  let notARobot = false
  let validateEmailInput, validatePasswordInput, validateUsernameInput;

  function submitForm(e) {
    e.preventDefault()
    let valid = [validateEmailInput(), validatePasswordInput(), validateUsernameInput()].every(f => f)
    if (!valid) {
      e.preventDefault()
      return false
    }
  }
</script>

<style>
  h2 a { text-decoration: none;}

  .captcha img {
    width: 130px;
    border: 3px solid white;
  }
</style>
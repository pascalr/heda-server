<div class="form-container">
  <h2><a href={urlWithLocale('/', locale)}>HedaCuisine {t('beta')}</a></h2>
  <h1>{t('Sign_up')}</h1>
  {#if errors?.length}
    {#each errors as error}
      <div class="inform-error">{error}</div><br/>
    {/each}
  {/if}
  <form action={urlWithLocale('/signup', locale)} method="post" on:submit={submitForm}>
    <LoginFormInput field="name" label={t('Username')+' (public)'} autocomplete="username" validate={validateUsername} bind:validateInput={validateUsernameInput} {t} />
    <LoginFormInput field="email" label={t('Email')} autocomplete="email" validate={validateEmail} bind:validateInput={validateEmailInput} {t} />
    <LoginFormInput type="password" field="password" label={t('Password')} autocomplete="new-password" validate={validatePassword} bind:validateInput={validatePasswordInput} {t} />
    <Captcha />
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
  import Captcha from './Captcha.svelte'
  import { validateEmail, validatePassword, validateUsername, getLocale, getCsrf } from '../lib'

  let locale = getLocale()
  console.log('locale', locale)
  let csrf = getCsrf()
  let {errors} = window.gon
  let t = translate(locale)
  let validateEmailInput, validatePasswordInput, validateUsernameInput;

  function submitForm(e) {
    
    try {
      let valid = [validateEmailInput(), validatePasswordInput(), validateUsernameInput()].every(f => f)
      if (!valid) {
        e.preventDefault()
        return false
      }
    } catch (err) {
      console.log('error', err)
      e.preventDefault()
    }
  }
</script>

<style>
  h2 a { text-decoration: none;}
</style>
<div class="form-container">
  <h2><a href={urlWithLocale('/', locale)}>HedaCuisine {t('beta')}</a></h2>
  <h1>{t('Sign_up')}</h1>
  {#if errors?.length}
    {#each errors as error}
      <div class="inform-error">{error}</div><br/>
    {/each}
  {/if}
  <form action={urlWithLocale('/signup', locale)} method="post">
    <div>
      <label for="username">{t('Username')} (public)</label>
      <input id="username" name="username" class="form-control" type="text" autocomplete="email" required>
    </div>
    <br/>
    <div>
      <label for="email">{t('Email')}</label>
      <input id="email" name="email" class="form-control" type="text" autocomplete="email" on:blur={validateEmail} required>
    </div>
    <br/>
    {#if emailError}
      <div class="inform-error">{emailError}</div><br/>
    {/if}
    <div>
      <label for="new-password">{t('Password')}</label>
      <input id="new-password" name="password" class="form-control" type="password" autocomplete="new-password" required>
    </div>
    <input type="hidden" name="_csrf" value={csrf}>
    <br/>
    <button id="create" class="btn btn-primary form-control" type="submit">{t('Sign_up')}</button>
  </form>
  <hr>
  <p class="help">
    {t('Help_login')}
    <a href={urlWithLocale('/login', locale)}>{t('Login')}</a>
  </p>
</div>

<script>
  import { isValidEmail, urlWithLocale } from '../utils'
  import { translate } from '../translate'
  import { getLocale, getCsrf } from '../lib'

  let locale = getLocale()
  let csrf = getCsrf()
  let errors = window.errors
  let t = translate(locale)

  let emailError = ''

  function validateEmail() {
    if (isValidEmail(this.value)) {
      this.classList.remove('invalid')
      emailError = ''
    } else {
      this.classList.add('invalid')
      emailError = 'Please enter a valid email address.'
    }
  }
</script>

<style>
  h2 a { text-decoration: none;}

  :global(.invalid) {
    border: 2px solid red;
  }

  .inform-error {
    color: red;
    font-style: italic;
  }
</style>
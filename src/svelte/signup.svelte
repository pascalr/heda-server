<div class="form-container">
  <h2><a href={urlWithLocale('/', locale)}>HedaCuisine {t('beta')}</a></h2>
  <h1>{t('Sign_up')}</h1>
  {#if errors?.length}
    {#each errors as error}
      <div class="error">{error}</div><br/>
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
      <input id="email" name="email" class="form-control" type="text" autocomplete="email" required>
    </div>
    <br/>
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
  import { getLocale, getCsrf } from '../react/lib'

  let locale = getLocale()
  let csrf = getCsrf()
  let errors = window.errors
  let t = translate(locale)

  function validateEmail(input) {
    if (isValidEmail(input)) {
      input.classList.remove('invalid')
    } else {
      input.classList.add('invalid')
    }
  }
</script>

<style>
  h2 a { text-decoration: none;}
</style>
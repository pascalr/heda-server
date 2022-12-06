<div>
  <label for="username">{label}</label>
  <input name={field} class="form-control" type="text" {autocomplete} on:blur={validateInput} bind:value={value} bind:this={ref}>
</div>
<br/>
{#if error}
  <div class="inform-error">{error}</div><br/>
{/if}

<script>
  export let validate;
  export let field;
  export let autocomplete;
  export let label;
  export let value;
  export let t;
  let ref;
  let error = ''

  export function validateInput() {
    error = t(validate(value))
    if (error) {
      ref.classList.add('invalid')
    } else {
      ref.classList.remove('invalid')
    }
    return !error
  }

</script>

<style>
  :global(.invalid) {
    border: 2px solid red;
  }
  .inform-error {
    color: red;
    font-style: italic;
  }
</style>
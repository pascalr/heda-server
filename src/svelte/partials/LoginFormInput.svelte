<div>
  <label for="username">{label}</label>
  <input id={'form-'+field} name={field} class="form-control" use:setType {autocomplete} on:blur={validateInput} bind:value bind:this={ref}>
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
  export let type = 'text';
  let ref;
  let error = ''

  function setType(node) {node.type = type}

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
</style>
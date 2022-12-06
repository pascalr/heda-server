<input name={field} class="form-control" type="text" {autocomplete} on:blur={validateInput} bind:value={value} bind:this={ref}>

<script>
  export let field = ''
  export let autocomplete = ''
  export let validate;
  export let value;
  let ref;

  export function validateInput() {
    let err = validate(value)
    if (err) {
      ref.classList.add('invalid')
    } else {
      ref.classList.remove('invalid')
    }
    return !err
  }
</script>

<style>
  :global(.invalid) {
    border: 2px solid red;
  }
</style>
import Signup from './signup.svelte';

document.addEventListener('DOMContentLoaded', () => {
  const app = new Signup({
    target: document.getElementById('signup-page'),
    props: {}
  });
})

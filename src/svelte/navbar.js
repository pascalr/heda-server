import Navbar from './navbar.svelte';

document.addEventListener('DOMContentLoaded', () => {
  const app = new Navbar({
    target: document.getElementById('navbar'),
    props: {}
  });
})

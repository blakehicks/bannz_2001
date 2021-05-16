import anime from '/assets/js/anime.es.js'

const tl = anime.timeline({
  easing: 'easeInOutQuad',
})

tl.add({
  targets: 'p',
  translateX: 20,
})

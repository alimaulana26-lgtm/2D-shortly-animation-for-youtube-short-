const speech = document.getElementById('speech');
const caption = document.getElementById('caption');
const character = document.getElementById('character');
const mouth = document.getElementById('mouth');
let timers = [];
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function later(fn, ms){timers.push(setTimeout(fn, ms))}
function play(){
  clearTimers();
  speech.classList.remove('show');
  caption.textContent = 'Kenapa harga barang bisa berbeda?';
  character.style.left = '38%';
  later(()=>{speech.textContent='Wah, murah juga!';speech.classList.add('show');},500);
  later(()=>{caption.textContent='Di tempat lain, harganya bisa lebih tinggi.';speech.textContent='Lho, kok mahal?';},2600);
  later(()=>{character.style.left='66%';speech.classList.remove('show');},4200);
  later(()=>{speech.textContent='Ada alasannya!';speech.classList.add('show');caption.textContent='Lokasi, biaya, dan kemudahan memengaruhi harga.';},5400);
  later(()=>speech.classList.remove('show'),8500);
}
document.getElementById('play').addEventListener('click',play);
document.getElementById('reset').addEventListener('click',()=>{clearTimers();speech.classList.remove('show');caption.textContent='Kenapa harga barang bisa berbeda?';character.style.left='48%';});
play();

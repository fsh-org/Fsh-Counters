let counters = [];
let add = document.getElementById('add');
let section = document.getElementById('section');
function display() {
  section.innerHTML = counters
    .map(con=>`<div style="--color:var(--${con.color}-2)">
  <span>${con.name}</span>
  <span>0</span>
  <span class="inline">
    <button>-</button>
    <button>+</button>
  </span>
</div>`)
    .join('');
}
const colors = 'red,yellow,green,blue,purple,black'.split(',');
add.onclick = ()=>{
  counters.push({
    id: Math.floor(Math.random()*(16**6)).toString(16),
    name: 'Counter '+(counters.length+1),
    color: colors[counters.length%colors.length]
  });
  display();
};
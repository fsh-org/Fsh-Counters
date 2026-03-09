let counters = [];
let add = document.getElementById('add');
let section = document.getElementById('section');
let dialog = document.getElementById('dialog');
function bright(color) {
  let c = 0;
  if (parseInt(color.slice(1,3),16)>136) c++;
  if (parseInt(color.slice(3,5),16)>200) c+=2;
  if (parseInt(color.slice(5,7),16)>136) c++;
  return c>1;
}
function display() {
  section.innerHTML = counters
    .map(con=>`<div style="--color:${con.color.startsWith('#')?con.color:`var(--${con.color}-2)`};--txt:var(--${con.color.startsWith('#')?(bright(con.color)?'bg':'text'):'text'}-1);" data-id="${con.id}">
  <span class="name" role="button" tabindex="0">${con.name}</span>
  <span class="num" role="button" tabindex="0">${con.num}</span>
  <span class="inline">
    <button class="down"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><rect y="103" width="256" height="50" rx="25"/></svg></button>
    <button class="up"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><rect x="103" width="50" height="256" rx="25"/><rect y="103" width="256" height="50" rx="25"/></svg></button>
  </span>
</div>`)
    .join('');
  section.querySelectorAll('div').forEach(con=>{
    let id = con.getAttribute('data-id');
    let counter = counters.find(c=>c.id===id);
    let down = con.querySelector('.down');
    let up = con.querySelector('.up');
    let num = con.querySelector('.num');
    let name = con.querySelector('.name');
    let time;
    let sep = 150;
    let debounce;
    let save = ()=>{
      if (debounce) clearInterval(debounce);
      debounce = setInterval(()=>{
        debounce = null;
        let tx = db.transaction(['counters'], 'readwrite');
        let cstore = tx.objectStore('counters');
        cstore.put(counter);
      }, 200);
    };
    let change = (am)=>{
      let number = counter.num+am;
      if (counter.max&&number>counter.max) number = counter.max;
      if (counter.min&&number<counter.min) number = counter.min;
      counter.num = number;
      num.innerText = number.toString();
      clearTimeout(time);
      time = setTimeout(()=>{change(am)}, sep);
      sep = sep*0.8;
      save();
    };
    down.onpointerdown = ()=>{
      change(0n-counter.step);
    };
    up.onpointerdown = ()=>{
      change(counter.step);
    };
    down.onkeydown = (evt)=>{
      if (['Enter',' '].includes(evt.key)) change(0n-counter.step);
    };
    up.onkeydown = (evt)=>{
      if (['Enter',' '].includes(evt.key)) change(counter.step);
    };
    down.onpointerup = up.onpointerup = down.onpointercancel = up.onpointercancel =  down.onpointerleave = up.onpointerleave = down.onkeyup = up.onkeyup = ()=>{
      clearTimeout(time);
      sep = 100;
    };
    num.onclick = ()=>{
      if (num.innerHTML.includes('input')) return;
      num.innerHTML = `<input type="num" value="${counter.num}" min="${counter.min}" max="${counter.max}">`;
      let input = num.querySelector('input');
      input.select();
      input.onkeydown = (evt)=>{
        if (evt.key==='Enter') input.blur();
      };
      input.onblur = ()=>{
        counter.num = BigInt(input.value);
        num.innerText = counter.num;
        save();
      };
    };
    name.onclick = ()=>{
      dialog.querySelector('.name').value = counter.name;
      dialog.querySelector('.num').value = counter.num;
      dialog.querySelector('.step').value = counter.step;
      dialog.querySelector('.min').value = counter.min;
      dialog.querySelector('.max').value = counter.max;
      dialog.querySelector('.color').value = counter.color;
      dialog.querySelector('.del').onclick = ()=>{
        counters = counters.filter(c=>c.id!==counter.id);
        let tx = db.transaction(['counters'], 'readwrite');
        let cstore = tx.objectStore('counters');
        cstore.delete(counter.id);
        dialog.close();
      };
      dialog.showModal();
      dialog.onclose = ()=>{
        counter.name = dialog.querySelector('.name').value;
        counter.num = BigInt(dialog.querySelector('.num').value);
        counter.step = BigInt(dialog.querySelector('.step').value);
        counter.min = dialog.querySelector('.min').value;
        counter.min = counter.min===''?null:BigInt(counter.min);
        counter.max = dialog.querySelector('.max').value;
        counter.max = counter.max===''?null:BigInt(counter.max);
        counter.color = dialog.querySelector('.color').value;
        save();
        display();
      };
    };
  });
}
const colors = 'red,yellow,green,blue,purple,black'.split(',');
let coloridx = 0;
add.onclick = ()=>{
  let obj = {
    name: 'Counter '+(coloridx+1),
    color: colors[coloridx%colors.length],
    num: 0n,
    step: 1n,
    min: null,
    max: null
  };
  coloridx++;
  let tx = db.transaction(['counters'], 'readwrite');
  let cstore = tx.objectStore('counters');
  let creq = cstore.put(obj);
  creq.onsuccess = ()=>{
    obj.id = creq.result;
    counters.push(obj);
    display();
  };
};
let dbRequest = indexedDB.open('data', 1);
dbRequest.onupgradeneeded = (evt)=>{
  let db = evt.target.result;
  if (!db.objectStoreNames.contains('counters')) db.createObjectStore('counters', { keyPath: 'id', autoIncrement: true });
};
dbRequest.onsuccess = (evt)=>{
  let db = evt.target.result;
  window.db = db;
  let tx = db.transaction(['counters'], 'readonly');
  let cstore = tx.objectStore('counters');
  let creq = cstore.getAll();
  creq.onsuccess = () => {
    counters = creq.result;
    coloridx = counters.length;
    display();
  };
}
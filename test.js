let x = null
let values = [10,20,30]

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getValue(i) {
  console.log('getValue', i)
  await sleep(100)
  return values[i]
}

for (let i = 0; i < 3; i++) {
  x = await getValue(i)
  if (x) {break;}
}

console.log('x', x)



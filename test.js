/**
 * Used for read only
 * 
 * let x = new ArrayCombination([[1,2], [3,4]])
 * console.log('1', x[0]) => 1
 * console.log('2', x[1]) => 2 
 * console.log('3', x[2]) => 3
 * console.log('4', x[3]) => 4
 */
class ArrayCombination {
  constructor(arrays) {
    let n = 0
    for (let i = 0; i < arrays.length; i++) {
      let array = arrays[i]
      for (let j = 0; j < array.length; j++) {
        this[n] = array[j]
        n += 1
      }
    }
  }
}

let x = new ArrayCombination([[1,2], [3,4]])


//let x = null
//let values = [10,20,30]
//
//const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
//
//async function getValue(i) {
//  console.log('getValue', i)
//  await sleep(100)
//  return values[i]
//}
//
//for (let i = 0; i < 3; i++) {
//  x = await getValue(i)
//  if (x) {break;}
//}
//
//console.log('x', x)
//
//

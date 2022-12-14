import { padStr } from "./utils.js";

export default class Scheduler {
  constructor(config) {
    this.dailyTasks = (config?.dailyTasks||[]).map(o => ({...o}))
  }
  start() {
    let date = new Date()
    console.log('Starting scheduler at: '+date.getHours()+':'+padStr(date.getMinutes()))
    this.dailyTasks.forEach(task => {
      let [hour1, min1] = task.time.split(':')
      let ms1 = hour1*60*60*1000 + min1*60*1000
      let ms2 = date.getHours()*60*60*1000 + date.getMinutes()*60*1000
      let timeUntilBeginsMs = ms1 - ms2
      if (timeUntilBeginsMs < 0) {timeUntilBeginsMs = 24*60*60*1000 + timeUntilBeginsMs}
      console.log('Task «'+task.title+'» scheduled at: '+hour1+':'+min1)
      task.timeout = setTimeout(() => {
        // Don't run if starting this very minute, because if the prog fails and restart automatically, it could
        // call the task many times instead of only once...
        // task.execute()
        task.interval = setInterval(() => {
          task.execute()
        }, 24*60*60*1000);
        task.timeout = null
      }, timeUntilBeginsMs)
    });
  }
  stop() {
    this.dailyTasks.forEach(task => {
      if (task.timeout) {
        clearTimeout(task.timeout)
      }
      if (task.interval) {
        clearInterval(task.interval)
      }
    })
  }
}

// export default class Scheduler {
//   constructor() {
//     this.delay = 60*1000; // Run every minute by default
    
//     clearInterval(interval);
//   }
//   run() {

//     this.config = {
//       dailyTasks: [
//         {time: '12:00', task: sendAnalyticsEmail}
//       ]
//     };
//     (this.config?.dailyTasks||[]).array.forEach(dailyTask => {
      
//     });
//   }
//   start() {
//     if (this.interval) {
//       throw "Can't start scheduler because it is already started."
//     }
//     this.interval = setInterval(this.run, this.delay);
//   }
//   stop() {
//     if (!this.interval) {
//       throw "Can't stop scheduler because it is not started yet."
//     }
//     clearInterval(this.interval)
//   }
// }
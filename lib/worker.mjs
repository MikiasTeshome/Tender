import { database } from './db.mjs';
import { importApprovedFeed } from './import.mjs';
import { checkPushReceipts, deliverAlerts, queueAlerts } from './notifications.mjs';

const db = database();
const tasks = [
  ['eGP import', () => importApprovedFeed(db), 3600000],
  ['Alert queue', () => queueAlerts(db), 60000],
  ['Alert delivery', () => deliverAlerts(db), 30000],
  ['Push receipts', () => checkPushReceipts(db), 300000],
];
for (const [label,run,delay] of tasks) {
  async function tick() {
    try {
      const result = await run();
      if (result) console.log(label,result);
    } catch (error) {
      console.error(label,error.message);
    } finally {
      setTimeout(tick,delay);
    }
  }
  void tick();
}

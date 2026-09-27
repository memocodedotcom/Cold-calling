import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarRange} from '../src/lib/calendar.ts';
test('calendar ranges use UTC, Monday weeks and real month boundaries',()=>{
 const week=calendarRange('2026-01-01','week');assert.equal(week.start,'2025-12-29T00:00:00.000Z');assert.equal(week.end,'2026-01-05T00:00:00.000Z');assert.equal(week.days.length,7);
 const leap=calendarRange('2028-02-17','month');assert.equal(leap.days.length,29);assert.equal(leap.end,'2028-03-01T00:00:00.000Z');
 assert.equal(calendarRange('2026-09-22','today').end,'2026-09-23T00:00:00.000Z');
 assert.equal(calendarRange('2026-02-30','month').date,new Date().toISOString().slice(0,10));
});

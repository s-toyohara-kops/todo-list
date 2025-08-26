import './style.css'

import { initStore, subscribe, setSelectedDate, getState } from './state';
import { renderTaskForm } from './ui/taskForm';
import { renderDayList } from './ui/dayList';
import { renderCalender } from './ui/calendar';
import { fromKey, formatDateLabel, weekdayJp, toKey } from './lib/date';

function $(sel: string, root: Document | HTMLElement = document) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`Element not found: ${sel}`);
  return el as HTMLElement;
}

function updateDateLabel() {
  const { selectedDate } = getState();
  const d = fromKey(selectedDate);
  ($('#date-label') as HTMLElement).textContent =
    `${formatDateLabel(d)} (${weekdayJp(d)})`;
}

function renderAll() {
  renderCalender($('#calender'));
  renderTaskForm($('.task-form') as HTMLElement);
  renderDayList($('.day-list') as HTMLElement);
  updateDateLabel();
}

function main() {
  initStore();
  renderAll();
  subscribe(renderAll);

  ($('.btn-today') as HTMLButtonElement).addEventListener('click', () => {
    setSelectedDate(toKey(new Date()));
  });
}

main();
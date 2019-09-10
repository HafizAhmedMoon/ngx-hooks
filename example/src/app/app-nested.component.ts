import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgHooks, NgHooksContext, onDestroy, onInit, ref, watch } from 'ngx-hooks';

@Component({
  selector: 'app-counter',
  template: `
    <div>counter: {{ count }}</div>
  `,
})
@NgHooks()
export class NestedComponent {
  @Input() count: number;
  @Output() countChange = new EventEmitter<number>();

  static ngHooks(context: NgHooksContext<NestedComponent>) {
    const counter = useCounter(context);
    watch(counter, (count) => context.countChange.emit(count));

    return null;
  }
}

function useCounter(obj: { count: number }) {
  let counter = ref(0);

  let interval;
  onInit(() => {
    counter.value = obj.count;
    interval = setInterval(() => {
      counter.value++;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  return counter;
}

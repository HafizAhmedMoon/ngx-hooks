import { Component, EventEmitter, Input, Output, PlatformRef } from '@angular/core';
import { FunctionComponent, inject, NgHooks, NgHooksProps, onDestroy, onInit, ref } from 'ngx-hooks';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
@NgHooks()
export class AppComponent extends FunctionComponent<AppComponent> {
  static ngHooks(props: NgHooksProps<AppComponent>) {
    const platformRef = inject(PlatformRef);
    console.log({ platformRef });

    const title = ref('Angular');
    title.value = 'NgxHooks';

    let inputA = ref<number>(0);
    let inputB = ref<number>();

    function updateInputA() {
      console.log('updateInputA');
      inputA.value = Math.floor(Math.random() * 100);
    }
    function updateInputBoth() {
      console.log('updateInputBoth');
      inputA.value = Math.floor(Math.random() * 100);
      inputB.value = Math.floor(Math.random() * 100);
    }
    return { title, inputA, inputB, updateInputA, updateInputBoth };
  }
}

@Component({
  selector: 'app-nested',
  template: `
    <div>
      {{ a }} {{ b }}
      <br />
      <br />
      counter: {{ counter }}
      <br />
      <br />
      <button (click)="updateA()">Update A from nested</button>
    </div>
  `,
})
@NgHooks()
export class NestedComponent extends FunctionComponent<NestedComponent> {
  @Input() a = 123;
  @Input() b = 321;

  @Output() aChange = new EventEmitter<number>();

  static ngHooks(props: NgHooksProps<NestedComponent>) {
    let counter = useCount();

    function updateA() {
      props.aChange.emit(Math.floor(Math.random() * 100));
    }

    return { counter, updateA };
  }
}

function useCount() {
  let counter = ref(0);

  let interval;
  onInit(() => {
    interval = setInterval(() => {
      counter.value++;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  return counter;
}

import { Component } from '@angular/core';
import { FunctionComponent, NgHooksContext, NgHooksReturn, ref } from 'ngx-hooks';

@Component({
  selector: 'app-root',
  styles: [
    `
      .apps {
        margin-top: 10px;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
      }
    `,
  ],
  template: `
    <div style="text-align:center">
      <h1>Welcome to {{ title }}!</h1>
      <br />
      <br />
      <app-input name="input" [ngModel]="title" (ngModelChange)="titleChange($event)"></app-input>
      <br />
      <br />
      <app-counter *ngIf="title" [(count)]="count"></app-counter>
      <div class="apps" *ngIf="title">
        <app-todo></app-todo>
        <app-todo key="1"></app-todo>
        <app-todo></app-todo>
      </div>
    </div>
  `,
})
@FunctionComponent()
export class AppComponent {
  title: string;
  titleChange: (val: string) => void;

  count: number;
  static ngHooks(context: NgHooksContext<AppComponent>): NgHooksReturn<AppComponent> {
    const title = ref('Angular');
    title.value = 'NgxHooks'; // update title
    function titleChange(val) {
      title.value = val;
    }

    const count = ref(0);

    return {
      title,
      titleChange,
      count,
    };
  }
}

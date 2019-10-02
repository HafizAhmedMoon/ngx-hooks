import { Component, Input } from '@angular/core';
import { FunctionComponent, inject, NgHooksContext, NgHooksReturn, observe, ref, watch } from 'ngx-hooks';
import { TodoItem, TodoService, TodoServiceProvider } from './todo.service';

@Component({
  selector: 'app-todo',
  providers: [TodoServiceProvider],
  styles: [
    `
      .todo {
        text-align: center;
        background: #bcd0c5;
        padding: 10px 20px;
        float: left;
      }
      h2 span {
        width: 25px;
        font-size: 16px;
        font-weight: normal;
      }
      input {
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 5px;
      }
      .items {
        font-family: sans-serif;
        text-align: left;
      }
      .items > div {
        margin-top: 10px;
      }
      .items button {
        float: right;
      }
    `,
  ],
  template: `
    <div class="todo">
      <h2>
        Todo <span>({{ key }})</span>
      </h2>
      <input
        type="text"
        placeholder="Item..."
        [ngModel]="input"
        (ngModelChange)="inputChange($event)"
        (keydown.enter)="addItem()"
      />
      <div class="items">
        <div
          [todoComplete]="item.completed"
          *ngFor="let item of items; let index = index"
          (click)="toggleItemComplete(index)"
        >
          <span>{{ item.text }}</span>
          <button (click)="removeItem(index)">remove</button>
        </div>
      </div>
    </div>
  `,
})
@FunctionComponent()
export class TodoComponent {
  @Input()
  key: string = '0';

  input: string;
  inputChange: (string) => void;
  items: TodoItem[];
  addItem: () => void;
  toggleItemComplete: (index: number) => void;
  removeItem: (index: number) => void;

  static ngHooks(context: NgHooksContext<TodoComponent>): NgHooksReturn<TodoComponent> {
    const input = ref('');
    const { items, addItem, removeItem, toggleItemComplete, setPersist } = inject(TodoService);

    const key = observe(context, (prop) => prop.key);
    let updateStore: ReturnType<typeof setPersist>;
    watch(
      key,
      (key) => {
        updateStore = setPersist(key, ({ input: _input = '' }) => {
          input.value = _input;
        });
      },
      { mode: 'sync' }
    );

    return {
      input,
      items,
      toggleItemComplete,
      removeItem,
      inputChange(val) {
        input.value = val;
        updateStore({ input });
      },
      addItem() {
        if (!input.value) return;
        addItem(input.value);
        input.value = '';
      },
    };
  }
}

import { Component, Input } from '@angular/core';
import { computed, fromRef, NgHooks, NgHooksContext, NgHooksFunctionReturn, observe, ref } from 'ngx-hooks';
import { shareStore } from './share-store';

interface TodoItem {
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo',
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
          [ngStyle]="{ 'text-decoration': item.completed ? 'line-through' : '' }"
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
@NgHooks()
export class TodoComponent {
  @Input()
  key: string = '0';

  input: string;
  inputChange: (string) => void;
  items: TodoItem[];
  addItem: () => void;
  toggleItemComplete: (index: number) => void;
  removeItem: (index: number) => void;

  static ngHooks(context: NgHooksContext<TodoComponent>): NgHooksFunctionReturn<TodoComponent> {
    const input = ref('');
    const items = ref<TodoItem[]>([]);

    const key = observe(context, (prop) => prop.key);
    const storeKey = computed(() => 'todo.' + key.value);
    const { persist } = shareStore(
      storeKey,
      (store) => {
        const { input: _input, items: _items } = store || { input: '', items: [] };
        input.value = _input;
        items.value = _items;
      },
      (store) => {
        input.value = store.input;
        items.value = store.items;
      }
    );

    function updateStore() {
      persist({ ...fromRef({ input, items }) });
    }

    function inputChange(val) {
      input.value = val;
      updateStore();
    }

    function addItem() {
      if (!input.value) return;

      items.value = items.value.concat({ text: input.value, completed: false });
      input.value = '';

      updateStore();
    }

    function toggleItemComplete(index) {
      const item = items.value[index];
      items.value = Object.assign([], items.value, { [index]: { ...item, completed: !item.completed } });

      updateStore();
    }

    function removeItem(index) {
      const _items = [...items.value];
      _items.splice(index, 1);
      items.value = _items;

      updateStore();
    }

    return { input, inputChange, items, addItem, toggleItemComplete, removeItem };
  }
}

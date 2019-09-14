import { computed, createProvider, fromRef, ref, RefDict } from 'ngx-hooks';
import { shareStore } from './share-store';

export interface TodoItem {
  text: string;
  completed: boolean;
}

export const [TodoService, TodoServiceProvider] = createProvider('Todo', () => {
  const items = ref([] as TodoItem[]);

  const key = ref('');
  let externalUpdate;
  const storeKey = computed(() => 'todo' + (key.value ? '.' + key.value : ''));
  const { persist } = shareStore(storeKey, onUpdate, (store) => {
    const _store = store || { items: [] };
    onUpdate(_store);
  });

  function onUpdate({ items: _items, ...extra }) {
    items.value = _items;
    externalUpdate && externalUpdate(extra);
  }

  function updateStore(extra?: RefDict) {
    persist({ ...fromRef(Object.assign({ items }, extra)) });
  }

  return {
    items,
    addItem(text: string) {
      items.value = items.value.concat({ text, completed: false });
      updateStore();
    },
    toggleItemComplete(index: number) {
      items.value = items.value.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return { ...item, completed: !item.completed };
      });
      updateStore();
    },
    removeItem(index: number) {
      items.value = items.value.filter((item, itemIndex) => itemIndex !== index);
      updateStore();
    },
    setPersist(_key: string, onUpdate: (...args) => void) {
      key.value = _key;
      externalUpdate = onUpdate;
      return updateStore;
    },
  };
});

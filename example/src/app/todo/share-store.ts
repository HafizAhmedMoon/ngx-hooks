import { ref, Ref, watch } from 'ngx-hooks';
import { Subject } from 'rxjs';

const storeSubject = new Subject<{ id: number; key: string; store: any }>();
export function shareStore<T = any>(key: Ref<string>, onStore?: (store: T) => void, onUpdate?: (store: T) => void) {
  const id = Math.random();
  const store = ref<T>();

  watch(
    key,
    (key, o, cleanup) => {
      let storedData = getStoreItem(key);
      store.value = storedData;
      onStore && onStore(storedData);

      const subscription = storeSubject.subscribe((obj) => {
        if (id !== obj.id && obj.key === key) {
          store.value = obj.store;
          onUpdate && onUpdate(obj.store);
        }
      });

      cleanup(() => {
        subscription.unsubscribe();
      });
    },
    { mode: 'sync' }
  );

  return {
    store,
    persist(val: T) {
      store.value = val;
      storeSubject.next({ id, key: key.value, store: val });
      setStoreItem(key.value, val);
    },
  };
}

function getStoreItem(key: string) {
  let item: any = localStorage.getItem(key);
  try {
    item = JSON.parse(item);
  } catch (e) {}

  return item;
}
function setStoreItem(key: string, item) {
  try {
    item = JSON.stringify(item) as any;
  } catch (e) {}

  localStorage.setItem(key, item as any);
}

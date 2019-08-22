export interface Ref<T> {
  value: T;
}

export interface GetterSetter<T> {
  get(): T;
  set?(value: T): void;
}

type Getter<T> = GetterSetter<T>['get'];

export function computed<T>(getter: Getter<T>): Ref<T>;
export function computed<T>(options: GetterSetter<T>): Ref<T>;
export function computed<T>(obj: Getter<T> | GetterSetter<T>): Ref<T> {
  if (typeof obj === 'function') {
    obj = { get: obj };
  }
  return Object.create(Object.create(null), {
    value: {
      get: obj.get,
      set: obj.set || (() => undefined),
      configurable: false,
    },
  });
}

export function ref<T>(value?: T): Ref<T> {
  return computed({ get: () => value, set: (val: T) => (value = val) });
}

export function isRef(ref): ref is Ref<any> {
  return typeof ref === 'object' && 'value' in ref;
}

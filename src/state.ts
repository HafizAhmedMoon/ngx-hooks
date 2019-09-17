import { Subject } from 'rxjs';
import { createInternalRefsStream, createPropMap, getPropertyDescriptor } from './helpers';
import { onDestroy } from './lifecycle';

export interface InternalRef<T = any> extends Ref<T> {
  __value: T;
  __updates: Subject<void>;
}

export interface GetterSetter<T> {
  get(): T;
  set?(value: T): void;
}

type Getter<T> = GetterSetter<T>['get'];
type Setter<T> = GetterSetter<T>['set'];

export function computed<T>(getter: Getter<T>, setter?: Setter<T>): Ref<T>;
export function computed<T>(options: GetterSetter<T>): Ref<T>;
export function computed<T>(fnOrObj: Getter<T> | GetterSetter<T>, setter?: Setter<T>): Ref<T> {
  let _getter,
    _setter,
    internalRefs: InternalRef[] = [];
  if (typeof fnOrObj === 'function') {
    _getter = fnOrObj;
    _setter = setter;
  } else {
    _getter = fnOrObj.get;
    _setter = fnOrObj.set;
  }

  let hasUpdate = false;
  let val = collectRefs(internalRefs, _getter);

  const subscription = createInternalRefsStream(internalRefs).subscribe(() => {
    hasUpdate = true;
    ref.__updates.next();
  });
  onDestroy(() => subscription.unsubscribe());

  const valueGetter = () => {
    if (hasUpdate) {
      val = _getter();
      hasUpdate = false;
    }
    return val;
  };

  const valueSetter = (newVal) => {
    if (!_setter) return;

    const doUpdate = () => {
      _setter(newVal);
      hasUpdate = true;
      ref.__updates.next();
    };

    if (_scheduleRefUpdates) {
      _scheduleRefUpdates.push(doUpdate);
    } else {
      doUpdate();
    }
  };

  const ref: InternalRef = Object.create(Object.create(null), {
    value: {
      get: () => {
        addRefs(ref);
        return valueGetter();
      },
      set: valueSetter,
      configurable: false,
    },
    __value: {
      get: valueGetter,
      configurable: false,
    },
    __updates: {
      value: new Subject<void>(),
      configurable: false,
    },
    __ref__: {
      configurable: false,
    },
  });

  return ref;
}

export function observe<T extends object, K extends keyof T>(
  obj: T,
  pickFn: (prop: { [P in keyof T]: P }) => K,
  notify?: (prop: K) => void
) {
  const key = pickFn(createPropMap(obj));
  let valueRef: Ref<T[K]>;

  const ownPropertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);
  const propertyDescriptor = getPropertyDescriptor(obj, key, ownPropertyDescriptor);
  let isExtensible = Object.isExtensible(obj);

  if (isExtensible && (!ownPropertyDescriptor || !propertyDescriptor || propertyDescriptor.configurable)) {
    if (!propertyDescriptor || Object.prototype.hasOwnProperty.call(propertyDescriptor, 'value')) {
      valueRef = ref(obj[key]);
    } else {
      valueRef = computed(() => propertyDescriptor.get.call(obj), (val) => propertyDescriptor.set.call(obj, val));
    }

    Object.defineProperty(obj, key, {
      get() {
        return valueRef.value;
      },
      set(value) {
        valueRef.value = value;
        notify && notify(key);
      },
      configurable: true,
    });
  } else {
    valueRef = computed(() => obj[key]);
    console.warn("NgxHooks: property can't be observe", 'obj:', obj, 'key:', key);
  }

  return valueRef;
}

export interface Ref<T> {
  value: T;
}
export type RefDict<T = {}> = { [K in keyof T]: Ref<T[K]> | T[K] };

export function ref<T = any>(value?: T): Ref<T> {
  return computed({ get: () => value, set: (val: T) => (value = val) });
}

export function isRef(ref): ref is Ref<any> {
  return ref != null && Object.prototype.hasOwnProperty.call(ref, '__ref__');
}

export function fromRef<R extends Ref<any> | RefDict<any>>(
  ref: R
): R extends Ref<infer V> ? V : R extends RefDict<infer V> ? V : never {
  if (isRef(ref)) {
    return ref.value;
  }

  if (typeof ref === 'object' && ref != null) {
    if (Array.isArray(ref)) {
      return ref.map((ref) => fromRef(ref)) as any;
    }
    const obj = {};
    Object.keys(ref).forEach((key) => {
      obj[key] = fromRef(ref[key]);
    });
    return obj as any;
  }
}

let refsAccumulator: Ref<any>[] = null;
let collectRefsNotifier: () => void = null;

function addRefs(ref) {
  if (refsAccumulator) {
    refsAccumulator.push(ref);
    collectRefsNotifier && collectRefsNotifier();
  }
}

export function collectRefs<T>(refs: any[], fn: () => T, notify?: () => void) {
  collectRefsNotifier = notify;
  refsAccumulator = refs;

  const val = fn();

  collectRefsNotifier = null;
  refsAccumulator = null;

  return val;
}

let _scheduleRefUpdates: (() => void)[] = null;
export function scheduleRefsUpdates(fn: () => void, scheduler: (cb: () => void) => void = setTimeout as any) {
  const refUpdateQue = (_scheduleRefUpdates = []);
  const val = fn();
  _scheduleRefUpdates = null;

  scheduler(() => {
    refUpdateQue.forEach((updateRef) => updateRef());
  });

  return val;
}

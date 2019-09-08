import { combineLatest, Subject } from 'rxjs';
import { skip, startWith } from 'rxjs/operators';

export function createInternalRefsStream<T extends { __updates: Subject<any> }[]>(internalRefs: T) {
  return combineLatest(internalRefs.map((internalRef) => internalRef.__updates.pipe(startWith(-1)))).pipe(skip(1));
}

export function getPropertyDescriptor<T>(
  obj: T,
  prop: keyof T,
  ownPropertyDescriptor?: PropertyDescriptor
): PropertyDescriptor | undefined {
  if (obj == null) return;
  const propertyDescriptor = ownPropertyDescriptor || Object.getOwnPropertyDescriptor(obj, prop);
  return propertyDescriptor ? propertyDescriptor : getPropertyDescriptor(Object.getPrototypeOf(obj), prop);
}

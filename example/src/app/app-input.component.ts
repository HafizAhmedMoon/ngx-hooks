import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FunctionComponent, NgHooksContext, NgHooksReturn, ref } from 'ngx-hooks';

@Component({
  selector: 'app-input',
  template: `
    Control Value Accessor: <input type="text" [value]="value" (input)="onChangeValue($event.target.value)" />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true }],
})
@FunctionComponent()
export class InputComponent {
  value: string;
  onChangeValue: (val) => void;

  static ngHooks(context: NgHooksContext<InputComponent>): NgHooksReturn<InputComponent & ControlValueAccessor> {
    const value = ref('');
    return {
      value,
      ...useControlValueAccessor<string>((val) => (value.value = val), (fn) => (context.onChangeValue = fn)),
    };
  }
}

function useControlValueAccessor<T>(
  writeValue = (val: T) => {},
  registerOnChange = (fn: (val: T) => void) => {},
  registerOnTouched = (fn: () => void) => {}
) {
  return {
    writeValue,
    registerOnChange,
    registerOnTouched,
  };
}

import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FunctionComponent, NgHooksContext, NgHooksReturn, ref, composeLifecycle } from 'ngx-hooks';

const { OnWriteValue, OnRegisterOnChange, OnRegisterOnTouched, OnSetDisabledState } = createControlValueAccessor<
  string
>();

@Component({
  selector: 'app-input',
  template: `
    Control Value Accessor: <input type="text" [value]="value" (input)="onChangeValue($event.target.value)" />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true }],
})
@FunctionComponent({ lifecycle: [OnWriteValue, OnRegisterOnChange, OnRegisterOnTouched, OnSetDisabledState] })
export class InputComponent {
  value: string;
  onChangeValue: (val) => void;

  static ngHooks(context: NgHooksContext<InputComponent>): NgHooksReturn<InputComponent & ControlValueAccessor> {
    const { value, onChangeValue } = valueController();
    return {
      value,
      onChangeValue,
    };
  }
}

function valueController() {
  const value = ref('');
  const onChangeValue = ref();
  OnWriteValue((_val) => {
    value.value = _val;
  });
  OnRegisterOnChange((fn) => {
    onChangeValue.value = fn;
  });
  return { value, onChangeValue };
}

function createControlValueAccessor<T>() {
  return {
    OnWriteValue: composeLifecycle<(value: T) => void>('writeValue'),
    OnRegisterOnChange: composeLifecycle<(fn: (value: T) => void) => void>('registerOnChange'),
    OnRegisterOnTouched: composeLifecycle<() => void>('registerOnTouched'),
    OnSetDisabledState: composeLifecycle<(isDisabled: boolean) => void>('setDisabledState'),
  };
}

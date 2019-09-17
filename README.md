<div align="center">

<h1>Ngx Hooks</h1>

<p>Function APIs for Angular to create component, directive and service using function composition api in declarative way, inspired by Vue Function APIs and React Hooks.</p>

</div>

:warning: **WARNING:** _It only works with Angular version >=8.x.x with Ivy render enabled (doesn't work with aot build of old compiler)._

<hr/>

[![version][version-badge]][package]
[![MIT License][license-badge]][license]

## Table of Contents

- [Why Function APIs?](#why-function-apis)
- [Installation](#installation)
- [Component](#component)
- [Directive](#directive)
- [ref](#ref)
- [computed](#computed)
- [observe](#observe)
- [License](#license)
- [FAQs](#faqs)

<!--
- [watch](#watch)
- [inject](#inject)
- [createProvider](#createprovider)
- [Helpers](#helpers)
  - [fromRef](#fromref)
  - [composeLifecycle](#composelifecycle)
- [Usage](#usage)
- Advance Usage
-->

## Why Function APIs?

- Declarative way to write Angular Components, Directives and Services
- Reuse same functions between different components
- Easy to split up functionality into functions of large component without creating unnecessarily more components.
- Encourages to write implementation detail free tests

## Installation

This library is distributed via [npm] which is bundled with [node]:

```
npm install --save ngx-hooks
```

This library has `@angular/core` and `rxjs` as `peerDependencies`.

## Component

Simple usage of function component

```typescript
import { Component } from '@angular/core';
import { FunctionComponent, NgHooksContext, ref } from 'ngx-hooks';

@Component({
  selector: 'app-component',
  template: '<h1>{{title}}</h1>',
})
@FunctionComponent() // <- to make Function Component
class AppComponent {
  title: string;

  // required by @FunctionComponent() and must be static
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const title = ref('Angular Function APIs');
    return { title };
  }
}
```

## Directive

Simple usage of a function directive which highlights a text with yellow color

```typescript
import { Directive, ElementRef, Input } from '@angular/core';
import { FunctionDirective, NgHooksContext, inject } from 'ngx-hooks';

@Directive({
  selector: '[highlight]',
})
@FunctionDirective() // <- to make Function Directive
class HighlightDirective {
  // required by @FunctionDirective() and must be static
  static ngHooks(context: NgHooksContext<HighlightDirective>) {
    const elementRef = inject(ElementRef);
    elementRef.nativeElement.style.backgroundColor = 'yellow';
  }
}
```

## `ref`

`ref()` is to creating a reactive state

```typescript
// ...
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const title = ref('Angular');

    setTimeout(() => {
      title.value = 'Angular Function API'
    }, 3000)

    return { title };
  }
// ...
```

## `computed`

`computed` takes a getter function in first argument and returns a reactive value based on computed value of different reactive value

```typescript
// ...
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const count = ref(0);
    const double = computed(() => count.value * 2)


    setInterval(() => {
      count.value++;
    }, 1000)

    return { double };
  }
// ...
```

it does also take second argument as setter which will be invoked when computed reactive value is set.

```typescript
// ...
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const count = ref(0);
    const double = computed(() => count.value * 2, (double) => count.value = double / 2);

    double.value = 1000;

    return { double };
  }
// ...
```

Note: assign computed value will not have any effect if setter is not provided

## `observe`

`observe` returns a reactive value by observing a property of different object

```typescript
// ...
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const id = observe(context, (context) => context.id);
    const currentUser = computed(() => USERS.find(user => user.id === id.value))

    return { currentUser }
  }
// ...
```

<!--
## `watch`

## `inject`

## `createProvider`

## Helpers

- ### `fromRef`

- ### `composeLifecycle`
-->

## FAQs

- **Why ngHooks method is static method?**

  To avoid confusion of `this` keyword as we restricted the usage of it.

  As we don't allow to use `this` in `ngHooks` function but if it would be a class method then `this` should be referenced to `class` instance as per semantic of Javascript.

## LICENSE

[MIT](LICENSE)

[npm]: https://www.npmjs.com
[node]: https://nodejs.org
[version-badge]: https://img.shields.io/npm/v/ngx-hooks.svg?style=flat-square
[package]: https://www.npmjs.com/package/ngx-hooks
[license-badge]: https://img.shields.io/npm/l/ngx-hooks.svg?style=flat-square
[license]: https://github.com/hafizahmedmoon/ngx-hooks/blob/master/LICENSE

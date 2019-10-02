<div align="center">

<h1>Ngx Hooks</h1>

<p>Function APIs for Angular to create component, directive and service using function composition api in declarative way, inspired by Vue Function APIs and React Hooks.</p>

</div>

:warning: **WARNING:** _It only works with Angular version >=8.x.x with Ivy render enabled (doesn't work with aot build of old compiler)._

---

[![version][version-badge]][package]
[![MIT License][license-badge]][license]

## Table of Contents

- [Why Function APIs?](#why-function-apis)
- [Installation](#installation)
- [Usage](#usage)
  - [Component](#component)
  - [Directive](#directive)
- [Lifecycle](#lifecycle)
- [ref](#ref)
- [computed](#computed)
- [observe](#observe)
- [watch](#watch)
- [inject](#inject)
- [createProvider](#createprovider)
- [Helpers](#helpers)
  - [fromRef](#fromref)
  - [composeLifecycle](#composelifecycle)
- [License](#license)
- [FAQs](#faqs)

<!--
- [Usage](#usage)
- Advance Usage
-->

## Why Function APIs?

- More declarative way to write Angular Components, Directives and Services
- Reuse same functions between different components/directives so no need to create services to splitting out methods to reduce component file or making it reusable.
- Easy to split up functionality into functions of large component without creating unnecessarily more components.
- Encourages to write implementation detail free tests

## Installation

This library is distributed via [npm] registry:

```
npm install --save ngx-hooks
```

This library has `@angular/core` and `rxjs` as `peerDependencies`.

### Typescript Configuration

This package contains _uncompiled_ typescript (.ts) files, you need to configure it manually.

To enable typescript compilation of this package along with your angular project, you need to configure source files in `tsconfig.json` like:

```json5
{
  // ...
  include: ['./node_modules/ngx-hooks/**/*.ts'],
  // ...
}
```

## Usage

### Component

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

### Directive

Simple usage of a function directive which highlights a text with yellow color

```typescript
import { Directive, ElementRef } from '@angular/core';
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

## Lifecycle

Lifecycle can be used in Function component/directives and Provider or any composed function. _It must be used in `ngHooks` function body or custom compose function body, can't be used in nested callback_

```typescript
import { onDestroy, ref } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const count = ref(0);

    const interval = setInterval(() => {
      ref.value++;
    }, 1000);

    onDestroy(() => {
      clearInterval(interval);
    });

    return { count };
  }
}
```

### Provided lifecycle:

- `onInit`
- `onDestroy`
- `onChanges`
- `onDoCheck`
- `onAfterContentInit`
- `onAfterContentChecked`
- `onAfterViewInit`
- `onAfterViewChecked`

Note: Custom lifecycle can be created via `composeLifecycle` [here](#composelifecycle)

## `ref`

`ref()` is to creating a reactive state

```typescript
import { ref } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const title = ref('Angular');

    setTimeout(() => {
      title.value = 'Angular Function API';
    }, 3000);

    return { title };
  }
}
```

## `computed`

`computed` takes a getter function in first argument and returns a _computed_ reactive value based on a getter function.

```typescript
import { computed, ref } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const count = ref(0);
    const double = computed(() => count.value * 2);

    setInterval(() => {
      count.value++;
    }, 1000);

    return { double };
  }
}
```

it does also take second argument as setter which will be invoked when computed reactive value is set.

```typescript
import { computed, ref } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const count = ref(0);
    const double = computed(() => count.value * 2, (double) => (count.value = double / 2));

    double.value = 1000;

    return { double };
  }
}
```

Note: assigning to a computed value will not have any effect if setter is not provided

## `observe`

`observe` returns a reactive value by observing a property of any object.

```typescript
import { observe, computed } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const id = observe(context, (context) => context.id);
    const currentUser = computed(() => USERS.find((user) => user.id === id.value));

    return { currentUser };
  }
}
```

## `watch`

It runs a watcher function when ever dependency or dependencies change. Dependency can be a reactive value or a getter function.

```typescript
import { watch, observe, ref } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const id = observe(context, (context) => context.id);
    const user = ref(null);
    watch(id, async (newId, oldId, onCleanup) => {
      const result = await fetch('some.domain.url/api/user/' + newId);
      const data = await result.json();
      user.value = data;

      onCleanup(() => {
        // cleanup functionality
      });
    });

    return { user };
  }
}
```

- ### Watching multiple sources

```typescript
import { watch, observe } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const id = observe(context, (context) => context.id);
    const params = observe(context, (context) => context.params);
    watch([id, () => params.value.user_role], ([newId, newUserRole], [oldId, oldUserRole], onCleanup) => {
      // ...
      onCleanup(() => {
        // cleanup functionality
      });
    });

    // ...
  }
}
```

### Options

`watch` takes `options` object _(optional)_ in last function parameter.

```typescript
watch(
  id,
  () => {
    // call immediately when id changes and will not call immediately
  },
  { mode: 'sync', lazy: true }
);
```

- **Watch mode:**

  By default, it flushes after content checked. this behaviour can be changed via `mode` option.

  - `sync`: flushes synchronously
  - `content`: flushes after content checked _(default)_
  - `view`: flushes after view checked

- **Lazy Watch:**

  When lazy is `true`, watcher function will not run immediately. _(default is `false`)_

Note: `watch` fallbacks to `sync` mode if it is used in [`createProvider`](#createprovider).

## `inject`

`inject` is same as Angular's [`Injector.get`](https://angular.io/api/core/Injector#get).

```typescript
import { inject } from 'ngx-hooks';

class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const store = inject(Store);

    // do anything with store
  }
}
```

## `createProvider`

`createProvider` creates provider which can be injected in components, directives or providers. the return value must be an object.

```typescript
import { createProvider, inject } from 'ngx-hooks';

const [LogService, LogServiceProvider] = createProvider('LogService', () => {
  function log(...args) {
    console.log('Log:', ...args);
  }
  return { log };
});

@Component({
  // ...
  providers: [LogServiceProvider],
})
@FunctionComponent()
class AppComponent {
  static ngHooks(context: NgHooksContext<AppComponent>) {
    const logService = inject(LogService);

    logService.log('log some useful stuff');
  }
}
```

- **Usage with object destructuring:**

  ```typescript
  import { createProvider } from 'ngx-hooks';

  const { token: LogService, provider: LogServiceProvider } = createProvider('LogService', () => {
    // ...
  });
  ```

- **Usage with `providedIn`:**

  `providedIn` is `root` by default

  ```typescript
  import { createProvider } from 'ngx-hooks';

  const { token: LogService, provider: LogServiceProvider } = createProvider('LogService', {
    providedIn: AppModule,
    factory: () => {
      // ...
    },
  });
  ```

Note: In provider, only `onDestroy` lifecycle can be used other lifecycle will have no effects.

## Helpers

- ### `composeLifecycle`

  it can be use to compose custom lifecycle which give can be used in composed functions as well.

  ```typescript
  import { composeLifecycle } from 'ngx-hooks';

  const onWriteValue = composeLifecycle<(value: string) => void>('writeValue');

  @Component({
    // ...
  })
  @FunctionComponent({
    lifecycle: [onWriteValue],
  })
  class AppComponent {
    static ngHooks(context: NgHooksContext<AppComponent>) {
      onWriteValue((value) => {
        // do something with value
      });
    }
  }
  ```

- ### `fromRef`

  it can be used to un-wrap ref or Object/Array of refs deeply

  ```typescript
  import { fromRef, ref } from 'ngx-hooks';

  const id = ref('001');
  fromRef(id); // '001'

  const refsArray = [ref(1), ref(2)];
  fromRef(refsArray); // [1, 2];

  const refMap = {
    ref1: ref('value1'),
    deep: {
      nestedRef: ref('value2'),
    },
  };
  fromRef(refMap); // {ref1: 'value1', deep: {nestedRef: 'value2'}}
  ```

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

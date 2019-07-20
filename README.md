# light-coroutine-typescript

"light-coroutine-typescript" is a coroutine library for TypeScript and JavaScript.

## Examples

### TypeScript example

```TypeScript
import { Coroutine } from "light-coroutine-typescript";

class C1 extends Coroutine {
    async run(n: number) {
        ++n;
        n = await C1.suspend(n) as number;
        ++n;
        return n;
    }
}

async function main() {
    const c = new C1();
    let n = 1;
    n = await c.resume(n) as number;
    ++n;
    n = await c.resume(n) as number;
    ++n;
    console.log(n);
}

main();
```

### JavaScript example

```JavaScript
const lc = require("light-coroutine-typescript");

class C1 extends lc.Coroutine {
    async run(n) {
        ++n;
        n = await C1.suspend(n);
        ++n;
        return n;
    }
}

async function main() {
    const c = new C1();
    let n = 1;
    n = await c.resume(n);
    ++n;
    n = await c.resume(n);
    ++n;
    console.log(n);
}

main();
```

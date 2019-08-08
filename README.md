# Configuring TypeScript Application the Third Factor Way

The [third factor](https://12factor.net/config) of [The Twelve-Factor App](https://12factor.net/) document states:

> Config: Store config in the environment.

This article explains how you can achieve this in TypeScript / NodeJS applications.

## Environment Variables

Environment variables are available in each NodeJS process. NodeJS process inherits them from the process that launched the application.

During development, these variables come from your shell session via terminal, and in production these variables come from the process supervisor (e.g. `systemd`).

You can access environment variables via built-in variable `process.env` - it is a dictionary of key/value strings.

You can see all of the variables that would be available to your process, in the current environment with the following command:

```sh
node -e 'console.log(process.env)'
```

You can also supply environment variables for each command execution by prefixing the command:

```sh
API_KEY="foo" node -e 'console.log(process.env.API_KEY)'
```

## Cross-Platform

Not every operating system (*Windows, I am looking at you!*) supports setting command-line environment variables.

Of course, the NodeJS community thought of that, and there is a module [`cross-env`](https://www.npmjs.com/package/cross-env) that solves this problem.

```sh
cross-env NODE_ENV=production node -e 'console.log(process.env.NODE_ENV)'
```

## Problems With Environment Variable Values

While you can access any variable directly via `process.env`, it is not a good idea for a few reasons.

1. There is no required variable check. If your application reads from `process.env.API_KEY` variable and you forget to set it in production - your application launches but fails when the code tries to access the non-existing variable.
2. There is no data validation. Your system may expect a valid URL and get garbage instead.
3. There is no type coercion. The values in `process.env` are **always strings**.
4. There is no IntelliSense or code completion for `process.env` keys, as the values are unknown until runtime.
5. Easy to introduce a typo, e.g. `process.env.APIKEY` instead of `process.env.API_KEY`.
6. Difficult to unit test code directly relying on `process.env`. It requires munging of the global `process.env` , which can lead to side effects.

Here is a typical mistake:

Imagine you run your application with the environment variable set to:

```sh
cross-env DESTROY_DATABASE=false node index.js
```

Your code looks like this. Do you see a problem here?

```js
// index.js

if (process.env.DESTROY_DATABASE) {
  await database.destroy()
}
```

The problem is that `process.env.DESTROY_DATABASE` is **always a string**.

The variable is set to a literal string value of `"false"`. It always evaluates to `true`.

Another common mistake may involve numbers. Guess what the output is?

```sh
cross-env COUNT=1 node -e 'console.log(process.env.COUNT + 1)'
```

Of course, it won't be `2`, as that would be too easy, right? The correct answer is `11`, because it is doing string concatenation, instead of math.

The value of the environment variable is **always a string**.

## One of the Solutions

I am going to outline one way to solve these problems, but there is more than one way.

I prefer to use the [`env-var`](https://www.npmjs.com/package/env-var) module to extract and validate the data.

However, I also do it in a way that makes it easier to stub and test the configuration.

I typically create a `config.ts` file in the project root that exports a configuration class.

First, here is a full example:

```typescript
import { from } from 'env-var'

export class Config {
  public constructor(private processEnv = process.env) {
    Object.freeze(this)
  }

  private env = from(this.processEnv)

  public readonly HOME = this.env.get('HOME').required().asString()

  public readonly DESTROY_DATABASE = this.env.get('DESTROY_DATABASE').required().asBool()

  public readonly COUNT = this.env.get('COUNT').required().asIntPositive()
}
```

Let's take break it down.

We declare a private property `processEnv` which defaults to values from `process.env`.

Have defaults allows us to construct the objects with defaults in your app code.

You'll probably use dependency injection and provide an instance of the `Config` automatically to your entire app.

```typescript
const config = new Config()
```

However, for tests, we can always override the defaults and provide our values:

```typescript
const config = new Config({ COUNT: 2 })
```

Then, we also freeze the object in the constructor, so that every instance becomes immutable.

There would be no way for you to overwrite the config object in your code accidentally.

The config should always be immutable.

The next step is to use `from` method provided by `env-var` to instantiate the `env-var` object.

Then we can declare any number of properties on the object and using a builder pattern declare all of our requirements for the given variable. 

Refer to the [documentation](https://www.npmjs.com/package/env-var) to learn about all of the possible validations. There are a lot of goodies there. You can set defaults and even decode from Base64.

This solution is entirely type-safe. You can see the code and tests in my repository.

Here is a screenshot showing how VS Code IntelliSense picks up correctly that `DESTROY_DATABASE` is a boolean.

![VS Code IntelliSense](/Users/roman/Development/experiments/typescript-12-factor/intellisense.png)

## Your Ideas

Do you have any tips and tricks for managing configuration?

Please share them in the comments below.


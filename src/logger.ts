/**
 * https://github.com/Yesterday17/node-kara-templater/blob/master/src/utils/log.ts
 *
 * MIT License
 * Copyright (c) 2019 Yesterday17
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import chalk from 'chalk'

abstract class Logger {
  protected logMain: string
  constructor(name: string) {
    this.logMain = name
  }
  abstract debug(message: string): void
  abstract info(message: string): void
  abstract warning(message: string): void
  abstract error(message: string, exit: boolean): void
  abstract success(message: string): void
}

export class ConsoleLogger extends Logger {
  constructor(name: string) {
    super(name)
  }

  debug(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray(`[${this.logMain}][DEBUG] ${message}`))
    }
  }

  info(message: string) {
    console.info(chalk.white(`[${this.logMain}][INFO] ${message}`))
  }

  warning(message: string) {
    console.warn(chalk.yellow(`[${this.logMain}][WARN] ${message}`))
  }

  error(message: string, exit = false) {
    console.info(chalk.red(`[${this.logMain}][ERROR] ${message}`))
    if (exit) {
      process.exit()
    }
  }

  success(message: string) {
    console.log(chalk.green(`[${this.logMain}][SUCCESS] ${message}`))
  }
}

export default Logger

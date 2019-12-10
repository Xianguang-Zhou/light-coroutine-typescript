/*
 * Copyright (c) 2019, Xianguang Zhou <xianguang.zhou@outlook.com>. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export enum Status {
    Created, Running, Suspended, Waiting, Dead
}

interface ResolveFunc {
    (value?: unknown | PromiseLike<unknown>): void;
}

export abstract class Coroutine {

    private static _current: Coroutine | null = null;
    private _link: Coroutine | null = null;
    private _next: ResolveFunc | null = null;
    private _status: Status = Status.Created;

    constructor() {
    }

    static async suspend(message?: unknown): Promise<unknown> {
        if (!Coroutine.suspendable()) {
            throw new Error("Not suspendable.");
        }
        return new Promise((resolve, _reject) => {
            const self = (Coroutine._current as Coroutine);
            Coroutine._current = self._link;
            if (Coroutine._current != null) {
                Coroutine._current._status = Status.Running;
            }
            self._status = Status.Suspended;
            const next = self._next;
            self._next = resolve;
            (next as ResolveFunc)(message);
        });
    }

    async resume(message?: unknown): Promise<unknown> {
        if (!this.resumable()) {
            throw new Error("Not resumable.");
        }
        return new Promise((resolve, _reject) => {
            if (Coroutine._current != null) {
                Coroutine._current._status = Status.Waiting;
            }
            this._status = Status.Running;
            if (null != this._next) {
                Coroutine._current = this;
                const next = this._next;
                this._next = resolve;
                next(message);
            } else {
                this._link = Coroutine._current;
                Coroutine._current = this;
                this._next = resolve;
                this._run(message);
            }
        });
    }

    static suspendable(): boolean {
        return Coroutine._current != null
            && Coroutine._current._status == Status.Running;
    }

    resumable(): boolean {
        return (this._status == Status.Suspended
            && this._link == Coroutine._current)
            || this._status == Status.Created;
    }

    protected abstract async run(message: unknown): Promise<unknown>;

    private async _run(message: unknown): Promise<void> {
        message = await this.run(message);
        this._status = Status.Dead;
        Coroutine._current = this._link;
        if (Coroutine._current != null) {
            Coroutine._current._status = Status.Running;
        }
        (this._next as ResolveFunc)(message);
    }

    static current(): Coroutine | null {
        return Coroutine._current;
    }

    status(): Status {
        return this._status;
    }
}

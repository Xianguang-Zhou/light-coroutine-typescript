/*
 * Copyright (c) 2019, Xianguang Zhou <xianguang.zhou@outlook.com>. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
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

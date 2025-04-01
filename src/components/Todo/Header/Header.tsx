/* eslint-disable no-console */
import React, { FormEvent, useEffect, useMemo, useRef } from 'react';
import { Todo } from '../../../types/Todo';
import classNames from 'classnames';
import { TodoCreateHandler, TodoToggleAll } from '../../../types/TodoMethods';
import { NetworkStatus } from '../../../types/AppNetworkStatus';

type Props = {
  todos: Todo[];
  onAddTodo: TodoCreateHandler;
  creationStatus: NetworkStatus;
  onToggleAll: TodoToggleAll;
};

export const TodoHeader: React.FC<Props> = React.memo(
  ({ todos, onAddTodo, creationStatus, onToggleAll }) => {
    const allActive = useMemo(
      () => todos?.every(todo => todo.completed) || false,
      [todos],
    );
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (creationStatus === NetworkStatus.Idle) {
        if (titleInputRef?.current) {
          titleInputRef.current.value = '';
        }
      }

      titleInputRef?.current?.focus();
    }, [creationStatus]);

    const handleSubmitForm = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onAddTodo(titleInputRef?.current?.value || '');
    };

    return (
      <header className="todoapp__header">
        {todos.length > 0 && (
          <button
            type="button"
            className={classNames('todoapp__toggle-all', {
              active: allActive,
            })}
            data-cy="ToggleAllButton"
            onClick={onToggleAll}
          />
        )}

        <form onSubmit={handleSubmitForm}>
          <input
            data-cy="NewTodoField"
            type="text"
            className="todoapp__new-todo"
            placeholder="What needs to be done?"
            ref={titleInputRef}
            disabled={creationStatus === NetworkStatus.Sending}
          />
        </form>
      </header>
    );
  },
);

TodoHeader.displayName = 'TodoHeader';

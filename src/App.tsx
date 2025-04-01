/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Todo } from './types/Todo';
import { TodoHeader } from './components/Todo/Header/Header';
import { TodoList } from './components/Todo/List/List';
import { ErrorMessageComponent } from './components/ErrorMessage/ErrorMessage';
import { TodoFooter } from './components/Todo/Footer/Footer';
import { FilterOption } from './types/FilterOptions';
import { ErrorType as ErrorMessage } from './types/ErrorTypes';
import {
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
import { NetworkStatus } from './types/AppNetworkStatus';
import { getInitialFilterFromHash } from './utils/getUrlHash';

const prepareTodos = (list: Todo[], filterBy: FilterOption) => {
  let copy = [...list];

  if (filterBy !== FilterOption.ALL) {
    copy = copy.filter(todo => {
      switch (filterBy) {
        case FilterOption.ACTIVE: {
          return !todo.completed;
        }

        case FilterOption.COMPLETED: {
          return todo.completed;
        }

        default: {
          return true;
        }
      }
    });
  }

  return copy;
};

export const App: React.FC = () => {
  // #region states
  const [filterBy, setFilterBy] = useState<FilterOption>(
    getInitialFilterFromHash(),
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState(ErrorMessage.NO_ERROR);
  const [networkTodoStatus, setNetworkTodoStatus] = useState(
    NetworkStatus.Idle,
  );
  const [temporaryTodo, setTemporaryTodo] = useState<Todo | null>(null);

  const [todoIdsInProcess, setTodoIdsInProcess] = useState<number[]>([]);
  // #endregion

  // #region handlers
  const handleFilterChange = useCallback((newType: FilterOption) => {
    setFilterBy(newType);
  }, []);

  const handleAddTodo = useCallback(async (todoTitle: string) => {
    const sanitizedTitle = todoTitle.trim();

    if (!sanitizedTitle) {
      setErrorMessage(ErrorMessage.EMPTY_TITLE);

      return;
    }

    const newTodo: Todo = {
      id: 0,
      title: sanitizedTitle,
      completed: false,
      userId: USER_ID,
    };

    setNetworkTodoStatus(NetworkStatus.Sending);
    setTemporaryTodo(newTodo);

    try {
      const response: Todo = await addTodo(newTodo);

      setTodos(current => [...current, response]);
      setNetworkTodoStatus(NetworkStatus.Idle);
    } catch (error) {
      setErrorMessage(ErrorMessage.FAIL_CREATING);
      setNetworkTodoStatus(NetworkStatus.Error);
    } finally {
      setTemporaryTodo(null);
    }
  }, []);

  const handleDeleteTodos = useCallback(async (...ids: number[]) => {
    setTodoIdsInProcess(current => [...current, ...ids]);
    setNetworkTodoStatus(NetworkStatus.Deleting);

    try {
      const results = await Promise.allSettled(ids.map(id => deleteTodo(id)));

      const successfullyDeleted = ids.filter(
        (_, index) => results[index].status === 'fulfilled',
      );

      setTodos(current =>
        current.filter(todo => !successfullyDeleted.includes(todo.id)),
      );

      const failedToDelete = ids.length - successfullyDeleted.length;

      if (failedToDelete > 0) {
        setErrorMessage(ErrorMessage.FAIL_DELETING);
      }
    } finally {
      setTodoIdsInProcess(current => current.filter(id => !ids.includes(id)));
    }
  }, []);

  const handleDeleteCompleted = useCallback(async () => {
    const ids = todos.filter(todo => todo.completed).map(todo => todo.id);

    handleDeleteTodos(...ids);
  }, [todos, handleDeleteTodos]);

  const handleUpdateTodos = useCallback(
    async (dataToPatch: Partial<Todo>, ...list: Todo[]) => {
      const ids = list.map(todo => todo.id);

      setTodoIdsInProcess(current => [...current, ...ids]);

      try {
        const updatedTodos = list.map(todo => ({
          ...todo,
          ...dataToPatch,
        }));

        const results = await Promise.allSettled(updatedTodos.map(updateTodo));

        const successfullyUpdated = results
          .filter(res => res.status === 'fulfilled')
          .map(res => res.value);

        setTodos(prevTodos =>
          prevTodos.map(
            todo =>
              successfullyUpdated.find(
                updatedTodo => updatedTodo.id === todo.id,
              ) || todo,
          ),
        );

        const hasUnsuccess = list.length - successfullyUpdated.length;

        if (hasUnsuccess) {
          setErrorMessage(ErrorMessage.FAIL_UPDATING);
        }
      } finally {
        setTodoIdsInProcess(current => current.filter(id => !ids.includes(id)));
      }
    },
    [],
  );

  const handleToggleAllTodos = () => {
    const allCompleted = todos.every(todo => todo.completed);

    const todosToToggle = allCompleted
      ? todos
      : todos.filter(todo => !todo.completed);

    handleUpdateTodos({ completed: !allCompleted }, ...todosToToggle);
  };

  // God bless whoever decided that this could be nice idea to make so many conditions for a part 3 task (specifically 'should stay open' etc.)
  const handleRenameTodo = useCallback(
    async (todoToUpdate: Todo, newTitle: Todo['title']) => {
      if (!newTitle) {
        try {
          await deleteTodo(todoToUpdate.id);

          setTodos(prev => prev.filter(todo => todo.id !== todoToUpdate.id));
        } catch (error) {
          setErrorMessage(ErrorMessage.FAIL_DELETING);
          throw error;
        }
      }

      try {
        const result = await updateTodo({ ...todoToUpdate, title: newTitle });

        setTodos(current => {
          const copy = [...current];
          const targetIndex = copy.findIndex(todo => todo.id === result.id);

          copy.splice(targetIndex, 1, result);

          return copy;
        });
      } catch (error) {
        setErrorMessage(ErrorMessage.FAIL_UPDATING);
        throw error;
      }
    },
    [],
  );

  const handleClearError = useCallback(
    () => setErrorMessage(ErrorMessage.NO_ERROR),
    [],
  );
  // #endregion

  // #region useEffects
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const result = await getTodos();

        setTodos(result);
        setErrorMessage(ErrorMessage.NO_ERROR);
      } catch (error) {
        setErrorMessage(ErrorMessage.FAIL_LOADING);
      }
    };

    fetchTodos();
  }, []);

  // #endregion

  const visibleTodos = useMemo(
    () => prepareTodos(todos, filterBy),
    [todos, filterBy],
  );

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <TodoHeader
          todos={todos}
          onAddTodo={handleAddTodo}
          creationStatus={networkTodoStatus}
          onToggleAll={handleToggleAllTodos}
        />
        <TodoList
          todos={visibleTodos}
          todoIdsInProcess={todoIdsInProcess}
          temporaryTodo={temporaryTodo}
          onTodoRemove={handleDeleteTodos}
          onTodoToggle={handleUpdateTodos}
          onTodoRename={handleRenameTodo}
        />
        {todos.length > 0 && (
          <TodoFooter
            filterBy={filterBy}
            onFilterChange={handleFilterChange}
            todos={todos}
            onDeleteCompleted={handleDeleteCompleted}
          />
        )}
      </div>

      <ErrorMessageComponent
        message={errorMessage}
        onErrorHide={handleClearError}
      />
    </div>
  );
};

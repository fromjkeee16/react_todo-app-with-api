/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useCallback, useEffect, useState } from 'react';
import { Todo } from '../../../types/Todo';
import classNames from 'classnames';
import {
  TodoRemoveHandler,
  TodoRename,
  TodoUpdate,
} from '../../../types/TodoMethods';

type Props = {
  todo: Todo;
  isLoading: boolean;
  onRemove?: TodoRemoveHandler;
  onToggle?: TodoUpdate;
  onRename?: TodoRename;
};
export const TodoItem: React.FC<Props> = React.memo(
  ({ todo, isLoading, onRemove, onToggle, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const handleTitleDoubleClick = () => {
      setIsEditing(true);
      setEditedTitle(todo.title);
    };

    const handleFormSubmit = useCallback(
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const newTitle = editedTitle.trim();

        if (newTitle === todo.title) {
          setIsEditing(false);

          return;
        }

        if (onRename) {
          setIsProcessing(true);
          try {
            await onRename(todo, newTitle);
            setIsEditing(false);
          } finally {
            setIsProcessing(false);
          }
        }
      },
      [editedTitle, onRename, todo],
    );

    const handleRemoveTodo = useCallback(() => {
      if (onRemove) {
        onRemove(todo.id);
      }
    }, [onRemove, todo.id]);

    const handleUpdateTodo = useCallback(() => {
      if (onToggle) {
        onToggle({ completed: !todo.completed }, todo);
      }
    }, [onToggle, todo]);

    useEffect(() => {
      const handleEscapePress = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsEditing(false);
        }
      };

      document.addEventListener('keydown', handleEscapePress);

      return () => {
        document.removeEventListener('keydown', handleEscapePress);
      };
    }, []);

    return (
      <div
        data-cy="Todo"
        className={classNames('todo', {
          completed: todo.completed,
        })}
        key={todo.id}
      >
        <label className="todo__status-label">
          <input
            data-cy="TodoStatus"
            type="checkbox"
            className="todo__status"
            checked={todo.completed}
            onChange={handleUpdateTodo}
          />
        </label>

        {isEditing ? (
          <form onSubmit={handleFormSubmit} onBlur={handleFormSubmit}>
            <input
              data-cy="TodoTitleField"
              type="text"
              className="todo__title-field"
              placeholder="Leave empty to delete this todo..."
              onChange={event => setEditedTitle(event.target.value)}
              value={editedTitle}
              autoFocus
            />
          </form>
        ) : (
          <>
            <span
              data-cy="TodoTitle"
              className="todo__title"
              onDoubleClick={handleTitleDoubleClick}
            >
              {todo.title}
            </span>

            <button
              type="button"
              className="todo__remove"
              data-cy="TodoDelete"
              onClick={handleRemoveTodo}
            >
              ×
            </button>
          </>
        )}

        <div
          data-cy="TodoLoader"
          className={classNames('modal', 'overlay', {
            'is-active': isLoading || isProcessing,
          })}
        >
          <div className="modal-background has-background-white-ter" />
          <div className="loader" />
        </div>
      </div>
    );
  },
);

TodoItem.displayName = 'TodoItem';

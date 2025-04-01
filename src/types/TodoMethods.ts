import { Todo } from './Todo';

export type TodoRemoveHandler = (...ids: number[]) => void;
export type TodoCreateHandler = (title: string) => void;
export type TodoRemoveCompletedHandler = () => void;
export type TodoToggleAll = () => void;
export type TodoUpdate = (newData: Partial<Todo>, todo: Todo) => Promise<void>;
export type TodoRename = (todo: Todo, newTitle: Todo['title']) => Promise<void>;

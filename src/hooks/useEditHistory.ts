import { useState } from 'react';
import {
  recordEdit,
  undoEdit,
  type EditInfo,
  type Profile,
} from '../domain/library';

type UpdateProfile = (
  id: string,
  transform: (profile: Profile) => Profile,
) => void;

/**
 * Undo uses the persisted profile history; redo is kept for the session only,
 * per profile, and is cleared by any new edit.
 */
export function useEditHistory(profile: Profile, updateProfile: UpdateProfile) {
  const [redoStacks, setRedoStacks] = useState<Record<string, string[]>>({});
  const redoStack = redoStacks[profile.id] ?? [];
  const setRedoStack = (stack: string[]) =>
    setRedoStacks((stacks) => ({ ...stacks, [profile.id]: stack }));

  const edit = (content: string, info: EditInfo = { change: 'edit' }) => {
    if (content === profile.content) return;
    updateProfile(profile.id, (current) => recordEdit(current, content, info));
    setRedoStack([]);
  };
  const undo = () => {
    if (!profile.history.length) return;
    setRedoStack([profile.content, ...redoStack]);
    updateProfile(profile.id, undoEdit);
  };
  const redo = () => {
    const [next, ...rest] = redoStack;
    if (next === undefined) return;
    updateProfile(profile.id, (current) =>
      recordEdit(current, next, { change: 'redo' }),
    );
    setRedoStack(rest);
  };
  return {
    edit,
    undo,
    redo,
    canUndo: profile.history.length > 0,
    canRedo: redoStack.length > 0,
  };
}

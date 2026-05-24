export const SAVE_KEY = 'vltk_gemini_save_v1';

export const saveGame = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, serializedState);
  } catch (e) {
    console.error("Could not save game", e);
  }
};

export const loadGame = (): any | null => {
  try {
    const serializedState = localStorage.getItem(SAVE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.error("Could not load game", e);
    return null;
  }
};

export const clearGameSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error("Could not clear save", e);
  }
};

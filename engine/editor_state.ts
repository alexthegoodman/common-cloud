import { SavedState } from "./animations";

export default class EditorState {
  selected_polygon_id: string = "";
  savedState: SavedState;

  constructor(savedState: SavedState) {
    this.savedState = savedState;
  }
}

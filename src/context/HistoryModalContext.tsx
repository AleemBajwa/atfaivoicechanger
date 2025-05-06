import { createContext } from "react";
export const HistoryModalContext = createContext<{open: boolean, setOpen: (v: boolean) => void}>({open: false, setOpen: () => {}}); 
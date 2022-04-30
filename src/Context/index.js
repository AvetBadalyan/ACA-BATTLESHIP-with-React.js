import { createContext, useContext } from "react";
import { defaultState } from "../State/State";

const Context = createContext(defaultState);

const useGameContext = () => useContext(Context);

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
};

export { Provider, useGameContext, useContext };

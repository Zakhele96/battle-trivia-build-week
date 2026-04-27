import { createContext, useContext, useMemo, useState } from "react";

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const [updateRegistration, setUpdateRegistration] = useState(null);

  const value = useMemo(
    () => ({
      updateRegistration,
      setUpdateRegistration,
      hasUpdateReady: Boolean(updateRegistration?.waiting),
    }),
    [updateRegistration]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  return useContext(PwaContext);
}

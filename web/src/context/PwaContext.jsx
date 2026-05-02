import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { registerServiceWorker } from "../pwa/registerServiceWorker";

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const [updateRegistration, setUpdateRegistration] = useState(null);

  useEffect(() => {
    registerServiceWorker(setUpdateRegistration);
  }, []);

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

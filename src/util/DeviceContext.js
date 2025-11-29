import { createContext, useContext, useEffect, useState } from "react";

const DeviceContext = createContext();

export let isMobile = false;

export function DeviceProvider({ children }) {
  const [mobileState, setMobileState] = useState(isMobile);

  useEffect(() => {
    const checkMobile = () => {
      const value = window.innerWidth <= 600 || window.innerHeight <= 600;
      setMobileState(value);
      isMobile = value;
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <DeviceContext.Provider value={{ isMobile: mobileState }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceContext);
}

import { useMemo, useState } from "react";

const useUserSigner = (injectedProvider, localProvider) => {
  const [signer, setSigner] = useState();

  useMemo(() => {
    if (injectedProvider) {
      console.log("🦊 Using injected provider");
      const injectedSigner = injectedProvider._isProvider ? injectedProvider.getSigner() : injectedProvider;
      setSigner(injectedSigner);
    } else if (!localProvider) setSigner();
  }, [injectedProvider, localProvider]);

  return signer;
};

export default useUserSigner;

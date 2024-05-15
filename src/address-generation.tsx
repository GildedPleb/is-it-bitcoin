// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable security/detect-object-injection */
import "react-toastify/dist/ReactToastify.css";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  checkAddressHistory,
  generateP2PKHAddresses,
  generateP2SHP2WPKHAddresses,
  generateP2WPKHAddresses,
} from "./bip-39";

interface SeedProperties {
  active: string;
}

interface SeedResult {
  balance: number;
  hasHistory: boolean;
}

type AddressType = "P2PKH" | "P2SHP2WPKH" | "P2WPKH";

const counts = (count: number): string => `Count: ${count.toLocaleString()}`;

const handleCopy = (textToCopy: string) => () => {
  try {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() =>
        toast.success(`"${textToCopy}" Copied to clipboard!`, {
          autoClose: 2000,
          closeOnClick: true,
          draggable: true,
          hideProgressBar: true,
          pauseOnHover: true,
          position: "top-right",
          progress: undefined,
          theme: "dark",
        }),
      )
      .catch(console.error);
  } catch {
    toast.error("Failed to copy!", {
      autoClose: 2000,
      closeOnClick: true,
      draggable: true,
      hideProgressBar: true,
      pauseOnHover: true,
      position: "bottom-center",
      progress: undefined,
      theme: "light",
    });
  }
};

const AddressGenerator: React.FC<SeedProperties> = ({ active }) => {
  const [addresses, setAddresses] = useState<{
    P2PKH: string[];
    P2SHP2WPKH: string[];
    P2WPKH: string[];
  }>({ P2PKH: [], P2SHP2WPKH: [], P2WPKH: [] });

  const [addressResults, setAddressResults] = useState<
    Record<string, SeedResult | undefined>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState<number>(0);
  const generatingReference = useRef<boolean>(false);
  const processKey = useRef<string>("");
  const [startedOnce, setStartedOnce] = useState<boolean>(false);

  const waitWhilePaused = async (): Promise<void> => {
    while (!generatingReference.current)
      await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const processNextAddress = useCallback(
    async (
      addressType: AddressType,
      generator: Generator<string, void, undefined>,
    ) => {
      const currentProcessKey = processKey.current;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        if (currentProcessKey !== processKey.current) return;
        if (!generatingReference.current) await waitWhilePaused();

        const { done, value } = generator.next();
        if (done !== undefined && done) break;
        if (value === "") break;
        const [hasHistory, balance] = await checkAddressHistory(value);
        if (currentProcessKey === processKey.current) {
          setAddresses((previous) => ({
            ...previous,
            [addressType]: [...new Set([...previous[addressType], value])],
          }));
          setAddressResults((previous) => ({
            ...previous,
            [value]: { balance, hasHistory },
          }));

          setCount((previous) => previous + 1);
        }
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      setIsGenerating(false);
    },
    [],
  );

  const startGenerating = useCallback(() => {
    generatingReference.current = true;
    setIsGenerating(true);
    if (!startedOnce) {
      processNextAddress("P2PKH", generateP2PKHAddresses(active)).catch(
        console.error,
      );
      processNextAddress(
        "P2SHP2WPKH",
        generateP2SHP2WPKHAddresses(active),
      ).catch(console.error);
      processNextAddress("P2WPKH", generateP2WPKHAddresses(active)).catch(
        console.error,
      );
    }
  }, [startedOnce, processNextAddress, active]);

  const stopGenerating = useCallback(() => {
    generatingReference.current = false;
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    if (count === 300 && isGenerating) stopGenerating();
    // disabled because we do not want to check on isGenerating changes (when we do, we can not click continue after it stops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, stopGenerating]);

  const toggleGenerating = useCallback(() => {
    if (isGenerating) stopGenerating();
    else startGenerating();
  }, [isGenerating, startGenerating, stopGenerating]);

  const history = (address: string): string => {
    const result = addressResults[address];
    if (result === undefined) return "";
    const { balance, hasHistory } = result;
    return hasHistory
      ? "(Dirty, " + (balance > 0 ? `🎉${balance} sats🎉)` : "0 sats)")
      : "(Clean)";
  };

  useEffect(() => {
    if (processKey.current !== active) {
      processKey.current = active;
      stopGenerating();
      setAddresses({ P2PKH: [], P2SHP2WPKH: [], P2WPKH: [] });
      setCount(0);
      setStartedOnce(false);
    }
  }, [active, stopGenerating]);

  useEffect(() => {
    if (!startedOnce && processKey.current !== "") {
      setStartedOnce(true);
      startGenerating();
    }
  }, [startGenerating, startedOnce]);

  const buttonText = isGenerating ? "Pause" : "Continue";

  return (
    <>
      <div className="counts">{counts(count)}</div>
      <div className="">
        {(["P2PKH", "P2SHP2WPKH", "P2WPKH"] as AddressType[]).map((type) => (
          <div key={type}>
            {type}
            <div className="addressGenerator">
              {addresses[type].map((address) => (
                <div className="addressGeneratorItem" key={address}>
                  <button
                    className={`addressItem ${address === active ? "addressItemActive" : ""}`}
                    onClick={handleCopy(address)}
                    type="button"
                  >
                    {address}
                  </button>
                  <span className="status">{history(address)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button disabled={active === ""} onClick={toggleGenerating} type="button">
        {buttonText}
      </button>
    </>
  );
};

export default AddressGenerator;

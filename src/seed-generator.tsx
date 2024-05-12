// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable security/detect-object-injection */
import "react-toastify/dist/ReactToastify.css";

import { validateMnemonic } from "bip39";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  checkSeedPhraseAddresses,
  formatLargeNumber,
  generatePermutations,
} from "./bip-39";
import { VALID_LENGTHS } from "./constants";

// eslint-disable-next-line functional/no-mixed-types
interface SeedProperties {
  active: string;
  count: number;
  foundBip39Words: string[];
  permutations: bigint;
  setActive: React.Dispatch<React.SetStateAction<string>>;
  setCount: React.Dispatch<React.SetStateAction<number>>;
}

interface SeedResult {
  balance: number;
  hasHistory: boolean;
}

const counts = (count: number, permutations: bigint): string =>
  `Count: ${count.toLocaleString()} | Potential Max: ${formatLargeNumber(permutations)}`;

const handleCopy = async (textToCopy: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(textToCopy);
    toast.success(`"${textToCopy}" Copied to clipboard!`, {
      autoClose: 2000,
      closeOnClick: true,
      draggable: true,
      hideProgressBar: true,
      pauseOnHover: true,
      position: "top-right",
      progress: undefined,
      theme: "dark",
    });
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

/**
 * @param array - An array of any type
 * @returns the same array but shuffled
 */
function secureShuffle<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let index = shuffledArray.length - 1; index > 0; index--) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const randomIndex = randomBuffer[0] % (index + 1);

    [shuffledArray[index], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[index],
    ];
  }
  return shuffledArray;
}

const SeedGenerator: React.FC<SeedProperties> = ({
  active,
  count,
  foundBip39Words,
  permutations,
  setActive,
  setCount,
}) => {
  const [seeds, setSeeds] = useState<string[]>([]);
  const seedsReference = useRef<string[]>([]);
  const [seedResults, setSeedResults] = useState<
    Record<string, SeedResult | undefined>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingReference = useRef<boolean>(false);
  const [startedOnce, setStartedOnce] = useState<boolean>(false);
  const processKey = useRef<string>("");
  const [finished, setFinished] = useState<boolean>(false);
  const currentIndex = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);

  const waitWhilePaused = async (): Promise<void> => {
    while (!generatingReference.current)
      await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const processNextSeed = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    const currentProcessKey = processKey.current;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      if (!generatingReference.current) await waitWhilePaused();
      if (currentProcessKey !== processKey.current) return;

      if (currentIndex.current < seedsReference.current.length) {
        const currentSeed = seedsReference.current[currentIndex.current];
        const results = await checkSeedPhraseAddresses(currentSeed, 5);
        setSeedResults((previousResults) => ({
          ...previousResults,
          [currentSeed]: {
            balance: results.reduce(
              (total, [_, __, balance]) => total + balance,
              0,
            ),
            hasHistory: results.some(([_, hasHistory]) => hasHistory),
          },
        }));

        currentIndex.current += 1;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }, []);

  const processSeeds = useCallback(async () => {
    const currentProcessKey = processKey.current;
    for (const length of VALID_LENGTHS) {
      for (const permutation of generatePermutations(
        secureShuffle(foundBip39Words),
        length,
      )) {
        if (!generatingReference.current) await waitWhilePaused();
        if (currentProcessKey !== processKey.current) return;
        const possibleMnemonic = permutation.join(" ");
        if (validateMnemonic(possibleMnemonic)) {
          setSeeds((previousSeeds) => {
            const newSeeds = [...new Set([...previousSeeds, possibleMnemonic])];
            seedsReference.current = newSeeds;
            return newSeeds;
          });
          setCount((previousCount) => previousCount + 1);
        }
        // Introduce a delay for UI responsiveness and to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    setIsGenerating(false);
    setFinished(true);
  }, [foundBip39Words, processKey]);

  const startGenerating = useCallback(() => {
    generatingReference.current = true;
    setIsGenerating(true);

    processSeeds().catch((error) => {
      console.error(error);
    });
    processNextSeed().catch((error) => {
      console.error(error);
    });
  }, [processNextSeed, processSeeds]);

  const stopGenerating = useCallback(() => {
    generatingReference.current = false;
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    if (processKey.current !== foundBip39Words.join(" ")) {
      processKey.current = foundBip39Words.join(" ");
      // Reset when foundBip39Words changes
      stopGenerating();
      setSeeds([]);
      seedsReference.current = [];
      setCount(0);
      setStartedOnce(false);
      setFinished(false);
      currentIndex.current = 0;
      isInitialized.current = false;
    }
  }, [foundBip39Words, processKey, stopGenerating]);

  useEffect(() => {
    if (!startedOnce && processKey.current !== "") {
      setStartedOnce(true);
      startGenerating();
    }
  }, [startGenerating, startedOnce]);

  const toggleGenerating = useCallback(() => {
    if (isGenerating) stopGenerating();
    else startGenerating();
  }, [isGenerating, startGenerating, stopGenerating]);

  const buttonText = isGenerating
    ? "Pause"
    : finished
      ? "Finished"
      : "Continue";

  const handleClick = (seed: string) => async () => {
    setActive(seed);
    await handleCopy(seed);
  };

  const history = (innerSeed: string): string => {
    const dirty = seedResults[innerSeed]?.hasHistory;
    if (dirty === undefined) return "";
    const balance = seedResults[innerSeed]?.balance;
    if (balance === undefined) return "";
    return dirty
      ? "(Dirty, " + (balance > 0 ? `🎉${balance} sats🎉)` : "0 sats)")
      : "(Clean)";
  };
  return (
    <>
      <div className="counts">{counts(count, permutations)}</div>
      <div className="seedGenerator">
        {seeds.map((seed) => (
          <div className="seedGeneratorItem" key={seed}>
            <button
              className={`seedItem${seed === active ? "Active" : ""}`}
              onClick={handleClick(seed)}
              type="button"
            >
              {seed}
            </button>
            <span className="status">{history(seed)}</span>
          </div>
        ))}
      </div>
      <button
        disabled={finished || foundBip39Words.length === 0}
        onClick={toggleGenerating}
        type="button"
      >
        {buttonText}
      </button>
    </>
  );
};

export default SeedGenerator;

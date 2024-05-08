// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable security/detect-object-injection */
import { validateMnemonic } from "bip39";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { generatePermutations, validLengths } from "./bip-39-service";

// eslint-disable-next-line functional/no-mixed-types
interface SeedProperties {
  active: string;
  foundBip39Words: string[];
  setActive: React.Dispatch<React.SetStateAction<string>>;
}

const counts = (count: number, result: string[]): string =>
  `count: ${count} | unique: ${new Set(result).size}`;

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
  foundBip39Words,
  setActive,
}) => {
  const [seeds, setSeeds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingReference = useRef<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [startedOnce, setStartedOnce] = useState<boolean>(false);
  const processKey = useRef<string>("");

  const waitWhilePaused = async (): Promise<void> => {
    while (!generatingReference.current)
      await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const processSeeds = useCallback(async () => {
    const currentProcessKey = processKey.current;
    const filteredList = validLengths.filter(
      (length) => foundBip39Words.length >= length,
    );
    for (const length of filteredList) {
      for (const permutation of generatePermutations(
        secureShuffle(foundBip39Words),
        length,
      )) {
        if (!generatingReference.current) await waitWhilePaused();
        if (currentProcessKey !== processKey.current) return;
        const possibleMnemonic = permutation.join(" ");
        if (validateMnemonic(possibleMnemonic)) {
          setSeeds((previousSeeds) => [
            ...new Set([...previousSeeds, possibleMnemonic]),
          ]);
          setCount((previousCount) => previousCount + 1);
        }
        // Introduce a delay for UI responsiveness and to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    setIsGenerating(false);
  }, [foundBip39Words, processKey]);

  const startGenerating = useCallback(() => {
    generatingReference.current = true;
    setIsGenerating(true);
    if (!startedOnce) {
      processSeeds().catch((error) => {
        console.error(error);
      });
      setStartedOnce(true);
    }
  }, [processSeeds, startedOnce]);

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
      setCount(0);
      setStartedOnce(false);
    }
  }, [foundBip39Words, processKey, stopGenerating]);

  const toggleGenerating = useCallback(() => {
    if (isGenerating) stopGenerating();
    else startGenerating();
  }, [isGenerating, startGenerating, stopGenerating]);

  const buttonText = isGenerating
    ? "Pause"
    : startedOnce
      ? "Continue"
      : "Start";

  const handleClick = (seed: string) => () => {
    // setActiveSeed(seed);
    setActive(seed);
  };

  return (
    <>
      <button onClick={toggleGenerating} type="button">
        {buttonText}
      </button>
      {seeds.length > 0 && (
        <>
          <div className="counts">{counts(count, seeds)}</div>
          {seeds.map((seed) => (
            <button
              className={`seedItem${seed === active ? "Active" : ""}`}
              key={seed}
              onClick={handleClick(seed)}
              type="button"
            >
              {seed}
            </button>
          ))}
        </>
      )}
    </>
  );
};

export default SeedGenerator;

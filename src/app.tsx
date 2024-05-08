import "./App.css";

import React, { useCallback, useEffect, useState } from "react";

import {
  calculateTotalPermutations,
  findBIP39Words,
  timeToCrack,
} from "./bip-39-service";
import { content } from "./content";
import SeedGenerator from "./seed-generator";
import ToggleButton from "./toggle";

const laptopRate = 1000n;
const gpuArrayRate = 1_000_000n;
const millRate = 1_000_000_000n;
const laptop = `Laptop @ ${laptopRate.toLocaleString()} sweeps/second:`;
const gpuArray = `GPU Array @ ${gpuArrayRate.toLocaleString()} sweeps/second:`;
const mill = `Industrial Mill @ ${millRate.toLocaleString()} sweeps/second:`;

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [customValue, setCustomValue] = useState<string>("9876543210");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [permutations, setPermutations] = useState<bigint>(0n);
  const [result, setResult] = useState<Array<{ index: number; word: string }>>(
    [],
  );
  const [active, setActive] = useState<string>("");
  const [toggle, setToggle] = useState<boolean>(true);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    [],
  );

  const handleCustomInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(event.target.value);
    },
    [],
  );

  const handleClick = useCallback(() => {
    setHasSubmitted(true);
    setActive("");
    const output = findBIP39Words(input);
    setResult(output);
    const permutes = calculateTotalPermutations(
      output.map((item) => item.word),
    );
    setPermutations(permutes);
  }, [input]);

  // Function to add text from URL parameters
  const addTextFromURL = useCallback(() => {
    const parameters = new URLSearchParams(window.location.search);
    const textFromURL = parameters.get("text");
    if (textFromURL !== null) {
      setInput(textFromURL);
    }
  }, []);

  // Run once when the component mounts to add text from URL parameters
  useEffect(() => {
    addTextFromURL();
  }, [addTextFromURL]);

  const handleTextAdd = (title: keyof typeof content) => () => {
    // eslint-disable-next-line security/detect-object-injection
    setInput(content[title]);
  };

  const conclusion1 =
    permutations > 0n ? (
      timeToCrack(permutations, gpuArrayRate).secure ? (
        <>
          <h1>{content.allegedly}</h1>
          <div>{content.allegedlySlug}</div>
        </>
      ) : (
        <>
          <h1>{content.improbable}</h1>
          <div>{content.improbableSlug}</div>
        </>
      )
    ) : (
      <>
        <h1>{content.no}</h1>
        <div>{content.noSlug}</div>
      </>
    );

  const conclusion2 =
    permutations > 0n ? (
      <>
        <h1>{content.yes}</h1>
        <div>{content.yesExplain}</div>
      </>
    ) : (
      <>
        <h1>{content.no}</h1>
        <div>{content.noExplain}</div>
      </>
    );

  const handleToggle = useCallback(() => {
    setToggle((previousToggle) => !previousToggle);
  }, []);

  const seen = new Set();
  const uniqueItems = result.filter((item) => {
    const duplicate = seen.has(item.word);
    seen.add(item.word);
    return !duplicate;
  });

  const toggleComp = toggle
    ? result.map((item) => (
        <div
          className={`item${active.includes(item.word) ? "Active" : ""}`}
          key={`${item.word}+${item.index}`}
        >
          {item.word}
        </div>
      ))
    : uniqueItems.map((item) => (
        <div
          className={`item${active.includes(item.word) ? "Active" : ""}`}
          key={`${item.word}+${item.index}`}
        >
          {item.word}
        </div>
      ));

  return (
    <div className="container">
      <h1>{content.header}</h1>
      <section className="buttonBox">
        <button onClick={handleTextAdd("proverbs111")} type="button">
          {content.processPro111}
        </button>
        <button onClick={handleTextAdd("sermonOnTheMount")} type="button">
          {content.processSermon}
        </button>
        <button onClick={handleTextAdd("constitution")} type="button">
          {content.processConstitution}
        </button>
        <button onClick={handleTextAdd("bankSecrecyAct")} type="button">
          {content.processBSA}
        </button>
        <button onClick={handleTextAdd("digitalAsset")} type="button">
          {content.processDigital}
        </button>
      </section>
      <textarea
        className="textInput"
        onChange={handleInputChange}
        placeholder="Choose from the examples above, Start typing, or Copy and Paste text here to analyze..."
        value={input}
      />
      <button onClick={handleClick} type="button">
        {content.process}
      </button>
      {hasSubmitted && (
        <>
          <hr />
          <h2>{content.canItHaveBitcoin}</h2>
          {conclusion2}
          <hr />
          <h2>{content.doesItHaveBitcoin}</h2>
          {conclusion1}
          <hr />
          <h2>{content.resultsText}</h2>
          <div className="counts">
            {/* {dynamicContent.counts(result.map((item) => item.word))} */}
            <ToggleButton
              toggle={handleToggle}
              total={`total: ${result.length}`}
              unique={`unique: ${new Set(result.map((item) => item.word)).size}`}
            />
          </div>
          <div className="box">{toggleComp}</div>
          <hr />
          <h2>{content.privateKeyCount}</h2>
          <span className="keyCount">{permutations.toLocaleString()}</span>
          <hr />
          {permutations > 0n && (
            <>
              <h2>{content.securityAnalysis}</h2>
              {content.securityBlurb}
              <div className="boxVariation">
                <div className="itemVariation">
                  <div className="bigNumber" lang="en">
                    {laptop}
                  </div>
                  <div className="bigNumber" lang="en">
                    {timeToCrack(permutations, laptopRate).timeString}
                  </div>
                </div>
                <div className="itemVariation">
                  <div className="bigNumber" lang="en">
                    {gpuArray}
                  </div>
                  <div className="bigNumber" lang="en">
                    {timeToCrack(permutations, gpuArrayRate).timeString}
                  </div>
                </div>
                <div className="itemVariation">
                  <div className="bigNumber" lang="en">
                    {mill}
                  </div>
                  <div className="bigNumber" lang="en">
                    {timeToCrack(permutations, millRate).timeString}
                  </div>
                </div>
                <div className="itemVariation">
                  <div className="bigNumberAlt" lang="en">
                    <input
                      autoComplete="true"
                      className="bigNumberInput"
                      onChange={handleCustomInput}
                      value={customValue.toLocaleString()}
                    />
                    <div className="bigNumberInputText">
                      {content.triesPerSecond}
                    </div>
                  </div>
                  <div className="bigNumber" lang="en">
                    {timeToCrack(permutations, customValue).timeString}
                  </div>
                </div>
              </div>
              <hr />
              <h2>{content.seedGeneratorText}</h2>
              {content.seedIsTransmitting}
              <hr />
              <SeedGenerator
                active={active}
                foundBip39Words={result.map((item) => item.word)}
                setActive={setActive}
              />
              <hr />
              <h2>{content.goodIdea}</h2>
              {content.notGoodIdea}
            </>
          )}
          <hr />
          <div className="legalDisclaimer">{content.legalDisclaimer}</div>
          <hr />
        </>
      )}
    </div>
  );
};

export default App;

import "./App.css";

import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";

import AddressGenerator from "./address-generation";
import {
  calculateTotalPermutations,
  findBIP39Words,
  replacePunctuationWithSpaces,
  timeToCrack,
  wordlist,
} from "./bip-39";
import { content, extendedContent } from "./content";
import ForkUs from "./fork-us";
import SeedGenerator from "./seed-generator";

const laptopRate = 1000n;
const gpuArrayRate = 1_000_000n;
const millRate = 1_000_000_000n;
const laptop = `Laptop @ ${laptopRate.toLocaleString()} sweeps/second:`;
const gpuArray = `GPU Array @ ${gpuArrayRate.toLocaleString()} sweeps/second:`;
const mill = `Industrial Mill @ ${millRate.toLocaleString()} sweeps/second:`;

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [customValue, setCustomValue] = useState<string>("9876543210");
  const [active, setActive] = useState<string>("");
  const [disabled, setDisabled] = useState<string[]>([]);
  const [count, setCount] = useState<number>(0);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
      const encodedURL = encodeURIComponent(event.target.value).slice(0, 4000);
      window.history.pushState({}, "", `?text=${encodedURL}`);
      setActive("");
      setDisabled([]);
    },
    [],
  );

  const handleCustomSweepRate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(event.target.value);
    },
    [],
  );

  // Function to add text from URL parameters
  const addTextFromURL = useCallback(() => {
    const parameters = new URLSearchParams(window.location.search);
    const textFromURL = parameters.get("text");
    if (textFromURL !== null) setInput(textFromURL);
  }, []);

  // Run once when the component mounts to add text from URL parameters
  useEffect(() => {
    addTextFromURL();
  }, [addTextFromURL]);

  const handleTextAdd = (title: keyof typeof extendedContent) => () => {
    // eslint-disable-next-line security/detect-object-injection
    setInput(extendedContent[title]);
    // eslint-disable-next-line security/detect-object-injection
    const encodedURL = encodeURIComponent(extendedContent[title]).slice(
      0,
      4000,
    );
    window.history.pushState({}, "", `?text=${encodedURL}`);
    setActive("");
    setDisabled([]);
  };

  let highlightedCount = 0;

  const highlighted = replacePunctuationWithSpaces(input)
    .toLowerCase()
    .split(" ")
    .map((word, index) => ({ index, word }))
    .map(({ index, word }) => {
      const isHighlighted = wordlist.includes(word);
      if (isHighlighted) highlightedCount++;
      return isHighlighted ? (
        <span className="highlight" key={index}>
          {word}
          {content.space}
        </span>
      ) : (
        <span key={index}>
          {word}
          {content.space}
        </span>
      );
    });

  const uniqueItems = findBIP39Words(input);
  const wordsOnly = uniqueItems.map((item) => item.word);
  const filteredWords = wordsOnly.filter((word) => !disabled.includes(word));
  const permutations = calculateTotalPermutations(filteredWords);

  const conclusion1 =
    count > 0 ? (
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
    count > 0 ? (
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

  const handleMute = (item: { index: number; word: string }) => () => {
    if (disabled.includes(item.word))
      setDisabled((previous) => previous.filter((word) => word !== item.word));
    else setDisabled((previous) => [...previous, item.word]);
    setActive("");
  };

  const uniqueSeedWords = uniqueItems.map((item) => (
    <button
      className={`item ${active.includes(item.word) ? "itemActive " : ""} ${disabled.includes(item.word) ? "disabled " : ""}`}
      key={item.index}
      onClick={handleMute(item)}
      type="button"
    >
      {item.word}
    </button>
  ));

  const addressesTitle =
    active === ""
      ? "Select A Seed Phrase Above To See Addresses"
      : `Addresses For Seed "${active}"`;

  return (
    <div className="container">
      <h1>{content.header}</h1>
      <section className="buttonBox">
        {/* <button onClick={handleTextAdd("proverbs111")} type="button">
          {content.processPro111}
        </button> */}
        <button onClick={handleTextAdd("sermonOnTheMount")} type="button">
          {content.processSermon}
        </button>
        <button onClick={handleTextAdd("constitution")} type="button">
          {content.processConstitution}
        </button>
        <button onClick={handleTextAdd("digitalAsset")} type="button">
          {content.processDigital}
        </button>
        <button onClick={handleTextAdd("runningBitcoin")} type="button">
          {content.processHal}
        </button>
      </section>
      <textarea
        className="textInput"
        onChange={handleInputChange}
        placeholder="Choose from the examples above, start typing, or copy and paste text to analyze..."
        value={input}
      />
      <hr />
      <h2>{content.allWordsHighlighted}</h2>
      <div className="counts">
        {content.count}
        {highlightedCount}
      </div>
      <div className="preview">{highlighted}</div>
      <hr />
      <h2>{content.resultsText}</h2>
      <div className="counts">
        {content.count}
        {uniqueSeedWords.length}
      </div>
      <div className="box">{uniqueSeedWords}</div>
      <hr />
      <h2>{content.seedGeneratorText}</h2>
      <SeedGenerator
        active={active}
        count={count}
        foundBip39Words={filteredWords}
        permutations={permutations}
        setActive={setActive}
        setCount={setCount}
      />
      <hr />
      {count > 0 && (
        <>
          <h2>{addressesTitle}</h2>
          <AddressGenerator active={active} />
          <hr />
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
                  onChange={handleCustomSweepRate}
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
        </>
      )}
      <h2>{content.canItHaveBitcoin}</h2>
      {conclusion2}
      <hr />
      <h2>{content.doesItHaveBitcoin}</h2>
      {conclusion1}
      <hr />
      {count > 0 && (
        <>
          <h2>{content.goodIdea}</h2>
          <h1>{content.no}</h1>
          {content.notGoodIdea}
          <hr />
          <h2>{content.butWhy}</h2>
          <h1>{content.yes}</h1>
          {content.thatIsThePoint}
          <hr />
        </>
      )}
      <div className="legalDisclaimer">{extendedContent.legalDisclaimer}</div>
      <hr />
      <ToastContainer />
      <ForkUs />
    </div>
  );
};

export default App;

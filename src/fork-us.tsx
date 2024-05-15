import React from "react";

const label = "View source on GitHub";
const verify = "Verify";
const source = "Source on GitHub";

const ForkUs = (): React.JSX.Element => {
  return (
    <a
      aria-label={label}
      className="angled-ribbon"
      href="https://github.com/gildedpleb/is-it-bitcoin"
    >
      {verify}
      <br />
      {source}
    </a>
  );
};

export default ForkUs;

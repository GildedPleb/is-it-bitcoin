import "./ToggleButton.css";

import React, { useCallback, useState } from "react";

// eslint-disable-next-line functional/no-mixed-types
interface Toggle {
  toggle: () => void;
  total: string;
  unique: string;
}

const ToggleButton: React.FC<Toggle> = ({ toggle, total, unique }) => {
  const [active, setActive] = useState<boolean>(true);

  const handleToggle = useCallback(
    (source: string) => (): void => {
      if ((source === "unique" && active) || (source === "total" && !active)) {
        setActive((previous) => !previous);
        toggle();
      }
    },
    [active, toggle],
  );

  return (
    <div className="toggle-container">
      <button
        className={`toggle-btn ${active ? "active" : ""}`}
        onClick={handleToggle("total")}
        type="button"
      >
        {total}
      </button>
      <button
        className={`toggle-btn ${active ? "" : "active"}`}
        onClick={handleToggle("unique")}
        type="button"
      >
        {unique}
      </button>
    </div>
  );
};

export default ToggleButton;

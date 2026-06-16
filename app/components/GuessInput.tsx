"use client";

import { useEffect, useRef, useState } from "react";

import { resolveAsset, searchAssets } from "@/lib/catalog";
import type { Asset } from "@/lib/types";

interface GuessInputProps {
  disabled?: boolean;
  guessesLeft: number;
  alreadyGuessed: Set<string>;
  onGuess: (asset: Asset) => void;
  onInvalid: (message: string) => void;
}

export default function GuessInput({
  disabled,
  guessesLeft,
  alreadyGuessed,
  onGuess,
  onInvalid,
}: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = open ? searchAssets(query) : [];

  useEffect(() => {
    setActive(0);
  }, [query]);

  function submit(asset: Asset | undefined) {
    if (!asset) {
      onInvalid("Pick an asset from the list.");
      return;
    }
    if (alreadyGuessed.has(asset.ticker)) {
      onInvalid(`You already guessed ${asset.ticker}.`);
      return;
    }
    onGuess(asset);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[active] ?? resolveAsset(query);
      submit(chosen);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder={disabled ? "Come back tomorrow" : "Guess the ticker or name…"}
            aria-label="Guess the asset"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-control border border-border bg-surface-2 px-4 py-3 text-text placeholder:text-muted focus:border-accent disabled:opacity-50"
          />
          {open && suggestions.length > 0 && (
            <ul
              className="absolute bottom-full z-20 mb-2 max-h-64 w-full overflow-auto rounded-control border border-border bg-surface shadow-xl"
              role="listbox"
            >
              {suggestions.map((a, i) => {
                const used = alreadyGuessed.has(a.ticker);
                return (
                  <li key={a.ticker} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      // onMouseDown fires before input blur, so the pick lands.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        submit(a);
                      }}
                      onMouseEnter={() => setActive(i)}
                      disabled={used}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left ${
                        i === active ? "bg-surface-2" : ""
                      } ${used ? "opacity-40" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-sm text-text">
                          {a.ticker}
                        </span>
                        <span className="truncate text-sm text-muted">
                          {a.name}
                        </span>
                      </span>
                      {used && <span className="text-xs text-muted">guessed</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            submit(suggestions[active] ?? resolveAsset(query));
          }}
          className="rounded-control bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          Guess
        </button>
      </div>
      <div className="mt-2 text-center text-xs text-muted">
        {disabled ? "Solved for today" : `${guessesLeft} guesses left`}
      </div>
    </div>
  );
}

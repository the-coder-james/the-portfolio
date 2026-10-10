import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  id: string;
  name: string;
  /** Projects this option would show, given the search and the other filters. */
  count: number;
}

interface FilterSelectProps {
  /** The facet's name, printed in the box: "tag", "role", "via". */
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * A select box that takes more than one value.
 *
 * A native <select multiple> renders as an always-open list box several rows
 * tall, which this one-line control row has no room for, and a native single
 * select cannot hold two values at all. This is the closed-box look of the old
 * select with a checkbox list behind it.
 *
 * The list is the ARIA listbox pattern with aria-multiselectable: focus stays
 * on the list and aria-activedescendant moves, so screen readers announce each
 * option with its selected state. Arrow keys move, Space or Enter toggles,
 * Home/End jump, a letter jumps to the next option starting with it, and Escape
 * or Tab closes and returns to the box. Choosing does not close the list --
 * picking three tags is three presses, not three trips.
 *
 * Radix Popover does the placement, the portal (so no section's clip or a
 * scroll region's mask can cut the list off) and dismissal on an outside click.
 */
export function FilterSelect({ label, options, selected, onChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const optionId = (i: number) => `${baseId}-option-${i}`;
  const chosen = new Set(selected);

  const toggle = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // Kept in the list's own order, so the box and the chips read the same
    // whichever order the values were picked in.
    onChange(options.filter((o) => next.has(o.id)).map((o) => o.id));
  };

  // Keep the active option inside the list's own viewport. Not
  // scrollIntoView: that walks every scrolling ancestor and would move the
  // page under the open list.
  const reveal = (i: number) => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`#${CSS.escape(optionId(i))}`);
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  };

  const move = (i: number) => {
    const next = Math.max(0, Math.min(options.length - 1, i));
    setActiveIndex(next);
    reveal(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(activeIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(activeIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(options.length - 1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        if (options[activeIndex]) toggle(options[activeIndex].id);
        break;
      case "Tab":
        // The list lives in a portal at the end of <body>, so the browser's
        // next Tab stop from here is nowhere near the box. Close instead;
        // Radix hands focus back to the box, and the next Tab carries on from
        // there through the row.
        e.preventDefault();
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
          const k = e.key.toLowerCase();
          const n = options.length;
          for (let step = 1; step <= n; step++) {
            const i = (activeIndex + step) % n;
            if (options[i].name.toLowerCase().startsWith(k)) {
              move(i);
              break;
            }
          }
        }
    }
  };

  const first = options.find((o) => o.id === selected[0]);
  const active = selected.length > 0;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Open on the first chosen option, so the reader lands on what is
        // already set rather than back at the top.
        if (next) setActiveIndex(Math.max(0, options.findIndex((o) => chosen.has(o.id))));
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          // Overrides the Trigger's "dialog": what opens is a list of choices.
          aria-haspopup="listbox"
          className="filter-select font-mono"
          data-active={active ? "true" : undefined}
        >
          <span className="sr-only">Filter by </span>
          <span className="filter-select-key">{label}:</span>
          <span className="filter-select-value">{first ? first.name : "all"}</span>
          {selected.length > 1 && (
            <span className="filter-select-more">
              +{selected.length - 1}
              <span className="sr-only"> more</span>
            </span>
          )}
          <ChevronDown size={13} aria-hidden="true" className="filter-select-caret" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="filter-popover font-mono"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          // Focus the list, not the first focusable inside the content (the
          // clear button), and without letting focus() scroll the page.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            listRef.current?.focus({ preventScroll: true });
          }}
        >
          <div className="filter-popover-head">
            <span aria-hidden="true">// {label}</span>
            <button
              type="button"
              className="filter-popover-clear"
              onClick={() => {
                onChange([]);
                listRef.current?.focus({ preventScroll: true });
              }}
              disabled={!active}
            >
              clear<span className="sr-only"> {label} filter</span>
            </button>
          </div>
          <ul
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            aria-label={`Filter by ${label}`}
            aria-activedescendant={options.length ? optionId(activeIndex) : undefined}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="filter-listbox"
          >
            {options.map((o, i) => (
              <li
                key={o.id}
                id={optionId(i)}
                role="option"
                aria-selected={chosen.has(o.id)}
                data-active={i === activeIndex ? "true" : undefined}
                data-empty={o.count === 0 ? "true" : undefined}
                className="filter-option"
                onPointerMove={() => setActiveIndex(i)}
                onClick={() => {
                  setActiveIndex(i);
                  toggle(o.id);
                }}
              >
                <span className="filter-check" aria-hidden="true">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="filter-option-name">{o.name}</span>
                <span className="filter-option-count" aria-hidden="true">{o.count}</span>
                <span className="sr-only">, {o.count} {o.count === 1 ? "project" : "projects"}</span>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

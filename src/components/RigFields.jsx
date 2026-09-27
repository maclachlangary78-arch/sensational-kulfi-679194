import { useState } from 'react';
import { Fish, Plus, X } from 'lucide-react';
import { HOOK_TYPES, LURE_SIZES, defaultHookSize, hookSizesFor } from '../lib/constants';
import { NEW_LURE } from '../lib/spread';
import { LURE_CATALOG, coloursFor, joinName, sizesFor, splitName } from '../lib/catalog';

const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';

// Free-text lure size with one-tap quick picks, so odd sizes (e.g. 180mm, "Medium") still work.
export function LureSizeField({ value, onChange, label = 'Lure size', sizes = LURE_SIZES }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-400 mb-1">{label}</label>
      <input
        type="text"
        placeholder='e.g. 10" or 180mm'
        maxLength={30}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      />
      <div className="flex gap-1.5 overflow-x-auto mt-1.5 pb-0.5 -mx-0.5 px-0.5">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(value === s ? '' : s)}
            className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold ${
              value === s ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// Optional hook, tucked behind an "Add hook" button. Size only appears once a hook type is picked,
// and follows that hook's own sizing (Pakula Dojo hooks use gape sizes like 25, others use 9/0 etc).
export function HookPicker({ hookType, hookSize, onChange }) {
  const [open, setOpen] = useState(false);
  const types = hookType && !HOOK_TYPES.includes(hookType) ? [hookType, ...HOOK_TYPES] : HOOK_TYPES;
  const sizes = hookSizesFor(hookType);
  const sizeOptions = hookSize && !sizes.some((s) => s.value === hookSize) ? [{ value: hookSize, label: hookSize }, ...sizes] : sizes;

  if (!hookType && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-amber-300 font-semibold flex items-center gap-1 py-1">
        <Plus className="w-3.5 h-3.5" /> Add hook (optional)
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] text-slate-400">Hook</label>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onChange({ hookType: '', hookSize });
          }}
          className="text-[11px] text-slate-500 flex items-center gap-0.5"
        >
          <X className="w-3 h-3" /> Remove hook
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={hookType}
          onChange={(e) => onChange({ hookType: e.target.value, hookSize: defaultHookSize(e.target.value, hookSize) })}
          className={field}
        >
          <option value="">Choose hook…</option>
          {types.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>
        {hookType && (
          <select value={hookSize} onChange={(e) => onChange({ hookType, hookSize: e.target.value })} className={field}>
            {sizeOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

const OTHER = '__other';
const step = 'block text-[11px] text-slate-400 mb-1';

// Step-by-step lure entry: 1. lure (brand + model from the catalogue, or typed), 2. colour, 3. size.
// The name is saved as "Pakula Sprocket - Lumo" so it can be read back into these steps later.
export function CatalogPicker({ name, size, onChange }) {
  const { base, colour, model } = splitName(name);
  const [typingLure, setTypingLure] = useState(Boolean(base && !model));
  const { brand: brandColours, common } = coloursFor(model?.brand);
  const allColours = [...brandColours, ...common];
  const [typingColour, setTypingColour] = useState(Boolean(colour && !allColours.includes(colour)));
  const sizes = model?.sizes || [];
  const [typingSize, setTypingSize] = useState(Boolean(size && sizes.length && !sizes.some((s) => s.value === size)));

  const lureValue = model ? model.name : typingLure ? OTHER : '';
  const showColourInput = typingColour || Boolean(colour && !allColours.includes(colour));
  const colourValue = showColourInput ? OTHER : colour;
  const showSizeInput = typingSize || Boolean(size && !sizes.some((s) => s.value === size));
  const sizeValue = showSizeInput ? OTHER : size;

  const pickLure = (v) => {
    if (v === OTHER || v === '') {
      setTypingLure(v === OTHER);
      onChange({ name: '' });
      return;
    }
    setTypingLure(false);
    const next = splitName(v).model;
    const keepSize = next.sizes.some((s) => s.value === size);
    setTypingSize(false);
    onChange({
      name: joinName(v, colour),
      size: keepSize ? size : next.sizes.length === 1 ? next.sizes[0].value : '',
      ...(next.position ? { defaultPosition: next.position } : {}),
    });
  };

  const pickColour = (v) => {
    setTypingColour(v === OTHER);
    if (v !== OTHER) onChange({ name: joinName(base, v) });
  };

  const pickSize = (v) => {
    setTypingSize(v === OTHER);
    if (v !== OTHER) onChange({ size: v });
  };

  return (
    <div className="space-y-2.5">
      <div>
        <label className={step}>1. Lure</label>
        <select value={lureValue} onChange={(e) => pickLure(e.target.value)} className={field}>
          <option value="">Choose brand &amp; model…</option>
          {LURE_CATALOG.map((b) => (
            <optgroup key={b.brand} label={b.brand}>
              {b.models.map((m) => (
                <option key={m.model} value={`${b.brand} ${m.model}`}>
                  {b.brand} {m.model}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER}>✏️ Not listed — type the lure name</option>
        </select>
        {lureValue === OTHER && (
          <input
            type="text"
            autoFocus
            maxLength={88}
            placeholder="Lure name, e.g. Zuker ZM-5"
            value={base}
            onChange={(e) => onChange({ name: joinName(e.target.value.replace(/ - /g, ' '), colour) })}
            className={`${field} mt-2`}
          />
        )}
      </div>

      {base && (
        <div>
          <label className={step}>2. Colour</label>
          <select value={colourValue} onChange={(e) => pickColour(e.target.value)} className={field}>
            <option value="">No colour</option>
            {brandColours.length > 0 && (
              <optgroup label={`${model.brand} colours`}>
                {brandColours.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </optgroup>
            )}
            {common.length > 0 && (
              <optgroup label="Common colours">
                {common.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </optgroup>
            )}
            <option value={OTHER}>✏️ Other colour — type it</option>
          </select>
          {showColourInput && (
            <input
              type="text"
              autoFocus={typingColour}
              maxLength={28}
              placeholder="Colour, e.g. Blue/Pink"
              value={colour}
              onChange={(e) => onChange({ name: joinName(base, e.target.value.replace(/ - /g, ' ')) })}
              className={`${field} mt-2`}
            />
          )}
        </div>
      )}

      {base &&
        (sizes.length > 0 ? (
          <div>
            <label className={step}>3. Size</label>
            <select value={sizeValue} onChange={(e) => pickSize(e.target.value)} className={field}>
              <option value="">Choose size…</option>
              {sizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
              <option value={OTHER}>✏️ Other size — type it</option>
            </select>
            {showSizeInput && (
              <input
                type="text"
                autoFocus={typingSize}
                maxLength={30}
                placeholder='e.g. 10" or 180mm'
                value={size}
                onChange={(e) => onChange({ size: e.target.value })}
                className={`${field} mt-2`}
              />
            )}
          </div>
        ) : (
          <LureSizeField label="3. Size" value={size} onChange={(s) => onChange({ size: s })} />
        ))}
    </div>
  );
}

// Lure dropdown from My Lures, with a last option to add a new one through the lure → colour → size steps.
// Size lives here too: a new lure picks it as step 3, a saved lure gets its model's sizes as quick picks.
// A new lure is added to My Lures automatically when the line is finished; `onSaveNew` offers it straight away.
export function LurePicker({ lures, lureId, customName, lureSize, onSelect, onCustomName, onLureSize, onSaveNew }) {
  const lure = lures.find((l) => String(l.id) === String(lureId));
  const newReady = lureId === NEW_LURE && (customName || '').trim() && (lureSize || '').trim();
  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-[11px] text-slate-400 mb-1">Lure</label>
        <select value={lureId} onChange={(e) => onSelect(e.target.value)} className={field}>
          {lureId === '' && <option value="">Choose a lure…</option>}
          {lures.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value={NEW_LURE}>➕ New lure — pick lure, colour &amp; size</option>
        </select>
      </div>
      {lureId === NEW_LURE ? (
        <div className="border-l-2 border-cyan-800/60 pl-3">
          <CatalogPicker
            name={customName}
            size={lureSize}
            onChange={(p) => {
              if ('name' in p) onCustomName(p.name);
              if ('size' in p) onLureSize(p.size);
            }}
          />
          {newReady && onSaveNew && (
            <button
              type="button"
              onClick={onSaveNew}
              className="mt-2.5 w-full py-2 rounded-lg bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Fish className="w-3.5 h-3.5" /> Add to My Lures
            </button>
          )}
        </div>
      ) : (
        <LureSizeField value={lureSize} onChange={onLureSize} sizes={sizesFor(lure?.name) || LURE_SIZES} />
      )}
    </div>
  );
}

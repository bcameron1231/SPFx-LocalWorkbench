import {
  Checkbox,
  DefaultButton,
  Dropdown,
  IconButton,
  PrimaryButton,
  Slider,
  TextField,
  css,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import React, { FC, useEffect, useState } from 'react';

import type {
  ISectionDesign,
  SectionColorSlot,
  SectionFillMode,
  SectionGradientDirection,
  SectionOverlayType,
} from '../../canvas/pageLayout';
import {
  BACKGROUND_PRESETS,
  THEME_COLOR_PAIRS,
  getCurrentPalette,
  getPairColors,
  getPreset,
  getSecondaryColor,
  getSectionBackgroundStyle,
} from '../../canvas/sectionTheme';
import styles from './SharePointCanvas.module.css';

interface ISectionDesignPaneProps {
  design: ISectionDesign;
  onChange: (design: ISectionDesign) => void;
}

const FILL_OPTIONS: IDropdownOption[] = [
  { key: 'cover', text: 'Scale to fill' },
  { key: 'contain', text: 'Scale to fit' },
  { key: 'tile', text: 'Tile' },
  { key: 'original', text: 'Original size' },
];

const DIRECTION_OPTIONS: IDropdownOption[] = [
  { key: 'toBottom', text: 'Top to bottom' },
  { key: 'toTop', text: 'Bottom to top' },
  { key: 'toRight', text: 'Left to right' },
  { key: 'toLeft', text: 'Right to left' },
];

const OVERLAYS: { type: SectionOverlayType; label: string }[] = [
  { type: 'white', label: 'White' },
  { type: 'black', label: 'Black' },
  { type: 'lightGradient', label: 'Light gradient' },
  { type: 'darkGradient', label: 'Dark gradient' },
];

/** The Design tab of the Section pane, modelled on SharePoint's */
export const SectionDesignPane: FC<ISectionDesignPaneProps> = ({ design, onChange }) => {
  const [palette, setPalette] = useState(getCurrentPalette);
  const [urlDraft, setUrlDraft] = useState('');
  const [darkDraft, setDarkDraft] = useState(false);
  const [addingImage, setAddingImage] = useState(false);

  useEffect(() => {
    const onThemeChanged = () => setPalette(getCurrentPalette());
    window.addEventListener('workbenchSectionThemeChanged', onThemeChanged);
    return () => window.removeEventListener('workbenchSectionThemeChanged', onThemeChanged);
  }, []);

  const colors = design.colors ?? ['white', 'primary'];
  const hasSecondary = !!palette && !!getSecondaryColor(palette);
  const pairs = THEME_COLOR_PAIRS.filter((pair) => hasSecondary || !pair.includes('secondary'));
  const background = design.background;
  const preset = getPreset(design);
  const overlay = design.overlay ?? { type: 'white' as const, opacity: 0 };
  const isGradient = overlay.type === 'lightGradient' || overlay.type === 'darkGradient';

  const setColors = (pair: [SectionColorSlot, SectionColorSlot]) =>
    onChange({ ...design, colors: pair });

  const choosePreset = (id: string) => {
    const chosen = BACKGROUND_PRESETS.find((p) => p.id === id);
    if (!chosen) {
      return;
    }
    onChange({
      ...design,
      background: { presetId: id, fill: 'cover', focalX: 50, focalY: 50 },
      overlay: { type: chosen.dark ? 'black' : 'white', opacity: chosen.overlayOpacity },
    });
  };

  const applyImage = () => {
    const url = urlDraft.trim();
    if (!url) {
      return;
    }
    onChange({
      ...design,
      background: { url, dark: darkDraft, fill: 'cover', focalX: 50, focalY: 50 },
      overlay: { type: darkDraft ? 'black' : 'white', opacity: 40 },
    });
    setAddingImage(false);
  };

  const updateBackground = (changes: Partial<NonNullable<ISectionDesign['background']>>) =>
    background && onChange({ ...design, background: { ...background, ...changes } });

  const updateOverlay = (changes: Partial<NonNullable<ISectionDesign['overlay']>>) =>
    onChange({ ...design, overlay: { ...overlay, ...changes } });

  return (
    <div className={styles.designPane}>
      <div className={styles.settingsLabel}>Theme colors</div>
      <div className={styles.colorPairs} role="grid" aria-label="Theme colors">
        {palette &&
          pairs.map((pair) => {
            const [bg, accent] = getPairColors(palette, pair);
            const selected = colors[0] === pair[0] && colors[1] === pair[1];
            return (
              <button
                key={pair.join('-')}
                role="gridcell"
                aria-selected={selected}
                aria-label={`${describe(bg)} background, ${describe(accent)} accent`}
                className={css(styles.colorPair, selected && styles.colorPairSelected)}
                style={{ background: bg, color: bg === '#ffffff' ? '#323130' : '#ffffff' }}
                onClick={() => setColors(pair)}
              >
                <span className={styles.colorPairText}>Aa</span>
                <span
                  className={styles.colorPairAccent}
                  style={{ background: accent, color: accent === '#ffffff' ? bg : '#ffffff' }}
                >
                  Aa
                </span>
              </button>
            );
          })}
      </div>
      {!hasSecondary && (
        <p className={styles.settingsNote}>
          This theme has one brand colour. Themes with a different `accent` colour also show pairs
          with it.
        </p>
      )}

      <div className={styles.settingsLabel}>Background</div>
      <div className={styles.backgroundGrid} role="radiogroup" aria-label="Background">
        {BACKGROUND_PRESETS.map((item) => (
          <button
            key={item.id}
            role="radio"
            aria-checked={preset?.id === item.id}
            aria-label={item.label}
            title={item.label}
            className={css(
              styles.backgroundTile,
              preset?.id === item.id && styles.backgroundTileSelected,
            )}
            style={{ backgroundImage: item.image, color: item.dark ? '#fff' : '#323130' }}
            onClick={() => choosePreset(item.id)}
          >
            Aa
          </button>
        ))}
      </div>

      {background && (
        <div
          className={styles.backgroundPreview}
          style={getSectionBackgroundStyle(design)}
          aria-label="Selected background"
        />
      )}

      {addingImage ? (
        <div className={styles.addImage}>
          <TextField
            label="Image URL"
            placeholder="https://contoso.sharepoint.com/SiteAssets/banner.jpg"
            value={urlDraft}
            onChange={(_e, value) => setUrlDraft(value ?? '')}
          />
          <Checkbox
            label="Dark image (light text)"
            checked={darkDraft}
            onChange={(_e, checked) => setDarkDraft(!!checked)}
          />
          <div className={styles.buttonRow}>
            <PrimaryButton text="Apply" onClick={applyImage} disabled={!urlDraft.trim()} />
            <DefaultButton text="Cancel" onClick={() => setAddingImage(false)} />
          </div>
        </div>
      ) : (
        <div className={styles.buttonRow}>
          <DefaultButton
            iconProps={{ iconName: background ? 'Edit' : 'Add' }}
            text={background ? 'Change background' : 'Add a background'}
            onClick={() => {
              setUrlDraft(background?.url ?? '');
              setDarkDraft(!!background?.dark);
              setAddingImage(true);
            }}
          />
          {background && (
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              title="Remove background"
              ariaLabel="Remove background"
              onClick={() => onChange({ colors: design.colors })}
            />
          )}
        </div>
      )}

      {background && (
        <>
          <Dropdown
            label="Fill mode"
            selectedKey={background.fill ?? 'cover'}
            options={FILL_OPTIONS}
            onChange={(_e, option) =>
              option && updateBackground({ fill: option.key as SectionFillMode })
            }
          />
          <div className={styles.settingsLabel}>Focal point</div>
          <Slider
            label="Horizontal"
            min={0}
            max={100}
            value={background.focalX ?? 50}
            onChange={(value) => updateBackground({ focalX: value })}
            valueFormat={(v) => `${v}%`}
          />
          <Slider
            label="Vertical"
            min={0}
            max={100}
            value={background.focalY ?? 50}
            onChange={(value) => updateBackground({ focalY: value })}
            valueFormat={(v) => `${v}%`}
          />

          <div className={styles.settingsLabel}>Overlay color</div>
          <div className={styles.overlayChoices} role="radiogroup" aria-label="Overlay color">
            {OVERLAYS.map((item) => (
              <button
                key={item.type}
                role="radio"
                aria-checked={overlay.type === item.type}
                aria-label={item.label}
                title={item.label}
                data-overlay={item.type}
                className={css(
                  styles.overlayChoice,
                  overlay.type === item.type && styles.overlayChoiceSelected,
                )}
                onClick={() => updateOverlay({ type: item.type })}
              />
            ))}
          </div>
          {isGradient && (
            <Dropdown
              label="Gradient direction"
              selectedKey={overlay.direction ?? 'toBottom'}
              options={DIRECTION_OPTIONS}
              onChange={(_e, option) =>
                option && updateOverlay({ direction: option.key as SectionGradientDirection })
              }
            />
          )}
          <Slider
            label="Overlay opacity"
            min={0}
            max={100}
            value={overlay.opacity}
            onChange={(value) => updateOverlay({ opacity: value })}
          />
        </>
      )}
    </div>
  );
};

function describe(color: string): string {
  return color.toLowerCase() === '#ffffff' ? 'white' : color.toLowerCase();
}

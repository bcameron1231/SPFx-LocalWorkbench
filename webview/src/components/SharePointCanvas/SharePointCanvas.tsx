import {
  Callout,
  DirectionalHint,
  Icon,
  IconButton,
  Panel,
  PanelType,
  Pivot,
  PivotItem,
  css,
} from '@fluentui/react';
import React, { FC, Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { IComponentManifest, IWebPartConfig } from '@spfx-local-workbench/shared';

import {
  COLUMN_LAYOUTS,
  COLUMN_SPANS,
  addSection,
  canAddSection,
  changeSectionLayout,
  getSectionDesign,
  moveSection,
  placeWebPart,
  removeSection,
  setSectionDesign,
} from '../../canvas/pageLayout';
import type { IPageLayout, ISection, SectionLayout } from '../../canvas/pageLayout';
import {
  applySectionTheme,
  getSectionBackgroundStyle,
  getSectionEmphasis,
  getSectionOverlayStyle,
} from '../../canvas/sectionTheme';
import { getLocalizedString } from '../../utilities';
import { WebPartZone } from '../WorkbenchCanvas/WebPartZone';
import { AddZone } from '../WorkbenchCanvas/WorkbenchCanvas';
import { LayoutIcon } from './LayoutIcon';
import { SectionDesignPane } from './SectionDesignPane';
import styles from './SharePointCanvas.module.css';

interface ISharePointCanvasProps {
  manifests: IComponentManifest[];
  activeWebParts: IWebPartConfig[];
  pageLayout: IPageLayout;
  onPageLayoutChange: (layout: IPageLayout) => void;
  onEditWebPart: (index: number) => void;
  onDeleteWebPart: (index: number) => void;
  locale?: string;
}

/** Layouts in SharePoint's "add section" menu, in its order */
const SECTION_MENU: { layout: SectionLayout | 'flexible'; label: string }[] = [
  { layout: 'flexible', label: 'Flexible' },
  { layout: 'oneColumn', label: 'One column' },
  { layout: 'twoColumns', label: 'Two columns' },
  { layout: 'threeColumns', label: 'Three columns' },
  { layout: 'oneThirdLeft', label: 'One-third left' },
  { layout: 'oneThirdRight', label: 'One-third right' },
  { layout: 'fullWidth', label: 'Full-width section' },
  { layout: 'vertical', label: 'Vertical section' },
];

export const LAYOUT_LABELS: Record<SectionLayout, string> = {
  oneColumn: 'One column',
  twoColumns: 'Two columns',
  threeColumns: 'Three columns',
  oneThirdLeft: 'One-third left',
  oneThirdRight: 'One-third right',
  fullWidth: 'Full-width section',
  vertical: 'Vertical section',
};

let instanceCounter = 0;

export const SharePointCanvas: FC<ISharePointCanvasProps> = ({
  manifests,
  activeWebParts,
  pageLayout,
  onPageLayoutChange,
  onEditWebPart,
  onDeleteWebPart,
  locale,
}) => {
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [sectionMenuAt, setSectionMenuAt] = useState<{ index: number; target: HTMLElement } | null>(
    null,
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [settingsSectionId, setSettingsSectionId] = useState<string | null>(null);

  const webPartsById = useMemo(() => {
    const map = new Map<string, { webPart: IWebPartConfig; index: number }>();
    activeWebParts.forEach((webPart, index) => map.set(webPart.instanceId, { webPart, index }));
    return map;
  }, [activeWebParts]);

  const horizontal = pageLayout.sections.filter((s) => s.layout !== 'vertical');
  const vertical = pageLayout.sections.find((s) => s.layout === 'vertical');
  const settingsSection = pageLayout.sections.find((s) => s.id === settingsSectionId);

  const addWebPart = (
    section: ISection,
    columnIndex: number,
    position: number,
    manifestIndex: number,
    preconfiguredEntryIndex?: number,
  ) => {
    setOpenPicker(null);
    const instanceId = `wp-${Date.now()}-${++instanceCounter}`;
    // Place it first, so the runtime knows its section (and design) before it renders
    onPageLayoutChange(placeWebPart(pageLayout, section.id, columnIndex, position, instanceId));
    window.dispatchEvent(
      new CustomEvent('addWebPart', {
        detail: {
          insertIndex: activeWebParts.length,
          manifestIndex,
          preconfiguredEntryIndex,
          instanceId,
        },
      }),
    );
  };

  const deleteSection = (section: ISection) => {
    const { page, removed } = removeSection(pageLayout, section.id);
    onPageLayoutChange(page);
    for (const id of removed) {
      if (webPartsById.has(id)) {
        window.dispatchEvent(new CustomEvent('deleteWebPartById', { detail: { instanceId: id } }));
      }
    }
    if (settingsSectionId === section.id) {
      setSettingsSectionId(null);
    }
  };

  const renderSection = (section: ISection, index: number) => (
    <SectionView
      key={section.id}
      section={section}
      isSelected={selectedSectionId === section.id}
      onSelect={() => setSelectedSectionId(section.id)}
      onOpenSettings={() => {
        setSelectedSectionId(section.id);
        setSettingsSectionId(section.id);
      }}
      onMove={
        section.layout === 'vertical'
          ? undefined
          : (direction) => onPageLayoutChange(moveSection(pageLayout, section.id, direction))
      }
      canMoveUp={index > 0}
      canMoveDown={index < horizontal.length - 1}
      onDelete={() => deleteSection(section)}
    >
      {section.columns.map((column, columnIndex) => {
        const pickerKey = `${section.id}:${columnIndex}`;
        return (
          <div
            key={columnIndex}
            className={css('CanvasSection', styles.column)}
            style={{ flexBasis: `${(COLUMN_SPANS[section.layout][columnIndex] / 12) * 100}%` }}
          >
            {column.map((instanceId) => {
              const entry = webPartsById.get(instanceId);
              if (!entry) {
                return null;
              }
              return (
                <WebPartZone
                  key={instanceId}
                  variant="sharepoint"
                  webPart={entry.webPart}
                  title={getWebPartTitle(entry.webPart, locale)}
                  onEdit={() => onEditWebPart(entry.index)}
                  onDelete={() => onDeleteWebPart(entry.index)}
                />
              );
            })}
            <div className={column.length === 0 ? styles.emptyColumn : styles.columnAddZone}>
              <AddZone
                insertIndex={columnIndex}
                isOpen={openPicker === pickerKey}
                manifests={manifests}
                locale={locale}
                onAddClick={() => setOpenPicker(openPicker === pickerKey ? null : pickerKey)}
                onSelect={(manifestIndex, _location, preconfiguredEntryIndex) =>
                  addWebPart(
                    section,
                    columnIndex,
                    column.length,
                    manifestIndex,
                    preconfiguredEntryIndex,
                  )
                }
              />
            </div>
          </div>
        );
      })}
    </SectionView>
  );

  const addSectionButton = (index: number) => (
    <div className={styles.addSectionLine}>
      <button
        className={styles.addSectionButton}
        title="Add a new section"
        aria-label="Add a new section"
        onClick={(e) => setSectionMenuAt({ index, target: e.currentTarget })}
      >
        <Icon iconName="Add" />
      </button>
    </div>
  );

  return (
    <>
      <div id="canvas" className={css(styles.page, vertical && styles.withVertical)}>
        <div className={styles.main}>
          {horizontal.map((section, index) => (
            <Fragment key={section.id}>
              {addSectionButton(index)}
              {renderSection(section, index)}
            </Fragment>
          ))}
          {addSectionButton(horizontal.length)}
        </div>
        {vertical && <aside className={styles.vertical}>{renderSection(vertical, 0)}</aside>}
      </div>

      {openPicker !== null && (
        <div className={styles.overlay} onClick={() => setOpenPicker(null)} />
      )}

      {sectionMenuAt && (
        <Callout
          target={sectionMenuAt.target}
          directionalHint={DirectionalHint.bottomCenter}
          onDismiss={() => setSectionMenuAt(null)}
          isBeakVisible
          gapSpace={4}
          setInitialFocus
        >
          <div className={styles.sectionMenu} role="menu" aria-label="Section layouts">
            {SECTION_MENU.map((item) => {
              const disabled =
                item.layout === 'flexible' || !canAddSection(pageLayout, item.layout);
              return (
                <button
                  key={item.layout}
                  role="menuitem"
                  className={styles.sectionMenuItem}
                  disabled={disabled}
                  title={
                    item.layout === 'flexible'
                      ? 'Flexible sections are not available in the local workbench'
                      : item.label
                  }
                  aria-label={`Add section layout ${item.label}`}
                  onClick={() => {
                    if (item.layout !== 'flexible') {
                      onPageLayoutChange(addSection(pageLayout, sectionMenuAt.index, item.layout));
                    }
                    setSectionMenuAt(null);
                  }}
                >
                  <LayoutIcon layout={item.layout} size={28} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </Callout>
      )}

      <Panel
        isOpen={!!settingsSection}
        type={PanelType.custom}
        customWidth="320px"
        isBlocking={false}
        headerText="Section"
        closeButtonAriaLabel="Close"
        onDismiss={() => setSettingsSectionId(null)}
      >
        {settingsSection && (
          <Pivot aria-label="Section settings">
            <PivotItem headerText="Layout">
              <SectionLayoutPane
                section={settingsSection}
                onLayoutChange={(layout) =>
                  onPageLayoutChange(changeSectionLayout(pageLayout, settingsSection.id, layout))
                }
              />
            </PivotItem>
            <PivotItem headerText="Design">
              <SectionDesignPane
                design={getSectionDesign(settingsSection) ?? {}}
                onChange={(design) =>
                  onPageLayoutChange(setSectionDesign(pageLayout, settingsSection.id, design))
                }
              />
            </PivotItem>
          </Pivot>
        )}
      </Panel>
    </>
  );
};

interface ISectionViewProps {
  section: ISection;
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
  onMove?: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}

const SectionView: FC<ISectionViewProps> = ({
  section,
  isSelected,
  onSelect,
  onOpenSettings,
  onMove,
  canMoveUp,
  canMoveDown,
  onDelete,
  children,
}) => {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [themeVersion, setThemeVersion] = useState(0);
  const design = getSectionDesign(section);
  const designKey = JSON.stringify(design ?? null);

  // The section's theme colours are a theme variant; its CSS custom properties cascade to the web parts
  useEffect(() => {
    const onThemeChanged = () => setThemeVersion((v) => v + 1);
    window.addEventListener('workbenchSectionThemeChanged', onThemeChanged);
    return () => window.removeEventListener('workbenchSectionThemeChanged', onThemeChanged);
  }, []);

  useLayoutEffect(() => {
    if (zoneRef.current) {
      applySectionTheme(zoneRef.current, design);
    }
  }, [designKey, themeVersion]);

  const className = [
    'CanvasZone',
    styles.section,
    section.layout === 'fullWidth' ? `CanvasZone--fullWidth ${styles.fullWidth}` : '',
    section.layout === 'vertical' ? `CanvasVerticalSection ${styles.verticalSection}` : '',
    isSelected ? styles.sectionSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const overlayStyle = getSectionOverlayStyle(design);

  return (
    <div
      ref={zoneRef}
      className={className}
      style={getSectionBackgroundStyle(design)}
      data-theme-emphasis={getSectionEmphasis(design)}
      data-section-layout={section.layout}
      onPointerDownCapture={onSelect}
    >
      {overlayStyle && (
        <div className={styles.sectionOverlay} style={overlayStyle} aria-hidden="true" />
      )}
      <div
        className={styles.toolbarBar}
        role="toolbar"
        aria-label={`${LAYOUT_LABELS[section.layout]} toolbar`}
      >
        <IconButton
          iconProps={{ iconName: 'Equalizer' }}
          title="Edit section"
          ariaLabel="Edit section"
          onClick={onOpenSettings}
        />
        {onMove && (
          <>
            <IconButton
              iconProps={{ iconName: 'Up' }}
              title="Move section up"
              ariaLabel="Move section up"
              disabled={!canMoveUp}
              onClick={() => onMove(-1)}
            />
            <IconButton
              iconProps={{ iconName: 'Down' }}
              title="Move section down"
              ariaLabel="Move section down"
              disabled={!canMoveDown}
              onClick={() => onMove(1)}
            />
          </>
        )}
        <IconButton
          iconProps={{ iconName: 'Delete' }}
          title="Delete section"
          ariaLabel="Delete section"
          onClick={onDelete}
        />
      </div>
      <div className={css('CanvasZoneSectionContainer', styles.sectionContainer)}>{children}</div>
    </div>
  );
};

const SectionLayoutPane: FC<{
  section: ISection;
  onLayoutChange: (layout: SectionLayout) => void;
}> = ({ section, onLayoutChange }) => {
  if (!COLUMN_LAYOUTS.includes(section.layout)) {
    return (
      <p className={styles.settingsNote}>
        {LAYOUT_LABELS[section.layout]}: the column layout of this section can't be changed.
      </p>
    );
  }
  return (
    <>
      <div className={styles.settingsLabel}>Columns</div>
      <div className={styles.layoutTiles} role="radiogroup" aria-label="Columns">
        {COLUMN_LAYOUTS.map((layout) => (
          <button
            key={layout}
            role="radio"
            aria-checked={section.layout === layout}
            aria-label={LAYOUT_LABELS[layout]}
            className={css(
              styles.layoutTile,
              section.layout === layout && styles.layoutTileSelected,
            )}
            onClick={() => onLayoutChange(layout)}
          >
            <LayoutIcon layout={layout} size={24} />
            <span>{LAYOUT_LABELS[layout]}</span>
          </button>
        ))}
      </div>
    </>
  );
};

function getWebPartTitle(webPart: IWebPartConfig, locale?: string): string {
  const entries = (webPart.manifest as any).preconfiguredEntries;
  const entry = entries?.[webPart.preconfiguredEntryIndex ?? 0] ?? entries?.[0];
  return getLocalizedString(entry?.title, locale) || webPart.manifest.alias;
}

// SharePoint icon font
//
// SharePoint Online registers the Fluent UI icon names against its own "Fluent MDL2 Hybrid Icons"
// font before any web part loads. Fluent keeps the first registration of each icon name, so web
// parts that call initializeIcons() still draw SharePoint's glyphs there. The workbench registers
// the classic Fabric MDL2 font instead, so icons look different from SharePoint.
//
// This moves the registered MDL2 icons to the hybrid font (same code points), except the ones
// SharePoint itself keeps on the classic font because the hybrid font has no glyph for them.

const HYBRID_FONT_FAMILY = '"Fluent MDL2 Hybrid Icons"';

// Public Microsoft CDN file that SharePoint Online loads for this font
const HYBRID_FONT_URL =
  'https://res.public.onecdn.static.microsoft/files/sp-client/fluent-hybrid-icons-62a09271_025fd67aaa8b7070383f.woff';

// Icons SharePoint keeps on the classic Fabric MDL2 font (observed on SharePoint Online, 2026-10)
const KEEP_CLASSIC = new Set([
  'azurelogo',
  'visualstudiologo',
  'accesslogofill',
  'wordlogofill',
  'excellogofill',
  'onenotelogofill',
  'outlooklogofill',
  'powerpointlogofill',
  'publisherlogofill',
  'teamslogofill',
  'sharepointlogofill',
  'exchangelogofill',
  'visiologofill',
  'wordlogofill16',
  'powerpointlogofill16',
  'excellogofill16',
  'onenotelogofill16',
  'outlooklogofill16',
  'publisherlogofill16',
  'visiologofill16',
  'crmcustomerinsightsapp',
  'teamslogofill16',
  'officeformslogofill',
  'officeformslogofill16',
  'officeformslogofill24',
  'projectlogofill32',
  'projectlogofill16',
  'microsoftflowlogo',
  'visualstudioidelogo32',
  'd365talenthrcore',
  'visioonlinelogofill32',
  'visioonlinelogo32',
  'visioonlinelogocloud32',
  'decreaseindentlegacy',
  'increaseindentlegacy',
  // Office app logos SharePoint draws from its separate "App Icons" font
  'sharepointlogo',
  'sharepointlogoinverse',
  'teamslogo',
  'teamslogoinverse',
  'outlooklogo',
  'outlooklogoinverse',
  'onedrivelogo',
  'wordlogo',
  'wordlogoinverse',
  'excellogo',
  'excellogoinverse',
  'powerpointlogo',
  'powerpointlogoinverse',
  'onenotelogo',
  'onenotelogoinverse',
  'defenderapp',
]);

interface IIconRecordLike {
  code?: string;
  subset?: { fontFace?: { fontFamily?: string } };
}

/**
 * Must run after the workbench's initializeIcons() and before any web part bundle loads.
 * Returns how many icons were moved to the hybrid font.
 */
export function applySharePointIconFont(): number {
  const registry = (window as any).__globalSettings__?.icons as
    | Record<string, IIconRecordLike>
    | undefined;
  if (!registry) {
    return 0;
  }

  // One subset object for all moved icons: Fluent registers its @font-face and class once, on first use
  const hybridSubset = {
    fontFace: {
      fontFamily: HYBRID_FONT_FAMILY,
      src: `url('${HYBRID_FONT_URL}') format('woff')`,
    },
    style: {
      MozOsxFontSmoothing: 'grayscale',
      WebkitFontSmoothing: 'antialiased',
      fontStyle: 'normal',
      fontWeight: 'normal',
      speak: 'none',
    },
  };

  let moved = 0;
  for (const name of Object.keys(registry)) {
    if (name.startsWith('__') || KEEP_CLASSIC.has(name)) {
      continue;
    }
    const record = registry[name];
    const family = record?.subset?.fontFace?.fontFamily;
    if (record?.code && family && /FabricMDL2Icons/.test(family)) {
      record.subset = hybridSubset;
      moved++;
    }
  }
  return moved;
}

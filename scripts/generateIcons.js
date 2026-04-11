#!/usr/bin/env node

/**
 * Icon Font Generator
 * 
 * Generates a subset WOFF font file containing only the required icon glyphs.
 * This reduces the font file size by including only the icons we actually use.
 * 
 * Usage:
 *   node scripts/generateIcons.js
 *   npm run generate:icons
 */

const subsetFont = require('subset-font');
const fs = require('fs');
const path = require('path');

// List of required icon glyphs (Unicode codepoints in hex)
// You can copy these from flicon.io 
const REQUIRED_GLYPHS = [
    0xF3A5, // TestBeaker icon
    0xF3A6, // TestBeakerSolid icon
    0xF3AC, // TestStep icon
    0xF2B7, // LocaleLanguage icon
    0xE895, // Sync icon
    0xEC7A, // DeveloperTools icon
    0xEA99, // Broom icon
];

const INPUT_FONT = path.join(__dirname, 'FabExMDL2.3.36.woff');
const OUTPUT_FONT = path.join(__dirname, '../media/icons.woff');

async function generateIconFont() {
    try {
        console.log('Generating icon font...');
        console.log(`Input: ${INPUT_FONT}`);
        console.log(`Output: ${OUTPUT_FONT}`);
        console.log(`Glyphs: ${REQUIRED_GLYPHS.length} icons`);
        console.log('');

        // Read the source font
        const inputBuffer = fs.readFileSync(INPUT_FONT);

        // Convert codepoints to a string of characters
        const glyphText = REQUIRED_GLYPHS.map(cp => String.fromCodePoint(cp)).join('');

        // Generate subset with only required glyphs
        const outputBuffer = await subsetFont(inputBuffer, glyphText, {
            targetFormat: 'woff'
        });

        // Write the output font
        fs.writeFileSync(OUTPUT_FONT, outputBuffer);

        const inputSize = (inputBuffer.length / 1024).toFixed(1);
        const outputSize = (outputBuffer.length / 1024).toFixed(1);
        const savings = (((inputBuffer.length - outputBuffer.length) / inputBuffer.length) * 100).toFixed(1);

        console.log('✓ Icon font generated successfully');
        console.log(`  Input size:  ${inputSize}KB`);
        console.log(`  Output size: ${outputSize}KB`);
        console.log(`  Savings:     ${savings}%`);
    } catch (error) {
        console.error('Error generating icon font:', error.message);
        process.exit(1);
    }
}

generateIconFont();

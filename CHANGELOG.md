# CHANGELOG

## [0.1.0]

### Added
- Default color props now take values directly from the original SVG (e.g., `color = "#FF0000"`).
- Full-file fallback: if no text is selected, the entire SVG file is used.
- `xmlns` attribute is now removed from output.
- Component export changed to `export default`.

### Fixed
- Improved `detectUsedElements` to ensure correct imports.

### Changed
- `IconProps` now includes default values for `color` and `size`.
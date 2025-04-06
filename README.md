# React Native SVG Converter

🚀 A VS Code extension that converts **SVG files** into **React Native components** using `react-native-svg`.

## Features

- ✅ Converts **SVG to React Native components** automatically  
- ✅ Detects and replaces **multiple colors** (`fill`, `stroke`) with dynamic props (`color`, `color2`, etc.), with default values taken from original SVG  
- ✅ Dynamically sets **size** based on `width` and `height`:  
  - If equal → `size: number`  
  - If different → `size: [width, height]`  
- ✅ Automatically **imports only used SVG elements**  
- ✅ Converts **SVG attributes** to React Native format:  
  - `stroke-width` → `strokeWidth`  
  - `clip-path` → `clipPath`  
  - `stroke-linecap` → `strokeLinecap`  
  - `stroke-miterlimit` → `strokeMiterlimit`  
  - `stroke-linejoin` → `strokeLinejoin`  
- ✅ Removes `xmlns` from the output  
- ✅ **Renames** files to PascalCase + `Icon` (e.g., `flag icon.svg` → `FlagIcon.tsx`)  

## Usage

1. Open an **SVG file** in VS Code  
2. **Select the SVG code** (or leave empty to use the whole file)  
3. Open **Command Palette** (`Ctrl+Shift+P`)  
4. Run:  
   ```
   Convert SVG to React Native Component
   ```
5. The component is saved in the same directory as `<FileName>Icon.tsx`  

## Example Output

**Input SVG:**  
```xml
<svg width="100" height="100" viewBox="0 0 100 100" fill="none">
  <circle cx="50" cy="50" r="40" fill="#FF0000" stroke="black" stroke-width="2"/>
</svg>
```

**Generated React Native Component:**  
```tsx
import React from "react";
import { Svg, Circle } from "react-native-svg";

type IconProps = { color?: string; color2?: string; color3?: string; size?: number };

const ExampleIcon = ({ color = "none", color2 = "#FF0000", color3 = "black", size = 100 }: IconProps) => {
  return (<Svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
  <Circle cx="50" cy="50" r="40" fill={color2} stroke={color3} strokeWidth="2"/>
</Svg>);
};

export default ExampleIcon
```

## License

MIT License.

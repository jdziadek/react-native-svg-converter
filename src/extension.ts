import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

function toCamelCase(fileName: string): string {
  return fileName
    .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
    .replace(/\.tsx?$/, "")
    .replace(/^\w/, (c) => c.toUpperCase()) + "Icon";
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "react-native-svg-converter" is now active!');

  const disposable = vscode.commands.registerCommand(
    "react-native-svg-converter.convertSvgToReactNativeComponent",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found!");
        return;
      }

      const document = editor.document;
      const selection = editor.selection;
      let text = editor.document.getText(selection);

      if (!text || text.trim().length === 0) {
        text = editor.document.getText();
      }

      if (!text.includes("<svg")) {
        vscode.window.showErrorMessage("Selected text is not an SVG!");
        return;
      }

      const filePath = document.uri.fsPath;
      const dirName = path.dirname(filePath);
      const fileName = path.basename(filePath, ".svg");
      const componentName = toCamelCase(fileName);
      const newFilePath = path.join(dirName, `${componentName}.tsx`);

      const converted = convertSvgToReactNativeComponent(text, componentName);

      try {
        fs.writeFileSync(newFilePath, converted, "utf8");

        const newFileUri = vscode.Uri.file(newFilePath);
        vscode.workspace.openTextDocument(newFileUri).then((doc) => {
          vscode.window.showTextDocument(doc);
        });

        vscode.window.showInformationMessage(`SVG converted and saved as ${componentName}.tsx!`);
      } catch (error) {
        vscode.window.showErrorMessage(`Error writing file: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

function extractColors(svgText: string): { colorProps: string[], colorTypeProps: string[], defaultColorProps: string[], modifiedSvg: string } {
  const colorRegex = /(stroke|fill)="(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)"/g;
  const colorMap = new Map<string, { attr: string, value: string }>();

  let match;
  let index = 0;
  while ((match = colorRegex.exec(svgText)) !== null) {
    const attr = match[1];
    const value = match[2];
    const varName = `color${index === 0 ? "" : index + 1}`;
    if (!Array.from(colorMap.values()).find((v) => v.value === value)) {
      colorMap.set(varName, { attr, value });
      index++;
    }
  }

  let modifiedSvg = svgText;
  for (const [varName, { value }] of colorMap) {
    modifiedSvg = modifiedSvg.replace(new RegExp(`(["'])${value}\\1`, "g"), `{${varName}}`);
  }

  const colorProps = Array.from(colorMap.keys());
  const colorTypeProps = colorProps.map((name) => `${name}?: string`);
  const defaultColorProps = Array.from(colorMap.entries()).map(
    ([name, { value }]) => `${name} = "${value}"`
  );

  return { colorProps, colorTypeProps, defaultColorProps, modifiedSvg };
}

function extractSize(svgText: string): { sizeProp: string, sizeType: string, modifiedSvg: string } {
  const sizeRegex = /width="(\d+)"\s+height="(\d+)"/;
  const sizeMatch = svgText.match(sizeRegex);
  let sizeProp = "size = 360";
  let sizeType = "number";
  let modifiedSvg = svgText;

  if (sizeMatch) {
    const width = Number(sizeMatch[1]);
    const height = Number(sizeMatch[2]);

    if (width === height) {
      sizeProp = `size = ${width}`;
      sizeType = "number";
      modifiedSvg = modifiedSvg.replace(sizeRegex, 'width={size} height={size}');
    } else {
      sizeProp = `size = [${width}, ${height}]`;
      sizeType = "[number, number]";
      modifiedSvg = modifiedSvg.replace(sizeRegex, 'width={size[0]} height={size[1]}');
    }
  }

  return { sizeProp, sizeType, modifiedSvg };
}

function detectUsedElements(svgText: string): Set<string> {
  const elements = [
    "Svg", "Path", "G", "Rect", "Circle", "Ellipse", "Line", "Polyline", "Polygon", "Defs", "Mask", "ClipPath"
  ];
  const usedElements = new Set<string>();

  elements.forEach((el) => {
    const regex = new RegExp(`<${el.toLowerCase()}[\\s>]+`, "i");
    if (regex.test(svgText)) {
      usedElements.add(el);
    }
  });

  return usedElements;
}

function formatSvgForReactNative(svgText: string): string {
  const REPLACE_MAP: Record<string, string> = {
    "<svg": "<Svg",
    "</svg>": "</Svg>",
    "<path": "<Path",
    "</path>": "</Path>",
    "<g": "<G",
    "</g>": "</G>",
    "<rect": "<Rect",
    "</rect>": "</Rect>",
    "<circle": "<Circle",
    "</circle>": "</Circle>",
    "<ellipse": "<Ellipse",
    "</ellipse>": "</Ellipse>",
    "<line": "<Line",
    "</line>": "</Line>",
    "<polyline": "<Polyline",
    "</polyline>": "</Polyline>",
    "<polygon": "<Polygon",
    "</polygon>": "</Polygon>",
    "<defs": "<Defs",
    "</defs>": "</Defs>",
    "<mask": "<Mask",
    "</mask>": "</Mask>",
    "<clipPath": "<ClipPath",
    "</clipPath>": "</ClipPath>",
    "stroke-width=": "strokeWidth=",
    "stroke-linecap=": "strokeLinecap=",
    "stroke-miterlimit=": "strokeMiterlimit=",
    "stroke-linejoin=": "strokeLinejoin=",
    "clip-path=": "clipPath="
  };

  Object.entries(REPLACE_MAP).forEach(([key, value]) => {
    svgText = svgText.replace(new RegExp(key, "g"), value);
  });

  svgText = svgText.replace(/\s+xmlns(:\w+)?="[^"]+"/g, "");


  return svgText;
}

function convertSvgToReactNativeComponent(svgText: string, componentName: string): string {
  const { colorProps, colorTypeProps, defaultColorProps, modifiedSvg: svgWithColors } = extractColors(svgText);
  const { sizeProp, sizeType, modifiedSvg: svgWithSize } = extractSize(svgWithColors);
  const formattedSvg = formatSvgForReactNative(svgWithSize);
  const usedElements = detectUsedElements(formattedSvg);

  const importStatement = `import { ${Array.from(usedElements).join(", ")} } from "react-native-svg";`;


  return `import React from "react";
${importStatement}

type IconProps = { ${colorTypeProps.join("; ")}; size?: ${sizeType} };

const ${componentName} = ({ ${defaultColorProps.join(", ")}, ${sizeProp} }: IconProps) => {
  return (${formattedSvg});
};

export default ${componentName}`;
}

export function deactivate() { }
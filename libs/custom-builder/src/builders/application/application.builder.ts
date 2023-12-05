import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import {
  ApplicationBuilderOptions,
  buildApplication,
} from '@angular-devkit/build-angular';
import { BuildOutputFile } from '@angular-devkit/build-angular/src/tools/esbuild/bundler-context';
import { DomElementSchemaRegistry } from '@angular/compiler';
import * as fs from 'fs';

export default createBuilder(customApplicationBuilder);

function customApplicationBuilder(
  options: ApplicationBuilderOptions & CustomOptions,
  context: BuilderContext
): AsyncIterable<
  BuilderOutput & {
    outputFiles?: BuildOutputFile[];
    assetFiles?: { source: string; destination: string }[];
  }
> {
  console.log(
    '[@angularboost/custom-builder] customApplicationBuilder started'
  );
  const optionsHandler = new OptionsHandler(options);

  // Override hasElement method in DomElementSchemaRegistry
  const originalHasElement = DomElementSchemaRegistry.prototype.hasElement;
  DomElementSchemaRegistry.prototype.hasElement = function (
    tagName: string,
    schemaMetas: any[]
  ): boolean {
    if (
      optionsHandler.hasElementByPrefix(tagName) ||
      optionsHandler.hasElementByManifestFile(tagName)
    ) {
      return true;
    }

    return originalHasElement.call(this, tagName, schemaMetas);
  };

  // Call the original browser builder
  return buildApplication(options, context);
}

class OptionsHandler {
  private customElementsPrefixes: string[] = [];
  private manifestFileTagNames: string[] = [];

  constructor(options: CustomOptions) {
    const { customElementsPrefix, customElementsManifestFilePath } = options;
    console.log('Detected options:', {
      customElementsPrefix,
      customElementsManifestFilePath,
    });

    this.customElementsPrefixes = customElementsPrefix?.split(',') ?? [];

    if (customElementsManifestFilePath) {
      try {
        const customElementsManifestContent = fs.readFileSync(
          customElementsManifestFilePath,
          'utf8'
        );
        this.manifestFileTagNames = JSON.parse(customElementsManifestContent)
          .modules.flatMap((module) => module.declarations)
          .filter((declaration) => declaration.customElement)
          .map((declaration) => declaration.tagName);
      } catch (e) {
        console.error(
          '[custom-builder] Error reading ' + customElementsManifestFilePath,
          e
        );
      }
    }
  }

  public hasElementByPrefix(tagName: string): boolean {
    return (
      this.customElementsPrefixes.length > 0 &&
      this.customElementsPrefixes.some((customElementPrefix) =>
        tagName.startsWith(customElementPrefix)
      )
    );
  }

  public hasElementByManifestFile = (tagName: string) =>
    this.manifestFileTagNames.length > 0 &&
    this.manifestFileTagNames.some(
      (manifestFileTagName) => tagName === manifestFileTagName
    );
}

interface CustomOptions {
  // Also supports a comma separated list of prefixes
  customElementsPrefix: string;
  customElementsManifestFilePath: string;
  /**
   * TODO: next step is to add support for custom elements manifest json
   * https://github.com/webcomponents/custom-elements-manifest
   */
}

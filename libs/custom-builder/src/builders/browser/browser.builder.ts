import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import {
  BrowserBuilderOptions,
  executeBrowserBuilder,
} from '@angular-devkit/build-angular';
import { DomElementSchemaRegistry } from '@angular/compiler';
import { Observable } from 'rxjs';

export default createBuilder(customBrowserBuilder);

function customBrowserBuilder(
  options: BrowserBuilderOptions & CustomOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  console.log('[@angularboost/custom-builder] customBrowserBuilder started');
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
  return executeBrowserBuilder(options, context);
}

import * as fs from 'fs';
export class OptionsHandler {
  private customElementsPrefixes: string[] = [];
  private manifestFileTagNames: string[] = [];

  constructor(options: CustomOptions) {
    const { customElementsPrefix, customElementsManifestFilePath } = options;
    this.customElementsPrefixes = customElementsPrefix?.split(',');

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

export interface CustomOptions {
  // Also supports a comma separated list of prefixes
  customElementsPrefix: string;
  customElementsManifestFilePath: string;
  /**
   * TODO: next step is to add support for custom elements manifest json
   * https://github.com/webcomponents/custom-elements-manifest
   */
}

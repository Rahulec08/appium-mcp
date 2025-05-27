/**
 * Utility functions for configuration management
 */

import path from 'path';

/**
 * Deep merge two objects
 * 
 * @param target The target object to merge into
 * @param source The source object to merge from
 * @returns A new object with merged properties
 */
export function deepMerge<T extends object = object>(target: T, source: T): T {
  if (!source) {
    return target;
  }
  
  const output = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' && 
        source[key] !== null && 
        !Array.isArray(source[key])
      ) {
        output[key] = deepMerge(
          output[key] || {} as any, 
          source[key] as any
        );
      } else {
        output[key] = source[key];
      }
    }
  }
  
  return output;
}

/**
 * Convert a relative path to an absolute path
 * 
 * @param relativePath The relative path
 * @param basePath Optional base path (defaults to current working directory)
 * @returns The absolute path
 */
export function getAbsolutePath(relativePath: string, basePath?: string): string {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  
  return path.resolve(basePath || process.cwd(), relativePath);
}

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Utility to load a YAML file and return its contents as an object.
 */
export function loadYamlFile(filePath: string): any {
  if (!fs.existsSync(filePath)) return undefined;
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Utility to load all YAML files in a directory and return a map of filename (no ext) to object.
 */
export function loadYamlDirectory(dirPath: string): Record<string, any> {
  if (!fs.existsSync(dirPath)) return {};
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  const result: Record<string, any> = {};
  for (const file of files) {
    const key = path.basename(file, path.extname(file));
    result[key] = loadYamlFile(path.join(dirPath, file));
  }
  return result;
}

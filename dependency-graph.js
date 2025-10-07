#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DependencyGraphGenerator {
  constructor(rootPath = __dirname) {
    this.rootPath = rootPath;
    this.graph = new Map();
    this.files = new Map();
  }

  async generateGraph() {
    console.log('🕸️  Generating dependency graph...\n');
    
    await this.scanFiles();
    await this.buildGraph();
    await this.visualizeGraph();
    await this.generateMermaidDiagram();
  }

  async scanFiles() {
    const scanDir = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (['node_modules', '.git', 'dist', 'build'].includes(item)) continue;
        
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath, relPath);
        } else if (['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(fullPath))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          this.files.set(relPath, {
            content,
            imports: this.extractImports(content),
            exports: this.extractExports(content)
          });
        }
      }
    };
    
    scanDir(this.rootPath);
  }

  extractImports(content) {
    const imports = [];
    
    // ES6 imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))?\s*from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        type: match[1].startsWith('.') ? 'local' : 'external'
      });
    }
    
    // Dynamic imports
    const dynamicImportRegex = /import\(['"`]([^'"`]+)['"`]\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        type: match[1].startsWith('.') ? 'local' : 'external',
        dynamic: true
      });
    }
    
    return imports;
  }

  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push({ name: match[1], type: 'named' });
    }
    
    // Default exports
    const defaultExportRegex = /export\s+default\s+(?:function\s+(\w+)|class\s+(\w+)|(\w+))/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      exports.push({ 
        name: match[1] || match[2] || match[3] || 'default', 
        type: 'default' 
      });
    }
    
    return exports;
  }

  async buildGraph() {
    for (const [filePath, fileData] of this.files) {
      this.graph.set(filePath, {
        imports: fileData.imports.filter(imp => imp.type === 'local'),
        exports: fileData.exports,
        externalDeps: fileData.imports.filter(imp => imp.type === 'external')
      });
    }
  }

  async visualizeGraph() {
    console.log('📊 DEPENDENCY GRAPH VISUALIZATION');
    console.log('=' .repeat(50));
    
    for (const [filePath, data] of this.graph) {
      console.log(`\n📄 ${filePath}`);
      
      if (data.exports.length > 0) {
        console.log('  Exports:');
        data.exports.forEach(exp => {
          console.log(`    • ${exp.name} (${exp.type})`);
        });
      }
      
      if (data.imports.length > 0) {
        console.log('  Local Imports:');
        data.imports.forEach(imp => {
          console.log(`    • ${imp.module}${imp.dynamic ? ' (dynamic)' : ''}`);
        });
      }
      
      if (data.externalDeps.length > 0) {
        console.log('  External Dependencies:');
        data.externalDeps.forEach(dep => {
          console.log(`    • ${dep.module}${dep.dynamic ? ' (dynamic)' : ''}`);
        });
      }
    }
    
    console.log('\n🔗 DEPENDENCY RELATIONSHIPS:');
    this.findCircularDependencies();
    this.findOrphanedFiles();
    this.findHeavilyImportedFiles();
  }

  findCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];
    
    const dfs = (file, path = []) => {
      if (recursionStack.has(file)) {
        const cycleStart = path.indexOf(file);
        cycles.push([...path.slice(cycleStart), file]);
        return;
      }
      
      if (visited.has(file)) return;
      
      visited.add(file);
      recursionStack.add(file);
      path.push(file);
      
      const fileData = this.graph.get(file);
      if (fileData) {
        fileData.imports.forEach(imp => {
          const resolvedPath = this.resolveImportPath(imp.module, file);
          if (resolvedPath && this.graph.has(resolvedPath)) {
            dfs(resolvedPath, [...path]);
          }
        });
      }
      
      recursionStack.delete(file);
      path.pop();
    };
    
    for (const file of this.graph.keys()) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }
    
    if (cycles.length > 0) {
      console.log('  ⚠️  Circular Dependencies Found:');
      cycles.forEach(cycle => {
        console.log(`    • ${cycle.join(' → ')}`);
      });
    } else {
      console.log('  ✅ No circular dependencies found');
    }
  }

  findOrphanedFiles() {
    const imported = new Set();
    
    for (const [, data] of this.graph) {
      data.imports.forEach(imp => {
        const resolved = this.resolveImportPath(imp.module);
        if (resolved) imported.add(resolved);
      });
    }
    
    const orphaned = [];
    for (const file of this.graph.keys()) {
      if (!imported.has(file) && !file.includes('main.jsx') && !file.includes('App.jsx')) {
        orphaned.push(file);
      }
    }
    
    if (orphaned.length > 0) {
      console.log('  🏝️  Potentially Orphaned Files:');
      orphaned.forEach(file => console.log(`    • ${file}`));
    }
  }

  findHeavilyImportedFiles() {
    const importCounts = new Map();
    
    for (const [, data] of this.graph) {
      data.imports.forEach(imp => {
        const resolved = this.resolveImportPath(imp.module);
        if (resolved) {
          importCounts.set(resolved, (importCounts.get(resolved) || 0) + 1);
        }
      });
    }
    
    const heavily = [...importCounts.entries()]
      .filter(([, count]) => count > 2)
      .sort(([, a], [, b]) => b - a);
    
    if (heavily.length > 0) {
      console.log('  🎯 Heavily Imported Files (potential for optimization):');
      heavily.forEach(([file, count]) => {
        console.log(`    • ${file} (${count} imports)`);
      });
    }
  }

  resolveImportPath(importPath, fromFile = '') {
    if (!importPath.startsWith('.')) return null;
    
    // Simple resolution - in a real project you'd want more sophisticated logic
    const basePath = path.dirname(fromFile);
    let resolved = path.normalize(path.join(basePath, importPath));
    
    // Try different extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (this.files.has(withExt)) return withExt;
    }
    
    return null;
  }

  async generateMermaidDiagram() {
    console.log('\n🎨 MERMAID DIAGRAM (copy to mermaid.live):');
    console.log('```mermaid');
    console.log('graph TD');
    
    for (const [filePath, data] of this.graph) {
      const nodeId = filePath.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = path.basename(filePath);
      
      console.log(`    ${nodeId}["${fileName}"]`);
      
      data.imports.forEach(imp => {
        const resolved = this.resolveImportPath(imp.module, filePath);
        if (resolved) {
          const targetId = resolved.replace(/[^a-zA-Z0-9]/g, '_');
          console.log(`    ${nodeId} --> ${targetId}`);
        }
      });
    }
    
    console.log('```');
  }
}

// Run the generator
const generator = new DependencyGraphGenerator();
generator.generateGraph().catch(console.error);
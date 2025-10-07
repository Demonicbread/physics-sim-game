#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectAnalyzer {
  constructor(rootPath = __dirname) {
    this.rootPath = rootPath;
    this.analysis = {
      structure: {},
      dependencies: { prod: {}, dev: {} },
      components: [],
      hooks: [],
      functions: [],
      imports: {},
      fileTypes: {},
      codeMetrics: {
        totalLines: 0,
        totalFiles: 0,
        jsxFiles: 0,
        jsFiles: 0,
        cssFiles: 0,
        configFiles: 0
      },
      issues: [],
      suggestions: []
    };
    this.excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
  }

  async analyze() {
    console.log('🔍 Analyzing project structure...\n');
    
    await this.analyzePackageJson();
    await this.scanDirectory(this.rootPath);
    await this.generateReport();
    
    return this.analysis;
  }

  async analyzePackageJson() {
    const packagePath = path.join(this.rootPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      this.analysis.dependencies.prod = pkg.dependencies || {};
      this.analysis.dependencies.dev = pkg.devDependencies || {};
      this.analysis.projectName = pkg.name;
      this.analysis.version = pkg.version;
      this.analysis.scripts = pkg.scripts || {};
    }
  }

  async scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (this.excludeDirs.includes(item)) continue;
      
      const fullPath = path.join(dir, item);
      const relPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await this.scanDirectory(fullPath, relPath);
      } else {
        await this.analyzeFile(fullPath, relPath);
      }
    }
  }

  async analyzeFile(filePath, relativePath) {
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    
    this.analysis.codeMetrics.totalFiles++;
    this.analysis.codeMetrics.totalLines += lines;
    
    // Count file types
    this.analysis.fileTypes[ext] = (this.analysis.fileTypes[ext] || 0) + 1;
    
    if (ext === '.jsx') this.analysis.codeMetrics.jsxFiles++;
    if (ext === '.js') this.analysis.codeMetrics.jsFiles++;
    if (ext === '.css') this.analysis.codeMetrics.cssFiles++;
    if (['package.json', 'vite.config.js', 'tailwind.config.js', '.gitignore'].includes(path.basename(filePath))) {
      this.analysis.codeMetrics.configFiles++;
    }

    // Analyze JS/JSX files
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      await this.analyzeJSFile(content, relativePath);
    }
  }

  async analyzeJSFile(content, filePath) {
    // Find imports
    const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
    importMatches.forEach(imp => {
      const match = imp.match(/from\s+['"`]([^'"`]+)['"`]/);
      if (match) {
        const module = match[1];
        if (!this.analysis.imports[module]) this.analysis.imports[module] = [];
        this.analysis.imports[module].push(filePath);
      }
    });

    // Find React components
    const componentMatches = content.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g) || [];
    componentMatches.forEach(comp => {
      const match = comp.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
      if (match) {
        this.analysis.components.push({
          name: match[1],
          file: filePath,
          type: comp.startsWith('function') ? 'function' : 'const'
        });
      }
    });

    // Find hooks
    const hookMatches = content.match(/use[A-Z][a-zA-Z0-9]*/g) || [];
    hookMatches.forEach(hook => {
      if (!this.analysis.hooks.includes(hook)) {
        this.analysis.hooks.push(hook);
      }
    });

    // Find functions
    const functionMatches = content.match(/(?:const|function)\s+([a-z][a-zA-Z0-9]*)/g) || [];
    functionMatches.forEach(func => {
      const match = func.match(/(?:const|function)\s+([a-z][a-zA-Z0-9]*)/);
      if (match) {
        this.analysis.functions.push({
          name: match[1],
          file: filePath
        });
      }
    });

    // Check for potential issues
    if (content.includes('console.log')) {
      this.analysis.issues.push(`Console.log found in ${filePath}`);
    }
    if (content.includes('// TODO') || content.includes('// FIXME')) {
      this.analysis.issues.push(`TODO/FIXME comment found in ${filePath}`);
    }
    if (content.match(/useEffect\([^,]*,\s*\[\s*\]/)) {
      this.analysis.issues.push(`Empty dependency array useEffect in ${filePath} - potential infinite re-render`);
    }
  }

  async generateReport() {
    console.log('📊 PROJECT ANALYSIS REPORT');
    console.log('=' .repeat(50));
    
    console.log('\n📁 PROJECT OVERVIEW:');
    console.log(`Name: ${this.analysis.projectName || 'Unknown'}`);
    console.log(`Version: ${this.analysis.version || 'Unknown'}`);
    console.log(`Total Files: ${this.analysis.codeMetrics.totalFiles}`);
    console.log(`Total Lines: ${this.analysis.codeMetrics.totalLines}`);
    
    console.log('\n📦 DEPENDENCIES:');
    console.log('Production:', Object.keys(this.analysis.dependencies.prod).length);
    Object.entries(this.analysis.dependencies.prod).forEach(([name, version]) => {
      console.log(`  • ${name}: ${version}`);
    });
    console.log('Development:', Object.keys(this.analysis.dependencies.dev).length);
    Object.entries(this.analysis.dependencies.dev).slice(0, 5).forEach(([name, version]) => {
      console.log(`  • ${name}: ${version}`);
    });
    
    console.log('\n🧩 COMPONENTS:');
    this.analysis.components.forEach(comp => {
      console.log(`  • ${comp.name} (${comp.type}) in ${comp.file}`);
    });
    
    console.log('\n🪝 REACT HOOKS USED:');
    [...new Set(this.analysis.hooks)].forEach(hook => {
      console.log(`  • ${hook}`);
    });
    
    console.log('\n📄 FILE BREAKDOWN:');
    Object.entries(this.analysis.fileTypes).forEach(([ext, count]) => {
      console.log(`  • ${ext || 'no extension'}: ${count} files`);
    });
    
    console.log('\n📥 IMPORT ANALYSIS:');
    Object.entries(this.analysis.imports).slice(0, 10).forEach(([module, files]) => {
      console.log(`  • ${module} (used in ${files.length} files)`);
    });
    
    if (this.analysis.issues.length > 0) {
      console.log('\n⚠️  POTENTIAL ISSUES:');
      this.analysis.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    console.log('\n💡 SUGGESTIONS:');
    this.generateSuggestions();
    this.analysis.suggestions.forEach(suggestion => {
      console.log(`  • ${suggestion}`);
    });
    
    console.log('\n🎯 ARCHITECTURE INSIGHTS:');
    this.generateArchitectureInsights();
  }

  generateSuggestions() {
    // Check for missing dependencies
    if (this.analysis.imports['react'] && !this.analysis.dependencies.prod['react']) {
      this.analysis.suggestions.push('React is imported but not in dependencies');
    }
    
    // Check for unused dependencies
    const usedModules = Object.keys(this.analysis.imports);
    Object.keys(this.analysis.dependencies.prod).forEach(dep => {
      if (!usedModules.includes(dep) && !['@prisma/client'].includes(dep)) {
        this.analysis.suggestions.push(`Potentially unused dependency: ${dep}`);
      }
    });
    
    // Performance suggestions
    if (this.analysis.codeMetrics.jsxFiles > 5) {
      this.analysis.suggestions.push('Consider code splitting for better performance');
    }
    
    // Code organization
    if (this.analysis.components.length > 10) {
      this.analysis.suggestions.push('Consider organizing components into subdirectories');
    }
  }

  generateArchitectureInsights() {
    console.log('  • Framework: React with Vite (modern, fast development)');
    console.log('  • Styling: Tailwind CSS (utility-first approach)');
    console.log('  • Physics: Matter.js (2D physics engine)');
    console.log('  • Database: Prisma + PostgreSQL (not yet integrated)');
    console.log('  • State Management: React hooks (useState, useEffect, useRef)');
    console.log('  • Architecture Pattern: Single-page application with client-side routing');
    
    if (this.analysis.components.length < 5) {
      console.log('  • Scale: Small project, good for prototyping');
    } else if (this.analysis.components.length < 15) {
      console.log('  • Scale: Medium project, consider modularization');
    } else {
      console.log('  • Scale: Large project, needs architectural planning');
    }
  }
}

// Run the analyzer
const analyzer = new ProjectAnalyzer();
analyzer.analyze().catch(console.error);
// ============================================================================
// SVG Importer - Convert SVG to Lottie shapes
// ============================================================================

import type { ShapePath, ShapeElement, FillShape, StrokeShape, GroupShape, PathShape, TransformShape } from '../types';
import { staticProperty, hexToRgba } from '../utils';

export interface SVGImportOptions {
  width?: number;
  height?: number;
  centerOrigin?: boolean;
}

export interface ParsedSVGShape {
  type: 'path' | 'rect' | 'circle' | 'ellipse' | 'polygon' | 'line' | 'polyline';
  path: ShapePath;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  transform?: { x: number; y: number; scale: number; rotation: number };
}

export class SVGImporter {

  // --------------------------------------------------------------------------
  // Parse SVG Path Data (d attribute)
  // --------------------------------------------------------------------------

  static parseSVGPath(d: string): ShapePath {
    const vertices: number[][] = [];
    const inTangents: number[][] = [];
    const outTangents: number[][] = [];

    // Normalize path data
    const normalized = d
      .replace(/([A-Za-z])/g, ' $1 ')
      .replace(/,/g, ' ')
      .replace(/-/g, ' -')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = normalized.split(' ').filter(t => t.length > 0);

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    let lastCommand = '';
    let lastControlX = 0;
    let lastControlY = 0;
    let i = 0;

    const getNum = (): number => {
      const num = parseFloat(tokens[i++]);
      return isNaN(num) ? 0 : num;
    };

    while (i < tokens.length) {
      let command = tokens[i];

      // Check if it's a command or continuation
      if (/^[A-Za-z]$/.test(command)) {
        i++;
      } else {
        // Continuation of previous command
        command = lastCommand;
      }

      const isRelative = command === command.toLowerCase();
      const cmd = command.toUpperCase();

      switch (cmd) {
        case 'M': { // Move to
          const x = getNum() + (isRelative ? currentX : 0);
          const y = getNum() + (isRelative ? currentY : 0);
          currentX = startX = x;
          currentY = startY = y;
          vertices.push([x, y]);
          inTangents.push([0, 0]);
          outTangents.push([0, 0]);
          lastCommand = isRelative ? 'l' : 'L'; // Subsequent coords are lineto
          break;
        }

        case 'L': { // Line to
          const x = getNum() + (isRelative ? currentX : 0);
          const y = getNum() + (isRelative ? currentY : 0);
          // Update previous point's out tangent
          if (outTangents.length > 0) {
            outTangents[outTangents.length - 1] = [0, 0];
          }
          currentX = x;
          currentY = y;
          vertices.push([x, y]);
          inTangents.push([0, 0]);
          outTangents.push([0, 0]);
          lastCommand = command;
          break;
        }

        case 'H': { // Horizontal line
          const x = getNum() + (isRelative ? currentX : 0);
          currentX = x;
          vertices.push([x, currentY]);
          inTangents.push([0, 0]);
          outTangents.push([0, 0]);
          lastCommand = command;
          break;
        }

        case 'V': { // Vertical line
          const y = getNum() + (isRelative ? currentY : 0);
          currentY = y;
          vertices.push([currentX, y]);
          inTangents.push([0, 0]);
          outTangents.push([0, 0]);
          lastCommand = command;
          break;
        }

        case 'C': { // Cubic bezier
          const cp1x = getNum() + (isRelative ? currentX : 0);
          const cp1y = getNum() + (isRelative ? currentY : 0);
          const cp2x = getNum() + (isRelative ? currentX : 0);
          const cp2y = getNum() + (isRelative ? currentY : 0);
          const x = getNum() + (isRelative ? currentX : 0);
          const y = getNum() + (isRelative ? currentY : 0);

          // Out tangent of previous point (relative to that point)
          if (outTangents.length > 0) {
            outTangents[outTangents.length - 1] = [cp1x - currentX, cp1y - currentY];
          }

          currentX = x;
          currentY = y;
          vertices.push([x, y]);
          // In tangent of new point (relative to new point)
          inTangents.push([cp2x - x, cp2y - y]);
          outTangents.push([0, 0]);

          lastControlX = cp2x;
          lastControlY = cp2y;
          lastCommand = command;
          break;
        }

        case 'S': { // Smooth cubic bezier
          // First control point is reflection of last control point
          let cp1x = currentX;
          let cp1y = currentY;
          if (lastCommand.toUpperCase() === 'C' || lastCommand.toUpperCase() === 'S') {
            cp1x = 2 * currentX - lastControlX;
            cp1y = 2 * currentY - lastControlY;
          }

          const cp2x = getNum() + (isRelative ? currentX : 0);
          const cp2y = getNum() + (isRelative ? currentY : 0);
          const x = getNum() + (isRelative ? currentX : 0);
          const y = getNum() + (isRelative ? currentY : 0);

          if (outTangents.length > 0) {
            outTangents[outTangents.length - 1] = [cp1x - currentX, cp1y - currentY];
          }

          currentX = x;
          currentY = y;
          vertices.push([x, y]);
          inTangents.push([cp2x - x, cp2y - y]);
          outTangents.push([0, 0]);

          lastControlX = cp2x;
          lastControlY = cp2y;
          lastCommand = command;
          break;
        }

        case 'Q': { // Quadratic bezier - convert to cubic
          const cpx = getNum() + (isRelative ? currentX : 0);
          const cpy = getNum() + (isRelative ? currentY : 0);
          const x = getNum() + (isRelative ? currentX : 0);
          const y = getNum() + (isRelative ? currentY : 0);

          // Convert quadratic to cubic control points
          const cp1x = currentX + (2/3) * (cpx - currentX);
          const cp1y = currentY + (2/3) * (cpy - currentY);
          const cp2x = x + (2/3) * (cpx - x);
          const cp2y = y + (2/3) * (cpy - y);

          if (outTangents.length > 0) {
            outTangents[outTangents.length - 1] = [cp1x - currentX, cp1y - currentY];
          }

          currentX = x;
          currentY = y;
          vertices.push([x, y]);
          inTangents.push([cp2x - x, cp2y - y]);
          outTangents.push([0, 0]);

          lastControlX = cpx;
          lastControlY = cpy;
          lastCommand = command;
          break;
        }

        case 'Z': { // Close path
          // Don't add a new vertex, just mark as closed
          lastCommand = command;
          break;
        }

        default:
          // Skip unknown commands
          i++;
          break;
      }
    }

    const closed = lastCommand.toUpperCase() === 'Z';

    return {
      c: closed,
      v: vertices,
      i: inTangents,
      o: outTangents,
    };
  }

  // --------------------------------------------------------------------------
  // Parse Simple SVG Elements
  // --------------------------------------------------------------------------

  static parseRect(x: number, y: number, width: number, height: number, rx = 0): ShapePath {
    if (rx > 0) {
      // Rounded rectangle - use bezier approximation
      const k = 0.5522847498; // Bezier circle constant
      const r = Math.min(rx, width / 2, height / 2);
      const kr = r * k;

      return {
        c: true,
        v: [
          [x + r, y],
          [x + width - r, y],
          [x + width, y + r],
          [x + width, y + height - r],
          [x + width - r, y + height],
          [x + r, y + height],
          [x, y + height - r],
          [x, y + r],
        ],
        i: [
          [-kr, 0], [0, 0], [0, -kr], [0, 0], [kr, 0], [0, 0], [0, kr], [0, 0],
        ],
        o: [
          [0, 0], [kr, 0], [0, 0], [0, kr], [0, 0], [-kr, 0], [0, 0], [0, -kr],
        ],
      };
    }

    return {
      c: true,
      v: [[x, y], [x + width, y], [x + width, y + height], [x, y + height]],
      i: [[0, 0], [0, 0], [0, 0], [0, 0]],
      o: [[0, 0], [0, 0], [0, 0], [0, 0]],
    };
  }

  static parseCircle(cx: number, cy: number, r: number): ShapePath {
    const k = 0.5522847498 * r;
    return {
      c: true,
      v: [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]],
      i: [[-k, 0], [0, -k], [k, 0], [0, k]],
      o: [[k, 0], [0, k], [-k, 0], [0, -k]],
    };
  }

  static parseEllipse(cx: number, cy: number, rx: number, ry: number): ShapePath {
    const kx = 0.5522847498 * rx;
    const ky = 0.5522847498 * ry;
    return {
      c: true,
      v: [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]],
      i: [[-kx, 0], [0, -ky], [kx, 0], [0, ky]],
      o: [[kx, 0], [0, ky], [-kx, 0], [0, -ky]],
    };
  }

  static parsePolygon(points: string): ShapePath {
    const coords = points.trim().split(/[\s,]+/).map(Number);
    const vertices: number[][] = [];
    const tangents: number[][] = [];

    for (let i = 0; i < coords.length; i += 2) {
      vertices.push([coords[i], coords[i + 1]]);
      tangents.push([0, 0]);
    }

    return {
      c: true,
      v: vertices,
      i: tangents,
      o: tangents.map(() => [0, 0]),
    };
  }

  static parseLine(x1: number, y1: number, x2: number, y2: number): ShapePath {
    return {
      c: false,
      v: [[x1, y1], [x2, y2]],
      i: [[0, 0], [0, 0]],
      o: [[0, 0], [0, 0]],
    };
  }

  // --------------------------------------------------------------------------
  // Convert to Lottie Shape Group
  // --------------------------------------------------------------------------

  static toShapeGroup(
    path: ShapePath,
    options: {
      name?: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    } = {}
  ): GroupShape {
    const items: ShapeElement[] = [];

    // Add path
    const pathShape: PathShape = {
      ty: 'sh',
      nm: 'Path',
      ks: staticProperty(path),
    };
    items.push(pathShape);

    // Add fill if specified
    if (options.fill && options.fill !== 'none') {
      const fill: FillShape = {
        ty: 'fl',
        nm: 'Fill',
        o: staticProperty(100),
        c: staticProperty(hexToRgba(options.fill)),
        r: 1,
      };
      items.push(fill);
    }

    // Add stroke if specified
    if (options.stroke && options.stroke !== 'none') {
      const stroke: StrokeShape = {
        ty: 'st',
        nm: 'Stroke',
        o: staticProperty(100),
        c: staticProperty(hexToRgba(options.stroke)),
        w: staticProperty(options.strokeWidth ?? 2),
        lc: 2,
        lj: 2,
      };
      items.push(stroke);
    }

    // Add transform
    const transform: TransformShape = {
      ty: 'tr',
      p: staticProperty([0, 0]),
      a: staticProperty([0, 0]),
      s: staticProperty([100, 100]),
      r: staticProperty(0),
      o: staticProperty(100),
    };
    items.push(transform);

    return {
      ty: 'gr',
      nm: options.name ?? 'Shape',
      it: items,
      np: items.length - 1,
    };
  }

  // --------------------------------------------------------------------------
  // Parse SVG String
  // --------------------------------------------------------------------------

  static parseSVGString(svgString: string): ParsedSVGShape[] {
    const shapes: ParsedSVGShape[] = [];

    // Extract viewBox dimensions
    const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
    let offsetX = 0, offsetY = 0;
    if (viewBoxMatch) {
      const [x, y] = viewBoxMatch[1].split(/[\s,]+/).map(Number);
      offsetX = -x;
      offsetY = -y;
    }

    // Parse path elements
    const pathRegex = /<path[^>]*\sd="([^"]+)"[^>]*(?:fill="([^"]*)")?[^>]*(?:stroke="([^"]*)")?[^>]*(?:stroke-width="([^"]*)")?[^>]*\/?>/gi;
    let match;
    while ((match = pathRegex.exec(svgString)) !== null) {
      const d = match[1];
      const fill = this.extractAttr(match[0], 'fill') || '#000000';
      const stroke = this.extractAttr(match[0], 'stroke');
      const strokeWidth = parseFloat(this.extractAttr(match[0], 'stroke-width') || '1');

      shapes.push({
        type: 'path',
        path: this.parseSVGPath(d),
        fill: fill && fill !== 'none' ? fill : undefined,
        stroke: stroke && stroke !== 'none' ? stroke : undefined,
        strokeWidth,
      });
    }

    // Parse circle elements
    const circleRegex = /<circle[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*r="([^"]*)"[^>]*\/?>/gi;
    while ((match = circleRegex.exec(svgString)) !== null) {
      const cx = parseFloat(match[1]) + offsetX;
      const cy = parseFloat(match[2]) + offsetY;
      const r = parseFloat(match[3]);
      const fill = this.extractAttr(match[0], 'fill') || '#000000';
      const stroke = this.extractAttr(match[0], 'stroke');

      shapes.push({
        type: 'circle',
        path: this.parseCircle(cx, cy, r),
        fill: fill && fill !== 'none' ? fill : undefined,
        stroke: stroke && stroke !== 'none' ? stroke : undefined,
      });
    }

    // Parse rect elements
    const rectRegex = /<rect[^>]*\/?>/gi;
    while ((match = rectRegex.exec(svgString)) !== null) {
      const x = parseFloat(this.extractAttr(match[0], 'x') || '0') + offsetX;
      const y = parseFloat(this.extractAttr(match[0], 'y') || '0') + offsetY;
      const width = parseFloat(this.extractAttr(match[0], 'width') || '0');
      const height = parseFloat(this.extractAttr(match[0], 'height') || '0');
      const rx = parseFloat(this.extractAttr(match[0], 'rx') || '0');
      const fill = this.extractAttr(match[0], 'fill') || '#000000';
      const stroke = this.extractAttr(match[0], 'stroke');

      if (width > 0 && height > 0) {
        shapes.push({
          type: 'rect',
          path: this.parseRect(x, y, width, height, rx),
          fill: fill && fill !== 'none' ? fill : undefined,
          stroke: stroke && stroke !== 'none' ? stroke : undefined,
        });
      }
    }

    return shapes;
  }

  private static extractAttr(element: string, attr: string): string | null {
    const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
    const match = element.match(regex);
    return match ? match[1] : null;
  }
}

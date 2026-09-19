'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreemapNode } from '@/types/api';
import { Layers, ZoomIn } from 'lucide-react';

interface Props {
  data: TreemapNode;
  height?: number;
  onSelectNode?: (nodeName: string) => void;
}

export const D3Treemap: React.FC<Props> = ({ data, height = 360, onSelectNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    name: string;
    value: number;
    category?: string;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const container = containerRef.current;
    const width = container.clientWidth || 700;

    // Clear previous SVG
    d3.select(container).selectAll('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('border-radius', '12px')
      .style('background', '#090d16');

    // Create D3 hierarchy
    const root = d3
      .hierarchy(data)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create Treemap layout with padding
    const treemapLayout = d3
      .treemap<TreemapNode>()
      .size([width, height])
      .paddingTop(22)
      .paddingInner(3)
      .round(true);

    const layoutRoot = treemapLayout(root);
    const descendants: d3.HierarchyRectangularNode<TreemapNode>[] = layoutRoot.descendants();

    // Color palette for projects
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(['website', 'antigravity-skills', 'osint_tool', 'scroll-world', 'vehicle-osint'])
      .range(['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#06b6d4']);

    // Group elements
    const nodes = svg
      .selectAll('g')
      .data(descendants)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    // Draw parent/group bounding headers
    nodes
      .filter((d) => d.depth === 1)
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', 20)
      .attr('fill', '#1e293b')
      .attr('opacity', 0.9)
      .attr('rx', 4);

    nodes
      .filter((d) => d.depth === 1)
      .append('text')
      .attr('x', 6)
      .attr('y', 14)
      .text((d) => d.data.name)
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#f1f5f9');

    // Draw leaf nodes (actual file clusters)
    const leaves = nodes.filter((d) => !d.children);

    leaves
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d) => {
        if (d.data.color) return d.data.color;
        const parentName = d.parent?.data.name || '';
        const baseKey = parentName.split(' ')[0];
        return colorScale(baseKey) || '#3b82f6';
      })
      .attr('opacity', 0.85)
      .attr('rx', 4)
      .attr('stroke', '#090d16')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d) => {
        d3.select(event.currentTarget as Element)
          .attr('opacity', 1)
          .attr('stroke', '#ffffff');
        setHoveredNode({
          name: d.data.name,
          value: d.value || 0,
          category: d.parent?.data.name,
        });
      })
      .on('mouseleave', (event: MouseEvent) => {
        d3.select(event.currentTarget as Element)
          .attr('opacity', 0.85)
          .attr('stroke', '#090d16');
        setHoveredNode(null);
      })
      .on('click', (_event: MouseEvent, d) => {
        if (onSelectNode) {
          onSelectNode(d.data.name);
        }
      });

    // Add labels to leaves if large enough
    leaves
      .filter((d) => d.x1 - d.x0 > 55 && d.y1 - d.y0 > 30)
      .append('text')
      .attr('x', 6)
      .attr('y', 16)
      .text((d) => d.data.name)
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .attr('fill', '#ffffff')
      .style('pointer-events', 'none')
      .each(function (d) {
        const self = d3.select(this);
        const textLength = self.node()?.getComputedTextLength() || 0;
        if (textLength > d.x1 - d.x0 - 10) {
          self.text(d.data.name.slice(0, 10) + '…');
        }
      });

    leaves
      .filter((d) => d.x1 - d.x0 > 55 && d.y1 - d.y0 > 45)
      .append('text')
      .attr('x', 6)
      .attr('y', 30)
      .text((d) => `${((d.value || 0) / 1000).toFixed(1)}k lines`)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#e2e8f0')
      .style('opacity', 0.8)
      .style('pointer-events', 'none');
  }, [data, height, onSelectNode]);

  return (
    <div className="relative w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Layers className="w-3.5 h-3.5" /> D3 Hierarchical Treemap
        </span>
        {hoveredNode ? (
          <div className="flex items-center gap-2 text-[11px] bg-slate-900 px-3 py-1 rounded-full border border-slate-700 shadow-md">
            <span className="text-amber-300 font-bold">{hoveredNode.name}</span>
            <span className="text-slate-400 font-mono">({hoveredNode.category})</span>
            <span className="text-emerald-400 font-bold font-mono">
              {hoveredNode.value.toLocaleString()} LOC
            </span>
          </div>
        ) : (
          <span className="text-slate-500 flex items-center gap-1">
            <ZoomIn className="w-3 h-3" /> Hover segments to inspect nested modules
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden border border-slate-800 rounded-xl shadow-inner"
      />
    </div>
  );
};

'use client';

import React from 'react';
import { RelationshipData } from '@/types/osint';
import { Network, Server, Globe, Cpu, Database } from 'lucide-react';

interface Props {
  data: RelationshipData;
}

export const RelationshipGraph: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          Infrastructure Relationship Graph
        </h3>
        <span className="text-xs text-slate-400">
          {data.nodes.length} Nodes &bull; {data.edges.length} Edges
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Observed connections between domain target, resolved IP nodes, delegated nameservers, and detected web stack components.
      </p>

      <div className="bg-slate-950 border border-slate-800 rounded-md p-4 min-h-[300px] flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nodes List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-400 font-mono">Discovered Entities (Nodes)</h4>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-2">
              {data.nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    {node.type === 'domain' && <Globe className="w-4 h-4 text-amber-400" />}
                    {node.type === 'ip' && <Server className="w-4 h-4 text-blue-400" />}
                    {node.type === 'nameserver' && <Database className="w-4 h-4 text-emerald-400" />}
                    {node.type === 'technology' && <Cpu className="w-4 h-4 text-purple-400" />}
                    <span className="font-mono text-slate-200">{node.label}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 uppercase font-mono border border-slate-800">
                    {node.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Edges List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-400 font-mono">Observed Relationships (Edges)</h4>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-2">
              {data.edges.map((edge, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-300">
                  <span className="text-amber-400">{edge.source}</span>
                  <span className="text-slate-500 font-sans text-[11px] px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                    &rarr; {edge.relationship} &rarr;
                  </span>
                  <span className="text-emerald-400">{edge.target.replace('tech-', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

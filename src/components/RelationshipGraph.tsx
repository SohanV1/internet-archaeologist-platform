'use client';

import React from 'react';
import { RelationshipData } from '@/types/osint';
import { Network, Server, Globe, Cpu, Database, ArrowRight, Search, Filter } from 'lucide-react';

interface Props {
  data: RelationshipData;
}

export const RelationshipGraph: React.FC<Props> = ({ data }) => {
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const nodeTypes = ['all', 'domain', 'subdomain', 'ip', 'nameserver', 'technology'];

  const filteredNodes = data.nodes.filter(n => {
    const matchesType = selectedType === 'all' || n.type === selectedType;
    const matchesSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase()) || n.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Network className="w-6 h-6 text-emerald-400" />
            Infrastructure & Entity Relationship Map
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Interconnection topology linking target domain, IP nodes, authoritative nameservers, & tech components.
          </p>
        </div>
        <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold">
          {data.nodes.length} Nodes &bull; {data.edges.length} Connections
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search network nodes (IPs, subdomains, stack)..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 text-[11px] uppercase font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-400" /> Type:
          </span>
          {nodeTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                selectedType === type
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {type === 'all' ? 'All Entities' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discovered Entities (Nodes) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider flex items-center justify-between">
              <span>Discovered Network Entities (Nodes)</span>
              <span className="text-slate-500 text-[10px]">Showing {filteredNodes.length} of {data.nodes.length} Items</span>
            </h4>
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {filteredNodes.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">No nodes match filter.</div>
              ) : (
                filteredNodes.map((node, idx) => (
                  <div
                    key={`${node.id}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-xs transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                        {node.type === 'domain' && <Globe className="w-4 h-4 text-amber-400" />}
                        {node.type === 'subdomain' && <Network className="w-4 h-4 text-emerald-400" />}
                        {node.type === 'ip' && <Server className="w-4 h-4 text-blue-400" />}
                        {node.type === 'nameserver' && <Database className="w-4 h-4 text-cyan-400" />}
                        {node.type === 'technology' && <Cpu className="w-4 h-4 text-purple-400" />}
                      </div>
                      <span className="font-mono font-bold text-slate-200 text-sm">{node.label}</span>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-mono font-bold border ${
                      node.type === 'subdomain'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      {node.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Observed Relationships (Edges) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider flex items-center justify-between">
              <span>Observed Topological Connections (Edges)</span>
              <span className="text-slate-500 text-[10px]">{data.edges.length} Links</span>
            </h4>
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {data.edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-300 hover:border-amber-500/40 transition-all"
                >
                  <span className="text-amber-400 font-bold">{edge.source}</span>
                  <div className="flex items-center space-x-1.5 text-[10px] px-2.5 py-1 bg-slate-950 rounded-full border border-slate-800 text-slate-400 font-sans">
                    <span className="font-semibold">{edge.relationship}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-emerald-300 font-bold">{edge.target.replace('tech-', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


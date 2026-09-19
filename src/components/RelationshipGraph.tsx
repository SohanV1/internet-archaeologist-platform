'use client';

import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RelationshipData, GraphNode as OSINTGraphNode } from '@/types/osint';
import {
  Network,
  Server,
  Globe,
  Cpu,
  Database,
  Shield,
  Search,
  Filter,
  Maximize2,
  Info,
  X,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Props {
  data: RelationshipData;
  onSelectEvidence?: (evidenceId: string) => void;
}

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  evidenceId?: string;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    borderColor: string;
    bgGradient: string;
    glowColor: string;
    icon: React.ElementType;
  }
> = {
  domain: {
    label: 'Domain Target',
    color: 'text-amber-300',
    borderColor: 'border-amber-500/80',
    bgGradient: 'from-amber-950/90 via-slate-900 to-slate-950',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    icon: Globe,
  },
  subdomain: {
    label: 'Subdomain',
    color: 'text-emerald-300',
    borderColor: 'border-emerald-500/70',
    bgGradient: 'from-emerald-950/80 via-slate-900 to-slate-950',
    glowColor: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    icon: Network,
  },
  ip: {
    label: 'IP Host',
    color: 'text-blue-300',
    borderColor: 'border-blue-500/70',
    bgGradient: 'from-blue-950/80 via-slate-900 to-slate-950',
    glowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    icon: Server,
  },
  nameserver: {
    label: 'Nameserver',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-500/70',
    bgGradient: 'from-cyan-950/80 via-slate-900 to-slate-950',
    glowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    icon: Database,
  },
  technology: {
    label: 'Technology',
    color: 'text-purple-300',
    borderColor: 'border-purple-500/70',
    bgGradient: 'from-purple-950/80 via-slate-900 to-slate-950',
    glowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    icon: Cpu,
  },
  organization: {
    label: 'Organization',
    color: 'text-rose-300',
    borderColor: 'border-rose-500/70',
    bgGradient: 'from-rose-950/80 via-slate-900 to-slate-950',
    glowColor: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    icon: Shield,
  },
};

// Custom Cyber Node Component
const CyberNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ data }) => {
  const cfg = TYPE_CONFIG[data.type] || {
    label: data.type,
    color: 'text-slate-300',
    borderColor: 'border-slate-700',
    bgGradient: 'from-slate-900 to-slate-950',
    glowColor: '',
    icon: Network,
  };
  const Icon = cfg.icon;

  const isDimmed = data.isDimmed;
  const isHighlighted = data.isHighlighted;
  const isSelected = data.isSelected;

  return (
    <div
      className={`relative min-w-[170px] max-w-[240px] px-3.5 py-2.5 rounded-xl border bg-gradient-to-b ${cfg.bgGradient} transition-all duration-200 cursor-pointer select-none backdrop-blur-md ${
        isDimmed ? 'opacity-25 grayscale' : 'opacity-100'
      } ${
        isHighlighted || isSelected
          ? `${cfg.borderColor} ring-2 ring-amber-400 ${cfg.glowColor} scale-105`
          : `${cfg.borderColor} hover:border-slate-400 hover:scale-[1.02]`
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-slate-900"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-slate-900"
      />

      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-slate-950/90 border border-slate-800 ${cfg.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold truncate">
            {cfg.label}
          </div>
          <div className="text-xs font-mono font-bold text-slate-100 truncate" title={data.label}>
            {data.label}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-slate-900"
      />
    </div>
  );
};

const nodeTypes = {
  cyberNode: CyberNode,
};

export const RelationshipGraph: React.FC<Props> = ({ data, onSelectEvidence }) => {
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [selectedNodeInfo, setSelectedNodeInfo] = React.useState<OSINTGraphNode | null>(null);
  const [layoutMode, setLayoutMode] = React.useState<'radial' | 'tree'>('radial');

  // Compute Layout Positions (Radial Tree / Hierarchical)
  const computeInitialElements = React.useCallback(() => {
    const rootNode = data.nodes.find((n) => n.type === 'domain') || data.nodes[0];
    const otherNodes = data.nodes.filter((n) => n.id !== rootNode?.id);

    // Group other nodes by type
    const subdomains = otherNodes.filter((n) => n.type === 'subdomain');
    const ips = otherNodes.filter((n) => n.type === 'ip');
    const nameservers = otherNodes.filter((n) => n.type === 'nameserver');
    const technologies = otherNodes.filter((n) => n.type === 'technology');
    const others = otherNodes.filter(
      (n) => !['subdomain', 'ip', 'nameserver', 'technology'].includes(n.type)
    );

    const initialNodes: Node<CustomNodeData>[] = [];
    const centerX = 500;
    const centerY = 350;

    if (rootNode) {
      initialNodes.push({
        id: rootNode.id,
        type: 'cyberNode',
        position:
          layoutMode === 'radial'
            ? { x: centerX - 90, y: centerY - 30 }
            : { x: centerX - 90, y: 50 },
        data: {
          label: rootNode.label,
          type: rootNode.type,
          evidenceId: rootNode.evidenceId,
        },
      });
    }

    if (layoutMode === 'radial') {
      // Quadrant allocation:
      // Subdomains: Top-Left (angles 135 to 225 deg)
      // Nameservers: Top-Right (angles 315 to 45 deg)
      // Technologies: Bottom-Right (angles 45 to 135 deg)
      // IPs: Bottom-Left (angles 225 to 315 deg)
      const placeInArc = (
        group: OSINTGraphNode[],
        startAngle: number,
        endAngle: number,
        baseRadius: number
      ) => {
        if (group.length === 0) return;
        const step = group.length === 1 ? 0 : (endAngle - startAngle) / (group.length - 1);
        group.forEach((node, i) => {
          const angle = group.length === 1 ? (startAngle + endAngle) / 2 : startAngle + i * step;
          const rad = (angle * Math.PI) / 180;
          // stagger radius slightly for dense groups
          const radius = baseRadius + (i % 2) * 55;
          const x = centerX + radius * Math.cos(rad) - 90;
          const y = centerY + radius * Math.sin(rad) - 25;
          initialNodes.push({
            id: node.id,
            type: 'cyberNode',
            position: { x, y },
            data: {
              label: node.label,
              type: node.type,
              evidenceId: node.evidenceId,
            },
          });
        });
      };

      placeInArc(subdomains, 140, 220, 290);
      placeInArc(nameservers, 320, 400, 290);
      placeInArc(technologies, 40, 130, 290);
      placeInArc(ips, 230, 310, 290);
      placeInArc(others, 0, 360, 410);
    } else {
      // Hierarchical Tree layout
      const placeTier = (group: OSINTGraphNode[], y: number, width: number) => {
        if (group.length === 0) return;
        const startX = centerX - width / 2;
        const step = group.length === 1 ? 0 : width / (group.length - 1);
        group.forEach((node, i) => {
          const x = group.length === 1 ? centerX - 90 : startX + i * step - 90;
          initialNodes.push({
            id: node.id,
            type: 'cyberNode',
            position: { x, y },
            data: {
              label: node.label,
              type: node.type,
              evidenceId: node.evidenceId,
            },
          });
        });
      };

      placeTier(
        [...subdomains, ...nameservers],
        220,
        Math.min(1000, (subdomains.length + nameservers.length) * 200)
      );
      placeTier(
        [...ips, ...technologies, ...others],
        420,
        Math.min(1100, (ips.length + technologies.length + others.length) * 210)
      );
    }

    // Convert Edges
    const initialEdges: Edge[] = data.edges.map((edge, idx) => {
      const sourceNode = data.nodes.find((n) => n.id === edge.source);
      const targetNode = data.nodes.find((n) => n.id === edge.target);
      const edgeColor =
        targetNode?.type === 'subdomain'
          ? '#10b981'
          : targetNode?.type === 'ip'
            ? '#3b82f6'
            : targetNode?.type === 'nameserver'
              ? '#06b6d4'
              : targetNode?.type === 'technology'
                ? '#a855f7'
                : '#f59e0b';

      return {
        id: `e-${edge.source}-${edge.target}-${idx}`,
        source: edge.source,
        target: edge.target,
        animated:
          edge.relationship.toLowerCase().includes('resolves') ||
          edge.relationship.toLowerCase().includes('hosts'),
        style: { stroke: edgeColor, strokeWidth: 1.75, opacity: 0.7 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14,
        },
      };
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [data, layoutMode]);

  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
    () => computeInitialElements(),
    [computeInitialElements]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = computeInitialElements();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [computeInitialElements, setNodes, setEdges]);

  // Handle Search & Filter state updates on nodes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const matchesSearch =
          searchTerm === '' ||
          node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.data.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'all' || node.data.type === selectedType;
        const isDimmed = !matchesSearch || !matchesType;
        const isHighlighted = searchTerm !== '' && matchesSearch;
        const isSelected = selectedNodeInfo?.id === node.id;

        return {
          ...node,
          data: {
            ...node.data,
            isDimmed,
            isHighlighted,
            isSelected,
          },
        };
      })
    );
  }, [searchTerm, selectedType, selectedNodeInfo, setNodes]);

  // Handle Node Click
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const raw = data.nodes.find((n) => n.id === node.id);
    if (raw) {
      setSelectedNodeInfo(raw);
    }
  };

  const typeList = ['all', 'domain', 'subdomain', 'ip', 'nameserver', 'technology'];

  // Connected relationships for selected node
  const nodeRelationships = React.useMemo(() => {
    if (!selectedNodeInfo) return [];
    return data.edges.filter(
      (e) => e.source === selectedNodeInfo.id || e.target === selectedNodeInfo.id
    );
  }, [selectedNodeInfo, data.edges]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Network className="w-6 h-6 text-emerald-400" />
            Interactive Network Topology Graph
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Visual node-link topology linking root target, authoritative DNS, resolved IPs, and tech
            footprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setLayoutMode('radial')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                layoutMode === 'radial'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Radial Orbit
            </button>
            <button
              onClick={() => setLayoutMode('tree')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                layoutMode === 'tree'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hierarchical Tree
            </button>
          </div>

          <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl font-mono font-bold">
            {data.nodes.length} Nodes &bull; {data.edges.length} Edges
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topology nodes (IP, subdomain, stack)..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 text-[11px] uppercase font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" /> Filter:
          </span>
          {typeList.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                selectedType === type
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {type === 'all' ? 'All Entities' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Area & Inspector Split */}
      <div className="relative h-[620px] w-full bg-slate-950/95 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          className="dark"
        >
          <Background color="#334155" gap={24} size={1} />
          <Controls className="!bg-slate-900 !border !border-slate-700 !rounded-xl !text-slate-200 !shadow-xl" />
          <MiniMap
            nodeColor={(n) => {
              const t = n.data?.type;
              if (t === 'domain') return '#f59e0b';
              if (t === 'subdomain') return '#10b981';
              if (t === 'ip') return '#3b82f6';
              if (t === 'nameserver') return '#06b6d4';
              if (t === 'technology') return '#a855f7';
              return '#64748b';
            }}
            maskColor="rgba(15, 23, 42, 0.75)"
            className="!bg-slate-950 !border !border-slate-800 !rounded-xl overflow-hidden"
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 backdrop-blur-md shadow-xl hidden sm:block">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" /> Topology Legend
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className="text-slate-300">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Drawer */}
        {selectedNodeInfo && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-200 space-y-3">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-bold">
                  {selectedNodeInfo.type}
                </span>
                <h4 className="text-sm font-mono font-extrabold text-slate-100 mt-1 break-all">
                  {selectedNodeInfo.label}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNodeInfo(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="text-[11px] text-slate-400 uppercase font-bold">
                Connections ({nodeRelationships.length}):
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {nodeRelationships.length === 0 ? (
                  <div className="text-slate-500 text-[11px]">No direct connections found.</div>
                ) : (
                  nodeRelationships.map((rel, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300"
                    >
                      <span className="text-amber-400 font-bold">{rel.relationship}</span>
                      <div className="text-slate-400 truncate mt-0.5">
                        {rel.source === selectedNodeInfo.id ? `→ ${rel.target}` : `← ${rel.source}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedNodeInfo.evidenceId && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectEvidence && onSelectEvidence(selectedNodeInfo.evidenceId!)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Forensic Evidence</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

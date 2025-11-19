import React from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './OrgChartViewer.css';

interface OrgChartViewerProps {
  data: string;
}

// Person Node Component (read-only) with name + department support
const PersonViewerNode = ({ data }: { data: { label?: string; name?: string; department?: string } }) => {
  const name = data.name || data.label || 'Person';
  const dept = data.department || '';
  return (
    <div className="org-node org-node-person">
      <div className="org-node-label">{name}</div>
      {dept && <div className="org-node-subtext">{dept}</div>}
    </div>
  );
};

const nodeTypes = {
  person: PersonViewerNode,
};

const OrgChartViewer: React.FC<OrgChartViewerProps> = ({ data }) => {
  const parsedData = React.useMemo(() => {
    try {
      return data ? JSON.parse(data) : { nodes: [], edges: [] };
    } catch (error) {
      console.error('Error parsing org chart data:', error);
      return { nodes: [], edges: [] };
    }
  }, [data]);

  const nodes: Node[] = parsedData.nodes || [];
  const edges: Edge[] = parsedData.edges || [];

  if (!data) {
    return (
      <div className="org-chart-viewer-empty">
        <div className="empty-state">
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <line x1="6.5" y1="10" x2="6.5" y2="14" />
            <line x1="17.5" y1="10" x2="17.5" y2="14" />
          </svg>
          <p>No organizational chart available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="org-chart-viewer-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={true}
        zoomOnScroll={true}
        panOnDrag={true}
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default OrgChartViewer;

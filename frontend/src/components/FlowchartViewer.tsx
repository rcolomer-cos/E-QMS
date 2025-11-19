import React from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  FitViewOptions,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './FlowchartViewer.css';

interface FlowchartViewerProps {
  data: { nodes: Node[]; edges: Edge[] };
}

// Custom node components matching the editor
const RectangleViewerNode = ({ data }: any) => {
  return (
    <div className="flowchart-node flowchart-node-rectangle">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="target" position={Position.Right} isConnectable={false} />
      <Handle type="target" position={Position.Bottom} isConnectable={false} />
      <div className="flowchart-node-label">{data.label}</div>
      <Handle type="source" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
};

const DiamondViewerNode = ({ data }: any) => {
  return (
    <div className="flowchart-node flowchart-node-diamond">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="target" position={Position.Right} isConnectable={false} />
      <Handle type="target" position={Position.Bottom} isConnectable={false} />
      <div className="flowchart-node-label">{data.label}</div>
      <Handle type="source" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
};

const CircleViewerNode = ({ data }: any) => {
  return (
    <div className="flowchart-node flowchart-node-circle">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="target" position={Position.Right} isConnectable={false} />
      <Handle type="target" position={Position.Bottom} isConnectable={false} />
      <div className="flowchart-node-label">{data.label}</div>
      <Handle type="source" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  default: RectangleViewerNode,
  diamond: DiamondViewerNode,
  circle: CircleViewerNode,
};

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
  duration: 800,
};

const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ data }) => {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flowchart-viewer-empty">
        <p>No flowchart available for this process.</p>
      </div>
    );
  }

  return (
    <div className="flowchart-viewer-container">
      <ReactFlow
        nodes={data.nodes}
        edges={data.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export default FlowchartViewer;

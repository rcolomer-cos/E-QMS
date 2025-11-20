import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  FitViewOptions,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './FlowchartEditor.css';

interface FlowchartEditorProps {
  initialData?: { nodes: Node[]; edges: Edge[] };
  onSave: (data: { nodes: Node[]; edges: Edge[] }) => void;
  readOnly?: boolean;
}

const nodeTypes: NodeTypes = {
  default: (props: any) => (
    <div className="flowchart-node">
      <div className="flowchart-node-label">{props.data.label}</div>
    </div>
  ),
};

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
  duration: 800,
};

const FlowchartEditor: React.FC<FlowchartEditorProps> = ({
  initialData,
  onSave,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasChanges(true);
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!readOnly) {
        setEdges((eds: Edge[]) => addEdge(params, eds));
      }
    },
    [setEdges, readOnly]
  );

  const handleSave = () => {
    onSave({ nodes, edges });
    setHasChanges(false);
  };

  const addNode = () => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: 'default',
      position: {
        x: Math.random() * 500,
        y: Math.random() * 300,
      },
      data: { label: `Step ${nodes.length + 1}` },
    };
    setNodes((nds: Node[]) => [...nds, newNode]);
  };

  const clearFlowchart = () => {
    if (window.confirm('Are you sure you want to clear the entire flowchart?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="flowchart-editor-container">
      {!readOnly && (
        <Panel position="top-left" className="flowchart-controls">
          <button onClick={addNode} className="flowchart-btn flowchart-btn-add">
            Add Node
          </button>
          <button
            onClick={handleSave}
            className="flowchart-btn flowchart-btn-save"
            disabled={!hasChanges}
          >
            Save Flowchart
          </button>
          <button onClick={clearFlowchart} className="flowchart-btn flowchart-btn-clear">
            Clear All
          </button>
        </Panel>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls showInteractive={!readOnly} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export default FlowchartEditor;

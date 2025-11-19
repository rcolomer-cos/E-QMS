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
  FitViewOptions,
  NodeTypes,
  Handle,
  Position,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './OrgChartEditor.css';

interface OrgChartEditorProps {
  initialData?: { nodes: Node[]; edges: Edge[] };
  onSave: (data: { nodes: Node[]; edges: Edge[] }) => void;
  readOnly?: boolean;
}

// Single manual person node type (name + department)
const PersonNode = ({ data, isConnectable }: any) => {
  const name = data.name || data.label || 'Person';
  const dept = data.department || '';
  return (
    <div className="org-node org-node-person">
      <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} />
      <div className="org-node-label">{name}</div>
      {dept && <div className="org-node-subtext">{dept}</div>}
      <Handle type="source" position={Position.Top} id="top-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="right-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="left-source" isConnectable={isConnectable} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  person: PersonNode,
};

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
  duration: 800,
};

const OrgChartEditor: React.FC<OrgChartEditorProps> = ({
  initialData,
  onSave,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
  const [hasChanges, setHasChanges] = useState(false);
  // Only person nodes now
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasChanges(true);
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!readOnly) {
        setEdges((eds: Edge[]) => addEdge({ ...params, animated: true }, eds));
      }
    },
    [setEdges, readOnly]
  );

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    const currentName = String(node.data.name || node.data.label || '');
    const currentDept = String(node.data.department || '');
    const newName = prompt('Enter user name:', currentName);
    if (newName === null) return;
    const newDept = prompt('Enter department (optional):', currentDept);
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, name: newName.trim(), department: (newDept || '').trim() } }
          : n
      )
    );
  }, [readOnly, setNodes]);

  const handleSave = () => {
    onSave({ nodes, edges });
    setHasChanges(false);
  };

  const addNode = () => {
    const name = prompt('Enter user name:');
    if (name === null || !name.trim()) return;
    const dept = prompt('Enter department (optional):');
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'person',
      position: {
        x: 250 + (nodes.length * 60) % 500,
        y: 100 + Math.floor(nodes.length / 4) * 140,
      },
      data: { name: name.trim(), department: (dept || '').trim() },
    };
    setNodes((nds: Node[]) => [...nds, newNode]);
  };

  const deleteNode = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) {
      alert('Please select a node to delete');
      return;
    }
    if (window.confirm(`Delete ${selectedNodes.length} selected node(s)?`)) {
      setNodes((nds) => nds.filter((n) => !n.selected));
      setEdges((eds) => eds.filter((e) => 
        !selectedNodes.some((n) => e.source === n.id || e.target === n.id)
      ));
    }
  }, [nodes, setNodes, setEdges]);

  const clearChart = () => {
    if (window.confirm('Are you sure you want to clear the entire organizational chart?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="org-chart-editor-wrapper">
      {!readOnly && (
        <div className="org-chart-sidebar">
          <div className="sidebar-toggle">
            <button 
              className="toggle-btn" 
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              title={isControlsExpanded ? "Hide controls" : "Show controls"}
            >
              {isControlsExpanded ? '▼' : '▶'} Organization Controls
            </button>
          </div>

          {isControlsExpanded && (
            <>
              <div className="sidebar-section">
                <h3>Actions</h3>
                <button onClick={addNode} className="org-btn org-btn-add" title="Add person node">
                  ➕ Add Person
                </button>
                <button onClick={deleteNode} className="org-btn org-btn-delete" title="Delete selected node(s)">
                  🗑️ Delete
                </button>
                <button
                  onClick={handleSave}
                  className="org-btn org-btn-save"
                  disabled={!hasChanges}
                  title="Save organizational chart changes"
                >
                  💾 Save
                </button>
                <button onClick={clearChart} className="org-btn org-btn-clear" title="Clear entire chart">
                  ❌ Clear All
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="org-chart-editor-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          minZoom={0.1}
          maxZoom={4}
          connectionRadius={20}
          connectionMode={ConnectionMode.Loose}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* Instructions moved to page footer for consistent placement */}
    </div>
  );
};

export default OrgChartEditor;

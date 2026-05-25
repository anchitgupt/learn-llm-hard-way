export function TokenFlowSvg() {
  return (
    <svg
      className="token-flow"
      viewBox="0 0 640 180"
      role="img"
      aria-labelledby="token-flow-title"
      aria-describedby="token-flow-desc"
    >
      <title id="token-flow-title">Token flow from text to ids</title>
      <desc id="token-flow-desc">Text becomes tokens, and tokens become integer ids before reaching a model.</desc>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
        </marker>
      </defs>
      <g className="flow-node" transform="translate(48 54)">
        <rect width="120" height="72" rx="8" />
        <text x="60" y="42">text</text>
      </g>
      <path className="flow-arrow" d="M190 90 H275" markerEnd="url(#arrow)" />
      <g className="flow-node" transform="translate(294 54)">
        <rect width="120" height="72" rx="8" />
        <text x="60" y="42">tokens</text>
      </g>
      <path className="flow-arrow" d="M436 90 H521" markerEnd="url(#arrow)" />
      <g className="flow-node" transform="translate(540 54)">
        <rect width="72" height="72" rx="8" />
        <text x="36" y="42">ids</text>
      </g>
    </svg>
  );
}

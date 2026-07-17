import type { AuditEventType, ChangeDiff, RowValue } from "../shared/types.js";

interface DiffViewProps {
  type: AuditEventType;
  diff: ChangeDiff;
}

interface ChangePair {
  from: RowValue;
  to: RowValue;
}

function isChangePair(value: ChangeDiff[string]): value is ChangePair {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "from") &&
    Object.hasOwn(value, "to")
  );
}

function formatValue(value: RowValue) {
  return JSON.stringify(value, null, 2) ?? String(value);
}

function renderValue(
  value: RowValue,
  className: "diff-value-removed" | "diff-value-added",
) {
  const marker = className === "diff-value-removed" ? "-" : "+";

  return (
    <pre className={`diff-value ${className}`}>
      <span className="diff-marker" aria-hidden="true">
        {marker}
      </span>
      <span className="diff-value-content">{formatValue(value)}</span>
    </pre>
  );
}

export function DiffView({ type, diff }: DiffViewProps) {
  const entries = Object.entries(diff);

  if (entries.length === 0) {
    return <div className="diff-empty">No changed fields</div>;
  }

  const hasChangePairs = entries.some(([, value]) => isChangePair(value));

  return (
    <div className="diff-view">
      <div className="diff-row diff-header">
        <div>Field</div>
        {hasChangePairs ? (
          <>
            <div>Before</div>
            <div>After</div>
          </>
        ) : (
          <div>{type === "delete" ? "Removed" : "Added"}</div>
        )}
      </div>

      {entries.map(([field, value]) => {
        if (isChangePair(value)) {
          return (
            <div className="diff-row diff-row-change" key={field}>
              <div className="diff-field">{field}</div>
              {renderValue(value.from, "diff-value-removed")}
              {renderValue(value.to, "diff-value-added")}
            </div>
          );
        }

        const valueClass =
          type === "delete" ? "diff-value-removed" : "diff-value-added";

        if (hasChangePairs) {
          return (
            <div className="diff-row diff-row-change" key={field}>
              <div className="diff-field">{field}</div>
              <div className="diff-value diff-value-empty" />
              {renderValue(value, valueClass)}
            </div>
          );
        }

        return (
          <div className="diff-row diff-row-single" key={field}>
            <div className="diff-field">{field}</div>
            {renderValue(value, valueClass)}
          </div>
        );
      })}
    </div>
  );
}

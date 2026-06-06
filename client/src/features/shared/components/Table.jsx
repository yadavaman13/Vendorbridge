import '../styles/components.scss';

const Table = ({
  columns = [],
  data = [],
  rowKey,
  loading = false,
  emptyState,
  className = '',
  onRowClick,
}) => {
  const emptyTitle = emptyState?.title || 'No records found';
  const emptyDescription = emptyState?.description || 'Try adjusting your filters or create a new item.';

  return (
    <div className={`vb-table__wrap ${className}`.trim()}>
      <table className="vb-table">
        <thead className="vb-table__head">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`vb-table__th${column.className ? ` ${column.className}` : ''}`}
                style={column.width ? { width: column.width } : undefined}
                scope="col"
                aria-sort={column.sortDirection || 'none'}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="vb-table__body">
          {loading ? (
            <tr>
              <td className="vb-table__state" colSpan={columns.length || 1}>
                <div className="vb-table__state-panel">
                  <div className="vb-spinner" aria-hidden="true" />
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length ? (
            data.map((row, index) => {
              const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? index;

              return (
                <tr
                  key={key}
                  className={`vb-table__row${onRowClick ? ' is-clickable' : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`vb-table__td${column.className ? ` ${column.className}` : ''}`}>
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="vb-table__state" colSpan={columns.length || 1}>
                <div className="vb-table__empty">
                  <strong>{emptyTitle}</strong>
                  <p>{emptyDescription}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
interface TableProps {
  caption?: string;
  headers?: string[];
  rows?: Array<{ _key: string; cells?: string[] }>;
}

export function TableBlock({ caption, headers, rows }: TableProps) {
  if (!headers || headers.length === 0) return null;

  return (
    <figure className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        {caption && (
          <caption className="mb-2 text-sm text-zinc-500 text-left">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b-2 border-zinc-300">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row) => (
            <tr key={row._key} className="border-b border-zinc-200">
              {headers.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="px-3 py-2 text-zinc-600 dark:text-zinc-400"
                >
                  {row.cells?.[colIdx] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

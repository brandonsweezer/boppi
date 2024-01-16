import { sql } from "@vercel/postgres";

export default async function Cart({
  params
} : {
  params: { user: string }
}): Promise<JSX.Element> {
  const { rows } = await sql`SELECT * FROM sessions`;

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id}>
          {`${row}`}
        </div>
      ))}
    </div>
  );
}
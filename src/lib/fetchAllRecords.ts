import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Record = Tables<"records">;

/**
 * Fetch all records from the database, bypassing the 1000-row default limit
 * by paginating with .range() in batches of 1000.
 */
export async function fetchAllRecords(
  filters?: {
    categoryEq?: string;
    categoryNeq?: string;
  },
  order?: { column: string; ascending: boolean }[],
  columns?: string
): Promise<Record[]> {
  const PAGE_SIZE = 1000;
  let allData: Record[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from("records").select(columns || "*");

    if (filters?.categoryEq) {
      query = query.eq("category", filters.categoryEq);
    }
    if (filters?.categoryNeq) {
      query = query.not("category", "eq", filters.categoryNeq);
    }

    if (order) {
      for (const o of order) {
        query = query.order(o.column, { ascending: o.ascending });
      }
    }

    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching records:", error);
      break;
    }

    allData = allData.concat(data || []);

    if (!data || data.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      from += PAGE_SIZE;
    }
  }

  return allData;
}

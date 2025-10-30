import { SupabaseClient } from '@supabase/supabase-js';

export class QueryService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async saveQuery(query: { title: string; query_text: string; description?: string; creator_id: string }) {
    const { data, error } = await this.supabase
      .from('queries')
      .insert(query)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserQueries(userId: string) {
    const { data, error } = await this.supabase
      .from('queries')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveQueryResults(queryId: string, results: any) {
    const { data, error } = await this.supabase
      .from('query_results')
      .insert({
        query_id: queryId,
        results: results
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getQueryResults(queryId: string) {
    const { data, error } = await this.supabase
      .from('query_results')
      .select('*')
      .eq('query_id', queryId)
      .single();

    if (error) return null;
    return data;
  }
}
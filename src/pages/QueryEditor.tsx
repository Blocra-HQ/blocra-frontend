import { Header } from "@/components/layout/Header";
import { QueryEditor as QueryEditorComponent } from "@/components/query/QueryEditor";

const QueryEditor = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        title="Query Editor" 
        subtitle="Write and execute SQL queries on Starknet data"
      />
      
      <main className="p-6">
        <QueryEditorComponent />
      </main>
    </div>
  );
};

export default QueryEditor;
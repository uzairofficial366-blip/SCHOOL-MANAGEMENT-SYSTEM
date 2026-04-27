"use client";

import { useState, useEffect } from "react";
import { 
  Book as BookIcon, 
  Search, 
  Bookmark, 
  History, 
  AlertCircle, 
  Clock, 
  Download, 
  Filter,
  Library,
  ChevronRight
} from "lucide-react";

export default function LibraryClient() {
  const [activeTab, setActiveTab] = useState("CATALOG"); // CATALOG, BOOKSHELF, HISTORY
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    fetchLibrary();
  }, [search]);

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`/api/library/student?q=${search}`);
      const data = await res.json();
      if (res.ok) {
        setCatalog(data.catalog || []);
        setMyBooks(data.myBooks || []);
        setHistory(data.history || []);
        setCard(data.libraryCard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* CARD & SEARCH BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className={`btn ${activeTab === 'CATALOG' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab("CATALOG")}>
            <Library size={18} /> Catalog
          </button>
          <button className={`btn ${activeTab === 'BOOKSHELF' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab("BOOKSHELF")}>
            <Bookmark size={18} /> My Bookshelf {myBooks.length > 0 && <span className="badge" style={{ marginLeft: "0.5rem" }}>{myBooks.length}</span>}
          </button>
          <button className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab("HISTORY")}>
            <History size={18} /> History
          </button>
        </div>

        {activeTab === 'CATALOG' && (
          <div className="form-group" style={{ marginBottom: 0, minWidth: "300px" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by Title, Author, or Genre..." 
                style={{ paddingLeft: "40px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === "CATALOG" && (
        <div className="grid-4">
          {catalog.map((book) => (
            <div key={book.id} className="card glass hover-lift" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ 
                height: "160px", background: "hsl(var(--primary)/0.05)", borderRadius: "8px", 
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem",
                border: "1px solid var(--border)"
              }}>
                <BookIcon size={48} className="text-primary" style={{ opacity: 0.5 }} />
              </div>
              <h4 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {book.title}
              </h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>by {book.author}</p>
              
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", background: "hsl(var(--bg-muted))", color: "var(--text-muted)" }}>
                  {book.category}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: book.available > 0 ? "#16a34a" : "#dc2626" }}>
                  {book.available > 0 ? `${book.available} Available` : "Checked Out"}
                </span>
              </div>
            </div>
          ))}
          {catalog.length === 0 && !loading && (
            <div style={{ gridColumn: "1/-1", padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              No books found matching your search.
            </div>
          )}
        </div>
      )}

      {activeTab === "BOOKSHELF" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {myBooks.length === 0 ? (
            <div className="card glass" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Bookmark size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
              <p>You haven't borrowed any physical books yet.</p>
            </div>
          ) : (
            myBooks.map((issue) => {
              const overdue = isOverdue(issue.dueDate);
              return (
                <div key={issue.id} className="card glass" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ width: "60px", height: "80px", background: "hsl(var(--primary)/0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookIcon size={24} className="text-primary" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{issue.book.title}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Issued on {new Date(issue.issuedAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: overdue ? "#dc2626" : "var(--text-muted)", fontWeight: 700, marginBottom: "0.25rem" }}>
                      {overdue ? "OVERDUE" : "DUE DATE"}
                    </div>
                    <div style={{ fontWeight: 800, color: overdue ? "#dc2626" : "inherit" }}>
                      {new Date(issue.dueDate).toLocaleDateString()}
                    </div>
                    {issue.fine > 0 && !issue.finePaid && (
                      <div style={{ color: "#dc2626", fontSize: "0.85rem", fontWeight: 700, marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
                        <AlertCircle size={14} /> Fine: ${issue.fine}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "HISTORY" && (
        <div className="card">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "hsl(var(--bg-muted))" }}>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Book</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Issued</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Returned</th>
                <th style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>Fine</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 700 }}>{h.book.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{h.book.author}</div>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{new Date(h.issuedAt).toLocaleDateString()}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{new Date(h.returnedAt).toLocaleDateString()}</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {h.fine > 0 ? (
                      <span style={{ color: h.finePaid ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                        ${h.fine} {h.finePaid ? "(Paid)" : "(Pending)"}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No borrowing history found.</div>
          )}
        </div>
      )}
    </div>
  );
}

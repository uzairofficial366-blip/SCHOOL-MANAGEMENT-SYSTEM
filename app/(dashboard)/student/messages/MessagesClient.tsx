/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { 
  Send, 
  Search, 
  User, 
  Plus, 
  ChevronRight, 
  Mail, 
  Inbox, 
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft
} from "lucide-react";

export default function MessagesClient({ currentUserId }: { currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newMsgBody, setNewMsgBody] = useState("");
  const [view, setView] = useState("LIST"); // LIST, CHAT, NEW
  const [search, setSearch] = useState("");



  const fetchData = async () => {
    try {
      const [msgRes, contactRes] = await Promise.all([
        fetch("/api/messages/student"),
        fetch("/api/messages/contacts/student")
      ]);
      const [msgData, contactData] = await Promise.all([msgRes.json(), contactRes.json()]);
      if (msgRes.ok) setMessages(msgData.messages || []);
      if (contactRes.ok) setContacts(contactData.contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgBody.trim() || !selectedContact) return;

    try {
      const res = await fetch("/api/messages/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          body: newMsgBody,
          subject: "Portal Message"
        })
      });
      if (res.ok) {
        setNewMsgBody("");
        fetchData();
        setView("CHAT");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group messages by thread (sender/receiver)
  const threads = messages.reduce((acc: any, msg: any) => {
    const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
    if (!acc[otherUser.id]) {
      acc[otherUser.id] = {
        user: otherUser,
        lastMessage: msg,
        unreadCount: (msg.receiverId === currentUserId && !msg.isRead) ? 1 : 0
      };
    } else if (msg.receiverId === currentUserId && !msg.isRead) {
      acc[otherUser.id].unreadCount += 1;
    }
    return acc;
  }, {});

  const sortedThreads = Object.values(threads).sort((a: any, b: any) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  const activeChatMessages = messages.filter(msg => 
    selectedContact && (msg.senderId === selectedContact.id || msg.receiverId === selectedContact.id)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading messages...</div>;

  return (
    <div className="card glass print-p-0" style={{ height: "calc(100vh - 200px)", display: "flex", padding: 0, overflow: "hidden" }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: "350px", borderRight: "1px solid var(--border)", 
        display: (view === "LIST" || window.innerWidth > 768) ? "flex" : "none",
        flexDirection: "column"
      }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "1.25rem" }}>Messages</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setView("NEW"); setSelectedContact(null); }} style={{ padding: "0.5rem" }}>
              <Plus size={20} />
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search conversations..." 
              style={{ paddingLeft: "35px", fontSize: "0.85rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {sortedThreads.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No messages yet. Click + to start a conversation.
            </div>
          ) : (
            sortedThreads.map((t: any) => (
              <div 
                key={t.user.id} 
                onClick={() => { setSelectedContact(t.user); setView("CHAT"); }}
                style={{ 
                  padding: "1.25rem 1.5rem", cursor: "pointer", borderBottom: "1px solid var(--border)",
                  background: selectedContact?.id === t.user.id ? "hsl(var(--primary)/0.05)" : "transparent",
                  display: "flex", gap: "1rem", alignItems: "center",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "hsl(var(--bg-muted))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "hsl(var(--primary))" }}>
                  {t.user.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{t.user.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(t.lastMessage.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.lastMessage.body}
                  </p>
                </div>
                {t.unreadCount > 0 && (
                  <div style={{ width: "20px", height: "20px", background: "hsl(var(--primary))", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>
                    {t.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ 
        flex: 1, display: (view !== "LIST" || window.innerWidth > 768) ? "flex" : "none", 
        flexDirection: "column", background: "hsl(var(--bg-muted)/0.3)" 
      }}>
        {view === "NEW" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "white", display: "flex", alignItems: "center", gap: "1rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setView("LIST")}><ArrowLeft size={20} /></button>
              <h4 style={{ fontWeight: 800 }}>New Message</h4>
            </div>
            <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
              <label style={{ fontWeight: 700, marginBottom: "0.5rem", display: "block" }}>To:</label>
              <select className="form-control" onChange={(e) => setSelectedContact(contacts.find(c => c.id === e.target.value))} style={{ marginBottom: "2rem" }}>
                <option value="">Select a Teacher or Administrator...</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
              </select>

              {selectedContact && (
                <form onSubmit={handleSend}>
                  <label style={{ fontWeight: 700, marginBottom: "0.5rem", display: "block" }}>Message:</label>
                  <textarea 
                    className="form-control" 
                    rows={6} 
                    placeholder="Type your message here..."
                    value={newMsgBody}
                    onChange={(e) => setNewMsgBody(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }}>
                    <Send size={18} /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : selectedContact ? (
          <>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setView("LIST")} style={{ display: window.innerWidth <= 768 ? "flex" : "none" }}>
                  <ArrowLeft size={20} />
                </button>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "hsl(var(--bg-muted))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{selectedContact.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedContact.role}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeChatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  style={{ 
                    alignSelf: msg.senderId === currentUserId ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.senderId === currentUserId ? "flex-end" : "flex-start"
                  }}
                >
                  <div style={{ 
                    padding: "0.75rem 1.25rem", borderRadius: "1.25rem",
                    background: msg.senderId === currentUserId ? "hsl(var(--primary))" : "white",
                    color: msg.senderId === currentUserId ? "white" : "black",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    fontSize: "0.95rem",
                    borderBottomRightRadius: msg.senderId === currentUserId ? "4px" : "1.25rem",
                    borderBottomLeftRadius: msg.senderId === currentUserId ? "1.25rem" : "4px"
                  }}>
                    {msg.body}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.senderId === currentUserId && (
                      msg.isRead ? <CheckCheck size={12} className="text-primary" /> : <Check size={12} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} style={{ padding: "1.5rem", background: "white", borderTop: "1px solid var(--border)", display: "flex", gap: "1rem" }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type your message..." 
                value={newMsgBody}
                onChange={(e) => setNewMsgBody(e.target.value)}
                style={{ borderRadius: "2rem" }}
              />
              <button type="submit" className="btn btn-primary btn-icon" style={{ borderRadius: "50%", width: "48px", height: "48px", flexShrink: 0 }}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column" }}>
            <Inbox size={64} style={{ opacity: 0.1, marginBottom: "1rem" }} />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}


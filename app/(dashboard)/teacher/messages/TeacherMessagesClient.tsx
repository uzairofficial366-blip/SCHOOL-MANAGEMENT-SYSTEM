/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Search, Phone, Video as VideoIcon, Info } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export default function TeacherMessagesClient({ currentUserId, currentUserName }: any) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeContact, setActiveContact] = useState("parent_1");

  const contacts = [
    { id: "parent_1", name: "Mr. Smith (John's Father)", role: "Parent", online: true },
    { id: "admin_1", name: "Principal Office", role: "Admin", online: false },
    { id: "teacher_2", name: "Jane Doe", role: "Colleague", online: true },
  ];

  useEffect(() => {
    // In production, this points to your real socket server path
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
    Promise.resolve().then(() => setSocket(newSocket));

    // Simulated initial fetch
    setMessages([
      { id: "1", senderId: "parent_1", text: "Hello! John has been struggling with his homework.", timestamp: "09:00 AM" },
      { id: "2", senderId: currentUserId, text: "I can assign some extra practice sheets.", timestamp: "09:05 AM" },
    ]);

    return () => { newSocket.close(); };
  }, [currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on("receive-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });
    return () => { socket.off("receive-message"); };
  }, [socket]);


  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    socket.emit("send-message", newMsg);
    setInputText("");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Contact Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input type="text" placeholder="Search contacts..." className="form-input pl-9 rounded-full bg-background" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => setActiveContact(contact.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-l-4 ${activeContact === contact.id ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-card-hover'}`}
            >
              <div className="relative">
                <div className="avatar w-10 h-10">{contact.name.substring(0, 2)}</div>
                {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{contact.name}</div>
                <div className="text-xs text-muted-foreground truncate">{contact.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3">
            <div className="font-bold">{contacts.find(c => c.id === activeContact)?.name}</div>
            <span className="badge badge-success text-[10px]">Online</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <button className="hover:text-primary transition-colors"><Phone size={18} /></button>
            <button className="hover:text-primary transition-colors"><VideoIcon size={18} /></button>
            <button className="hover:text-primary transition-colors"><Info size={18} /></button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-card-foreground rounded-bl-sm'}`}>
                  {msg.text}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 px-1">{msg.timestamp}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={sendMessage} className="flex gap-2 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..." 
              className="form-input flex-1 rounded-full pl-4 pr-12 py-3 bg-background border-transparent focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-50 transition-opacity"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


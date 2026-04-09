'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/session";

type ChatMessage = {
  id: string;
  user_id: string | null;
  message: string;
  nickname: string | null;
  created_at: string;
};

type SessionUser = {
  id: string;
  email: string;
};

type Props = {
  compact?: boolean;
};

export default function ChatBox({ compact = false }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((nextUser) => {
        setUser(nextUser);
        setChecked(true);
      })
      .catch(() => {
        setUser(null);
        setChecked(true);
      });
  }, []);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("betlab-chat-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function loadMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, user_id, message, nickname, created_at")
      .order("created_at", { ascending: true })
      .limit(80);

    setMessages((data as ChatMessage[] | null) ?? []);
  }

  async function send() {
    if (!user) {
      alert("로그인 후 채팅 가능");
      return;
    }

    if (!text.trim()) return;

    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email,
        message: text.trim(),
      }),
    });

    const json = await res.json().catch(() => ({ ok: false }));
    if (!json.ok) {
      alert("메시지 전송 실패");
      return;
    }

    setText("");
  }

  return (
    <div className={`side-panel chat-panel ${compact ? "compact" : ""}`}>
      <div className="side-panel-title-row">
        <div className="side-panel-title">실시간 채팅</div>
        <div className="chat-count">{messages.length}</div>
      </div>

      <div ref={scrollRef} className="chat-messages-area">
        {messages.length === 0 ? (
          <p className="chat-empty">아직 메시지가 없다.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="chat-message-row">
              <div className="chat-nickname">{message.nickname ?? "익명"}</div>
              <div className="chat-text">{message.message}</div>
            </div>
          ))
        )}
      </div>

      {!checked ? (
        <div className="chat-guide">로그인 상태 확인 중...</div>
      ) : !user ? (
        <div className="chat-guide">로그인 후 채팅 가능합니다</div>
      ) : null}

      <div className="chat-input-row">
        <input
          className="side-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "채팅을 입력하세요" : "로그인 후 채팅 가능"}
          disabled={!user}
        />
        <button className="panel-button send-button" onClick={send} disabled={!user}>
          전송
        </button>
      </div>
    </div>
  );
}

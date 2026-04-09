import React from "react";

async function getRanking() {
  const res = await fetch("http://localhost:3000/api/ranking", {
    cache: "no-store",
  });
  return res.json();
}

export default async function RankingPage() {
  const data = await getRanking();

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">랭킹</h1>
      <div className="space-y-2">
        {data.ranking?.map((r: any, i: number) => (
          <div key={i} className="bg-[#111827] p-3 rounded flex justify-between">
            <span>{i + 1}. {r.users?.nickname || "유저"}</span>
            <span>{r.balance}P</span>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, Search, Trash2, Pin, PinOff, Eye, ThumbsUp, Loader2, 
  RefreshCw, User, Clock, Shield, Filter 
} from "lucide-react";

export default function CommunityModerationPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search: searchQuery, category: categoryFilter }).toString();
      const res = await fetch(`/api/forum/posts?${q}&limit=100`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [searchQuery, categoryFilter]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const togglePin = async (id: string, pinned: boolean) => {
    await fetch(`/api/admin/forum/${id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    loadPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post and all replies?")) return;
    await fetch(`/api/admin/forum/${id}`, { method: "DELETE" });
    loadPosts();
  };

  const categories = ["", "AI & Training", "Technical Support", "Developer", "Strategy", "Success Stories", "Legal & Compliance"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Community Moderation</h1>
        <p className="text-sm text-slate-400">Manage forum discussions, pin topics, and moderate content.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: posts.length, color: "text-blue-400" },
          { label: "Pinned", value: posts.filter(p => p.pinned).length, color: "text-emerald-400" },
          { label: "Categories", value: [...new Set(posts.map(p => p.category))].length, color: "text-purple-400" },
          { label: "Total Replies", value: posts.reduce((s, p) => s + (p.replyCount || 0), 0), color: "text-amber-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="pl-10 bg-white/5 border-white/10 text-white h-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white h-10 focus:outline-none focus:border-emerald-400/50"
        >
          {categories.map(c => <option key={c} value={c}>{c || "All Categories"}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={loadPosts} className="border-white/10 text-slate-300 hover:text-white h-10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : posts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No posts found</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="p-4">Post</th>
                <th className="p-4 hidden md:table-cell">Category</th>
                <th className="p-4 hidden md:table-cell">Author</th>
                <th className="p-4 hidden md:table-cell">Stats</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {post.pinned && <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate max-w-xs">{post.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{post.content}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <Badge className="bg-white/10 text-slate-300 text-xs">{post.category}</Badge>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="w-3 h-3" /> {post.authorName}
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.replyCount || 0}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likeCount || 0}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePin(post.id, post.pinned)}
                        className={cn("p-1.5 rounded-lg text-xs", post.pinned ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-400 hover:text-white")}
                        title={post.pinned ? "Unpin" : "Pin"}>
                        {post.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deletePost(post.id)}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

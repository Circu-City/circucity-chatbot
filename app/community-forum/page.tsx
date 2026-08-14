"use client";

import { useState, useEffect, useCallback } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Clock, ThumbsUp, MessageSquare, Eye, Send, Loader2, X, User, Plus } from "lucide-react";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorEmail?: string;
  pinned: boolean;
  replyCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

const CATEGORIES = [
  { name: "All Topics" },
  { name: "AI & Training" },
  { name: "Technical Support" },
  { name: "Developer" },
  { name: "Strategy" },
  { name: "Success Stories" },
  { name: "Legal & Compliance" },
];

export default function CommunityForumPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "General", authorName: "", authorEmail: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Check login state
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.success && d.data?.email) {
        setLoggedIn(true);
        setNewPost(p => ({ ...p, authorName: d.data.name || d.data.email.split("@")[0], authorEmail: d.data.email }));
      }
    }).catch(() => {});
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/posts?category=${activeCategory === "All Topics" ? "" : activeCategory}&search=${searchQuery}`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [activeCategory, searchQuery]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.authorName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        setNewPost({ title: "", content: "", category: "General", authorName: loggedIn ? newPost.authorName : "", authorEmail: loggedIn ? newPost.authorEmail : "" });
        setShowModal(false);
        fetchPosts();
      }
    } catch {}
    setSubmitting(false);
  };

  const pinnedPosts = posts.filter(p => p.pinned);
  const regularPosts = posts.filter(p => !p.pinned);
  const totalReplies = posts.reduce((sum, p) => sum + p.replyCount, 0);
  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);

  return (
    <MarketingShell>
      <section className="py-20 bg-dark-navy text-white text-center px-6">
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Community <span className="text-lemon-green">Forum</span></h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Discuss strategies, share tips, and connect with other store owners using CircuCity AI.
        </p>
        <div className="relative w-full max-w-md mx-auto mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-11"
          />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === cat.name
                  ? "bg-primary text-dark-navy font-bold"
                  : "bg-slate-100 text-gray-600 hover:bg-slate-200"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: MessageSquare, label: "Discussions", value: posts.length, color: "text-blue-500" },
            { icon: MessageSquare, label: "Replies", value: totalReplies, color: "text-green-500" },
            { icon: Eye, label: "Views", value: totalViews, color: "text-primary" },
            { icon: ThumbsUp, label: "Likes", value: totalLikes, color: "text-purple-500" },
          ].map(stat => (
            <div key={stat.label} className="border rounded-xl p-4 text-center">
              <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />
              <p className="text-2xl font-bold text-dark-navy">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Header bar */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {activeCategory === "All Topics" ? "All Discussions" : activeCategory}
          </h3>
          <Button onClick={() => setShowModal(true)} className="bg-primary text-dark-navy font-bold text-sm gap-1.5">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold text-dark-navy">Start a Discussion</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {loggedIn && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-slate-50 rounded-xl p-3">
                    <User className="w-4 h-4" />
                    Posting as {newPost.authorName || newPost.authorEmail}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-dark-navy mb-1.5">Subject *</label>
                  <Input
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value }))}
                    placeholder="What's on your mind?"
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-navy mb-1.5">Content *</label>
                  <textarea
                    required
                    value={newPost.content}
                    onChange={(e) => setNewPost(p => ({ ...p, content: e.target.value }))}
                    rows={5}
                    placeholder="Share your thoughts, questions, or tips..."
                    className="w-full rounded-xl border border-input px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-navy mb-1.5">Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c.name !== "All Topics").map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {!loggedIn && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      required
                      value={newPost.authorName}
                      onChange={(e) => setNewPost(p => ({ ...p, authorName: e.target.value }))}
                      placeholder="Your name *"
                      className="h-10"
                    />
                    <Input
                      value={newPost.authorEmail}
                      onChange={(e) => setNewPost(p => ({ ...p, authorEmail: e.target.value }))}
                      placeholder="Email (optional)"
                      type="email"
                      className="h-10"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-dark-navy text-white font-bold">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                    Post
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {pinnedPosts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Pinned</h3>
                <div className="space-y-2">
                  {pinnedPosts.map(topic => <TopicCard key={topic.id} topic={topic} pinned />)}
                </div>
              </div>
            )}

            {regularPosts.length === 0 && pinnedPosts.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No discussions yet</p>
                <p className="text-gray-400 text-sm">Be the first to start a conversation!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {regularPosts.map(topic => <TopicCard key={topic.id} topic={topic} />)}
              </div>
            )}
          </>
        )}
      </div>
    </MarketingShell>
  );
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function TopicCard({ topic, pinned }: { topic: ForumPost; pinned?: boolean }) {
  const initials = (topic.authorName || "?")[0].toUpperCase();
  return (
    <div className={cn(
      "border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all",
      pinned && "border-primary/20 bg-primary/5"
    )}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-dark-navy shrink-0 text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-dark-navy hover:text-primary transition-colors cursor-pointer">{topic.title}</h4>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.content}</p>
          <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-gray-400">
            <span className="bg-slate-100 px-2 py-0.5 rounded-full font-medium text-slate-600">{topic.category}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimeAgo(topic.createdAt)}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {topic.replyCount} replies</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {topic.viewCount}</span>
            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {topic.likeCount}</span>
            <span className="text-gray-500">by {topic.authorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

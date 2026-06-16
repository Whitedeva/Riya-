import React, { useState, useEffect } from "react";
import { Lock, Eye, Trash2, Edit3, Plus, Download, RefreshCw, BarChart2, Heart, Image as ImageIcon, Sparkles, Check, HelpCircle, Save } from "lucide-react";
import { AppConfig, UserResponse, PhotoAsset, TimelineStage } from "../types";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [errorHeader, setErrorHeader] = useState("");
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<"responses" | "config" | "photos" | "analytics">("analytics");
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Editable configurations state
  const [editLandingHeading, setEditLandingHeading] = useState("");
  const [editLandingSub, setEditLandingSub] = useState("");
  const [editProposalMsg, setEditProposalMsg] = useState("");
  const [musicUrl, setMusicUrl] = useState("");

  // Photo uploading states
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoBase64, setNewPhotoBase64] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  // Timeline CRUD edit state
  const [timelineStages, setTimelineStages] = useState<TimelineStage[]>([]);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDesc, setNewStageDesc] = useState("");

  const DEFAULT_PASS = "riyaaa_special_love";

  const fetchAdminData = async (pwdToUse = password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data", {
        headers: { "x-admin-password": pwdToUse }
      });
      if (res.status === 401) {
        setErrorHeader("Incorrect password! Access Denied.");
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setResponses(data.responses);
      setConfig(data.config);
      setPhotos(data.photos);
      setAnalytics(data.analytics);
      
      // Seed edits state
      setEditLandingHeading(data.config.landingPage.heading);
      setEditLandingSub(data.config.landingPage.subHeading);
      setEditProposalMsg(data.config.proposalSection.message);
      setMusicUrl(data.config.backgroundMusicUrl || "");
      setTimelineStages(data.config.journeyTimeline || []);

      setIsAuthenticated(true);
      setErrorHeader("");
    } catch (e) {
      console.error(e);
      setErrorHeader("Database connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const saveConfiguration = async () => {
    if (!config) return;
    setLoading(true);
    const updatedConfig: AppConfig = {
      ...config,
      landingPage: {
        ...config.landingPage,
        heading: editLandingHeading,
        subHeading: editLandingSub
      },
      proposalSection: {
        ...config.proposalSection,
        message: editProposalMsg
      },
      journeyTimeline: timelineStages,
      backgroundMusicUrl: musicUrl
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ config: updatedConfig })
      });
      const data = await res.json();
      if (data.success) {
        alert("Configuration saved successfully! 💕");
        setConfig(data.config);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded photo to Base64
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo upload
  const uploadPhoto = async () => {
    if (!newPhotoBase64) {
      setUploadMessage("Please select a photo file first");
      return;
    }

    setLoading(true);
    setUploadMessage("Uploading...");
    try {
      const res = await fetch("/api/photo/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          url: newPhotoBase64,
          caption: newPhotoCaption
        })
      });

      const data = await res.json();
      if (data.success) {
        setPhotos(prev => [data.photo, ...prev]);
        setNewPhotoBase64("");
        setNewPhotoCaption("");
        setUploadMessage("Photo uploaded successfully! 📸");
        setTimeout(() => setUploadMessage(""), 3000);
      } else {
        setUploadMessage("Failed to upload: " + data.error);
      }
    } catch (e) {
      setUploadMessage("Upload error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete Photo Asset
  const deletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/photo/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setPhotos(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      alert("Failed to delete photo");
    } finally {
      setLoading(false);
    }
  };

  // Timeline CRUD helpers
  const addTimelineStage = () => {
    if (!newStageName || !newStageDesc) return;
    setTimelineStages(prev => [...prev, { stage: newStageName, description: newStageDesc }]);
    setNewStageName("");
    setNewStageDesc("");
  };

  const removeTimelineStage = (index: number) => {
    setTimelineStages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = async () => {
    if (!confirm("⚠️ This will completely erase all visitor responses and analytics scores! Proceed?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "x-admin-password": password }
      });
      const data = await res.json();
      if (data.success) {
        alert("Analytics database purged successfully!");
        fetchAdminData();
      }
    } catch (e) {
      alert("Reset operation failed");
    } finally {
      setLoading(false);
    }
  };

  // JSON Exporter
  const exportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ responses, config, photos, analytics }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "riyaaa_special_responses.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[500px]" id="admin-panel-container">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-3xl border border-pink-200 p-8 shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto shadow-inner text-pink-500 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-800 font-sans tracking-tight">Admin Protected Portal</h2>
            <p className="text-xs text-rose-400 font-semibold font-mono">
              Only the creator knows the special secret phrase 🤫
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="relative">
              <input
                id="admin-pwd-input"
                type="password"
                placeholder="Enter romantic passphrase..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 pl-4 pr-12 rounded-2xl border border-pink-200 focus:outline-[none] focus:ring-2 focus:ring-pink-300 text-center font-semibold text-gray-700 bg-white shadow-inner placeholder-gray-400"
              />
              <Heart className="w-5 h-5 text-pink-300 absolute right-4 top-4 animate-pulse fill-pink-100" />
            </div>

            {errorHeader && <p className="text-red-500 font-semibold text-xs animate-bounce">{errorHeader}</p>}

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 px-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
            >
              {loading ? "Decrypting..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white/95 rounded-3xl border border-pink-100 shadow-2xl overflow-hidden flex flex-col min-h-[600px] animate-fade-in relative">
          
          {/* Header Banner */}
          <div className="bg-linear-to-r from-pink-500 via-rose-500 to-amber-400 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 fill-white stroke-none" />
                Riyaaa Special Analytics Panel
              </h1>
              <p className="text-xs text-pink-100 font-medium">Keep track of responses, photos, and customizable settings</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="db-refresh-btn"
                onClick={() => fetchAdminData()}
                className="bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 px-3 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>

              <button
                id="json-export-btn"
                onClick={exportDatabase}
                className="bg-white/25 hover:bg-white/35 text-white rounded-xl py-2 px-3 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-pink-100 bg-pink-50/50 overflow-x-auto text-sm">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "analytics"
                  ? "border-pink-500 text-pink-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-pink-500"
              }`}
            >
              📊 Metrics & Graphs
            </button>
            <button
              onClick={() => setActiveTab("responses")}
              className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "responses"
                  ? "border-pink-500 text-pink-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-pink-500"
              }`}
            >
              ❤️ Riyaaa's Answers ({responses.length})
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "config"
                  ? "border-pink-500 text-pink-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-pink-500"
              }`}
            >
              ⚙️ Modify Text
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "photos"
                  ? "border-pink-500 text-pink-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-pink-500"
              }`}
            >
              📸 Manage Memory Photos
            </button>
          </div>

          {/* Content Space */}
          <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            
            {/* TAB: ANALYTICS GRAPHS */}
            {activeTab === "analytics" && analytics && (
              <div className="space-y-6">
                
                {/* Numeric quick cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-center">
                    <p className="text-slate-500 text-xs font-semibold">Total Page Views</p>
                    <p className="text-2xl font-bold text-pink-600 mt-1">{analytics.pageViews}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                    <p className="text-slate-500 text-xs font-semibold">Distinct Sessions</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{analytics.totalSessions}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <p className="text-slate-500 text-xs font-semibold">Says YES ❤️</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics.yesCount}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                    <p className="text-slate-500 text-xs font-semibold">Think Again 😝</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{analytics.thinkAgainCount}</p>
                  </div>
                </div>

                {/* Vertical SVG Chart for Funnel Conversion */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <BarChart2 className="w-4 h-4 text-pink-500" />
                    Funnel Progression Stats (Visitation by Milestone)
                  </h3>

                  {/* SVG Chart */}
                  <div className="space-y-3">
                    {["Landing Page", "Hobbies Screen", "Timeline Screen", "Special Box", "Proposal Modal"].map(stage => {
                      const count = analytics.stagesStats[stage] || 0;
                      const maxCount = Math.max(...Object.values(analytics.stagesStats || { "Landing Page": 1 }) as number[], 1);
                      const pct = Math.min((count / maxCount) * 100, 100);

                      return (
                        <div key={stage} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span>{stage}</span>
                            <span>{count} visitors ({Math.round((count / Math.max(analytics.totalSessions, 1)) * 100)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden shadow-inner">
                            <div
                              style={{ width: `${pct}%` }}
                              className="bg-linear-to-r from-pink-400 to-rose-500 h-full rounded-full transition-all duration-1000"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hobbies Breakdown Bar Graph */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-pink-500" />
                    How Riyaaa Answered - Hobbies Popularity Chart
                  </h3>

                  <div className="space-y-3">
                    {Object.keys(analytics.hobbiesStats).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center italic">No hobbies selected yet</p>
                    ) : (
                      Object.entries(analytics.hobbiesStats).map(([hobby, count]: any) => {
                        const maxHbyCount = Math.max(...Object.values(analytics.hobbiesStats) as number[], 1);
                        const pct = (count / maxHbyCount) * 100;
                        return (
                          <div key={hobby} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span>{hobby}</span>
                              <span className="font-bold text-pink-600">{count} times</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="bg-pink-400 h-full rounded-full transition-all duration-1000"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Reset Buttons */}
                <div className="flex justify-end pt-4">
                  <button
                    id="db-reset-btn"
                    onClick={handleReset}
                    className="text-red-500 hover:text-red-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Wipe Database Logs
                  </button>
                </div>
              </div>
            )}

            {/* TAB: CUSTOMER RESPONSES FEED */}
            {activeTab === "responses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-700 font-semibold font-sans">Active User Progress Feed</h3>
                  <span className="text-xs bg-slate-100 py-1 px-2.5 rounded-full font-semibold text-slate-600 uppercase tracking-wider">
                    {responses.length} logged responses
                  </span>
                </div>

                {responses.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                    <Heart className="w-10 h-10 text-pink-300 mx-auto fill-pink-50" />
                    <p className="text-sm font-semibold text-slate-500">Wait for responses</p>
                    <p className="text-xs text-slate-400">Share your draft build or deployment link with Riyaaa!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responses.map((item, id) => (
                      <div
                        key={item.id || id}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                      >
                        {item.proposalStatus === "yes" && (
                          <div className="absolute right-0 top-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-bl-xl shadow-sm flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Yes 💕
                          </div>
                        )}
                        {item.proposalStatus === "think_again" && (
                          <div className="absolute right-0 top-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-bl-xl shadow-sm">
                            Think Again 😝
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-pink-50 pb-2.5 gap-2">
                          <div>
                            <span className="text-xs bg-pink-100 text-pink-600 font-bold px-2 py-0.5 rounded-lg mr-2 font-mono">
                              SESSION {item.sessionId.substring(0, 8)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Responses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                          <div className="space-y-1">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Selected Hobbies</p>
                            <p className="text-slate-800 text-sm">
                              {item.hobbies && item.hobbies.length > 0 ? item.hobbies.join(", ") : "None chosen yet"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Timeline Milestones Viewed</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.stagesVisited && item.stagesVisited.map(st => (
                                <span key={st} className="bg-pink-50/80 border border-pink-100 text-pink-700 py-0.5 px-1.5 rounded-md text-[10px] font-bold">
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Custom message note if any */}
                        {item.customNote && (
                          <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-3 text-xs italic text-gray-700 leading-relaxed font-semibold">
                            💬 Message from Riyaaa: "{item.customNote}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MODIFY TEXT LABELS */}
            {activeTab === "config" && config && (
              <div className="space-y-6">
                
                {/* Landing Section Editable */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Edit3 className="w-4 h-4 text-pink-500" />
                    Landing Hero Headings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
                    <div className="space-y-1">
                      <label className="text-slate-500 text-xs font-semibold">Main Greeting Heading</label>
                      <input
                        type="text"
                        value={editLandingHeading}
                        onChange={(e) => setEditLandingHeading(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-pink-100 focus:outline-[none] text-slate-800 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 text-xs font-semibold">Sub-heading Text</label>
                      <input
                        type="text"
                        value={editLandingSub}
                        onChange={(e) => setEditLandingSub(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-pink-100 focus:outline-[none]"
                      />
                    </div>
                  </div>
                </div>

                {/* Editable Proposal Message Textbox */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Proposal Invitation Message (Markdown or custom lines layout)
                  </h3>

                  <div className="space-y-1">
                    <label className="text-slate-500 text-xs font-semibold">Message Text body</label>
                    <textarea
                      rows={8}
                      value={editProposalMsg}
                      onChange={(e) => setEditProposalMsg(e.target.value)}
                      className="w-full p-3 font-medium rounded-xl border border-pink-100 focus:outline-[none] text-slate-700 leading-relaxed text-sm"
                    />
                  </div>
                </div>

                {/* Background music track URL */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    🎵 Cute Instrumental Background Music Track
                  </h3>

                  <div className="space-y-1">
                    <label className="text-slate-500 text-xs font-semibold">Audio MP3 direct link URL</label>
                    <input
                      type="text"
                      value={musicUrl}
                      onChange={(e) => setMusicUrl(e.target.value)}
                      placeholder="Paste any live MP3 audio stream link..."
                      className="w-full p-2.5 rounded-xl border border-pink-100 focus:outline-[none]"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">
                      Ensure this is a direct, accessible .mp3 track URL (We have preselected a gorgeous sweet lo-fi love story piano track).
                    </p>
                  </div>
                </div>

                {/* Timeline stages manager CRUD */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    🌸 Customize Timeline Stage Milestones
                  </h3>

                  <div className="space-y-3">
                    {timelineStages.map((stg, i) => (
                      <div key={i} className="flex items-center justify-between bg-white border border-pink-50 p-3 rounded-xl gap-3">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-800">{stg.stage}</p>
                          <p className="text-slate-500">{stg.description}</p>
                        </div>
                        <button
                          onClick={() => removeTimelineStage(i)}
                          className="text-red-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Stage sub-form */}
                  <div className="bg-white border border-dashed border-pink-200 p-4 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-pink-600">Add custom new milestone:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <input
                        type="text"
                        placeholder="Stage name (e.g. Dream Date 👋)..."
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        className="p-2 border border-pink-100 rounded-lg focus:outline-[none]"
                      />
                      <input
                        type="text"
                        placeholder="Milestone descriptive text..."
                        value={newStageDesc}
                        onChange={(e) => setNewStageDesc(e.target.value)}
                        className="p-2 border border-pink-100 rounded-lg focus:outline-[none]"
                      />
                    </div>
                    <button
                      onClick={addTimelineStage}
                      className="bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold py-2 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Milestone
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    id="admin-save-config-btn"
                    onClick={saveConfiguration}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save All Changes
                  </button>
                </div>
              </div>
            )}

            {/* TAB: MANAGE POLAROIDS AND PHOTO FILES */}
            {activeTab === "photos" && (
              <div className="space-y-6">
                
                {/* Photo Upload Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-slate-700 font-bold text-sm flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-pink-500" />
                    Upload Polaroid Memory Card Photo
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-slate-500 text-xs font-semibold">Choose photo file</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 text-xs font-semibold">Polaroid caption subtitle</label>
                        <input
                          type="text"
                          placeholder="e.g. Your smile melts my winter... 🌸"
                          value={newPhotoCaption}
                          onChange={(e) => setNewPhotoCaption(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-pink-100 focus:outline-[none] text-xs font-medium text-gray-700"
                        />
                      </div>

                      <button
                        id="upload-polaroid-btn"
                        onClick={uploadPhoto}
                        disabled={loading || !newPhotoBase64}
                        className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add memory polaroid
                      </button>

                      {uploadMessage && <p className="text-xs text-pink-600 italic font-bold">{uploadMessage}</p>}
                    </div>

                    <div className="flex items-center justify-center border border-dashed border-pink-200 rounded-xl p-4 bg-white min-h-[140px]">
                      {newPhotoBase64 ? (
                        <div className="bg-white p-2.5 rounded-lg shadow-md border border-gray-100 rotate-2 w-32 relative text-center">
                          <img
                            src={newPhotoBase64}
                            alt="Preivew"
                            className="w-full h-24 object-cover rounded-sm"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[9px] font-semibold text-slate-500 font-serif mt-1.5 truncate">
                            {newPhotoCaption || "Your Caption..."}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs text-center italic leading-medium">
                          Select an image from your computer to see preview polaroid card here
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Gallery Grid */}
                <div className="space-y-3">
                  <h3 className="text-slate-700 font-semibold text-sm">Loaded Childhood or Memory Polaroids</h3>
                  
                  {photos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No photos loaded yet. Upload file to start!</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.map((ph) => (
                        <div key={ph.id} className="bg-white border border-pink-50 rounded-2xl p-3 shadow-md hover:shadow-lg transition-all text-center relative group">
                          <img
                            src={ph.url}
                            alt={ph.caption}
                            className="w-full h-32 object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-slate-600 text-[10px] font-bold mt-2 font-serif truncate">{ph.caption}</p>

                          <button
                            onClick={() => deletePhoto(ph.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:scale-105 transition-all shadow-sm cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}

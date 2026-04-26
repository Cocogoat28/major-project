// src/pages/Profile.tsx
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "./LoadingScreen";
import { useRole } from "../context/RoleContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const LazyProviderSpaces = React.lazy(() => import("../components/dashboard/ProviderSpaces"));

interface UserProfile { _id?:string; name?:string; email?:string; avatar?:string; bookings?:any[]; spaces?:any[]; providerSpaces?:any[]; parkingSpaces?:any[]; spacesCount?:number; rating?:number; updatedAt?:string; role?:string; isSeller?:boolean; seller?:boolean; type?:string; kycData?:any; kycStatus?:string; _stats?:any; }

const floatVariants = { float:{ y:[0,-15,0], transition:{ duration:8, repeat:Infinity, ease:"easeInOut" } } };
const cardVariants = { hidden:{opacity:0,y:30}, visible:{opacity:1,y:0,transition:{duration:0.6,ease:"easeOut"}}, hover:{y:-5,transition:{duration:0.3}} };
const statsVariants = { hidden:{scale:0.8,opacity:0}, visible:(i:number)=>({scale:1,opacity:1,transition:{delay:i*0.1,duration:0.5,ease:"easeOut"}}) };

function useCountUp(target:number,duration=1200){ const [value,setValue]=useState(0); useEffect(()=>{ let start=0; if(!isFinite(target)||target<=0){ setValue(target>=0?0:target); return; } const stepTime=Math.max(Math.floor(duration/Math.max(1,target)),8); const increment=Math.max(1,Math.round(target/Math.max(1,duration/stepTime))); const timer=setInterval(()=>{ start+=increment; if(start>=target){ setValue(target); clearInterval(timer); } else setValue(start); },stepTime); return ()=>clearInterval(timer); },[target,duration]); return value; }

export default function Profile(){
  const [profile,setProfile]=useState<UserProfile|null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [tab,setTab]=useState<"Profile"|"Spaces">("Profile");
  const [refreshKey,setRefreshKey]=useState(0);
  const [bookingsCountFetched,setBookingsCountFetched]=useState<number|null>(null);
  const [spacesCountFetched,setSpacesCountFetched]=useState<number|null>(null);
  const [stats,setStats]=useState<any>(null);

  const API_BASE = import.meta.env.VITE_BASE_URL||"";
  const { role: uiRole } = useRole();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(()=>{
    let mounted=true;
    async function load(){
      setIsLoading(true); setError(null);
      try{
        if(!API_BASE) throw new Error("VITE_BASE_URL is not set.");
        const token = localStorage.getItem("token"); if(!token) throw new Error("No auth token.");
        if(auth?.user) setProfile(auth.user as UserProfile);
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }});
        if(!res.ok){ const txt=await res.text().catch(()=>""); throw new Error(`Failed: ${res.status} ${txt}`); }
        const data:UserProfile = await res.json(); if(!mounted) return; setProfile(data);
        try{
          const statsRes = await fetch(`${API_BASE}/api/stats/me`, { headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }});
          if(statsRes.ok){ const sData = await statsRes.json(); if(mounted){ setStats(sData); setBookingsCountFetched(typeof sData.providerBookingsCount==="number"?sData.providerBookingsCount: bookingsCountFetched); setSpacesCountFetched(typeof sData.spacesCount==="number"?sData.spacesCount: spacesCountFetched); setProfile(p=>({...(p||{}),_stats:sData} as any)); } }
        }catch(e){ console.warn("stats fetch error",e); }
      }catch(err:any){ console.error(err); if(mounted) setError(err?.message||"Failed to load profile."); }
      finally{ if(mounted) setIsLoading(false); }
    }
    load();
    return ()=>{ mounted=false; };
  },[API_BASE,uiRole,auth,refreshKey]);

  const handleEditProfileClick = ()=> navigate("/edit-profile");
  const handleProfileUpdated = ()=>{ setRefreshKey(prev=>prev+1); toast.success("Profile updated successfully!"); }

  const effectiveRole = useMemo(()=>{
    if(uiRole==="seller") return "seller";
    if(uiRole==="buyer") return "buyer";
    if(!profile) return "buyer";
    return profile?.role==="seller"||profile?.isSeller||profile?.seller||profile?.type==="seller" ? "seller":"buyer";
  },[uiRole,profile]);

  const isSeller = useMemo(()=> effectiveRole==="seller",[effectiveRole]);

  const bookingsCount = useMemo(()=>{
    if(stats && typeof stats.buyerBookingsCount==="number" && !isSeller) return stats.buyerBookingsCount;
    if(stats && typeof stats.providerBookingsCount==="number" && isSeller) return stats.providerBookingsCount;
    if(typeof bookingsCountFetched==="number") return bookingsCountFetched;
    if(Array.isArray(profile?.bookings)) return profile!.bookings!.length;
    return 0;
  },[stats,bookingsCountFetched,profile,isSeller]);

  const spacesCount = useMemo(()=>{
    if(stats && typeof stats.spacesCount==="number") return stats.spacesCount;
    if(typeof spacesCountFetched==="number") return spacesCountFetched;
    if(Array.isArray(profile?.spaces)) return profile!.spaces!.length;
    if(Array.isArray((profile as any)?.providerSpaces)) return (profile as any).providerSpaces.length;
    if(typeof profile?.spacesCount==="number") return profile!.spacesCount;
    return 0;
  },[stats,spacesCountFetched,profile]);

  const kycRaw = (profile?.kycStatus||profile?.kycData?.status||(profile?.kycData?.verified?"approved":"")||"").toString().toLowerCase();
  const kycShowsBookings = useMemo(()=> ["done","approved","pending","verified"].includes(kycRaw),[profile]);
  const rating = useMemo(()=> isSeller? profile?.rating ?? 0 : null,[isSeller,profile]);

  const bookingsCountAnim = useCountUp(bookingsCount);
  const spacesCountAnim = useCountUp(spacesCount);
  const ratingCountAnim = useCountUp(Math.round((rating??0)*10));

  if(isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900"><Loader/></div>);
  if(error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 p-6">
      <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="max-w-lg bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700">
        <h3 className="text-xl font-bold text-red-600 mb-3">Profile Error</h3>
        <p className="text-gray-700 dark:text-gray-200 mb-4">{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Check console for details.</p>
      </motion.div>
    </div>
  );
  if(!profile) return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900"><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center text-gray-600 dark:text-gray-300">No profile data available.</motion.div></div>);

  const kycDisplay = kycRaw==="approved"||kycRaw==="verified"||kycRaw==="done"
    ? { text:"verified", className:"text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs dark:text-green-300" }
    : kycRaw==="pending"
      ? { text:"pending", className:"text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full text-xs dark:text-yellow-300" }
      : { text:"not verified", className:"text-gray-600 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-full text-xs dark:text-gray-300" };

  const earnings = stats?.earnings ?? 0;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div variants={floatVariants} animate="float" className="absolute w-[500px] h-[500px] rounded-full opacity-12 blur-3xl" style={{ background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", left:"-10%", top:"-10%" }}/>
        <div className="absolute inset-0 opacity-[0.02] bg-[length:50px_50px] bg-grid-pattern" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-8 pb-6 gap-4">
          <div className="flex-1">
            <motion.h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Welcome Back!</motion.h1>
            <motion.p className="text-gray-600 mt-2 flex items-center gap-2 dark:text-gray-300"><span>✨</span> Your account dashboard and activity overview</motion.p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <motion.button whileTap={{scale:0.95}} whileHover={{scale:1.05}} className="px-5 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 backdrop-blur-sm" onClick={()=>setRefreshKey(k=>k+1)}>🔄 Refresh</motion.button>
            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg" onClick={handleEditProfileClick}>✏️ Edit Profile</motion.button>
          </div>
        </motion.div>

        <div className="space-y-8">
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"/>
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <motion.div className="flex-shrink-0 relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-5xl font-bold text-blue-600 dark:text-blue-300 shadow-2xl overflow-hidden border-4 border-white dark:border-gray-700">
                  {profile?.avatar ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover"/> : <span>{(profile?.name||"U")[0].toUpperCase()}</span>}
                </div>
                <motion.div className="mt-4 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${kycDisplay.className}`}>
                    {kycDisplay.text==="verified" ? "✓ Verified" : kycDisplay.text==="pending" ? "⏳ Pending" : "○ Not Verified"}
                  </span>
                </motion.div>
              </motion.div>

              <div className="flex-1 text-center lg:text-left">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{profile?.name || "Unknown User"}</h2>
                  <p className="text-gray-600 mt-2 flex items-center justify-center lg:justify-start gap-2 dark:text-gray-300">📧 {profile?.email || "—"}</p>
                  <p className="text-gray-500 text-sm mt-1 capitalize dark:text-gray-400">{isSeller ? "🚀 Premium Seller" : "👤 Valued Customer"}</p>
                </div>

                <motion.div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                  {[0,1,2].map((i)=>(
                    <motion.div key={i} custom={i} variants={statsVariants} initial="hidden" animate="visible" whileHover={{scale:1.03}} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/60 rounded-xl p-4 shadow-lg border border-gray-100/50 dark:border-gray-700/60">
                      <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                        {i===0 ? (kycShowsBookings ? bookingsCountAnim : "-") : i===1 ? (isSeller ? spacesCountAnim : "-") : (isSeller ? (ratingCountAnim/10).toFixed(1) : "-")}
                      </div>
                      <div className="text-xs text-gray-500 font-medium dark:text-gray-400">{i===0 ? "Bookings" : i===1 ? "Spaces" : "Rating"}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {isSeller && (
                  <motion.div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800/60 dark:to-gray-700/50 px-6 py-3 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="bg-green-500/10 p-2 rounded-lg"><span className="text-2xl">💰</span></div>
                    <div>
                      <div className="text-xs text-green-600 font-medium dark:text-green-300">Total Earnings</div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-200">₹{earnings.toLocaleString()}</div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.4,duration:0.6}} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Profile Information</h3>
              <div className="flex gap-2">
                <TabButton active={tab==="Profile"} onClick={()=>setTab("Profile")}>👤 Profile</TabButton>
                {isSeller && <TabButton active={tab==="Spaces"} onClick={()=>setTab("Spaces")}>🏢 My Spaces</TabButton>}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {tab==="Profile" && <motion.div key="profile" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} transition={{duration:0.3}}><ProfileDetails profile={profile} /></motion.div>}
              {tab==="Spaces" && isSeller && <motion.div key="spaces" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.3}} className="min-h-[400px]"><Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}><LazyProviderSpaces/></Suspense></motion.div>}
            </AnimatePresence>
          </motion.div>

          {isSeller && (
            <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{delay:0.6,duration:0.7}} className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-gray-800/60 dark:to-gray-700/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-blue-100/40 dark:border-gray-700/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-500/10 p-2 rounded-xl"><span className="text-2xl">🏢</span></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">My Parking Spaces</h3>
                  <p className="text-gray-600 text-sm dark:text-gray-300">Manage your listed parking spaces</p>
                </div>
              </div>
              <Suspense fallback={<div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}><LazyProviderSpaces/></Suspense>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix = "" }: { label:string; value:any; suffix?:string }){
  return (
    <div className="flex flex-col items-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-lg border border-white/40 dark:border-gray-700">
      <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}{suffix}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
    </div>
  );
}

function TabButton({ children, active=false, onClick }: any){
  return (
    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onClick} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${ active ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "bg-white/60 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-600 shadow-md" }`}>
      {children}
    </motion.button>
  );
}

function ProfileDetails({ profile }: { profile:any }){
  const details = [
    { icon:"📧", label:"Email", value: profile?.email || "-" },
    { icon:"📱", label:"Phone", value: profile?.kycData?.phoneNumber || "-" },
    { icon:"🏠", label:"Address", value: profile?.kycData?.address || profile?.address || "-" },
    { icon:"👤", label:"Member Since", value: profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "-" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {details.map((detail,index)=>(
        <motion.div key={detail.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:index*0.1+0.2}} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-800/60 rounded-xl border border-gray-100/50 dark:border-gray-700/60">
          <div className="text-2xl">{detail.icon}</div>
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-200">{detail.label}</div>
            <div className="text-gray-600 dark:text-gray-300 mt-1">{detail.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

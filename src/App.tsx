/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  Component,
  ReactNode,
  useRef,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./components/BottomNav";
import { ChatsScreen } from "./components/ChatsScreen";
import { ChatScreen } from "./components/ChatScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { ContactsScreen } from "./components/ContactsScreen";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Smartphone,
  Settings,
  Bell,
  Search,
  LayoutGrid,
  Calendar,
  MessageSquare,
  LogOut,
  ChevronRight,
  Home,
  UserCircle,
  Newspaper,
  Users,
  Users2,
  AlertCircle,
  Loader2,
  AtSign,
  Camera,
  Check,
  X,
  UserPlus,
  UserMinus,
  ArrowLeft,
  BadgeCheck,
  Trophy,
  Activity,
  MapPin,
  Link,
  Info,
  Edit2,
  Globe,
  Briefcase,
  Shield,
  Heart,
  Share2,
  Plus,
  Filter,
  Trash2,
  Github,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  writeBatch,
  orderBy,
  limit,
  startAt,
  endAt,
} from "firebase/firestore";
import { auth, db, storage } from "./firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

type Screen = "registration" | "login" | "main-menu";
type Tab = "news" | "friends" | "messages" | "groups" | "profile";

// --- Error Handling ---
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));

  // Show user-friendly message
  if (errInfo.error.includes("insufficient permissions")) {
    alert(
      "Ошибка доступа: У вас нет прав на выполнение этого действия. Пожалуйста, убедитесь, что вы вошли в свой аккаунт.",
    );
  } else {
    alert(`Произошла ошибка при работе с базой данных: ${errInfo.error}`);
  }

  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error.message };
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
          <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-md w-full text-center border border-red-100">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={32} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Произошла ошибка при работе с базой данных. Пожалуйста, попробуйте
              позже.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors"
            >
              Перезагрузить приложение
            </button>
          </div>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  userId: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  isVerified?: boolean;
  achievements?: { id: string; title: string; icon: string; unlockedAt: any }[];
  activity?: {
    id: string;
    type: string;
    description: string;
    timestamp: any;
  }[];
  createdAt: any;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface Community {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  avatar?: string;
  memberCount: number;
  createdAt: any;
}

interface CommunityPost {
  id: string;
  text: string;
  authorId: string;
  authorName?: string;
  createdAt: any;
  likes: number;
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>("registration");
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileTab, setProfileTab] = useState<
    "info" | "activity" | "achievements"
  >("info");
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    website: "",
  });

  // Friends & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userId: "",
    email: "",
    password: "",
    phone: "",
  });

  // Chat State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Community State
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(
    null,
  );
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isEditingCommunity, setIsEditingCommunity] = useState(false);
  const [communityFormData, setCommunityFormData] = useState({
    name: "",
    description: "",
    avatar: "",
  });
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [myCommunities, setMyCommunities] = useState<string[]>([]);
  const [communityPostText, setCommunityPostText] = useState("");

  const [activeCommunityRole, setActiveCommunityRole] = useState<string | null>(
    null,
  );
  const [memberData, setMemberData] = useState<any>(null);
  const [showCommunityMembers, setShowCommunityMembers] = useState(false);
  const [communityMembersList, setCommunityMembersList] = useState<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear viewingUser when switching tabs or screens
  useEffect(() => {
    setViewingUser(null);
    if (activeTab !== "messages") {
      setActiveChat(null);
    }
    if (activeTab !== "groups") {
      setActiveCommunity(null);
      setIsCreatingCommunity(false);
    }
  }, [activeTab, screen]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^\+?\d{10,15}$/;
    return re.test(phone);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid);
      setUser(currentUser);

      if (currentUser) {
        // Only redirect to main-menu if we are NOT in the middle of registration
        // handleRegister will handle the redirect itself after profile creation
        if (!isRegistering) {
          setScreen("main-menu");
          fetchProfile(currentUser.uid);
        }
      } else {
        if (!isRegistering) {
          setScreen("registration");
          setUserProfile(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isRegistering]);

  // Chats Listener
  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];
        setChats(chatList);
      },
      (err) => handleFirestoreError(err, OperationType.GET, "chats"),
    );

    return () => unsubscribe();
  }, [user]);

  // Messages Listener
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(msgList);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.GET,
          `chats/${activeChat.id}/messages`,
        ),
    );

    return () => unsubscribe();
  }, [activeChat]);

  // Communities Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "communities"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Community[];
        setCommunities(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "communities"),
    );

    return () => unsubscribe();
  }, [user]);

  // My Communities Listener
  useEffect(() => {
    if (!user) {
      setMyCommunities([]);
      return;
    }

    // We need to find which communities the user is a member of.
    // Since we can't easily query across subcollections in a simple way without collectionGroup (which needs indexes),
    // we'll listen to all communities and then check membership for each if needed,
    // OR better: just listen to the communities I'm in if I had a list on the user profile.
    // For now, let's just listen to the members subcollection of the active community if one is selected.
  }, [user]);

  // Active Community Posts & Members Listener
  useEffect(() => {
    if (!activeCommunity || !user) {
      setCommunityPosts([]);
      setActiveCommunityRole(null);
      return;
    }

    const postsQ = query(
      collection(db, "communities", activeCommunity.id, "posts"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribePosts = onSnapshot(
      postsQ,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CommunityPost[];
        setCommunityPosts(list);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `communities/${activeCommunity.id}/posts`,
        ),
    );

    // Check if I'm a member and get role
    const memberRef = doc(
      db,
      "communities",
      activeCommunity.id,
      "members",
      user.uid,
    );
    const unsubscribeMember = onSnapshot(memberRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMemberData(data);
        setActiveCommunityRole(data.role || "member");
        if (!myCommunities.includes(activeCommunity.id)) {
          setMyCommunities((prev) => [...prev, activeCommunity.id]);
        }
      } else {
        setMemberData(null);
        setActiveCommunityRole(null);
        setMyCommunities((prev) =>
          prev.filter((id) => id !== activeCommunity.id),
        );
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeMember();
    };
  }, [activeCommunity, user]);

  const handleCommunityAvatarUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCommunityFormData((prev) => ({
        ...prev,
        avatar: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const deleteAllCommunities = async () => {
    if (
      !window.confirm(
        "Вы уверены, что хотите удалить ВСЕ сообщества? Это действие необратимо.",
      )
    )
      return;

    setLoading(true);
    try {
      const communitiesSnapshot = await getDocs(collection(db, "communities"));
      const batch = writeBatch(db);

      for (const docSnapshot of communitiesSnapshot.docs) {
        // Delete members and posts subcollections first
        const membersSnapshot = await getDocs(
          collection(db, "communities", docSnapshot.id, "members"),
        );
        membersSnapshot.docs.forEach((memberDoc) =>
          batch.delete(memberDoc.ref),
        );

        const postsSnapshot = await getDocs(
          collection(db, "communities", docSnapshot.id, "posts"),
        );
        postsSnapshot.docs.forEach((postDoc) => batch.delete(postDoc.ref));

        batch.delete(docSnapshot.ref);
      }

      await batch.commit();
      alert("Все сообщества удалены.");
    } catch (err) {
      console.error("Error deleting communities:", err);
      handleFirestoreError(err, OperationType.DELETE, "communities");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !communityFormData.name.trim()) return;

    setLoading(true);
    try {
      const communityData: any = {
        name: communityFormData.name.trim(),
        description: communityFormData.description.trim(),
        creatorId: user.uid,
        memberCount: 1,
        createdAt: serverTimestamp(),
      };
      if (
        communityFormData.avatar &&
        communityFormData.avatar.startsWith("data:")
      ) {
        const storageRef = ref(
          storage,
          `communities/${Date.now()}_${user.uid}.jpg`,
        );
        await uploadString(storageRef, communityFormData.avatar, "data_url");
        communityData.avatar = await getDownloadURL(storageRef);
      } else if (communityFormData.avatar) {
        communityData.avatar = communityFormData.avatar;
      }

      const docRef = await addDoc(collection(db, "communities"), communityData);

      // Add creator as admin member
      await setDoc(doc(db, "communities", docRef.id, "members", user.uid), {
        uid: user.uid,
        role: "admin",
        joinedAt: serverTimestamp(),
      });

      setCommunityFormData({ name: "", description: "", avatar: "" });
      setIsCreatingCommunity(false);
      setActiveCommunity({ id: docRef.id, ...communityData } as Community);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "communities");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommunity || !communityFormData.name.trim()) return;

    setLoading(true);
    try {
      const communityData: any = {
        name: communityFormData.name.trim(),
        description: communityFormData.description.trim(),
      };
      if (
        communityFormData.avatar &&
        communityFormData.avatar.startsWith("data:")
      ) {
        const storageRef = ref(
          storage,
          `communities/${Date.now()}_${user.uid}.jpg`,
        );
        await uploadString(storageRef, communityFormData.avatar, "data_url");
        communityData.avatar = await getDownloadURL(storageRef);
      } else if (communityFormData.avatar) {
        communityData.avatar = communityFormData.avatar;
      }

      await updateDoc(
        doc(db, "communities", activeCommunity.id),
        communityData,
      );

      setCommunityFormData({ name: "", description: "", avatar: "" });
      setIsEditingCommunity(false);
      setActiveCommunity({ ...activeCommunity, ...communityData });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${activeCommunity.id}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCommunity || !showCommunityMembers) {
      setCommunityMembersList([]);
      return;
    }

    const membersQ = query(
      collection(db, "communities", activeCommunity.id, "members"),
    );
    const unsubscribe = onSnapshot(
      membersQ,
      async (snapshot) => {
        const membersData = await Promise.all(
          snapshot.docs.map(async (memberDoc) => {
            const memberInfo = memberDoc.data();
            const userDoc = await getDoc(doc(db, "users", memberInfo.uid));
            return {
              id: memberDoc.id,
              ...memberInfo,
              profile: userDoc.exists() ? userDoc.data() : null,
            };
          }),
        );
        setCommunityMembersList(membersData);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `communities/${activeCommunity.id}/members`,
        ),
    );

    return () => unsubscribe();
  }, [activeCommunity, showCommunityMembers]);

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!activeCommunity || !user) return;
    try {
      await updateDoc(
        doc(db, "communities", activeCommunity.id, "members", memberId),
        {
          role: newRole,
        },
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${activeCommunity.id}/members/${memberId}`,
      );
    }
  };

  const removeMember = async (memberId: string) => {
    if (!activeCommunity || !user) return;
    if (memberId === activeCommunity.creatorId) {
      alert("Cannot remove the creator.");
      return;
    }
    try {
      await deleteDoc(
        doc(db, "communities", activeCommunity.id, "members", memberId),
      );
      await updateDoc(doc(db, "communities", activeCommunity.id), {
        memberCount: Math.max(0, (activeCommunity.memberCount || 1) - 1),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${activeCommunity.id}/members/${memberId}`,
      );
    }
  };

  const deletePost = async (postId: string) => {
    if (!activeCommunity || !user) return;
    try {
      await deleteDoc(
        doc(db, "communities", activeCommunity.id, "posts", postId),
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${activeCommunity.id}/posts/${postId}`,
      );
    }
  };

  const joinCommunity = async (community: Community) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "communities", community.id, "members", user.uid), {
        uid: user.uid,
        role: "member",
        joinedAt: serverTimestamp(),
        lastVisited: serverTimestamp(),
      });

      // Increment member count
      await updateDoc(doc(db, "communities", community.id), {
        memberCount: (community.memberCount || 0) + 1,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${community.id}/members`,
      );
    }
  };

  const leaveCommunity = async (community: Community) => {
    if (!user) return;
    try {
      await deleteDoc(
        doc(db, "communities", community.id, "members", user.uid),
      );

      // Decrement member count
      await updateDoc(doc(db, "communities", community.id), {
        memberCount: Math.max(0, (community.memberCount || 1) - 1),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${community.id}/members`,
      );
    }
  };

  const createCommunityPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommunity || !communityPostText.trim()) return;

    const text = communityPostText.trim();
    setCommunityPostText("");

    try {
      await addDoc(collection(db, "communities", activeCommunity.id, "posts"), {
        text,
        authorId: user.uid,
        authorName: userProfile
          ? `${userProfile.firstName} ${userProfile.lastName}`
          : user.email,
        createdAt: serverTimestamp(),
        likes: 0,
      });

      // Update lastPostAt
      await updateDoc(doc(db, "communities", activeCommunity.id), {
        lastPostAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${activeCommunity.id}/posts`,
      );
    }
  };

  const likePost = async (
    communityId: string,
    postId: string,
    currentLikes: number,
  ) => {
    try {
      await updateDoc(doc(db, "communities", communityId, "posts", postId), {
        likes: (currentLikes || 0) + 1,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/posts/${postId}`,
      );
    }
  };

  const openChat = async (otherUid: string) => {
    if (!user) return;

    setChatLoading(true);
    setActiveTab("messages");

    try {
      // Check if chat already exists
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid),
      );

      const snapshot = await getDocs(q);
      let existingChat = snapshot.docs.find((doc) => {
        const data = doc.data();
        return data.participants.includes(otherUid);
      });

      if (existingChat) {
        setActiveChat({ id: existingChat.id, ...existingChat.data() } as Chat);
      } else {
        // Create new chat
        const chatData = {
          participants: [user.uid, otherUid],
          updatedAt: serverTimestamp(),
          lastMessage: "",
        };
        const docRef = await addDoc(collection(db, "chats"), chatData);
        setActiveChat({ id: docRef.id, ...chatData } as Chat);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "chats");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (
    text: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string,
  ) => {
    if (!user || !activeChat || (!text.trim() && !fileUrl)) return;

    try {
      const batch = writeBatch(db);

      // Add message
      const msgRef = doc(collection(db, "chats", activeChat.id, "messages"));
      batch.set(msgRef, {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        ...(fileUrl && { fileUrl, fileType, fileName }),
      });

      // Update chat
      const chatRef = doc(db, "chats", activeChat.id);
      batch.update(chatRef, {
        lastMessage: fileUrl
          ? fileType?.startsWith("image/")
            ? "📷 Photo"
            : "📎 File"
          : text,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `chats/${activeChat.id}/messages`,
      );
    }
  };

  const fetchProfile = async (uid: string) => {
    setProfileLoading(true);
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUserProfile(data);
        setEditData({
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
        });
      } else {
        console.log("No profile found for user:", uid);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        bio: editData.bio,
        location: editData.location,
        website: editData.website,
      });
      setUserProfile((prev) => (prev ? { ...prev, ...editData } : null));
      setIsEditingProfile(false);
      alert("Профиль обновлен!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const fixUserIds = async () => {
    if (!user || user.email !== "rdischat@gmail.com") return;
    setLoading(true);
    setMigrationMessage("Начинаю миграцию...");
    try {
      let fixedCount = 0;
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);

      for (const userDoc of snapshot.docs) {
        const data = userDoc.data();
        if (data.userId && data.userId !== data.userId.toLowerCase()) {
          await updateDoc(doc(db, "users", userDoc.id), {
            userId: data.userId.toLowerCase(),
          });
          fixedCount++;
        }
      }

      setMigrationMessage(
        `Миграция завершена. Исправлено пользователей: ${fixedCount}`,
      );
      setTimeout(() => setMigrationMessage(null), 5000);
    } catch (err) {
      setMigrationMessage("Ошибка при миграции. Проверьте консоль.");
      handleFirestoreError(err, OperationType.UPDATE, "users");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setAuthError(null);
  };

  useEffect(() => {
    if (!user) return;

    // Listen for incoming friend requests
    const qIncoming = query(
      collection(db, "friendRequests"),
      where("toUid", "==", user.uid),
      where("status", "==", "pending"),
    );
    const unsubIncoming = onSnapshot(
      qIncoming,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendRequests(requests);
      },
      (err) => handleFirestoreError(err, OperationType.GET, "friendRequests"),
    );

    // Listen for sent requests to update UI
    const qSent = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", user.uid),
      where("status", "==", "pending"),
    );
    const unsubSent = onSnapshot(
      qSent,
      (snapshot) => {
        const uids = snapshot.docs.map((doc) => doc.data().toUid);
        setSentRequests(uids);
      },
      (err) => handleFirestoreError(err, OperationType.GET, "friendRequests"),
    );

    // Listen for friends
    const qFriends = query(collection(db, `users/${user.uid}/friends`));
    const unsubFriends = onSnapshot(
      qFriends,
      async (snapshot) => {
        const friendData = await Promise.all(
          snapshot.docs.map(async (friendDoc) => {
            const friendUid = friendDoc.data().uid;
            const profileSnap = await getDoc(doc(db, "users", friendUid));
            return {
              id: friendDoc.id,
              uid: friendUid,
              ...(profileSnap.data() as any),
            };
          }),
        );
        setFriends(friendData);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.GET,
          `users/${user.uid}/friends`,
        ),
    );

    return () => {
      unsubIncoming();
      unsubSent();
      unsubFriends();
    };
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const normalizedSearchQuery = searchQuery.trim().toLowerCase();
      // Simple search by userId (case-sensitive in Firestore, but we can try)
      const q = query(
        collection(db, "users"),
        where("userId", ">=", normalizedSearchQuery),
        where("userId", "<=", normalizedSearchQuery + "\uf8ff"),
        limit(10),
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() }) as UserProfile)
        .filter((u) => u.uid !== user?.uid); // Don't show self
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      handleFirestoreError(err, OperationType.LIST, "users");
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (targetUser: UserProfile) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "friendRequests"), {
        fromUid: user.uid,
        toUid: targetUser.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert(`Запрос отправлен ${targetUser.firstName}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "friendRequests");
    }
  };

  const acceptFriendRequest = async (request: any) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);

      // 1. Update request status
      batch.update(doc(db, "friendRequests", request.id), {
        status: "accepted",
      });

      // 2. Add to both users' friends subcollections
      batch.set(doc(db, `users/${user.uid}/friends`, request.fromUid), {
        uid: request.fromUid,
        addedAt: serverTimestamp(),
      });
      batch.set(doc(db, `users/${request.fromUid}/friends`, user.uid), {
        uid: user.uid,
        addedAt: serverTimestamp(),
      });

      await batch.commit();
      alert("Запрос принят!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "friends");
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "friendRequests", requestId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "friendRequests");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setIsRegistering(true);

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.userId ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setAuthError("Заполните все поля!");
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    if (formData.userId.includes("@")) {
      setAuthError("UserID не может содержать символ '@'");
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    if (formData.password.length < 6) {
      setAuthError("Пароль должен быть не менее 6 символов");
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setAuthError("Неверный формат Email!");
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      setAuthError(
        "Неверный формат номера телефона! Используйте +380XXXXXXXXX",
      );
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    try {
      const normalizedUserId = formData.userId.trim().toLowerCase();
      // 1. Create user first
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const newUser = userCredential.user;

      // 2. Check UserID uniqueness (now authenticated)
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("userId", "==", normalizedUserId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await newUser.delete();
        setAuthError("Этот UserID уже занят. Выберите другой.");
        setIsRegistering(false);
        setLoading(false);
        return;
      }

      const userDocPath = `users/${newUser.uid}`;
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        userId: normalizedUserId,
        phone: formData.phone,
        email: formData.email,
        createdAt: serverTimestamp(),
        bio: "",
        location: "",
        website: "",
        achievements: [
          {
            id: "welcome",
            title: "Добро пожаловать!",
            icon: "trophy",
            unlockedAt: new Date().toISOString(),
          },
        ],
        activity: [
          {
            id: "reg",
            type: "registration",
            description: "Зарегистрировался в приложении",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      try {
        await setDoc(doc(db, userDocPath), profileData);
        setUserProfile(profileData as any);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userDocPath);
      }

      setIsRegistering(false);
      setScreen("main-menu");
    } catch (err: any) {
      console.error("Registration error:", err);
      setIsRegistering(false);

      if (err.code === "auth/email-already-in-use") {
        setAuthError("Этот email уже используется.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Пароль слишком слабый (минимум 6 символов).");
      } else if (err.code === "auth/invalid-email") {
        setAuthError("Неверный формат Email.");
      } else if (err.code === "auth/invalid-credential") {
        setAuthError("Неверные учетные данные. Проверьте Email и пароль.");
      } else {
        try {
          const parsed = JSON.parse(err.message);
          setAuthError(parsed.error || "Ошибка при регистрации");
        } catch {
          setAuthError(err.message || "Произошла ошибка при регистрации");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    let loginEmail = formData.email.trim();
    const password = formData.password;

    if (!loginEmail || !password) {
      setAuthError("Введите логин и пароль");
      setLoading(false);
      return;
    }

    try {
      // Check if input is UserID (doesn't contain @)
      // If it starts with @, remove it and treat as UserID
      let isUserId = !loginEmail.includes("@");
      let searchId = loginEmail;

      if (loginEmail.startsWith("@")) {
        isUserId = true;
        searchId = loginEmail.substring(1);
      }

      if (isUserId) {
        const normalizedUserId = searchId.trim().toLowerCase();
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userId", "==", normalizedUserId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          loginEmail = querySnapshot.docs[0].data().email;
        } else {
          setAuthError("Пользователь с таким ID не найден");
          setLoading(false);
          return;
        }
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      setScreen("main-menu");
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setAuthError("Неверный логин или пароль");
      } else if (err.code === "auth/invalid-email") {
        setAuthError("Неверный формат Email");
      } else if (err.code === "auth/user-disabled") {
        setAuthError("Аккаунт отключен");
      } else {
        setAuthError(err.message || "Ошибка при входе");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists()) {
        const email = result.user.email || "";
        const nameParts = (result.user.displayName || "").split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "";
        const userId = result.user.uid.substring(0, 8).toLowerCase();
        
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          email,
          firstName,
          lastName,
          userId,
          avatar: result.user.photoURL || "",
          createdAt: serverTimestamp(),
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      }
      
      setScreen("main-menu");
    } catch (err: any) {
      console.error("GitHub login error:", err);
      if (err.code === "auth/account-exists-with-different-credential") {
        setAuthError("Аккаунт с таким email уже существует, но привязан к другому способу входа.");
      } else {
        setAuthError(err.message || "Ошибка при входе через GitHub");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setScreen("registration");
    } catch (err) {
      console.error(err);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      if (img.width < 500 || img.height < 500) {
        alert("Минимальный размер фото: 500x500");
        return;
      }

      const size = 500;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = size;
      canvas.height = size;

      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;

      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

      const base64 = canvas.toDataURL("image/jpeg", 0.8);

      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { avatar: base64 });
        setUserProfile((prev) => (prev ? { ...prev, avatar: base64 } : null));
        alert("Аватар обновлён!");
      } catch (err) {
        console.error("Error updating avatar:", err);
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    };
  };

  const backgroundStyle = {
    background: "linear-gradient(to bottom, #fef9c3 0%, #2dd4bf 100%)",
  };

  const isVerified = (profile: UserProfile | null) => {
    if (!profile) return false;
    return (
      profile.isVerified ||
      profile.userId === "alexeivasilev" ||
      profile.email === "rdischat@gmail.com"
    );
  };

  const VerificationBadge = ({ profile }: { profile: UserProfile }) => {
    if (!isVerified(profile)) return null;
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          alert("Этот пользователь верифицирован");
        }}
        className="inline-flex items-center justify-center ml-1 transition-transform"
        title="Верифицированный аккаунт"
      >
        <div className="w-4 h-4 bg-[#3b82f6] rounded-full flex items-center justify-center shadow-sm">
          <Check size={10} strokeWidth={4} className="text-white" />
        </div>
      </motion.button>
    );
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 font-sans selection:bg-teal-200 overflow-hidden"
      style={backgroundStyle}
    >
      {/* Android Status Bar Mockup - Hidden on mobile, visible on desktop */}
      <div className="hidden sm:flex fixed top-0 left-0 w-full h-6 bg-black/5 items-center justify-between px-4 text-[10px] font-medium text-black/40 z-50">
        <span>12:30</span>
        <div className="flex gap-1 items-center">
          <Smartphone size={10} />
          <span>LTE</span>
          <div className="w-4 h-2 border border-black/20 rounded-sm relative">
            <div className="absolute inset-0 bg-black/40 w-full" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="text-white animate-spin" size={32} />
            <span className="text-white font-medium text-xs">Загрузка...</span>
          </motion.div>
        ) : screen === "registration" || screen === "login" ? (
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[48px] shadow-2xl overflow-hidden border border-white/40 flex flex-col max-h-[90vh]"
          >
            <div className="p-8 pt-12 flex-1 overflow-y-auto custom-scrollbar">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-14 h-14 bg-teal-500 rounded-2xl flex flex-col items-center justify-center mb-4 mx-auto shadow-lg shadow-teal-500/30"
              >
                <User className="text-white" size={20} />
              </motion.div>
              <div className="text-center mb-6">
                <span className="text-xs font-black text-teal-600 uppercase tracking-[0.3em]">
                  rdscht
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 text-center mb-2 tracking-tight">
                {screen === "registration"
                  ? "Создать аккаунт"
                  : "С возвращением"}
              </h1>
              <p className="text-gray-500 text-center mb-8 text-sm font-medium">
                {screen === "registration"
                  ? "Присоединяйтесь к нам сегодня"
                  : "Войдите в свой профиль"}
              </p>

              {authError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs animate-shake">
                  <AlertCircle size={14} />
                  {authError}
                </div>
              )}

              <form
                onSubmit={
                  screen === "registration" ? handleRegister : handleLogin
                }
                className="space-y-4"
              >
                {screen === "registration" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={14}
                        />
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Имя"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-gray-400 text-gray-700 text-xs"
                          required
                        />
                      </div>
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={14}
                        />
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Фамилия"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-gray-400 text-gray-700 text-xs"
                          required
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <AtSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <input
                        type="text"
                        name="userId"
                        placeholder="UserID (уникальный)"
                        value={formData.userId}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-gray-400 text-gray-700 text-xs"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Smartphone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+380 XXX XXX XXX"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-gray-400 text-gray-700 text-xs"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    name="email"
                    placeholder="Email или UserID"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-gray-400 text-gray-700 text-xs"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-gray-400 text-gray-700 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 hover:bg-teal-600 transition-all mt-4 disabled:opacity-70 text-xs"
                >
                  {screen === "registration" ? "Зарегистрироваться" : "Войти"}
                  <ArrowRight size={14} />
                </motion.button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 text-xs">Или</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-[#24292e] text-white font-bold rounded-2xl shadow-lg shadow-gray-500/30 flex items-center justify-center gap-2 hover:bg-[#1b1f23] transition-all disabled:opacity-70 text-xs"
                >
                  <Github size={16} />
                  Войти через GitHub
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  {screen === "registration"
                    ? "Уже есть аккаунт?"
                    : "Нет аккаунта?"}{" "}
                  <button
                    onClick={() =>
                      setScreen(
                        screen === "registration" ? "login" : "registration",
                      )
                    }
                    className="text-teal-600 font-bold hover:underline"
                  >
                    {screen === "registration" ? "Войти" : "Создать"}
                  </button>
                </p>
              </div>
            </div>
            <div className="h-1.5 w-32 bg-gray-300 rounded-full mx-auto mb-4 opacity-50" />
          </motion.div>
        ) : (
          <motion.div
            key="main-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex flex-col overflow-hidden bg-slate-50"
          >
            {/* Header with Settings and Logout */}
            <div className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all shadow-sm border border-slate-200"
              >
                <LogOut size={20} />
              </motion.button>

              <div className="flex gap-2">
                {user?.email === "rdischat@gmail.com" && (
                  <div className="flex items-center gap-2">
                    {migrationMessage && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="px-3 py-1.5 bg-teal-950 text-white text-[10px] font-bold rounded-lg shadow-lg border border-teal-800 whitespace-nowrap"
                      >
                        {migrationMessage}
                      </motion.div>
                    )}
                    <motion.button
                      onClick={fixUserIds}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Fix User IDs"
                      className="w-9 h-9 rounded-xl bg-teal-950 text-white flex items-center justify-center hover:bg-teal-900 transition-colors shadow-sm border border-teal-800"
                    >
                      <Shield size={18} />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 relative">
              <AnimatePresence>
                {viewingUser && (
                  <motion.div
                    initial={{ opacity: 0, x: "100%" }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: "100%" }}
                    className="absolute inset-0 z-50 flex flex-col overflow-y-auto bg-teal-950/10 backdrop-blur-xl"
                  >
                    {/* Banner & Header */}
                    <div className="relative h-48 bg-gradient-to-br from-teal-400 to-emerald-600 shrink-0 shadow-lg">
                      <button
                        onClick={() => setViewingUser(null)}
                        className="absolute left-6 top-6 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-colors z-10 border border-white/20"
                      >
                        <ArrowLeft size={16} />
                      </button>
                    </div>

                    {/* Profile Info Card */}
                    <div className="px-6 -mt-12 pb-8 relative">
                      <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-teal-950/20 p-6 border border-white/50">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-24 h-24 bg-white rounded-[28px] p-1 shadow-lg -mt-16">
                            <div className="w-full h-full bg-teal-500/10 rounded-[24px] flex items-center justify-center overflow-hidden border border-teal-100">
                              {viewingUser.avatar ? (
                                <img
                                  src={viewingUser.avatar}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <UserCircle
                                  size={48}
                                  className="text-teal-600"
                                />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {friends.some((f) => f.uid === viewingUser.uid) && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openChat(viewingUser.uid)}
                                className="px-4 py-2 bg-teal-100 text-teal-700 font-bold rounded-xl hover:bg-teal-200 transition-all flex items-center gap-2 text-xs"
                              >
                                <MessageSquare size={14} />
                                Сообщение
                              </motion.button>
                            )}
                            {!friends.some((f) => f.uid === viewingUser.uid) &&
                              !sentRequests.includes(viewingUser.uid) && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => sendFriendRequest(viewingUser)}
                                  className="px-4 py-2 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 text-xs"
                                >
                                  <UserPlus size={14} />
                                  Добавить
                                </motion.button>
                              )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                alert("Функция сообщений скоро появится!")
                              }
                              className="w-10 h-10 bg-white/50 backdrop-blur-md text-teal-600 rounded-xl flex items-center justify-center hover:bg-white/80 transition-colors border border-white/50"
                            >
                              <MessageSquare size={18} />
                            </motion.button>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h2 className="text-2xl font-bold text-teal-950 flex items-center gap-1">
                            {viewingUser.firstName} {viewingUser.lastName}
                            <VerificationBadge profile={viewingUser} />
                          </h2>
                          <p className="text-teal-800/60 font-medium">
                            @{viewingUser.userId}
                          </p>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex justify-between items-center bg-teal-500/5 rounded-2xl p-4 border border-teal-500/10 mb-6">
                          <div className="text-center flex-1">
                            <p className="text-teal-950 font-black text-lg leading-none">
                              {viewingUser.achievements?.length || 0}
                            </p>
                            <p className="text-teal-800/40 text-[9px] uppercase font-black tracking-widest mt-1">
                              Награды
                            </p>
                          </div>
                          <div className="w-px h-6 bg-teal-950/10" />
                          <div className="text-center flex-1">
                            <p className="text-teal-950 font-black text-lg leading-none">
                              {viewingUser.activity?.length || 0}
                            </p>
                            <p className="text-teal-800/40 text-[9px] uppercase font-black tracking-widest mt-1">
                              Активность
                            </p>
                          </div>
                          <div className="w-px h-6 bg-teal-950/10" />
                          <div className="text-center flex-1">
                            <p className="text-teal-950 font-black text-lg leading-none">
                              {friends.some((f) => f.uid === viewingUser.uid)
                                ? "Друг"
                                : "Гость"}
                            </p>
                            <p className="text-teal-800/40 text-[9px] uppercase font-black tracking-widest mt-1">
                              Статус
                            </p>
                          </div>
                        </div>

                        {/* Bio Section */}
                        {viewingUser.bio && (
                          <div className="mb-6">
                            <h3 className="text-[10px] font-black text-teal-800/40 uppercase tracking-widest mb-2 ml-1">
                              О себе
                            </h3>
                            <p className="text-teal-950 text-sm leading-relaxed bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
                              {viewingUser.bio}
                            </p>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                              <MapPin size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] font-black text-teal-800/40 uppercase tracking-widest">
                                Локация
                              </p>
                              <p className="text-teal-950 text-[10px] font-bold truncate">
                                {viewingUser.location || "Не указано"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                              <Globe size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] font-black text-teal-800/40 uppercase tracking-widest">
                                Сайт
                              </p>
                              {viewingUser.website ? (
                                <a
                                  href={viewingUser.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-600 text-[10px] font-bold truncate hover:underline block"
                                >
                                  {viewingUser.website.replace(
                                    /^https?:\/\//,
                                    "",
                                  )}
                                </a>
                              ) : (
                                <p className="text-teal-950 text-[10px] font-bold truncate">
                                  Не указано
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Achievements Preview */}
                        {viewingUser.achievements &&
                          viewingUser.achievements.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-[10px] font-black text-teal-800/40 uppercase tracking-widest mb-3 ml-1">
                                Достижения
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {viewingUser.achievements
                                  .slice(0, 4)
                                  .map((ach) => (
                                    <div
                                      key={ach.id}
                                      className="p-2 bg-white/50 backdrop-blur-md rounded-xl border border-white/50 flex items-center gap-2 shadow-sm"
                                      title={ach.title}
                                    >
                                      <span className="text-lg">
                                        {ach.icon}
                                      </span>
                                      <span className="text-[10px] font-bold text-teal-900">
                                        {ach.title}
                                      </span>
                                    </div>
                                  ))}
                                {viewingUser.achievements.length > 4 && (
                                  <div className="p-2 bg-white/50 backdrop-blur-md rounded-xl border border-white/50 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-bold text-teal-600">
                                      +{viewingUser.achievements.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Recent Activity */}
                        {viewingUser.activity &&
                          viewingUser.activity.length > 0 && (
                            <div>
                              <h3 className="text-[10px] font-black text-teal-800/40 uppercase tracking-widest mb-3 ml-1">
                                Последняя активность
                              </h3>
                              <div className="space-y-2">
                                {viewingUser.activity.slice(0, 3).map((act) => (
                                  <div
                                    key={act.id}
                                    className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
                                      <Activity size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-teal-950 text-[11px] font-medium leading-tight">
                                        {act.description}
                                      </p>
                                      <p className="text-teal-800/40 text-[9px] mt-0.5">
                                        {act.timestamp?.toDate
                                          ? new Date(
                                              act.timestamp.toDate(),
                                            ).toLocaleDateString()
                                          : "Недавно"}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {activeTab === "profile" ? (
                  <motion.div
                    key="profile-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <ProfileScreen currentUser={user} />
                  </motion.div>
                ) : activeTab === "contacts" ? (
                  <motion.div
                    key="contacts-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <ContactsScreen
                      friends={friends}
                      friendRequests={friendRequests}
                      sentRequests={sentRequests}
                      onSearch={handleSearch}
                      searchResults={searchResults}
                      searchLoading={searchLoading}
                      onSendRequest={sendFriendRequest}
                      onAcceptRequest={(reqId) => {
                        const req = friendRequests.find((r) => r.id === reqId);
                        if (req) acceptFriendRequest(req);
                      }}
                      onRejectRequest={declineFriendRequest}
                      onClearSearch={() => setSearchResults([])}
                    />
                  </motion.div>
                ) : activeTab === "messages" ? (
                  <motion.div
                    key="messages-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    {activeChat ? (
                      <ChatScreen
                        chat={{
                          id: activeChat.id,
                          participants: activeChat.participants,
                          name: (() => {
                            const otherUid = activeChat.participants.find(
                              (p) => p !== user?.uid,
                            );
                            const friend = friends.find(
                              (f) => f.uid === otherUid,
                            );
                            return friend
                              ? `${friend.firstName} ${friend.lastName}`
                              : "Chat";
                          })(),
                          lastMessage: activeChat.lastMessage || "",
                          time: activeChat.updatedAt
                            ? new Date(activeChat.updatedAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "",
                          unread: 0,
                          avatar: (() => {
                            const otherUid = activeChat.participants.find(
                              (p) => p !== user?.uid,
                            );
                            const friend = friends.find(
                              (f) => f.uid === otherUid,
                            );
                            return friend?.avatar;
                          })(),
                          isOnline: true,
                        }}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onBack={() => setActiveChat(null)}
                        currentUser={user}
                      />
                    ) : (
                      <ChatsScreen
                        chats={chats.map((chat) => {
                          const otherUid = chat.participants.find(
                            (p) => p !== user?.uid,
                          );
                          const friend = friends.find(
                            (f) => f.uid === otherUid,
                          );
                          return {
                            id: chat.id,
                            participants: chat.participants,
                            name: friend
                              ? `${friend.firstName} ${friend.lastName}`
                              : "Chat",
                            lastMessage: chat.lastMessage || "",
                            time: chat.updatedAt
                              ? new Date(chat.updatedAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "",
                            unread: 0,
                            avatar: friend?.avatar,
                            isOnline: true,
                          };
                        })}
                        friends={friends}
                        onSelectChat={(chat) =>
                          setActiveChat(
                            chats.find((c) => c.id === chat.id) || null,
                          )
                        }
                        onNewChat={openChat}
                      />
                    )}
                  </motion.div>
                ) : activeTab === "groups" ? (
                  <motion.div
                    key="groups-tab"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex flex-col"
                  >
                    {activeCommunity ? (
                      <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        className="fixed inset-0 z-[100] flex flex-col bg-slate-50 overflow-hidden"
                      >
                        {/* Immersive Header */}
                        <div className="relative h-80 shrink-0 overflow-hidden">
                          <div className="absolute inset-0 bg-teal-950">
                            <img
                              src={
                                activeCommunity.avatar ||
                                `https://picsum.photos/seed/${activeCommunity.id}/800/600`
                              }
                              className="w-full h-full object-cover opacity-60"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/20 to-transparent" />

                          <button
                            onClick={() => setActiveCommunity(null)}
                            className="absolute left-6 top-6 p-3 bg-black/20 backdrop-blur-xl text-white rounded-full hover:bg-black/40 transition-all z-10 border border-white/10"
                          >
                            <ArrowLeft size={20} />
                          </button>

                          <div className="absolute bottom-16 left-8 right-8 flex items-end justify-between">
                            <div className="flex items-center gap-6">
                              <div className="w-28 h-28 bg-white rounded-[32px] shadow-2xl flex items-center justify-center text-teal-900 border-4 border-white/20 overflow-hidden shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                {activeCommunity.avatar ? (
                                  <img
                                    src={activeCommunity.avatar}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Users2 size={36} />
                                )}
                              </div>
                              <div className="mb-2">
                                <h3 className="text-4xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-xl">
                                  {activeCommunity.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="px-4 py-1.5 bg-black/30 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/10 flex items-center gap-2 shadow-sm">
                                    <Users size={14} />
                                    {activeCommunity.memberCount || 0}{" "}
                                    участников
                                  </span>
                                  {activeCommunity.creatorId === user?.uid && (
                                    <span className="px-4 py-1.5 bg-emerald-500/40 backdrop-blur-md text-emerald-50 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-2 shadow-sm">
                                      <Shield size={14} />
                                      Создатель
                                    </span>
                                  )}
                                  {(activeCommunity.creatorId === user?.uid ||
                                    activeCommunityRole === "admin") && (
                                    <button
                                      onClick={() => {
                                        setCommunityFormData({
                                          name: activeCommunity.name,
                                          description:
                                            activeCommunity.description || "",
                                          avatar: activeCommunity.avatar || "",
                                        });
                                        setIsEditingCommunity(true);
                                      }}
                                      className="p-2 bg-black/30 backdrop-blur-md text-white rounded-full border border-white/10 hover:bg-black/50 transition-all shadow-sm"
                                    >
                                      <Settings size={16} />
                                    </button>
                                  )}
                                  {activeCommunity.creatorId === user?.uid && (
                                    <button
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            "Вы уверены, что хотите удалить сообщество? Это действие необратимо.",
                                          )
                                        ) {
                                          try {
                                            await deleteDoc(
                                              doc(
                                                db,
                                                "communities",
                                                activeCommunity.id,
                                              ),
                                            );
                                            setActiveCommunity(null);
                                          } catch (err) {
                                            handleFirestoreError(
                                              err,
                                              OperationType.DELETE,
                                              `communities/${activeCommunity.id}`,
                                            );
                                          }
                                        }
                                      }}
                                      className="p-2 bg-red-500/30 backdrop-blur-md text-red-100 rounded-full border border-red-500/30 hover:bg-red-500/50 transition-all shadow-sm"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 mb-2">
                              {myCommunities.includes(activeCommunity.id) ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() =>
                                    leaveCommunity(activeCommunity)
                                  }
                                  className="px-6 py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-red-500/20 hover:text-red-50 hover:border-red-500/30 transition-all border border-white/20 shadow-lg flex items-center justify-center gap-2"
                                >
                                  <LogOut size={16} />
                                  Покинуть
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => joinCommunity(activeCommunity)}
                                  className="px-8 py-3 bg-white text-teal-950 font-black rounded-2xl hover:bg-teal-50 transition-all shadow-xl hover:shadow-white/20 flex items-center justify-center gap-2"
                                >
                                  <UserPlus size={18} />
                                  Вступить
                                </motion.button>
                              )}
                              {myCommunities.includes(activeCommunity.id) && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() =>
                                    setShowCommunityMembers(
                                      !showCommunityMembers,
                                    )
                                  }
                                  className="px-6 py-3 bg-teal-500/20 backdrop-blur-md text-teal-50 font-bold rounded-2xl hover:bg-teal-500/30 transition-all border border-teal-500/30 shadow-lg flex items-center justify-center gap-2"
                                >
                                  <Users size={16} />
                                  {showCommunityMembers ? "Лента" : "Участники"}
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar relative z-10 rounded-t-[40px] -mt-10 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                          <div className="w-full px-8 py-10 space-y-10 max-w-4xl mx-auto">
                            {activeCommunity.description && (
                              <div className="bg-white p-6 rounded-[32px] border border-teal-100 shadow-sm">
                                <h4 className="text-xs font-black text-teal-800/40 uppercase tracking-widest mb-3">
                                  О сообществе
                                </h4>
                                <p className="text-teal-900 text-base leading-relaxed">
                                  {activeCommunity.description}
                                </p>
                              </div>
                            )}

                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xl font-bold text-teal-950">
                                  Лента
                                </h4>
                              </div>

                              {myCommunities.includes(activeCommunity.id) ? (
                                <form
                                  onSubmit={createCommunityPost}
                                  className="bg-white p-6 rounded-[32px] border border-teal-100/50 shadow-sm relative overflow-hidden focus-within:shadow-xl focus-within:shadow-teal-900/5 focus-within:border-teal-200 transition-all duration-500"
                                >
                                  <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[18px] flex items-center justify-center text-teal-600/40 shrink-0 border border-teal-100/50 shadow-inner overflow-hidden">
                                      {userProfile?.avatar ? (
                                        <img
                                          src={userProfile.avatar}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User size={20} />
                                      )}
                                    </div>
                                    <textarea
                                      value={communityPostText}
                                      onChange={(e) =>
                                        setCommunityPostText(e.target.value)
                                      }
                                      placeholder="Что нового в сообществе?"
                                      className="flex-1 py-2 text-base font-medium bg-transparent focus:outline-none resize-none min-h-[80px] text-teal-950 placeholder:text-teal-950/30"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-teal-50/50">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        className="p-2.5 text-teal-600/40 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-all"
                                      >
                                        <Camera size={20} strokeWidth={2.5} />
                                      </button>
                                      <button
                                        type="button"
                                        className="p-2.5 text-teal-600/40 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-all"
                                      >
                                        <Link size={20} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                    <button
                                      type="submit"
                                      disabled={!communityPostText.trim()}
                                      className="px-6 py-2.5 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 transition-all disabled:opacity-50 disabled:hover:bg-teal-500 shadow-lg shadow-teal-500/20 disabled:shadow-none flex items-center gap-2"
                                    >
                                      Опубликовать
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="bg-teal-50/50 p-12 rounded-[40px] border-2 border-dashed border-teal-100 text-center">
                                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-teal-300 mx-auto mb-6 shadow-sm">
                                    <Lock size={32} />
                                  </div>
                                  <h5 className="text-xl font-bold text-teal-900 mb-2">
                                    Только для участников
                                  </h5>
                                  <p className="text-teal-600/60 text-sm max-w-xs mx-auto">
                                    Вступите в сообщество, чтобы участвовать в
                                    обсуждениях и делиться мыслями.
                                  </p>
                                </div>
                              )}

                              <div className="space-y-6">
                                {communityPosts.length === 0 ? (
                                  <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-200 mx-auto mb-6">
                                      <MessageSquare size={40} />
                                    </div>
                                    <p className="text-teal-600/50 font-medium">
                                      Пока нет записей
                                    </p>
                                  </div>
                                ) : (
                                  communityPosts.map((post) => (
                                    <motion.div
                                      key={post.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      whileInView={{ opacity: 1, y: 0 }}
                                      viewport={{ once: true }}
                                      className="bg-white p-6 md:p-8 rounded-[32px] border border-teal-100/50 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-500 group"
                                    >
                                      <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[18px] flex items-center justify-center text-teal-600 font-bold text-lg border border-teal-100/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                          {post.authorName?.[0]?.toUpperCase() ||
                                            "?"}
                                        </div>
                                        <div>
                                          <span className="text-base font-black text-teal-950 block">
                                            {post.authorName || "Пользователь"}
                                          </span>
                                          <span className="text-[11px] text-teal-600/50 font-medium block mt-0.5 uppercase tracking-wider">
                                            {post.createdAt?.toDate
                                              ? post.createdAt
                                                  .toDate()
                                                  .toLocaleString()
                                              : "Только что"}
                                          </span>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1">
                                          {(post.authorId === user?.uid ||
                                            activeCommunityRole === "admin" ||
                                            activeCommunityRole ===
                                              "moderator" ||
                                            activeCommunity.creatorId ===
                                              user?.uid) && (
                                            <button
                                              onClick={() =>
                                                deletePost(post.id)
                                              }
                                              className="p-2.5 text-teal-600/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                              <Trash2
                                                size={18}
                                                strokeWidth={2.5}
                                              />
                                            </button>
                                          )}
                                          <button className="p-2.5 text-teal-600/40 hover:text-teal-900 hover:bg-teal-50 rounded-xl transition-all">
                                            <Share2
                                              size={18}
                                              strokeWidth={2.5}
                                            />
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-[15px] text-teal-900 leading-relaxed mb-6 font-medium whitespace-pre-wrap">
                                        {post.text}
                                      </p>
                                      <div className="flex items-center gap-6 pt-4 border-t border-teal-50/50">
                                        <button
                                          onClick={() =>
                                            likePost(
                                              activeCommunity.id,
                                              post.id,
                                              post.likes,
                                            )
                                          }
                                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${post.likes > 0 ? "bg-teal-50 text-teal-600" : "text-teal-600/60 hover:bg-teal-50 hover:text-teal-600"}`}
                                        >
                                          <Heart
                                            size={18}
                                            fill={
                                              post.likes > 0
                                                ? "currentColor"
                                                : "none"
                                            }
                                            strokeWidth={2.5}
                                          />
                                          <span className="text-sm font-bold">
                                            {post.likes || 0}
                                          </span>
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-teal-600/60 hover:bg-teal-50 hover:text-teal-950 transition-all">
                                          <MessageSquare
                                            size={18}
                                            strokeWidth={2.5}
                                          />
                                          <span className="text-sm font-bold">
                                            Ответить
                                          </span>
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Members Modal */}
                        <AnimatePresence>
                          {showCommunityMembers && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 z-50 bg-teal-950/40 backdrop-blur-sm flex items-center justify-center p-6"
                            >
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-full"
                              >
                                <div className="p-6 border-b border-teal-50 flex items-center justify-between">
                                  <h3 className="text-xl font-bold text-teal-950">
                                    Участники
                                  </h3>
                                  <button
                                    onClick={() =>
                                      setShowCommunityMembers(false)
                                    }
                                    className="p-2 text-teal-600/40 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-colors"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                                  {communityMembersList.map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-teal-100/50 shadow-sm hover:shadow-md transition-all duration-300 group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl flex items-center justify-center text-teal-600 font-bold border border-teal-100/50 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                          {member.profile?.avatar ? (
                                            <img
                                              src={member.profile.avatar}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <User size={20} strokeWidth={2.5} />
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm font-black text-teal-950">
                                            {member.profile
                                              ? `${member.profile.firstName} ${member.profile.lastName}`
                                              : member.uid}
                                          </div>
                                          <div className="text-[10px] font-bold text-teal-600/50 uppercase tracking-widest mt-0.5">
                                            {member.role === "admin"
                                              ? "Администратор"
                                              : member.role === "moderator"
                                                ? "Модератор"
                                                : "Участник"}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Role Management Controls */}
                                      {activeCommunityRole === "admin" &&
                                        member.uid !==
                                          activeCommunity.creatorId && (
                                          <div className="flex items-center gap-2">
                                            <select
                                              value={member.role}
                                              onChange={(e) =>
                                                updateMemberRole(
                                                  member.id,
                                                  e.target.value,
                                                )
                                              }
                                              className="text-[11px] font-bold text-teal-700 bg-teal-50/50 border border-teal-100 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                                            >
                                              <option value="member">
                                                Участник
                                              </option>
                                              <option value="moderator">
                                                Модератор
                                              </option>
                                              <option value="admin">
                                                Админ
                                              </option>
                                            </select>
                                            <button
                                              onClick={() =>
                                                removeMember(member.id)
                                              }
                                              className="p-2 text-teal-600/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                              title="Исключить"
                                            >
                                              <UserMinus
                                                size={18}
                                                strokeWidth={2.5}
                                              />
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ) : isEditingCommunity ? (
                      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-teal-100/50 shadow-2xl max-w-2xl mx-auto">
                        <div className="flex items-center gap-6 mb-10">
                          <button
                            onClick={() => setIsEditingCommunity(false)}
                            className="p-3 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-all shadow-sm"
                          >
                            <ArrowLeft size={24} strokeWidth={2.5} />
                          </button>
                          <div>
                            <h2 className="text-3xl font-black text-teal-950 leading-tight">
                              Редактирование
                            </h2>
                            <p className="text-teal-600/60 text-sm font-medium">
                              Обновите информацию о вашем сообществе
                            </p>
                          </div>
                        </div>
                        <form
                          onSubmit={handleUpdateCommunity}
                          className="space-y-8"
                        >
                          <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="relative group">
                              <div className="w-28 h-28 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[36px] flex items-center justify-center text-teal-400 border-2 border-dashed border-teal-200 overflow-hidden transition-all group-hover:border-teal-500 group-hover:bg-teal-100/50 shadow-inner">
                                {communityFormData.avatar ? (
                                  <img
                                    src={communityFormData.avatar}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera size={36} strokeWidth={2.5} />
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCommunityAvatarUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <p className="text-[11px] font-black text-teal-900/40 uppercase tracking-widest">
                              Обложка сообщества
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-teal-900 uppercase tracking-widest ml-4">
                              Название
                            </label>
                            <input
                              type="text"
                              required
                              value={communityFormData.name}
                              onChange={(e) =>
                                setCommunityFormData({
                                  ...communityFormData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-6 py-4 bg-teal-50/50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-3xl text-teal-950 font-bold placeholder:text-teal-600/30 transition-all outline-none shadow-inner"
                              placeholder="Например: Любители котиков"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-teal-900 uppercase tracking-widest ml-4">
                              Описание
                            </label>
                            <textarea
                              value={communityFormData.description}
                              onChange={(e) =>
                                setCommunityFormData({
                                  ...communityFormData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-6 py-4 bg-teal-50/50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-3xl text-teal-950 font-medium placeholder:text-teal-600/30 transition-all outline-none shadow-inner min-h-[160px] resize-none"
                              placeholder="О чем ваше сообщество?"
                            />
                          </div>
                          <div className="pt-6">
                            <button
                              type="submit"
                              disabled={
                                loading || !communityFormData.name.trim()
                              }
                              className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:shadow-teal-600/40 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 text-lg"
                            >
                              {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                              ) : (
                                "Сохранить изменения"
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : isCreatingCommunity ? (
                      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-teal-100/50 shadow-2xl max-w-2xl mx-auto">
                        <div className="flex items-center gap-6 mb-10">
                          <button
                            onClick={() => setIsCreatingCommunity(false)}
                            className="p-3 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-all shadow-sm"
                          >
                            <ArrowLeft size={24} strokeWidth={2.5} />
                          </button>
                          <div>
                            <h2 className="text-3xl font-black text-teal-950 leading-tight">
                              Новое сообщество
                            </h2>
                            <p className="text-teal-600/60 text-sm font-medium">
                              Создайте пространство для единомышленников
                            </p>
                          </div>
                        </div>
                        <form
                          onSubmit={handleCreateCommunity}
                          className="space-y-8"
                        >
                          <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="relative group">
                              <div className="w-28 h-28 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[36px] flex items-center justify-center text-teal-400 border-2 border-dashed border-teal-200 overflow-hidden transition-all group-hover:border-teal-500 group-hover:bg-teal-100/50 shadow-inner">
                                {communityFormData.avatar ? (
                                  <img
                                    src={communityFormData.avatar}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera size={36} strokeWidth={2.5} />
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCommunityAvatarUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <p className="text-[11px] font-black text-teal-900/40 uppercase tracking-widest">
                              Обложка сообщества
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-teal-900 uppercase tracking-widest ml-4">
                              Название
                            </label>
                            <input
                              type="text"
                              required
                              value={communityFormData.name}
                              onChange={(e) =>
                                setCommunityFormData({
                                  ...communityFormData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-6 py-4 bg-teal-50/50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-3xl text-teal-950 font-bold placeholder:text-teal-600/30 transition-all outline-none shadow-inner"
                              placeholder="Например: Любители котиков"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-teal-900 uppercase tracking-widest ml-4">
                              Описание
                            </label>
                            <textarea
                              value={communityFormData.description}
                              onChange={(e) =>
                                setCommunityFormData({
                                  ...communityFormData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-6 py-4 bg-teal-50/50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-3xl text-teal-950 font-medium placeholder:text-teal-600/30 transition-all outline-none shadow-inner min-h-[160px] resize-none"
                              placeholder="О чем ваше сообщество?"
                            />
                          </div>
                          <div className="pt-6">
                            <button
                              type="submit"
                              disabled={
                                loading || !communityFormData.name.trim()
                              }
                              className="w-full py-5 bg-teal-600 text-white font-black rounded-3xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:shadow-teal-600/40 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 text-lg"
                            >
                              {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                              ) : (
                                "Создать сообщество"
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="space-y-8 h-full flex flex-col">
                        <div className="flex justify-between items-end px-2">
                          <div>
                            <h2 className="text-3xl font-bold text-teal-950 tracking-tight">
                              Сообщества
                            </h2>
                            <p className="text-teal-600/60 text-xs mt-1">
                              Найдите своих людей
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {user?.email === "rdischat@gmail.com" && (
                              <button
                                onClick={deleteAllCommunities}
                                className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-90"
                                title="Удалить все сообщества"
                              >
                                <Trash2 size={24} />
                              </button>
                            )}
                            <button
                              onClick={() => setIsCreatingCommunity(true)}
                              className="p-3 bg-teal-950 text-white rounded-2xl hover:bg-teal-900 transition-all shadow-xl shadow-teal-950/20 active:scale-90"
                            >
                              <Plus size={24} />
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-4 mb-8">
                          <div className="relative flex-1 group">
                            <Search
                              className="absolute left-5 top-1/2 -translate-y-1/2 text-teal-600/30 group-focus-within:text-teal-500 transition-colors"
                              size={20}
                              strokeWidth={2.5}
                            />
                            <input
                              type="text"
                              placeholder="Поиск по названию..."
                              value={communitySearchQuery}
                              onChange={(e) =>
                                setCommunitySearchQuery(e.target.value)
                              }
                              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent focus:border-teal-500 rounded-[28px] focus:outline-none text-teal-950 font-bold placeholder:text-teal-600/30 transition-all shadow-sm hover:shadow-md"
                            />
                          </div>
                          <button className="p-5 bg-white border-2 border-transparent hover:border-teal-100 rounded-[28px] text-teal-600 hover:bg-teal-50 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <Filter size={20} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-10">
                          {/* Featured Section */}
                          {communitySearchQuery === "" &&
                            communities.length > 0 && (
                              <div className="mb-10">
                                <h3 className="text-[11px] font-black text-teal-950 uppercase tracking-[0.2em] mb-4 ml-4 opacity-40">
                                  Рекомендуемые
                                </h3>
                                <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar snap-x -mx-2 px-2">
                                  {communities.slice(0, 3).map((c) => (
                                    <div
                                      key={`featured-${c.id}`}
                                      onClick={() => setActiveCommunity(c)}
                                      className="w-[85%] md:w-[360px] h-64 shrink-0 relative rounded-[40px] overflow-hidden cursor-pointer group snap-center shadow-xl shadow-teal-900/10 hover:shadow-2xl hover:shadow-teal-900/20 transition-all duration-500"
                                    >
                                      <div className="absolute inset-0 bg-teal-950">
                                        {c.avatar ? (
                                          <img
                                            src={c.avatar}
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-70 group-hover:scale-110 transition-transform duration-1000" />
                                        )}
                                      </div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/20 to-transparent" />

                                      <div className="absolute top-6 left-6">
                                        <span className="px-4 py-2 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/20 shadow-lg">
                                          Выбор редакции
                                        </span>
                                      </div>

                                      <div className="absolute bottom-0 left-0 right-0 p-8">
                                        <h4 className="text-white font-black text-3xl mb-2 truncate drop-shadow-2xl">
                                          {c.name}
                                        </h4>
                                        <p className="text-white/70 text-sm line-clamp-2 mb-6 drop-shadow-lg max-w-[90%] font-medium">
                                          {c.description ||
                                            "Присоединяйтесь к нашему уютному сообществу!"}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl text-[11px] font-black border border-white/10 shadow-lg">
                                            <Users
                                              size={16}
                                              strokeWidth={2.5}
                                            />
                                            <span>{c.memberCount || 0}</span>
                                          </div>
                                          <div className="w-12 h-12 bg-white text-teal-950 rounded-2xl flex items-center justify-center transform group-hover:translate-x-2 transition-transform shadow-xl">
                                            <ArrowRight
                                              size={20}
                                              strokeWidth={3}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <h3 className="text-[11px] font-black text-teal-950 uppercase tracking-[0.2em] mb-4 ml-4 opacity-40">
                            Все сообщества
                          </h3>
                          <div className="space-y-4">
                            {communities
                              .filter((c) =>
                                c.name
                                  .toLowerCase()
                                  .includes(communitySearchQuery.toLowerCase()),
                              )
                              .map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => setActiveCommunity(c)}
                                  className="flex items-center justify-between p-6 bg-white border-2 border-transparent hover:border-teal-100/50 rounded-[32px] cursor-pointer shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-500 group"
                                >
                                  <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[24px] overflow-hidden flex items-center justify-center shrink-0 shadow-inner border border-teal-100/50 group-hover:scale-105 transition-transform duration-500">
                                      {c.avatar ? (
                                        <img
                                          src={c.avatar}
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <Users
                                          className="text-teal-600/30"
                                          size={32}
                                          strokeWidth={2.5}
                                        />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-black text-teal-950 text-lg flex items-center gap-2 mb-1.5">
                                        {c.name}
                                        {myCommunities.includes(c.id) && (
                                          <span className="bg-teal-100 text-teal-700 p-1 rounded-full shadow-sm">
                                            <Check size={12} strokeWidth={4} />
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-sm font-medium text-teal-600/60 line-clamp-1 max-w-[200px] md:max-w-md">
                                        {c.description || "Нет описания"}
                                      </p>
                                      <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-600/40 uppercase tracking-widest">
                                          <Users size={12} strokeWidth={2.5} />
                                          <span>
                                            {c.memberCount || 0} участников
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-12 h-12 bg-teal-50/50 text-teal-600 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500 shadow-sm">
                                    <ArrowRight size={20} strokeWidth={3} />
                                  </div>
                                </div>
                              ))}

                            {communities.length === 0 && (
                              <div className="text-center py-24 bg-white/30 rounded-[48px] border-2 border-dashed border-teal-100">
                                <Users2
                                  size={64}
                                  className="mx-auto text-teal-200 mb-6 opacity-10"
                                />
                                <p className="text-teal-800/40 font-bold text-sm">
                                  Здесь пока пусто
                                </p>
                                <p className="text-teal-600/30 text-xs mt-1">
                                  Будьте первым, кто создаст сообщество!
                                </p>
                                <button
                                  onClick={() => setIsCreatingCommunity(true)}
                                  className="mt-8 px-8 py-3 bg-teal-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform"
                                >
                                  Создать сейчас
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-teal-900/40"
                  >
                    <LayoutGrid size={32} className="mb-4 opacity-20" />
                    <p className="font-medium uppercase tracking-widest text-[9px]">
                      Раздел в разработке
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

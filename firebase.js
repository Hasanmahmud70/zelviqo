// ================================================================
// ZELVIQO LUXURY SKINCARE - FIREBASE MASTER CONTROLLER
// PRODUCTION BUG-FIXED & ENHANCED VERSION
// ================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail, 
    sendEmailVerification, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc,
    setDoc,
    getDoc,
    getDocs,
    query, 
    where,
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Production Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiN8DvUWmkd5T579LHiP4aAWgLvZ44HcI",
  authDomain: "zelviqo-f9531.firebaseapp.com",
  projectId: "zelviqo-f9531",
  storageBucket: "zelviqo-f9531.firebasestorage.app",
  messagingSenderId: "886553994948",
  appId: "1:886553994948:web:2e3c0fb3d1ccb81a7c0b91",
  measurementId: "G-WSNEJPW7FQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Global Auth State
let currentUser = null;

// Observe Auth State Changes
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    const authBtnText = document.getElementById("authBtnText");
    const accountNavItem = document.getElementById("accountNavItem");

    if (user) {
        if (authBtnText) authBtnText.innerText = user.displayName || user.email.split('@')[0];
        if (accountNavItem) accountNavItem.style.display = "inline-block";
        
        // Auto-fill checkout fields if user profile exists
        await loadUserProfileToCheckout(user.uid);
    } else {
        if (authBtnText) authBtnText.innerText = "Login / Register";
        if (accountNavItem) accountNavItem.style.display = "none";
    }
});

// Helper: Get Logged In User
export function getCurrentUser() {
    return currentUser;
}

// 1. SIGNUP WITH EMAIL
export async function registerUser(name, email, password, phone) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        await sendEmailVerification(user);

        // Save User Document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone || "",
            address: "",
            createdAt: serverTimestamp()
        });

        alert("Account created successfully! A verification email has been sent to your inbox.");
        closeModal("authModal");
        return user;
    } catch (error) {
        alert("Registration Error: " + error.message);
        throw error;
    }
}

// 2. LOGIN WITH EMAIL
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Welcome back, " + (userCredential.user.displayName || "Valued Customer") + "!");
        closeModal("authModal");
        return userCredential.user;
    } catch (error) {
        alert("Login Error: " + error.message);
        throw error;
    }
}

// 3. GOOGLE LOGIN
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists, if not create it
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                uid: user.uid,
                name: user.displayName || "Google User",
                email: user.email,
                phone: user.phoneNumber || "",
                address: "",
                createdAt: serverTimestamp()
            });
        }

        alert("Signed in successfully with Google!");
        closeModal("authModal");
        return user;
    } catch (error) {
        alert("Google Sign-In Error: " + error.message);
        throw error;
    }
}

// 4. FORGOT PASSWORD
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Please check your inbox.");
    } catch (error) {
        alert("Password Reset Error: " + error.message);
    }
}

// 5. LOGOUT
export async function logoutUser() {
    try {
        await signOut(auth);
        alert("You have logged out.");
        closeModal("accountModal");
    } catch (error) {
        alert("Logout Error: " + error.message);
    }
}

// 6. UPDATE PROFILE & ADDRESS
export async function updateUserProfile(name, phone, address) {
    if (!currentUser) return;
    try {
        await updateProfile(currentUser, { displayName: name });
        await setDoc(doc(db, "users", currentUser.uid), {
            name: name,
            phone: phone,
            address: address,
            updatedAt: serverTimestamp()
        }, { merge: true });

        alert("Profile and address saved successfully!");
    } catch (error) {
        alert("Profile Update Error: " + error.message);
    }
}

// 7. LOAD USER PROFILE TO CHECKOUT & ACCOUNT FORM
export async function loadUserProfileToCheckout(uid) {
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Checkout Form Fields
            const nameInput = document.getElementById("name");
            const phoneInput = document.getElementById("phone");
            const addressInput = document.getElementById("address");

            if (nameInput && !nameInput.value) nameInput.value = data.name || "";
            if (phoneInput && !phoneInput.value) phoneInput.value = data.phone || "";
            if (addressInput && !addressInput.value) addressInput.value = data.address || "";

            // Account Dashboard Fields
            const profileName = document.getElementById("accName");
            const profilePhone = document.getElementById("accPhone");
            const profileAddress = document.getElementById("accAddress");

            if (profileName) profileName.value = data.name || "";
            if (profilePhone) profilePhone.value = data.phone || "";
            if (profileAddress) profileAddress.value = data.address || "";
        }
    } catch (err) {
        console.error("Error loading user profile:", err);
    }
}

// 8. SAVE USER ORDER TO FIRESTORE
export async function saveOrderToFirestore(orderData) {
    try {
        const userId = currentUser ? currentUser.uid : "GUEST";
        await addDoc(collection(db, "orders"), {
            ...orderData,
            userId: userId,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error("Error saving order to Firestore:", err);
    }
}

// 9. FETCH USER ORDER HISTORY
export async function fetchUserOrderHistory() {
    if (!currentUser) return [];
    try {
        const q = query(
            collection(db, "orders"), 
            where("userId", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return orders;
    } catch (err) {
        console.error("Error fetching order history:", err);
        return [];
    }
}

// 10. REVIEWS SYSTEM (FIRESTORE)
export function initReviewSystem() {
    const reviewsListContainer = document.getElementById("reviews-list");
    const seeMoreBtn = document.getElementById("seeMoreBtn");
    let reviews = [];
    let showAll = false;

    const render = () => {
        if (!reviewsListContainer) return;
        if (reviews.length === 0) {
            reviewsListContainer.innerHTML = `<p class="no-reviews" style="text-align:center; width:100%;">No reviews yet. Be the first to share your experience!</p>`;
            if (seeMoreBtn) seeMoreBtn.style.display = "none";
            return;
        }

        const visible = showAll ? reviews : reviews.slice(0, 3);
        reviewsListContainer.innerHTML = visible.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${escapeHtml(r.name)}</strong>
                    <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
                </div>
                <p class="review-text">${escapeHtml(r.text)}</p>
            </div>
        `).join("");

        if (seeMoreBtn) {
            seeMoreBtn.style.display = reviews.length > 3 ? "inline-block" : "none";
            seeMoreBtn.innerText = showAll ? "Show Less" : "See More Reviews";
        }
    };

    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        reviews = [];
        snapshot.forEach((doc) => reviews.push({ id: doc.id, ...doc.data() }));
        render();
    });

    if (seeMoreBtn) {
        seeMoreBtn.addEventListener("click", () => {
            showAll = !showAll;
            render();
        });
    }

    const reviewForm = document.getElementById("reviewForm");
    if (reviewForm) {
        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("reviewName").value.trim();
            const text = document.getElementById("reviewText").value.trim();
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            const rating = ratingInput ? parseInt(ratingInput.value, 10) : 5;

            if (!name || !text) return alert("Please complete all fields.");

            const submitBtn = document.getElementById("submitReviewBtn");
            submitBtn.disabled = true;
            submitBtn.innerText = "Submitting...";

            try {
                await addDoc(collection(db, "reviews"), {
                    name: name,
                    rating: rating,
                    text: text,
                    timestamp: serverTimestamp()
                });
                reviewForm.reset();
                alert("Thank you! Your review has been published.");
            } catch (err) {
                alert("Failed to submit review. Try again.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Review";
            }
        });
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// Expose Auth API globally for DOM button actions
window.zelviqoAuth = {
    registerUser,
    loginUser,
    loginWithGoogle,
    resetPassword,
    logoutUser,
    updateUserProfile,
    fetchUserOrderHistory,
    saveOrderToFirestore,
    getCurrentUser
};

// Initialize Reviews
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReviewSystem);
} else {
    initReviewSystem();
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiN8DvUWmkd5T579LHiP4aAWgLvZ44HcI",
  authDomain: "zelviqo-f9531.firebaseapp.com",
  projectId: "zelviqo-f9531",
  storageBucket: "zelviqo-f9531.firebasestorage.app",
  messagingSenderId: "886553994948",
  appId: "1:886553994948:web:2e3c0fb3d1ccb81a7c0b91",
  measurementId: "G-WSNEJPW7FQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;

// State management for reviews
let reviewsList = [];
let showAllReviews = false;

// Helper function to escape HTML to prevent XSS issues
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to render reviews in the DOM
function renderReviews() {
    const reviewsContainer = document.getElementById("reviews-list");
    const seeMoreBtn = document.getElementById("seeMoreBtn");

    if (!reviewsContainer) return;

    if (reviewsList.length === 0) {
        reviewsContainer.innerHTML = `<p class="no-reviews">No reviews yet. Be the first to review this product.</p>`;
        if (seeMoreBtn) seeMoreBtn.style.display = "none";
        return;
    }

    const visibleReviews = showAllReviews ? reviewsList : reviewsList.slice(0, 3);

    reviewsContainer.innerHTML = visibleReviews.map(review => {
        const starCount = parseInt(review.rating, 10) || 5;
        const stars = "★".repeat(starCount) + "☆".repeat(5 - starCount);
        return `
            <div class="review-box">
                <div class="review-header">
                    <strong>${escapeHtml(review.name)}</strong>
                    <span class="review-stars">${stars}</span>
                </div>
                <p>${escapeHtml(review.text)}</p>
            </div>
        `;
    }).join("");

    if (seeMoreBtn) {
        if (reviewsList.length > 3) {
            seeMoreBtn.style.display = "inline-block";
            seeMoreBtn.innerText = showAllReviews ? "Show Less" : "See More Reviews";
        } else {
            seeMoreBtn.style.display = "none";
        }
    }
}

// Initialize Firestore Review Listeners and Form Handlers
function initReviewSystem() {
    const reviewsCollection = collection(db, "reviews");
    const q = query(reviewsCollection, orderBy("timestamp", "desc"));

    // Real-time Firestore snapshot listener
    onSnapshot(q, (snapshot) => {
        reviewsList = [];
        snapshot.forEach((doc) => {
            reviewsList.push({ id: doc.id, ...doc.data() });
        });
        renderReviews();
    }, (error) => {
        console.error("Error fetching reviews: ", error);
    });

    // Handle Review Form Submission
    const reviewForm = document.getElementById("reviewForm");
    if (reviewForm) {
        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("reviewName");
            const textInput = document.getElementById("reviewText");
            const ratingInput = document.querySelector('input[name="rating"]:checked');

            const name = nameInput ? nameInput.value.trim() : "";
            const text = textInput ? textInput.value.trim() : "";
            const rating = ratingInput ? parseInt(ratingInput.value, 10) : 5;

            if (!name || !text) {
                alert("Please fill in all fields.");
                return;
            }

            const submitBtn = document.getElementById("submitReviewBtn");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Submitting...";
            }

            try {
                await addDoc(collection(db, "reviews"), {
                    name: name,
                    rating: rating,
                    text: text,
                    timestamp: serverTimestamp()
                });

                reviewForm.reset();
                alert("Thank you! Your review has been submitted.");
            } catch (err) {
                console.error("Error adding review: ", err);
                alert("Failed to submit review. Please try again.");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Submit Review";
                }
            }
        });
    }

    // See More Reviews toggle handler
    const seeMoreBtn = document.getElementById("seeMoreBtn");
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener("click", () => {
            showAllReviews = !showAllReviews;
            renderReviews();
        });
    }
}

// Ensure DOM is ready before attaching listeners
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReviewSystem);
} else {
    initReviewSystem();
}

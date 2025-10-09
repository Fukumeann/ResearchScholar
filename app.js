// Firebase configuration and imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAM8d-8hBOSf6jeR6zClVHFPU8s-o8n33Y",
    authDomain: "researchscholar-d232c.firebaseapp.com",
    projectId: "researchscholar-d232c",
    storageBucket: "researchscholar-d232c.firebasestorage.app",
    messagingSenderId: "140321397579",
    appId: "1:140321397579:web:966748afc14576562fa6ce",
    measurementId: "G-2SD4G9E6D3"
};

// Initialize Firebase
let firebaseApp, firebaseAuth, googleProvider, firebaseDb;

try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    googleProvider = new GoogleAuthProvider();

    console.log("Firebase connected:", firebaseApp.name);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    console.error("Failed to initialize authentication. Please refresh the page.");
}

// Check Firebase connection status
function checkFirebaseConnection() {
    if (!firebaseApp || !firebaseAuth || !firebaseDb) {
        console.error("Firebase not properly initialized");
        showNotification("Database connection issue. Please refresh the page.", "error");
        return false;
    }
    return true;
}

// DOM Elements
const elements = {
    // Navigation
    burgerMenuBtn: document.getElementById("burgerMenuBtn"),
    navbarLinks: document.getElementById("navbarLinks"),
    appSidebar: document.getElementById("appSidebar"),

    // Navigation links (will be reassigned after updates)
    loginNavLink: null,
    registerNavLink: null,

    // Modals
    loginModal: document.getElementById("loginModal"),
    registerModal: document.getElementById("registerModal"),
    logoutModal: document.getElementById("logoutModal"),
    closeLoginModal: document.getElementById("closeLoginModal"),
    closeRegisterModal: document.getElementById("closeRegisterModal"),
    closeLogoutModal: document.getElementById("closeLogoutModal"),
    cancelLogout: document.getElementById("cancelLogout"),
    confirmLogout: document.getElementById("confirmLogout"),

    // Forms
    loginForm: document.getElementById("loginForm"),
    registerForm: document.getElementById("registerForm"),
    googleLoginBtn: document.getElementById("googleLoginBtn"),

    // Search
    searchBtn: document.getElementById("searchBtn"),
    searchInput: document.getElementById("searchInput"),

    // User status
    userStatus: document.getElementById("userStatus")
};

// Application state
let currentUser = null;
let settingsAuthResolved = false;
let settingsLoginWarned = false;
let lastUserDocWriteAt = null; // Guards against stale Firestore reads overwriting fresh UI

// Utility functions
function showModal(modal) {
    if (modal) {
        modal.classList.add("is-visible");
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove("is-visible");
        document.body.style.overflow = '';
    }
}

function hideAllModals() {
    hideModal(elements.loginModal);
    hideModal(elements.registerModal);
    hideModal(elements.logoutModal);
}

function toggleSidebar() {
    if (elements.appSidebar) {
        elements.appSidebar.classList.toggle("is-visible");
    }
}

function toggleMobileNav() {
    if (elements.navbarLinks) {
        elements.navbarLinks.classList.toggle("is-visible");
    }
}

function updateUserStatus(user) {
    if (!elements.userStatus || !elements.navbarLinks) return;

    if (user) {
        elements.userStatus.textContent = `Welcome, ${user.displayName || user.email}!`;
        elements.userStatus.classList.add("is-logged-in");

        elements.navbarLinks.innerHTML = `
            <a href="#" class="navbar-link" id="logoutNavLink"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;

        const logoutNavLink = document.getElementById("logoutNavLink");
        if (logoutNavLink) {
            logoutNavLink.addEventListener("click", (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    } else {
        elements.userStatus.textContent = "Guest User";
        elements.userStatus.classList.remove("is-logged-in");

        elements.navbarLinks.innerHTML = `
            <a href="#" class="navbar-link" id="registerNavLink">Register</a>
            <a href="#" class="navbar-link" id="loginNavLink">Log in</a>
        `;

        attachNavLinkListeners();
        attachSidebarLinkListeners();
    }
}

function attachNavLinkListeners() {
    const loginNavLink = document.getElementById("loginNavLink");
    const registerNavLink = document.getElementById("registerNavLink");

    if (loginNavLink) {
        loginNavLink.addEventListener("click", (e) => {
            e.preventDefault();
            showModal(elements.loginModal);
            if (elements.navbarLinks) {
                elements.navbarLinks.classList.remove("is-visible");
            }
        });
    }

    if (registerNavLink) {
        registerNavLink.addEventListener("click", (e) => {
            e.preventDefault();
            showModal(elements.registerModal);
            if (elements.navbarLinks) {
                elements.navbarLinks.classList.remove("is-visible");
            }
        });
    }
}

function attachSidebarLinkListeners() {
    const allSidebarLinks = document.querySelectorAll('.sidebar-navigation a');
    allSidebarLinks.forEach(link => {
        link.removeEventListener("click", handleSidebarNavigation);
        link.addEventListener("click", handleSidebarNavigation);
    });
}

function handleSidebarNavigation(event) {
    closeSidebar();

    if (event.target.classList.contains('is-restricted')) {
        event.preventDefault();
        if (!currentUser) {
            const feature = event.target.dataset.feature || 'this feature';
            console.log(`Please log in to access the ${feature}.`);
            showModal(elements.loginModal);
        } else {
            const feature = event.target.dataset.feature || 'this feature';
            console.log(`Accessing ${feature}... (functionality to be implemented)`);
            window.location.href = event.target.href;
        }
    } else {
        console.log(`Navigating to: ${event.target.href}`);
    }
}

// Event handlers
const QUICK_DELAY = 300;
const SAVE_DELAY = 400;

function handleLogin(event) {
    event.preventDefault();
    const emailInput = event.target.querySelector('input[type="email"]');
    const passwordInput = event.target.querySelector('input[type="password"]');

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
        showNotification("Please fill in all fields", "warning");
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;

    setTimeout(() => {
        simulateUserLogin(email);
        showNotification("Login successful! Welcome back!", "success");
        hideModal(elements.loginModal);

        emailInput.value = '';
        passwordInput.value = '';

        submitBtn.innerHTML = 'Log in';
        submitBtn.disabled = false;
        restoreIcons();
    }, QUICK_DELAY);
}


function handleRegister(event) {
    event.preventDefault();
    const inputs = event.target.querySelectorAll('input');
    const name = inputs[0] ? inputs[0].value.trim() : '';
    const email = inputs[1] ? inputs[1].value.trim() : '';
    const password = inputs[2] ? inputs[2].value.trim() : '';

    if (!name || !email || !password) {
        showNotification("Please fill in all fields", "warning");
        return;
    }

    if (password.length < 6) {
        showNotification("Password must be at least 6 characters long", "warning");
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    setTimeout(async () => {
        console.log("Registering with:", { name, email, password });

        showNotification("Account created successfully! Welcome to ResearchScholar!", "success");
        hideModal(elements.registerModal);

        // Create user object with registration data
        const newUser = {
            uid: 'user-' + Date.now(),
            email: email,
            displayName: name,
            photoURL: null
        };

        currentUser = newUser;
        updateUserStatus(newUser);

        // Create profile with registration data
        await createProfileFromRegistration(name, email);

        inputs.forEach(input => input.value = '');

        submitBtn.innerHTML = 'Register';
        submitBtn.disabled = false;
        restoreIcons();
    }, 1500);
}

function simulateUserLogin(email, name = null) {
    const mockUser = {
        uid: 'mock-user-' + Date.now(),
        email: email,
        displayName: name || email.split('@')[0],
        photoURL: null
    };

    currentUser = mockUser;
    updateUserStatus(mockUser);

    console.log("User logged in:", mockUser);
}

function handleGoogleLogin() {
    if (!firebaseAuth || !googleProvider) {
        console.error("Firebase auth not initialized");
        showNotification("Authentication service not available. Please refresh the page.", "error");
        return;
    }

    signInWithPopup(firebaseAuth, googleProvider)
        .then(async (result) => {
            const user = result.user;
            currentUser = user;
            console.log("Google login successful:", user);
            hideModal(elements.loginModal);
            showNotification('Logged in successfully!', 'success');

            // Immediately populate forms with Google user data
            if (window.location.pathname.includes('profile.html')) {
                console.log("Google login on profile page, populating immediately");
                updateAvatarInitials(user.displayName || user.email);
                populateProfileWithDefaults();
            }

            if (window.location.pathname.includes('settings.html')) {
                console.log("Google login on settings page, populating immediately");
                populateSettingsWithDefaults();
            }

            // Load or create profile
            if (firebaseDb) {
                await loadProfileData();
            }
        })
        .catch((error) => {
            console.error("Google Login Error:", error);
            let errorMessage = "Google login failed. ";

            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage += "Login popup was closed.";
                    break;
                case 'auth/popup-blocked':
                    errorMessage += "Login popup was blocked. Please allow popups for this site.";
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage += "Login was cancelled.";
                    break;
                default:
                    errorMessage += error.message;
            }

            showNotification(errorMessage, 'error');
        });
}

function handleLogout() {
    showModal(elements.logoutModal);
}

function confirmLogout() {
    if (!firebaseAuth) {
        console.error("Firebase auth not initialized");
        showNotification("Authentication service not available. Please refresh the page.", "error");
        return;
    }

    signOut(firebaseAuth)
        .then(() => {
            currentUser = null;
            console.log("Logged out successfully!");
            showNotification("Logged out successfully!", "success");
            hideModal(elements.logoutModal);
            if (elements.appSidebar) {
                elements.appSidebar.classList.remove("is-visible");
            }

            // Redirect to index.html after logout
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        })
        .catch((error) => {
            console.error("Logout Error:", error);
            showNotification("Logout failed: " + error.message, "error");
        });
}

function closeSidebar() {
    if (elements.appSidebar) {
        setTimeout(() => {
            elements.appSidebar.classList.remove("is-visible");
        }, 150);
    }
}

// Ensure Font Awesome icons are loaded and preserved
function ensureIconsLoaded() {
    if (typeof FontAwesome === 'undefined' && !document.querySelector('link[href*="font-awesome"]')) {
        console.warn('Font Awesome not loaded, adding CDN link');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }

    const iconButtons = document.querySelectorAll('.btn i, .btn-icon i, .btn-small i');
    iconButtons.forEach(button => {
        if (button.parentElement && !button.parentElement.dataset.iconPreserved) {
            button.parentElement.dataset.iconPreserved = 'true';
            button.parentElement.dataset.originalIcon = button.className;
        }
    });
}

function restoreIcons() {
    const elementsWithIcons = document.querySelectorAll('[data-icon-preserved="true"]');
    elementsWithIcons.forEach(element => {
        const iconClass = element.dataset.originalIcon;
        if (iconClass && !element.querySelector('i')) {
            const icon = document.createElement('i');
            icon.className = iconClass;
            element.insertBefore(icon, element.firstChild);
        }
    });
}

// Page-specific functionality
function initializePageFeatures() {
    initializeProfileFeatures();
    initializeLibraryFeatures();
    initializePublishedFeatures();
    initializeQuestionsFeatures();
    initializeNotificationsFeatures();
    initializeSettingsFeatures();
    initializeAllButtons();

    setTimeout(() => {
        restoreIcons();
    }, 100);
}

function initializeAllButtons() {
    const allButtons = document.querySelectorAll('.btn, .btn-small, .btn-icon, .btn-secondary, .btn-danger');
    allButtons.forEach(button => {
        if (button.dataset.initialized) return;

        button.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });

        button.dataset.initialized = 'true';
    });

    const formButtons = document.querySelectorAll('form .btn[type="submit"]');
    formButtons.forEach(button => {
        if (!button.dataset.formInitialized) {
            button.addEventListener('click', function (e) {
                if (!this.innerHTML.includes('spinner')) {
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                    this.disabled = true;

                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.disabled = false;
                        restoreIcons();
                    }, 1000);
                }
            });
            button.dataset.formInitialized = 'true';
        }
    });
}

// PROFILE PAGE FUNCTIONALITY

async function initializeProfileFeatures() {
    console.log("Initializing profile features...");

    // Wait for Firebase auth to be ready
    if (!firebaseAuth) {
        console.warn("Firebase auth not available, retrying in 1 second...");
        setTimeout(initializeProfileFeatures, 1000);
        return;
    }

    // Force update avatar and form fields immediately if user is logged in
    if (currentUser) {
        console.log("User is logged in, force updating profile immediately");
        updateAvatarInitials(currentUser.displayName || currentUser.email);
        populateProfileWithDefaults();
    }

    // Always try to load profile data, even if currentUser is null
    // This handles cases where the user was logged in before page refresh
    console.log("Attempting to load profile data...");
    await loadProfileData();

    // Add interest functionality
    const addInterestBtn = document.getElementById('addInterestBtn');
    if (addInterestBtn) {
        addInterestBtn.addEventListener('click', function () {
            showAddInterestModal();
        });
    }

    // Remove interest on click
    attachInterestRemovalListeners();

    // Save profile changes
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function () {
            if (!currentUser) {
                showNotification('Please log in to save changes', 'warning');
                showModal(elements.loginModal);
                return;
            }

            await saveProfileData();
        });
    }

    // Cancel button - reset form to last saved state
    const cancelBtn = document.getElementById('cancelChangesBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async function () {
            if (currentUser) {
                await loadProfileData();
                showNotification('Changes discarded', 'info');
            } else {
                resetProfileForm();
                showNotification('Form reset', 'info');
            }
        });
    }

    // Change avatar button
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function () {
            showNotification('Avatar upload feature coming soon!', 'info');
        });
    }

    // Add demo stats update functionality
    addStatsUpdateDemo();

    console.log("Profile features initialized successfully");
}

function resetProfileForm() {
    document.getElementById('fullName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('institution').value = '';
    document.getElementById('department').value = '';
    document.getElementById('bio').value = '';

    // Clear interests
    const interestsContainer = document.getElementById('interestsContainer');
    if (interestsContainer) {
        const existingTags = interestsContainer.querySelectorAll('.interest-tag');
        existingTags.forEach(tag => tag.remove());
    }

    // Reset avatar
    updateAvatarInitials('');

    // Reset stats
    updateProfileStats({
        papersPublished: 0,
        citations: 0,
        averageRating: 0,
        collaborators: 0
    });
}

// Load profile data from Firestore
async function loadProfileData() {
    if (!currentUser) {
        console.log('No user logged in, cannot load profile');
        resetProfileForm();
        return;
    }

    if (!firebaseDb) {
        console.error('Firestore not initialized');
        showNotification('Database connection not available', 'error');
        return;
    }

    try {
        console.log('Loading profile data for user:', currentUser.uid);

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Profile data loaded:', userData);

            // Skip applying if this payload is older than our most recent write
            if (lastUserDocWriteAt && userData.updatedAt && userData.updatedAt < lastUserDocWriteAt) {
                console.log('Stale profile payload detected, skipping UI apply');
                return;
            }

            // Populate form fields with a small delay to ensure DOM is ready
            setTimeout(() => {
                const fullNameInput = document.getElementById('fullName');
                const emailInput = document.getElementById('email');
                const institutionInput = document.getElementById('institution');
                const departmentInput = document.getElementById('department');
                const bioTextarea = document.getElementById('bio');

                console.log('Populating profile form with data:', {
                    fullName: userData.fullName || currentUser.displayName,
                    email: userData.email || currentUser.email,
                    institution: userData.institution,
                    department: userData.department,
                    bio: userData.bio
                });

                if (fullNameInput) {
                    fullNameInput.value = userData.fullName || currentUser.displayName || '';
                    console.log('Set fullName to:', fullNameInput.value);
                }
                if (emailInput) {
                    emailInput.value = userData.email || currentUser.email || '';
                    console.log('Set email to:', emailInput.value);
                }
                if (institutionInput) {
                    institutionInput.value = userData.institution || '';
                    console.log('Set institution to:', institutionInput.value);
                }
                if (departmentInput) {
                    departmentInput.value = userData.department || '';
                    console.log('Set department to:', departmentInput.value);
                }
                if (bioTextarea) {
                    bioTextarea.value = userData.bio || '';
                    console.log('Set bio to:', bioTextarea.value);
                }

                // Update avatar initials
                updateAvatarInitials(userData.fullName || currentUser.displayName || currentUser.email);

                // Load research interests
                const interestsContainer = document.getElementById('interestsContainer');
                if (interestsContainer) {
                    // Clear existing interests (except the add button)
                    const existingTags = interestsContainer.querySelectorAll('.interest-tag');
                    existingTags.forEach(tag => tag.remove());

                    // Add interests from database
                    if (userData.interests && Array.isArray(userData.interests)) {
                        userData.interests.forEach(interest => {
                            addInterestTag(interest);
                        });
                    }
                }

                // Update stats if available
                if (userData.stats) {
                    updateProfileStats(userData.stats);
                } else {
                    // Initialize default stats
                    updateProfileStats({
                        papersPublished: 0,
                        citations: 0,
                        averageRating: 0,
                        collaborators: 0
                    });
                }

                console.log('Profile loaded successfully');
            }, 100);

        } else {
            // Create initial profile document
            console.log('No existing profile found, creating initial profile...');
            await createInitialProfile();
            // Populate with default values while creating profile
            populateProfileWithDefaults();
            // Reload the newly created profile
            await loadProfileData();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile data: ' + error.message, 'error');
        // Fallback: populate with default values
        populateProfileWithDefaults();
    }
}

// Save profile data to Firestore
async function saveProfileData() {
    if (!currentUser) {
        showNotification('Please log in to save changes', 'warning');
        showModal(elements.loginModal);
        return;
    }

    if (!firebaseDb) {
        showNotification('Database connection not available', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveProfileBtn');
    const originalHTML = saveBtn.innerHTML;

    try {
        // Show loading state
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        // Get form values
        const fullName = document.getElementById('fullName')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const institution = document.getElementById('institution')?.value.trim() || '';
        const department = document.getElementById('department')?.value.trim() || '';
        const bio = document.getElementById('bio')?.value.trim() || '';

        // Get research interests
        const interestTags = document.querySelectorAll('.interests-container .interest-tag');
        const interests = Array.from(interestTags).map(tag => tag.textContent.trim());

        // Get current stats to preserve them
        const currentStats = {
            papersPublished: parseInt(document.getElementById('papersCount')?.textContent) || 0,
            citations: parseInt(document.getElementById('citationsCount')?.textContent) || 0,
            averageRating: parseFloat(document.getElementById('ratingValue')?.textContent) || 0,
            collaborators: parseInt(document.getElementById('collaboratorsCount')?.textContent) || 0
        };

        const writeAt = new Date().toISOString();
        // Prepare profile data
        const profileData = {
            fullName,
            email: email || currentUser.email,
            institution,
            department,
            bio,
            interests,
            stats: currentStats,
            updatedAt: writeAt
        };

        // Save to Firestore
        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await setDoc(userDocRef, profileData, { merge: true });
        lastUserDocWriteAt = writeAt;

        // Immediately update the UI to reflect saved changes
        updateProfileUI(profileData);

        // Show success message
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveBtn.style.background = '#10b981';

        showNotification('Profile saved successfully!', 'success');
        console.log('Profile saved:', profileData);

        // Restore button quickly
        setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.style.background = '';
            saveBtn.disabled = false;
            restoreIcons();
        }, 1000);

    } catch (error) {
        console.error('Error saving profile:', error);

        // Show error state
        saveBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error!';
        saveBtn.style.background = '#dc2626';
        saveBtn.disabled = false;

        showNotification('Failed to save profile: ' + error.message, 'error');

        // Restore button after delay
        setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.style.background = '';
            restoreIcons();
        }, 2000);
    }
}

// Create initial profile for new users
async function createInitialProfile() {
    if (!currentUser || !firebaseDb) {
        console.error('Cannot create profile: User not logged in or Firestore not available');
        return;
    }

    try {
        const initialData = {
            fullName: currentUser.displayName || '',
            email: currentUser.email || '',
            institution: '',
            department: '',
            bio: '',
            interests: [],
            stats: {
                papersPublished: 0,
                citations: 0,
                averageRating: 0,
                collaborators: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await setDoc(userDocRef, initialData);

        console.log('Initial profile created successfully');
        showNotification('Welcome! Your profile has been created.', 'success');
    } catch (error) {
        console.error('Error creating initial profile:', error);
        showNotification('Failed to create profile: ' + error.message, 'error');
    }
}

// Create profile from registration data
async function createProfileFromRegistration(name, email) {
    if (!currentUser || !firebaseDb) {
        console.error('Cannot create profile: User not logged in or Firestore not available');
        return;
    }

    try {
        const profileData = {
            fullName: name,
            email: email,
            institution: '',
            department: '',
            bio: '',
            interests: [],
            stats: {
                papersPublished: 0,
                citations: 0,
                averageRating: 0,
                collaborators: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await setDoc(userDocRef, profileData);

        console.log('Profile created from registration:', profileData);

        // If we're on the profile page, load the data immediately
        if (window.location.pathname.includes('profile.html')) {
            setTimeout(() => {
                loadProfileData();
            }, 500);
        }
    } catch (error) {
        console.error('Error creating profile from registration:', error);
        showNotification('Failed to create profile: ' + error.message, 'error');
    }
}

// Update avatar initials
function updateAvatarInitials(name) {
    const avatarText = document.getElementById('avatarInitials');
    console.log('Updating avatar initials with name:', name);
    console.log('Avatar element found:', !!avatarText);

    if (avatarText && name) {
        const initials = name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
        console.log('Generated initials:', initials);
        avatarText.textContent = initials || 'U';
        console.log('Avatar text set to:', avatarText.textContent);
    } else {
        console.log('Avatar not updated - missing element or name');
    }
}
// Update profile statistics
function updateProfileStats(stats) {
    const papersCount = document.getElementById('papersCount');
    const citationsCount = document.getElementById('citationsCount');
    const ratingValue = document.getElementById('ratingValue');
    const collaboratorsCount = document.getElementById('collaboratorsCount');

    if (papersCount) {
        papersCount.textContent = stats.papersPublished || 0;
        animateStatUpdate(papersCount);
    }
    if (citationsCount) {
        citationsCount.textContent = stats.citations || 0;
        animateStatUpdate(citationsCount);
    }
    if (ratingValue) {
        ratingValue.textContent = stats.averageRating?.toFixed(1) || '0.0';
        animateStatUpdate(ratingValue);
    }
    if (collaboratorsCount) {
        collaboratorsCount.textContent = stats.collaborators || 0;
        animateStatUpdate(collaboratorsCount);
    }
}

// Animate stat updates for visual feedback
function animateStatUpdate(element) {
    element.style.transition = 'all 0.3s ease';
    element.style.transform = 'scale(1.1)';
    element.style.color = '#10b981';

    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.color = '';
    }, 300);
}

// Update profile UI immediately after saving
function updateProfileUI(profileData) {
    // Update avatar initials
    updateAvatarInitials(profileData.fullName);

    // Update form inputs immediately to reflect saved changes
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const institutionInput = document.getElementById('institution');
    const departmentInput = document.getElementById('department');
    const bioTextarea = document.getElementById('bio');

    if (fullNameInput) fullNameInput.value = profileData.fullName || '';
    if (emailInput) emailInput.value = profileData.email || '';
    if (institutionInput) institutionInput.value = profileData.institution || '';
    if (departmentInput) departmentInput.value = profileData.department || '';
    if (bioTextarea) bioTextarea.value = profileData.bio || '';

    // Update stats if they exist
    if (profileData.stats) {
        updateProfileStats(profileData.stats);
    }

    // Update interests display
    const interestsContainer = document.getElementById('interestsContainer');
    if (interestsContainer && profileData.interests) {
        // Clear existing interests (except the add button)
        const existingTags = interestsContainer.querySelectorAll('.interest-tag');
        existingTags.forEach(tag => tag.remove());

        // Add interests from saved data
        profileData.interests.forEach(interest => {
            addInterestTag(interest);
        });
    }

    // Add visual feedback for successful save
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.style.transition = 'all 0.3s ease';
        profileContainer.style.transform = 'scale(1.02)';
        profileContainer.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';

        setTimeout(() => {
            profileContainer.style.transform = 'scale(1)';
            profileContainer.style.boxShadow = '';
        }, 500);
    }

    console.log('Profile UI updated with saved data');
}

function addInterestTag(interest) {
    const container = document.getElementById('interestsContainer');
    if (container) {
        const tag = document.createElement('div');
        tag.className = 'interest-tag';
        tag.textContent = interest;
        tag.style.cursor = 'pointer';
        tag.title = 'Click to remove';

        // Add click to remove functionality
        tag.addEventListener('click', function () {
            showRemoveInterestModal(interest, this);
        });

        // Insert before the add button
        const addButton = container.querySelector('#addInterestBtn');
        if (addButton) {
            container.insertBefore(tag, addButton);
        } else {
            container.appendChild(tag);
        }
    }
}

// Attach listeners to existing interest tags for removal
function attachInterestRemovalListeners() {
    const interestTags = document.querySelectorAll('.interest-tag');
    interestTags.forEach(tag => {
        if (!tag.dataset.listenerAttached) {
            tag.style.cursor = 'pointer';
            tag.title = 'Click to remove';
            tag.addEventListener('click', function () {
                const interest = this.textContent.trim();
                showRemoveInterestModal(interest, this);
            });
            tag.dataset.listenerAttached = 'true';
        }
    });
}

// Save interests to Firebase immediately when they change
async function saveInterestsToFirebase() {
    if (!currentUser || !firebaseDb) {
        return;
    }

    try {
        // Get current interests from the UI
        const interestTags = document.querySelectorAll('.interests-container .interest-tag');
        const interests = Array.from(interestTags).map(tag => tag.textContent.trim());

        // Get current stats to preserve them
        const currentStats = {
            papersPublished: parseInt(document.getElementById('papersCount')?.textContent) || 0,
            citations: parseInt(document.getElementById('citationsCount')?.textContent) || 0,
            averageRating: parseFloat(document.getElementById('ratingValue')?.textContent) || 0,
            collaborators: parseInt(document.getElementById('collaboratorsCount')?.textContent) || 0
        };

        const writeAt = new Date().toISOString();
        // Update only interests in Firebase
        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            interests: interests,
            stats: currentStats,
            updatedAt: writeAt
        });
        lastUserDocWriteAt = writeAt;

        console.log('Interests saved to Firebase:', interests);
    } catch (error) {
        console.error('Error saving interests:', error);
        showNotification('Failed to save interests: ' + error.message, 'error');
    }
}

// Add demo functionality for stats updates
function addStatsUpdateDemo() {
    // Add click handlers to stat cards for demo purposes
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.title = 'Click to simulate stat update';

        card.addEventListener('click', function () {
            if (currentUser) {
                simulateStatsUpdate();
            } else {
                showNotification('Please log in to update stats', 'warning');
            }
        });
    });
}

// Simulate stats update for demonstration
async function simulateStatsUpdate() {
    if (!currentUser || !firebaseDb) {
        showNotification('Please log in to update stats', 'warning');
        return;
    }

    try {
        // Get current stats
        const currentStats = {
            papersPublished: parseInt(document.getElementById('papersCount')?.textContent) || 0,
            citations: parseInt(document.getElementById('citationsCount')?.textContent) || 0,
            averageRating: parseFloat(document.getElementById('ratingValue')?.textContent) || 0,
            collaborators: parseInt(document.getElementById('collaboratorsCount')?.textContent) || 0
        };

        // Simulate some growth
        const newStats = {
            papersPublished: currentStats.papersPublished + Math.floor(Math.random() * 3) + 1,
            citations: currentStats.citations + Math.floor(Math.random() * 10) + 5,
            averageRating: Math.min(5.0, currentStats.averageRating + (Math.random() * 0.2)),
            collaborators: currentStats.collaborators + Math.floor(Math.random() * 2) + 1
        };

        // Update UI immediately
        updateProfileStats(newStats);

        // Save to Firebase
        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            stats: newStats,
            updatedAt: new Date().toISOString()
        });

        showNotification('Stats updated successfully!', 'success');
        console.log('Stats updated:', newStats);
    } catch (error) {
        console.error('Error updating stats:', error);
        showNotification('Failed to update stats: ' + error.message, 'error');
    }
}

// Populate profile with default values
function populateProfileWithDefaults() {
    console.log('Populating profile with default values...');
    console.log('Current user:', currentUser);

    // Set default profile values
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');

    console.log('Form elements found:', {
        fullNameInput: !!fullNameInput,
        emailInput: !!emailInput
    });

    if (fullNameInput && currentUser) {
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
        fullNameInput.value = displayName;
        console.log('Set fullName to:', displayName);
    }
    if (emailInput && currentUser) {
        const email = currentUser.email || '';
        emailInput.value = email;
        console.log('Set email to:', email);
    }

    // Update avatar initials
    if (currentUser) {
        const nameForAvatar = currentUser.displayName || currentUser.email;
        console.log('Updating avatar with name:', nameForAvatar);
        updateAvatarInitials(nameForAvatar);
    }

    console.log('Default profile populated');
}

// Show modal for adding interests
function showAddInterestModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'addInterestModal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-btn" onclick="closeAddInterestModal()">&times;</button>
            <h2 class="modal-title"><i class="fas fa-plus"></i> Add Research Interest</h2>
            <form id="addInterestForm">
                <div class="form-group">
                    <label for="interestInput">Research Interest</label>
                    <input type="text" id="interestInput" class="form-input" placeholder="e.g., Machine Learning, Quantum Computing" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeAddInterestModal()">Cancel</button>
                    <button type="submit" class="btn">Add Interest</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const form = document.getElementById('addInterestForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const interest = document.getElementById('interestInput').value.trim();
        if (interest) {
            addInterestTag(interest);
            showNotification('Interest added successfully!', 'success');

            // If user is logged in, auto-save the updated interests
            if (currentUser) {
                saveInterestsToFirebase();
            }

            closeAddInterestModal();
        }
    });

    // Focus on input
    setTimeout(() => {
        document.getElementById('interestInput').focus();
    }, 100);
}

// Close add interest modal
function closeAddInterestModal() {
    const modal = document.getElementById('addInterestModal');
    if (modal) {
        modal.remove();
    }
}

// Show modal for removing interests
function showRemoveInterestModal(interest, element) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'removeInterestModal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-btn" onclick="closeRemoveInterestModal()">&times;</button>
            <div class="modal-icon">
                <i class="fas fa-trash-alt"></i>
            </div>
            <h2 class="modal-title">Remove Interest</h2>
            <p>Are you sure you want to remove "<strong>${interest}</strong>" from your research interests?</p>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeRemoveInterestModal()">Cancel</button>
                <button type="button" class="btn btn-danger" onclick="confirmRemoveInterest('${interest}', this)">Remove</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Close remove interest modal
function closeRemoveInterestModal() {
    const modal = document.getElementById('removeInterestModal');
    if (modal) {
        modal.remove();
    }
}

// Confirm interest removal
function confirmRemoveInterest(interest, button) {
    // Find and remove the interest tag
    const interestTags = document.querySelectorAll('.interest-tag');
    interestTags.forEach(tag => {
        if (tag.textContent.trim() === interest) {
            tag.remove();
        }
    });

    showNotification('Interest removed', 'info');

    // If user is logged in, auto-save the updated interests
    if (currentUser) {
        saveInterestsToFirebase();
    }

    closeRemoveInterestModal();
}

// END PROFILE FUNCTIONALITY

// SETTINGS PAGE FUNCTIONALITY

// Load settings data from Firebase
async function loadSettingsData() {
    if (!currentUser || !firebaseDb) {
        console.log('No user logged in or Firebase not available');
        // Don't show notification here as it might be called during initialization
        return;
    }

    try {
        console.log('Loading settings data for user:', currentUser.uid);

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Settings data loaded:', userData);

            // Skip applying if this payload is older than our most recent write
            if (lastUserDocWriteAt && userData.updatedAt && userData.updatedAt < lastUserDocWriteAt) {
                console.log('Stale settings payload detected, skipping UI apply');
                return;
            }

            // Populate account settings
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');

            console.log('Populating settings form with data:', {
                username: userData.username || userData.fullName,
                email: userData.email || currentUser.email
            });

            if (usernameInput) {
                usernameInput.value = userData.username || userData.fullName || currentUser.displayName || '';
                console.log('Set username to:', usernameInput.value);
            }
            if (emailInput) {
                emailInput.value = userData.email || currentUser.email || '';
                console.log('Set email to:', emailInput.value);
            }

            // Populate research preferences
            const primaryFieldSelect = document.getElementById('primaryField');
            const experienceLevelSelect = document.getElementById('experienceLevel');
            const paperLanguageSelect = document.getElementById('paperLanguage');

            if (primaryFieldSelect) primaryFieldSelect.value = userData.primaryField || 'Machine Learning';
            if (experienceLevelSelect) experienceLevelSelect.value = userData.experienceLevel || 'Graduate Student';
            if (paperLanguageSelect) paperLanguageSelect.value = userData.paperLanguage || 'English';

            // Populate privacy settings
            const profilePublic = document.getElementById('profilePublic');
            const showReadingActivity = document.getElementById('showReadingActivity');
            const allowCollaboration = document.getElementById('allowCollaboration');
            const shareStats = document.getElementById('shareStats');

            if (profilePublic) profilePublic.checked = userData.privacy?.profilePublic !== false;
            if (showReadingActivity) showReadingActivity.checked = userData.privacy?.showReadingActivity === true;
            if (allowCollaboration) allowCollaboration.checked = userData.privacy?.allowCollaboration !== false;
            if (shareStats) shareStats.checked = userData.privacy?.shareStats === true;

            // Populate notification settings
            const emailNotifications = document.getElementById('emailNotifications');
            const paperRecommendations = document.getElementById('paperRecommendations');
            const citationAlerts = document.getElementById('citationAlerts');
            const qaNotifications = document.getElementById('qaNotifications');
            const weeklyDigest = document.getElementById('weeklyDigest');
            const marketingEmails = document.getElementById('marketingEmails');

            if (emailNotifications) emailNotifications.checked = userData.notifications?.emailNotifications !== false;
            if (paperRecommendations) paperRecommendations.checked = userData.notifications?.paperRecommendations !== false;
            if (citationAlerts) citationAlerts.checked = userData.notifications?.citationAlerts === true;
            if (qaNotifications) qaNotifications.checked = userData.notifications?.qaNotifications !== false;
            if (weeklyDigest) weeklyDigest.checked = userData.notifications?.weeklyDigest === true;
            if (marketingEmails) marketingEmails.checked = userData.notifications?.marketingEmails === true;

            console.log('Settings loaded successfully');
        } else {
            console.log('No existing settings found, using defaults');
            populateSettingsWithDefaults();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Failed to load settings: ' + error.message, 'error');
        // Fallback: populate with default values
        populateSettingsWithDefaults();
    }
}

// Save account settings
async function saveAccountSettings() {
    if (!currentUser || !firebaseDb) {
        showNotification('Please log in to save settings', 'warning');
        return;
    }

    const updateAccountBtn = document.getElementById('updateAccountBtn');
    const originalHTML = updateAccountBtn.innerHTML;

    try {
        updateAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        updateAccountBtn.disabled = true;

        const username = document.getElementById('username')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const currentPassword = document.getElementById('currentPassword')?.value.trim() || '';
        const newPassword = document.getElementById('newPassword')?.value.trim() || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';

        // Validate password change if provided
        if (newPassword && newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        const writeAt = new Date().toISOString();
        const accountData = {
            username: username,
            email: email || currentUser.email,
            updatedAt: writeAt
        };

        // Add password change if provided
        if (newPassword && currentPassword) {
            accountData.passwordChanged = true;
            // Note: In a real app, you'd hash the password and verify the current one
        }

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await updateDoc(userDocRef, accountData);
        lastUserDocWriteAt = writeAt;

        updateAccountBtn.innerHTML = '<i class="fas fa-check"></i> Updated!';
        updateAccountBtn.style.background = '#10b981';
        showNotification('Account settings updated successfully!', 'success');

        setTimeout(() => {
            updateAccountBtn.innerHTML = originalHTML;
            updateAccountBtn.style.background = '';
            updateAccountBtn.disabled = false;
            restoreIcons();
        }, 2000);

    } catch (error) {
        console.error('Error saving account settings:', error);
        updateAccountBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error!';
        updateAccountBtn.style.background = '#dc2626';
        showNotification('Failed to save account settings: ' + error.message, 'error');

        setTimeout(() => {
            updateAccountBtn.innerHTML = originalHTML;
            updateAccountBtn.style.background = '';
            updateAccountBtn.disabled = false;
            restoreIcons();
        }, 3000);
    }
}

// Save research preferences
async function saveResearchPreferences() {
    if (!currentUser || !firebaseDb) {
        showNotification('Please log in to save settings', 'warning');
        return;
    }

    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    const originalHTML = savePreferencesBtn.innerHTML;

    try {
        savePreferencesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        savePreferencesBtn.disabled = true;

        const primaryField = document.getElementById('primaryField')?.value || '';
        const experienceLevel = document.getElementById('experienceLevel')?.value || '';
        const paperLanguage = document.getElementById('paperLanguage')?.value || '';

        const writeAt = new Date().toISOString();
        const preferencesData = {
            primaryField: primaryField,
            experienceLevel: experienceLevel,
            paperLanguage: paperLanguage,
            updatedAt: writeAt
        };

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await updateDoc(userDocRef, preferencesData);
        lastUserDocWriteAt = writeAt;

        savePreferencesBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        savePreferencesBtn.style.background = '#10b981';
        showNotification('Research preferences saved successfully!', 'success');

        setTimeout(() => {
            savePreferencesBtn.innerHTML = originalHTML;
            savePreferencesBtn.style.background = '';
            savePreferencesBtn.disabled = false;
            restoreIcons();
        }, 2000);

    } catch (error) {
        console.error('Error saving research preferences:', error);
        savePreferencesBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error!';
        savePreferencesBtn.style.background = '#dc2626';
        showNotification('Failed to save research preferences: ' + error.message, 'error');

        setTimeout(() => {
            savePreferencesBtn.innerHTML = originalHTML;
            savePreferencesBtn.style.background = '';
            savePreferencesBtn.disabled = false;
            restoreIcons();
        }, 3000);
    }
}

// Save notification settings
async function saveNotificationSettings() {
    if (!currentUser || !firebaseDb) {
        showNotification('Please log in to save settings', 'warning');
        return;
    }

    const updateNotificationsBtn = document.getElementById('updateNotificationsBtn');
    const originalHTML = updateNotificationsBtn.innerHTML;

    try {
        updateNotificationsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        updateNotificationsBtn.disabled = true;

        const emailNotifications = document.getElementById('emailNotifications')?.checked || false;
        const paperRecommendations = document.getElementById('paperRecommendations')?.checked || false;
        const citationAlerts = document.getElementById('citationAlerts')?.checked || false;
        const qaNotifications = document.getElementById('qaNotifications')?.checked || false;
        const weeklyDigest = document.getElementById('weeklyDigest')?.checked || false;
        const marketingEmails = document.getElementById('marketingEmails')?.checked || false;

        const writeAt = new Date().toISOString();
        const notificationsData = {
            notifications: {
                emailNotifications: emailNotifications,
                paperRecommendations: paperRecommendations,
                citationAlerts: citationAlerts,
                qaNotifications: qaNotifications,
                weeklyDigest: weeklyDigest,
                marketingEmails: marketingEmails
            },
            updatedAt: writeAt
        };

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await updateDoc(userDocRef, notificationsData);
        lastUserDocWriteAt = writeAt;

        updateNotificationsBtn.innerHTML = '<i class="fas fa-check"></i> Updated!';
        updateNotificationsBtn.style.background = '#10b981';
        showNotification('Notification settings updated successfully!', 'success');

        setTimeout(() => {
            updateNotificationsBtn.innerHTML = originalHTML;
            updateNotificationsBtn.style.background = '';
            updateNotificationsBtn.disabled = false;
            restoreIcons();
        }, 2000);

    } catch (error) {
        console.error('Error saving notification settings:', error);
        updateNotificationsBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error!';
        updateNotificationsBtn.style.background = '#dc2626';
        showNotification('Failed to save notification settings: ' + error.message, 'error');

        setTimeout(() => {
            updateNotificationsBtn.innerHTML = originalHTML;
            updateNotificationsBtn.style.background = '';
            updateNotificationsBtn.disabled = false;
            restoreIcons();
        }, 3000);
    }
}

// Auto-save settings to Firebase
async function saveSettingsToFirebase() {
    if (!currentUser || !firebaseDb) {
        return;
    }

    try {
        // Get current settings
        const profilePublic = document.getElementById('profilePublic')?.checked || false;
        const showReadingActivity = document.getElementById('showReadingActivity')?.checked || false;
        const allowCollaboration = document.getElementById('allowCollaboration')?.checked || false;
        const shareStats = document.getElementById('shareStats')?.checked || false;

        const emailNotifications = document.getElementById('emailNotifications')?.checked || false;
        const paperRecommendations = document.getElementById('paperRecommendations')?.checked || false;
        const citationAlerts = document.getElementById('citationAlerts')?.checked || false;
        const qaNotifications = document.getElementById('qaNotifications')?.checked || false;
        const weeklyDigest = document.getElementById('weeklyDigest')?.checked || false;
        const marketingEmails = document.getElementById('marketingEmails')?.checked || false;

        const writeAt = new Date().toISOString();
        const settingsData = {
            privacy: {
                profilePublic: profilePublic,
                showReadingActivity: showReadingActivity,
                allowCollaboration: allowCollaboration,
                shareStats: shareStats
            },
            notifications: {
                emailNotifications: emailNotifications,
                paperRecommendations: paperRecommendations,
                citationAlerts: citationAlerts,
                qaNotifications: qaNotifications,
                weeklyDigest: weeklyDigest,
                marketingEmails: marketingEmails
            },
            updatedAt: writeAt
        };

        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        await updateDoc(userDocRef, settingsData);
        lastUserDocWriteAt = writeAt;

        console.log('Settings auto-saved to Firebase');
    } catch (error) {
        console.error('Error auto-saving settings:', error);
    }
}

// Populate settings with default values
function populateSettingsWithDefaults() {
    console.log('Populating settings with default values...');
    console.log('Current user:', currentUser);

    // Set default account values
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    console.log('Settings form elements found:', {
        usernameInput: !!usernameInput,
        emailInput: !!emailInput
    });

    if (usernameInput && currentUser) {
        const username = currentUser.displayName || currentUser.email?.split('@')[0] || '';
        usernameInput.value = username;
        console.log('Set username to:', username);
    }
    if (emailInput && currentUser) {
        const email = currentUser.email || '';
        emailInput.value = email;
        console.log('Set email to:', email);
    }

    // Set default research preferences
    const primaryFieldSelect = document.getElementById('primaryField');
    const experienceLevelSelect = document.getElementById('experienceLevel');
    const paperLanguageSelect = document.getElementById('paperLanguage');

    console.log('Research preference elements found:', {
        primaryFieldSelect: !!primaryFieldSelect,
        experienceLevelSelect: !!experienceLevelSelect,
        paperLanguageSelect: !!paperLanguageSelect
    });

    if (primaryFieldSelect) {
        primaryFieldSelect.value = 'Machine Learning';
        console.log('Set primary field to: Machine Learning');
    }
    if (experienceLevelSelect) {
        experienceLevelSelect.value = 'Graduate Student';
        console.log('Set experience level to: Graduate Student');
    }
    if (paperLanguageSelect) {
        paperLanguageSelect.value = 'English';
        console.log('Set paper language to: English');
    }

    console.log('Default settings populated');
}

// END SETTINGS FUNCTIONALITY

// Library page functionality
function initializeLibraryFeatures() {
    const heartBtns = document.querySelectorAll('.btn-icon[title="Add to Favorites"]');
    heartBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            this.classList.toggle('favorited');
            if (this.classList.contains('favorited')) {
                this.innerHTML = '<i class="fas fa-heart" style="color: #dc2626;"></i>';
                showNotification('Added to favorites!', 'success');
            } else {
                this.innerHTML = '<i class="fas fa-heart"></i>';
                showNotification('Removed from favorites', 'info');
            }
        });
    });

    const downloadBtns = document.querySelectorAll('.btn-icon[title="Download"]');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            showNotification('Download started...', 'info');
            setTimeout(() => {
                showNotification('Download completed!', 'success');
            }, 2000);
        });
    });

    const shareBtns = document.querySelectorAll('.btn-icon[title="Share"]');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (navigator.share) {
                navigator.share({
                    title: 'Research Paper',
                    text: 'Check out this interesting research paper!',
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showNotification('Link copied to clipboard!', 'success');
                });
            }
        });
    });

    const filterSelects = document.querySelectorAll('.form-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function () {
            console.log(`Filter changed: ${this.value}`);
            showNotification(`Filtered by: ${this.value}`, 'info');
            filterPapers(this.value);
        });
    });

    const librarySearchBtn = document.querySelector('.library-controls .btn');
    if (librarySearchBtn && librarySearchBtn.textContent.includes('Search')) {
        librarySearchBtn.addEventListener('click', function () {
            const searchInput = document.querySelector('.library-controls .search-input');
            if (searchInput && searchInput.value.trim()) {
                console.log(`Searching library for: ${searchInput.value}`);
                showNotification(`Searching for: ${searchInput.value}`, 'info');
                searchLibraryPapers(searchInput.value);
            } else {
                showNotification('Please enter a search term', 'warning');
            }
        });
    }

    const sortSelects = document.querySelectorAll('select[name="sort"]');
    sortSelects.forEach(select => {
        select.addEventListener('change', function () {
            console.log(`Sort changed: ${this.value}`);
            showNotification(`Sorted by: ${this.value}`, 'info');
            sortPapers(this.value);
        });
    });
}

function filterPapers(filterValue) {
    const papers = document.querySelectorAll('.paper-card, .search-result-item');
    papers.forEach(paper => {
        if (filterValue === 'all') {
            paper.style.display = 'block';
        } else {
            const shouldShow = Math.random() > 0.3;
            paper.style.display = shouldShow ? 'block' : 'none';
        }
    });
}

function searchLibraryPapers(query) {
    const papers = document.querySelectorAll('.paper-card, .search-result-item');
    let foundCount = 0;

    papers.forEach(paper => {
        const title = paper.querySelector('h3, h4')?.textContent.toLowerCase() || '';
        const abstract = paper.querySelector('.paper-abstract, .result-abstract')?.textContent.toLowerCase() || '';

        if (title.includes(query.toLowerCase()) || abstract.includes(query.toLowerCase())) {
            paper.style.display = 'block';
            foundCount++;
        } else {
            paper.style.display = 'none';
        }
    });

    showNotification(`Found ${foundCount} papers matching "${query}"`, 'info');
}

function sortPapers(sortValue) {
    const container = document.querySelector('.papers-grid, .search-results-list');
    if (!container) return;

    const papers = Array.from(container.children);

    papers.sort((a, b) => {
        switch (sortValue) {
            case 'title':
                const titleA = a.querySelector('h3, h4')?.textContent || '';
                const titleB = b.querySelector('h3, h4')?.textContent || '';
                return titleA.localeCompare(titleB);
            case 'year':
                const yearA = parseInt(a.querySelector('.year')?.textContent) || 0;
                const yearB = parseInt(b.querySelector('.year')?.textContent) || 0;
                return yearB - yearA;
            case 'rating':
                const ratingA = parseFloat(a.querySelector('.rating')?.textContent) || 0;
                const ratingB = parseFloat(b.querySelector('.rating')?.textContent) || 0;
                return ratingB - ratingA;
            default:
                return 0;
        }
    });

    papers.forEach(paper => container.appendChild(paper));
}

// Published page functionality
function initializePublishedFeatures() {
    const editBtns = document.querySelectorAll('.publication-actions .btn-small');
    editBtns.forEach(btn => {
        if (btn.textContent.includes('Edit')) {
            btn.addEventListener('click', function () {
                console.log('Editing publication...');
            });
        }
    });

    const pubFilterSelects = document.querySelectorAll('.publication-controls .form-select');
    pubFilterSelects.forEach(select => {
        select.addEventListener('change', function () {
            console.log(`Publication filter changed: ${this.value}`);
        });
    });
}

// Questions page functionality
function initializeQuestionsFeatures() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            tabBtns.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            console.log(`Switched to tab: ${this.textContent}`);
            showNotification(`Viewing: ${this.textContent}`, 'info');
            filterQuestionsByTab(this.textContent);
        });
    });

    const answerBtns = document.querySelectorAll('.question-actions .btn-small');
    answerBtns.forEach(btn => {
        if (btn.textContent.includes('Answer')) {
            btn.addEventListener('click', function () {
                console.log('Opening answer form...');
                showAnswerForm(this);
            });
        }
    });

    const upvoteBtns = document.querySelectorAll('.btn-secondary[title="Upvote"]');
    upvoteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            this.classList.toggle('upvoted');
            if (this.classList.contains('upvoted')) {
                this.style.background = '#10b981';
                this.style.color = 'white';
                showNotification('Question upvoted!', 'success');
                updateVoteCount(this, 1);
            } else {
                this.style.background = '';
                this.style.color = '';
                showNotification('Upvote removed', 'info');
                updateVoteCount(this, -1);
            }
        });
    });

    const askQuestionBtn = document.querySelector('.qa-actions .btn');
    if (askQuestionBtn && askQuestionBtn.textContent.includes('Ask Question')) {
        askQuestionBtn.addEventListener('click', function () {
            showAskQuestionForm();
        });
    }

    const followBtns = document.querySelectorAll('.btn-icon[title="Follow"]');
    followBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            this.classList.toggle('following');
            if (this.classList.contains('following')) {
                this.innerHTML = '<i class="fas fa-bell" style="color: #5b21b6;"></i>';
                showNotification('Following question', 'success');
            } else {
                this.innerHTML = '<i class="fas fa-bell"></i>';
                showNotification('Unfollowed question', 'info');
            }
        });
    });
}

function filterQuestionsByTab(tabName) {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach(question => {
        const shouldShow = Math.random() > 0.2;
        question.style.display = shouldShow ? 'block' : 'none';
    });
}

function showAnswerForm(button) {
    const questionItem = button.closest('.question-item');
    if (!questionItem) return;

    let answerForm = questionItem.querySelector('.answer-form');
    if (answerForm) {
        answerForm.style.display = answerForm.style.display === 'none' ? 'block' : 'none';
        return;
    }

    answerForm = document.createElement('div');
    answerForm.className = 'answer-form';
    answerForm.innerHTML = `
        <div class="answer-form-content">
            <h4><i class="fas fa-reply"></i> Write Your Answer</h4>
            <textarea class="form-textarea" placeholder="Share your knowledge and help the community..." rows="4"></textarea>
            <div class="answer-form-actions">
                <button class="btn btn-secondary" onclick="cancelAnswer(this)">Cancel</button>
                <button class="btn" onclick="submitAnswer(this)">Post Answer</button>
            </div>
        </div>
    `;

    const questionText = questionItem.querySelector('.question-text');
    questionText.parentNode.insertBefore(answerForm, questionText.nextSibling);

    const textarea = answerForm.querySelector('textarea');
    textarea.focus();
}

function showAskQuestionForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'askQuestionModal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-btn" onclick="closeAskQuestionModal()">&times;</button>
            <h2 class="modal-title"><i class="fas fa-question-circle"></i> Ask a Question</h2>
            <form id="askQuestionForm">
                <div class="form-group">
                    <label for="questionTitle">Question Title</label>
                    <input type="text" id="questionTitle" class="form-input" placeholder="What's your question?" required>
                </div>
                <div class="form-group">
                    <label for="questionCategory">Category</label>
                    <select id="questionCategory" class="form-select" required>
                        <option value="">Select a category</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Psychology">Psychology</option>
                        <option value="Economics">Economics</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="questionDetails">Question Details</label>
                    <textarea id="questionDetails" class="form-textarea" placeholder="Provide more details about your question..." rows="5" required></textarea>
                </div>
                <div class="form-group">
                    <label for="questionTags">Tags (comma-separated)</label>
                    <input type="text" id="questionTags" class="form-input" placeholder="e.g., machine learning, research, methodology">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeAskQuestionModal()">Cancel</button>
                    <button type="submit" class="btn">Post Question</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const form = document.getElementById('askQuestionForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitQuestion();
    });
}

function closeAskQuestionModal() {
    const modal = document.getElementById('askQuestionModal');
    if (modal) {
        modal.remove();
    }
}

function submitQuestion() {
    const title = document.getElementById('questionTitle').value;
    const category = document.getElementById('questionCategory').value;
    const details = document.getElementById('questionDetails').value;
    const tags = document.getElementById('questionTags').value;

    if (!title || !category || !details) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }

    showNotification('Question posted successfully!', 'success');
    closeAskQuestionModal();

    setTimeout(() => {
        addNewQuestion(title, category, details, tags);
    }, 1000);
}

function addNewQuestion(title, category, details, tags) {
    const questionsList = document.querySelector('.questions-list');
    if (!questionsList) return;

    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.innerHTML = `
        <div class="question-header">
            <h3>${title}</h3>
            <div class="question-actions">
                <button class="btn-icon" title="Follow"><i class="fas fa-bell"></i></button>
                <button class="btn-icon" title="Share"><i class="fas fa-share"></i></button>
            </div>
        </div>
        <div class="question-meta">
            <span class="category"><i class="fas fa-tag"></i> ${category}</span>
            <span class="time"><i class="fas fa-clock"></i> Just now</span>
            <span class="author"><i class="fas fa-user"></i> You</span>
        </div>
        <div class="question-text">${details}</div>
        <div class="question-tags">
            ${tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
        </div>
        <div class="question-stats">
            <div class="stat">
                <i class="fas fa-thumbs-up"></i>
                <span class="vote-count">0</span>
            </div>
            <div class="stat">
                <i class="fas fa-comments"></i>
                <span>0 answers</span>
            </div>
            <div class="stat">
                <i class="fas fa-eye"></i>
                <span>1 view</span>
            </div>
        </div>
        <div class="question-actions">
            <button class="btn-secondary" title="Upvote">
                <i class="fas fa-thumbs-up"></i> Upvote
            </button>
            <button class="btn-small">Answer</button>
        </div>
    `;

    questionsList.insertBefore(questionItem, questionsList.firstChild);
    initializeQuestionsFeatures();
}

function updateVoteCount(button, change) {
    const voteCount = button.closest('.question-item').querySelector('.vote-count');
    if (voteCount) {
        const currentCount = parseInt(voteCount.textContent) || 0;
        voteCount.textContent = Math.max(0, currentCount + change);
    }
}

function cancelAnswer(button) {
    const answerForm = button.closest('.answer-form');
    answerForm.remove();
}

function submitAnswer(button) {
    const answerForm = button.closest('.answer-form');
    const textarea = answerForm.querySelector('textarea');
    const answer = textarea.value.trim();

    if (!answer) {
        showNotification('Please write an answer', 'warning');
        return;
    }

    showNotification('Answer posted successfully!', 'success');
    answerForm.remove();

    const questionItem = answerForm.closest('.question-item');
    const answerCount = questionItem.querySelector('.question-stats .stat:nth-child(2) span');
    if (answerCount) {
        const currentCount = parseInt(answerCount.textContent) || 0;
        answerCount.textContent = `${currentCount + 1} answer${currentCount + 1 !== 1 ? 's' : ''}`;
    }
}

// Notifications page functionality
function initializeNotificationsFeatures() {
    const notifTabBtns = document.querySelectorAll('.notification-controls .tab-btn');
    notifTabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            notifTabBtns.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            console.log(`Switched to notification tab: ${this.textContent}`);
        });
    });

    const markReadBtns = document.querySelectorAll('.notification-actions .btn-icon[title="Mark as read"]');
    markReadBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const notification = this.closest('.notification-item');
            if (notification) {
                notification.classList.remove('unread');
                this.style.display = 'none';
                console.log('Notification marked as read');
            }
        });
    });

    const dismissBtns = document.querySelectorAll('.notification-actions .btn-icon[title="Dismiss"]');
    dismissBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const notification = this.closest('.notification-item');
            if (notification) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
                console.log('Notification dismissed');
            }
        });
    });

    const markAllReadBtn = document.querySelector('.notification-actions .btn-secondary');
    if (markAllReadBtn && markAllReadBtn.textContent.includes('Mark All as Read')) {
        markAllReadBtn.addEventListener('click', function () {
            const unreadNotifications = document.querySelectorAll('.notification-item.unread');
            unreadNotifications.forEach(notification => {
                notification.classList.remove('unread');
            });
            console.log('All notifications marked as read');
        });
    }
}

// Settings page functionality
function initializeSettingsFeatures() {
    console.log("Initializing settings features...");

    // Force update settings immediately if user is logged in
    if (currentUser) {
        console.log("User is logged in, force updating settings immediately");
        populateSettingsWithDefaults();
    }

    // Wait a bit for Firebase auth to initialize, then load settings
    setTimeout(async () => {
        if (currentUser) {
            console.log("User is logged in, loading settings data...");
            await loadSettingsData();
        } else {
            console.log("No user logged in (init phase), suppressing settings login prompt");
            // Do not notify here; wait for auth observer to decide once
        }
    }, 500);

    // Account settings
    const updateAccountBtn = document.getElementById('updateAccountBtn');
    if (updateAccountBtn) {
        updateAccountBtn.addEventListener('click', async function () {
            await saveAccountSettings();
        });
    }

    // Research preferences
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    if (savePreferencesBtn) {
        savePreferencesBtn.addEventListener('click', async function () {
            await saveResearchPreferences();
        });
    }

    // Notification settings
    const updateNotificationsBtn = document.getElementById('updateNotificationsBtn');
    if (updateNotificationsBtn) {
        updateNotificationsBtn.addEventListener('click', async function () {
            await saveNotificationSettings();
        });
    }

    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function () {
            const confirmed = confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.');
            if (confirmed) {
                const doubleConfirmed = confirm('This will permanently delete all your data. Type "DELETE" to confirm.');
                if (doubleConfirmed) {
                    showNotification('Account deletion confirmed. This is a demo - no actual deletion occurred.', 'warning');
                    console.log('Account deletion confirmed');
                }
            }
        });
    }

    // Auto-save checkbox changes
    const checkboxes = document.querySelectorAll('.settings-grid input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const settingName = this.nextElementSibling.textContent;
            console.log(`Setting changed: ${settingName} = ${this.checked}`);
            showNotification(`${settingName} ${this.checked ? 'enabled' : 'disabled'}`, 'info');

            // Auto-save checkbox changes
            if (currentUser) {
                saveSettingsToFirebase();
            }
        });
    });

    console.log("Settings features initialized successfully");
}

function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (query) {
        if (elements.searchBtn) {
            const originalHTML = elements.searchBtn.innerHTML;
            elements.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            elements.searchBtn.disabled = true;

            setTimeout(() => {
                console.log(`Searching for: "${query}"`);
                performSearch(query);

                elements.searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
                elements.searchBtn.disabled = false;
                restoreIcons();
            }, 1500);
        }
    } else {
        showNotification("Please enter a search query", "warning");
        if (elements.searchInput) {
            elements.searchInput.focus();
        }
    }
}

function performSearch(query) {
    const mockResults = [
        {
            title: "Machine Learning in Healthcare: A Comprehensive Review",
            authors: "Dr. Sarah Johnson, Prof. Michael Chen",
            year: "2023",
            abstract: "This paper explores the applications of machine learning in healthcare, covering recent advances in diagnostic imaging, treatment optimization, and patient care management.",
            citations: 45,
            rating: 4.8,
            tags: ["Machine Learning", "Healthcare", "AI"],
            category: "Computer Science"
        },
        {
            title: "Quantum Computing: Breaking Cryptographic Barriers",
            authors: "Dr. Alice Quantum, Prof. Bob Cryptography",
            year: "2023",
            abstract: "This research examines the potential of quantum computing to break current cryptographic systems and proposes quantum-resistant encryption methods.",
            citations: 67,
            rating: 4.9,
            tags: ["Quantum Computing", "Cryptography", "Security"],
            category: "Computer Science"
        }
    ];

    const filteredResults = mockResults.filter(paper =>
        paper.title.toLowerCase().includes(query.toLowerCase()) ||
        paper.authors.toLowerCase().includes(query.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
        paper.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    displaySearchResults(filteredResults, query);
}

function displaySearchResults(results, query) {
    let resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'searchResults';
        resultsContainer.className = 'search-results';

        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(resultsContainer, searchContainer.nextSibling);
        }
    }

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No results found for "${query}"</h3>
                <p>Try different keywords or check your spelling</p>
            </div>
        `;
    } else {
        const categories = [...new Set(results.map(paper => paper.category))];

        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h3><i class="fas fa-search"></i> Search Results for "${query}" (${results.length} found)</h3>
                <div class="search-filters">
                    <label for="categoryFilter">Filter by Category:</label>
                    <select id="categoryFilter" class="form-select">
                        <option value="all">All Categories</option>
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                    <label for="sortResults">Sort by:</label>
                    <select id="sortResults" class="form-select">
                        <option value="relevance">Relevance</option>
                        <option value="year">Year (Newest First)</option>
                        <option value="citations">Citations (Most First)</option>
                        <option value="rating">Rating (Highest First)</option>
                        <option value="title">Title (A-Z)</option>
                    </select>
                </div>
            </div>
            <div class="search-results-list">
                ${results.map(paper => `
                    <div class="search-result-item" data-category="${paper.category}">
                        <div class="result-header">
                            <h4>${paper.title}</h4>
                            <div class="result-actions">
                                <button class="btn-icon" title="Add to Favorites"><i class="fas fa-heart"></i></button>
                                <button class="btn-icon" title="Download"><i class="fas fa-download"></i></button>
                                <button class="btn-icon" title="Share"><i class="fas fa-share"></i></button>
                            </div>
                        </div>
                        <div class="result-meta">
                            <span class="authors"><i class="fas fa-user"></i> ${paper.authors}</span>
                            <span class="year"><i class="fas fa-calendar"></i> ${paper.year}</span>
                            <span class="citations"><i class="fas fa-quote-left"></i> ${paper.citations} citations</span>
                            <span class="rating"><i class="fas fa-star"></i> ${paper.rating}</span>
                            <span class="category"><i class="fas fa-tag"></i> ${paper.category}</span>
                        </div>
                        <p class="result-abstract">${paper.abstract}</p>
                        <div class="result-tags">
                            ${paper.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    attachSearchResultListeners();
    attachSearchFilterListeners();
    restoreIcons();
}

function attachSearchFilterListeners() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            filterSearchResults(this.value);
        });
    }

    const sortFilter = document.getElementById('sortResults');
    if (sortFilter) {
        sortFilter.addEventListener('change', function () {
            sortSearchResults(this.value);
        });
    }
}

function filterSearchResults(category) {
    const results = document.querySelectorAll('.search-result-item');
    let visibleCount = 0;

    results.forEach(result => {
        if (category === 'all' || result.dataset.category === category) {
            result.style.display = 'block';
            visibleCount++;
        } else {
            result.style.display = 'none';
        }
    });

    showNotification(`Showing ${visibleCount} results for ${category === 'all' ? 'all categories' : category}`, 'info');
}

function sortSearchResults(sortBy) {
    const container = document.querySelector('.search-results-list');
    if (!container) return;

    const results = Array.from(container.querySelectorAll('.search-result-item'));

    results.sort((a, b) => {
        switch (sortBy) {
            case 'year':
                const yearA = parseInt(a.querySelector('.year')?.textContent) || 0;
                const yearB = parseInt(b.querySelector('.year')?.textContent) || 0;
                return yearB - yearA;
            case 'citations':
                const citationsA = parseInt(a.querySelector('.citations')?.textContent) || 0;
                const citationsB = parseInt(b.querySelector('.citations')?.textContent) || 0;
                return citationsB - citationsA;
            case 'rating':
                const ratingA = parseFloat(a.querySelector('.rating')?.textContent) || 0;
                const ratingB = parseFloat(b.querySelector('.rating')?.textContent) || 0;
                return ratingB - ratingA;
            case 'title':
                const titleA = a.querySelector('h4')?.textContent || '';
                const titleB = b.querySelector('h4')?.textContent || '';
                return titleA.localeCompare(titleB);
            default:
                return 0;
        }
    });

    results.forEach(result => container.appendChild(result));
    showNotification(`Results sorted by ${sortBy}`, 'info');
}

function attachSearchResultListeners() {
    const favoriteBtns = document.querySelectorAll('.search-results .btn-icon[title="Add to Favorites"]');
    favoriteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            this.classList.toggle('favorited');
            if (this.classList.contains('favorited')) {
                this.innerHTML = '<i class="fas fa-heart" style="color: #dc2626;"></i>';
                showNotification('Added to favorites!', 'success');
            } else {
                this.innerHTML = '<i class="fas fa-heart"></i>';
                showNotification('Removed from favorites', 'info');
            }
        });
    });

    const downloadBtns = document.querySelectorAll('.search-results .btn-icon[title="Download"]');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            showNotification('Download started...', 'info');
            setTimeout(() => {
                showNotification('Download completed!', 'success');
            }, 2000);
        });
    });

    const shareBtns = document.querySelectorAll('.search-results .btn-icon[title="Share"]');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (navigator.share) {
                navigator.share({
                    title: 'Research Paper',
                    text: 'Check out this interesting research paper!',
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showNotification('Link copied to clipboard!', 'success');
                });
            }
        });
    });
}

function searchSuggestion(term) {
    if (elements.searchInput) {
        elements.searchInput.value = term;
        handleSearch();
    }
}

function browseCategory(category) {
    if (elements.searchInput) {
        elements.searchInput.value = category;
        handleSearch();
    }
    showNotification(`Browsing ${category} papers...`, 'info');
}

function reinitializeFeatures() {
    initializePageFeatures();
    attachSidebarLinkListeners();
    restoreIcons();
    console.log('Features reinitialized');
}

const observer = new MutationObserver(function (mutations) {
    let shouldReinitialize = false;

    mutations.forEach(function (mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.classList && (
                        node.classList.contains('search-results') ||
                        node.classList.contains('question-item') ||
                        node.classList.contains('answer-form') ||
                        node.classList.contains('modal')
                    )) {
                        shouldReinitialize = true;
                        break;
                    }
                }
            }
        }
    });

    if (shouldReinitialize) {
        setTimeout(reinitializeFeatures, 100);
    }
});

if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Notification system
function showNotification(message, type = 'info') {
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icon = getNotificationIcon(type);
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">&times;</button>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    notification.classList.add('notification-fade-out');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

// Initialize event listeners
function initializeEventListeners() {
    const requiredElements = ['burgerMenuBtn', 'navbarLinks', 'appSidebar', 'loginModal', 'registerModal'];
    const missingElements = requiredElements.filter(id => !elements[id]);

    if (missingElements.length > 0) {
        console.warn('Missing DOM elements:', missingElements);
    }

    if (elements.burgerMenuBtn) {
        elements.burgerMenuBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleSidebar();
        });
    }

    attachNavLinkListeners();

    if (elements.closeLoginModal) {
        elements.closeLoginModal.addEventListener("click", () => hideModal(elements.loginModal));
    }

    if (elements.closeRegisterModal) {
        elements.closeRegisterModal.addEventListener("click", () => hideModal(elements.registerModal));
    }

    if (elements.closeLogoutModal) {
        elements.closeLogoutModal.addEventListener("click", () => hideModal(elements.logoutModal));
    }

    if (elements.cancelLogout) {
        elements.cancelLogout.addEventListener("click", () => hideModal(elements.logoutModal));
    }

    if (elements.confirmLogout) {
        elements.confirmLogout.addEventListener("click", confirmLogout);
    }

    window.addEventListener("click", (event) => {
        if (event.target === elements.loginModal) {
            hideModal(elements.loginModal);
        }
        if (event.target === elements.registerModal) {
            hideModal(elements.registerModal);
        }
        if (event.target === elements.logoutModal) {
            hideModal(elements.logoutModal);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === 'Escape') {
            hideAllModals();
            closeSidebar();
        }
    });

    document.addEventListener("click", (event) => {
        if (elements.appSidebar && elements.appSidebar.classList.contains("is-visible")) {
            if (!elements.appSidebar.contains(event.target) &&
                !elements.burgerMenuBtn.contains(event.target)) {
                closeSidebar();
            }
        }
    });

    let scrollTimeout;
    window.addEventListener("scroll", () => {
        if (elements.appSidebar && elements.appSidebar.classList.contains("is-visible")) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                closeSidebar();
            }, 0);
        }
    });

    window.addEventListener("resize", () => {
        if (elements.appSidebar && elements.appSidebar.classList.contains("is-visible")) {
            closeSidebar();
        }
    });

    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }

    if (elements.registerForm) {
        elements.registerForm.addEventListener("submit", handleRegister);
    }

    if (elements.googleLoginBtn) {
        elements.googleLoginBtn.addEventListener("click", handleGoogleLogin);
    }

    attachSidebarLinkListeners();

    if (elements.searchBtn) {
        elements.searchBtn.addEventListener("click", handleSearch);
    }

    if (elements.searchInput) {
        elements.searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                handleSearch();
            }
        });
    }

    document.addEventListener("click", (event) => {
        if (window.innerWidth <= 768) {
            if (elements.appSidebar && elements.burgerMenuBtn) {
                if (!elements.appSidebar.contains(event.target) &&
                    !elements.burgerMenuBtn.contains(event.target) &&
                    elements.appSidebar.classList.contains("is-visible")) {
                    elements.appSidebar.classList.remove("is-visible");
                }
            }
        }
    });
}

// Firebase Auth State Observer
if (firebaseAuth) {
    onAuthStateChanged(firebaseAuth, async (user) => {
        currentUser = user;
        settingsAuthResolved = true;
        updateUserStatus(user);
        console.log("Auth state changed:", user ? "User logged in" : "User logged out");

        // Update avatar initials and populate forms immediately when user logs in
        if (user && window.location.pathname.includes('profile.html')) {
            console.log("User logged in, updating avatar initials and populating profile immediately");
            updateAvatarInitials(user.displayName || user.email);
            populateProfileWithDefaults();
        }

        if (user && window.location.pathname.includes('settings.html')) {
            console.log("User logged in, populating settings immediately");
            populateSettingsWithDefaults();
        }

        // Load profile data when user logs in and we're on profile page
        if (user && firebaseDb && window.location.pathname.includes('profile.html')) {
            console.log("User logged in on profile page, loading profile data...");
            // Add a small delay to ensure DOM is ready
            setTimeout(async () => {
                await loadProfileData();
            }, 200);
        } else if (!user && window.location.pathname.includes('profile.html')) {
            // User logged out, reset profile form
            console.log("User logged out, resetting profile form...");
            resetProfileForm();
        }

        // Load settings data when user logs in and we're on settings page
        if (user && firebaseDb && window.location.pathname.includes('settings.html')) {
            console.log("User logged in on settings page, loading settings data...");
            // Add a small delay to ensure DOM is ready
            setTimeout(async () => {
                await loadSettingsData();
            }, 300);
        }

        // If still logged out and on settings page, show login notice once
        if (!user && window.location.pathname.includes('settings.html') && !settingsLoginWarned) {
            settingsLoginWarned = true;
            showNotification('Please log in to access settings', 'warning');
        }
    });
} else {
    console.warn("Firebase auth not available, skipping auth state observer");
}
// Initialize the application
function initializeResearchApp() {
    try {
        ensureIconsLoaded();
        initializeEventListeners();
        initializePageFeatures();
        console.log("ResearchScholar app initialized successfully!");
    } catch (error) {
        console.error("Error initializing app:", error);
    }
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeResearchApp);
} else {
    initializeResearchApp();
}
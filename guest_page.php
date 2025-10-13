<?php
session_start();
include 'connect.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>ResearchScholar - Guest</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

</head>

<body>
    <!-- Navbar -->
    <header>
        <div class="logo"><strong>ResearchScholar</strong></div>
        <div class="nav-links">
            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="user_page.php"><i class="fas fa-user"></i> Dashboard</a>
                <a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a>
            <?php else: ?>
                <a href="login.php"><i class="fas fa-sign-in-alt"></i> Login</a>
                <a href="register.php"><i class="fas fa-user-plus"></i> Register</a>
            <?php endif; ?>
        </div>
    </header>

    <div class="container">
        <!-- Sidebar -->
        <nav class="sidebar">
            <div class="profile-section">
                <img src="default_profile.png" alt="Profile Picture">
                <p><strong><?php echo $_SESSION['name'] ?? 'Guest'; ?></strong></p>
            </div>

            <ul>
                <li><a href="papers.php"><i class="fas fa-book"></i> Browse Papers</a></li>
                <li><a href="about.php"><i class="fas fa-info-circle"></i> About</a></li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="profile.php"><i class="fas fa-user"></i> Profile</a>
                    <?php else: ?>
                        <a href="login.php"><i class="fas fa-user"></i> Profile</a>
                    <?php endif; ?>
                </li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="library.php"><i class="fas fa-book"></i> Library</a>
                    <?php else: ?>
                        <a href="login.php"><i class="fas fa-book"></i> Library</a>
                    <?php endif; ?>
                </li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="published.php"><i class="fas fa-star"></i> Published</a>
                    <?php else: ?>
                        <a href="login.php"><i class="fas fa-star"></i> Published</a>
                    <?php endif; ?>
                </li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="questions.php"><i class="fa-solid fa-question"></i> Questions</a>
                    <?php else: ?>
                        <a href="login.php"><i class="fa-solid fa-question"></i> Questions</a>
                    <?php endif; ?>
                </li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="notifications.php"><i class="fas fa-bell"></i> Notifications</a>
                    <?php else: ?>
                        <a href="login.php"><i class="fas fa-bell"></i> Notifications</a>
                    <?php endif; ?>
                </li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="settings.php"><i class="fas fa-cog"></i> Settings</a>
                    <?php else: ?>
                        <a href="login.php"><i class="fas fa-cog"></i> Settings</a>
                    <?php endif; ?>
                </li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main>
            <h2>Welcome to ResearchScholar</h2>
            <p>Browse and discover research papers. Login to upload, download, or interact with the community.</p>

            <!-- Papers Container -->
            <?php include "papers_container.php"; ?>
        </main>
    </div>
</body>

</html>
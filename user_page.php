<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>ResearchScholar - Home</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <!-- Navbar -->
    <header>
        <div class="logo">ResearchScholar</div>
        <div class="nav-links">
            <a href="login.php"><i class="fas fa-sign-in-alt"></i> Login</a>
        </div>
    </header>

    <!-- Sidebar + Content -->
    <div class="container">
        <nav class="sidebar">
            <!-- Profile Section -->
            <div class="profile-section">
                <img src="default_profile.png" alt="Profile Picture">
                <p><strong><?php echo $_SESSION['name'] ?? 'User Name'; ?></strong></p>
            </div>

            <!-- Sidebar Links -->
            <ul>
                <li><a href="profile.php"><i class="fas fa-user"></i> Profile</a></li>
                <li><a href="library.php"><i class="fas fa-book"></i> Library</a></li>
                <li><a href="favorites.php"><i class="fas fa-star"></i> Published</a></li>
                <li><a href="published.php"><i class="fa-solid fa-question"></i> Questions</a></li>
                <li><a href="notifications.php"><i class="fas fa-bell"></i> Notifications</a></li>
                <li><a href="settings.php"><i class="fas fa-cog"></i> Settings</a></li>
                <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
            </ul>
        </nav>

        <main>
            <!-- Search bar -->
            <div class="search-bar">
                <form action="search.php" method="get">
                    <input type="text" name="q" placeholder="Search papers, questions, authors...">
                    <button type="submit"><i class="fas fa-search"></i> Search</button>
                </form>
            </div>

            <!-- Dashboard content -->
            <h2>Welcome back, <?php echo $_SESSION['name'] ?? 'Researcher'; ?>!</h2>
            <p>
                We’re glad to have you here at <strong>ResearchScholar</strong>.
                Explore the latest papers, manage your library, or share your own work with the community.
                Let’s advance knowledge together!
            </p>
        </main>
    </div>
</body>

</html>
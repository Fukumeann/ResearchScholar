<?php
session_start();
// don't force login on home page — allow guests to browse
require 'connect.php';

// session flags
$isLoggedIn = isset($_SESSION['user_id']);
$name = $_SESSION['name'] ?? null;
$role = $_SESSION['role'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>ResearchScholar - Home</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>

    <!-- NAVBAR -->
    <header>
        <div class="logo">ResearchScholar</div>

        <div class="nav-links">
            <?php if ($isLoggedIn): ?>
                <a href="profile.php"><i class="fas fa-user-circle"></i>
                    <?php echo htmlspecialchars($name ?? 'Profile'); ?></a>
                <a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a>
            <?php else: ?>
                <a href="login.php"><i class="fas fa-sign-in-alt"></i> Login</a>
                <a href="register.php"><i class="fas fa-user-plus"></i> Register</a>
            <?php endif; ?>
        </div>
    </header>

    <div class="container">
        <!-- Guest sidebar -->
        <php>
            <div class="profile-section">
                <img src="default_profile.png" alt="Guest">
                <div class="name">Welcome Guest</div>
                <div style="font-size:13px;color:#555">Create an account to save papers & join discussions</div>
            </div>

            <ul>
                <li><a href="login.php"><i class="fas fa-sign-in-alt"></i> Login</a></li>
                <li><a href="register.php"><i class="fas fa-user-plus"></i> Register</a></li>
                <li><a href="library.php"><i class="fas fa-book"></i> Browse Library</a></li>
                <li><a href="questions.php"><i class="fas fa-question-circle"></i> Questions</a></li>
            </ul>
        </php>
        </nav>

        <!-- MAIN CONTENT -->
        <main>
            <div class="search-bar">
                <form action="search.php" method="get" role="search">
                    <input type="text" name="q" placeholder="Search papers, questions, authors...">
                    <button type="submit"><i class="fas fa-search"></i> Search</button>
                </form>
            </div>

            <div class="welcome-card">
                <?php if ($isLoggedIn): ?>
                    <h2>Welcome back, <?php echo htmlspecialchars($name ?? 'Researcher'); ?>!</h2>
                    <p>Good to see you again — use the sidebar to manage your library, favorites, and uploads.</p>
                <?php else: ?>
                    <h2>Welcome to ResearchScholar</h2>
                    <p>Discover and read research papers for free. Create an account to save favorites, upload your work,
                        and join the community.</p>
                <?php endif; ?>
            </div>
        </main>
    </div>

</body>

</html>
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
    <title>ResearchScholar - Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <!-- Navbar -->
    <header>
        <div class="logo">ResearchScholar</div>
        <div class="nav-links">
            <a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </header>

    <div class="container">
        <!-- Sidebar -->
        <nav class="sidebar">
            <div class="profile-section">
                <img src="default_profile.png" alt="Profile Picture">
                <p><strong><?php echo $_SESSION['name'] ?? 'User'; ?></strong></p>
            </div>

            <ul>
                <li><a href="user_page.php"><i class="fas fa-user"></i> Profile</a></li>
                <li><a href="library.php"><i class="fas fa-book"></i> Library</a></li>
                <li><a href="published.php"><i class="fas fa-star"></i> Published</a></li>
                <li><a href="questions.php"><i class="fa-solid fa-question"></i> Questions</a></li>
                <li><a href="notifications.php"><i class="fas fa-bell"></i> Notifications</a></li>
                <li><a href="settings.php"><i class="fas fa-cog"></i> Settings</a></li>
            </ul>
        </nav>

        <!-- Main content -->
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

            <!-- Upload Paper Button -->
            <button onclick="openModal()">+ Upload Paper</button>

            <!-- Upload Modal -->
            <div id="uploadModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeModal()">&times;</span>
                    <h2>Upload Research Paper</h2>
                    <form action="upload_paper.php" method="POST" enctype="multipart/form-data">
                        <label>Title:</label><br>
                        <input type="text" name="title" required><br>

                        <label>Authors:</label><br>
                        <input type="text" name="authors" required><br>

                        <label>Year:</label><br>
                        <input type="number" name="year" min="1900" max="2100" required><br>

                        <label>Abstract:</label><br>
                        <textarea name="abstract" rows="4" required></textarea><br>

                        <label>Upload PDF:</label><br>
                        <input type="file" name="file" accept="application/pdf" required><br><br>

                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal Styles -->
    <style>
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
        }

        .modal-content {
            background: #fff;
            margin: 10% auto;
            padding: 20px;
            width: 400px;
            border-radius: 8px;
        }

        .close {
            float: right;
            font-size: 20px;
            cursor: pointer;
        }
    </style>

    <!-- Modal Script -->
    <script>
        function openModal() {
            document.getElementById("uploadModal").style.display = "block";
        }
        function closeModal() {
            document.getElementById("uploadModal").style.display = "none";
        }
    </script>
</body>

</html>
/**
 * Mobile Menu Toggle - SafeSphere
 * Handles hamburger menu functionality for mobile devices
 */

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menu when hamburger button is clicked
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            toggleMenu();
        });
    }

    // Close menu when overlay is clicked
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeMenu();
        });
    }

    // Close menu when a navigation link is clicked (mobile only)
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 900) {
                closeMenu();
            }
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeMenu();
        }
    });

    // Handle window resize - close menu if resizing to desktop
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 900) {
                closeMenu();
            }
        }, 250);
    });

    function toggleMenu() {
        if (sidebar && sidebarOverlay && mobileMenuBtn) {
            const isActive = sidebar.classList.contains('active');
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        }
    }

    function openMenu() {
        if (sidebar && sidebarOverlay && mobileMenuBtn) {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            mobileMenuBtn.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        }
    }

    function closeMenu() {
        if (sidebar && sidebarOverlay && mobileMenuBtn) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    // Expose functions globally for other scripts if needed
    window.SafeSphereMenu = {
        open: openMenu,
        close: closeMenu,
        toggle: toggleMenu
    };
});

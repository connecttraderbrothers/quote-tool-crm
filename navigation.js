// Navigation functions for OMEGA application

// Show splash screen on load (no auto-transition)
window.addEventListener('DOMContentLoaded', function() {
    // Show splash screen
    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    document.getElementById('statementScreen').style.display = 'none';

    // Reset body overflow for splash
    document.body.style.overflow = 'hidden';
});

// Enter The Matrix button function
function enterMatrix() {
    const splashScreen = document.getElementById('splashScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const canvas = document.getElementById('matrix');
    
    // Add fade-out class to splash screen
    splashScreen.classList.add('fade-out');
    
    // After fade-out animation completes, show dashboard
    setTimeout(function() {
        splashScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        dashboardScreen.style.opacity = '0';
        
        // Fade in dashboard
        setTimeout(function() {
            dashboardScreen.style.transition = 'opacity 0.8s ease-in';
            dashboardScreen.style.opacity = '1';
        }, 50);
        
        // Hide matrix canvas
        if (canvas) {
            canvas.style.transition = 'opacity 0.8s ease-out';
            canvas.style.opacity = '0';
            setTimeout(function() {
                canvas.style.display = 'none';
            }, 800);
        }
        
        // Enable scrolling for dashboard
        document.body.style.overflow = 'auto';
        document.body.style.overflowX = 'hidden';
        
        // Scroll to top
        window.scrollTo(0, 0);
    }, 800);
}

// Show dashboard screen
function showDashboard() {
    const canvas = document.getElementById('matrix');
    
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    document.getElementById('statementScreen').style.display = 'none';

    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }

    // Enable scrolling for dashboard
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';

    // Scroll to top
    window.scrollTo(0, 0);
}

// Show quotation tool screen
function showQuotationTool() {
    const canvas = document.getElementById('matrix');

    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'block';
    document.getElementById('invoiceScreen').style.display = 'none';
    document.getElementById('statementScreen').style.display = 'none';
    
    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }
    
    // Enable scrolling for quotation tool
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show invoice tool screen
function showInvoiceTool() {
    const canvas = document.getElementById('matrix');
    
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'block';
    document.getElementById('statementScreen').style.display = 'none';

    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }

    // Enable scrolling for invoice tool
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';

    // Scroll to top
    window.scrollTo(0, 0);
}

// Show statement tool screen
function showStatementTool() {
    const canvas = document.getElementById('matrix');

    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    document.getElementById('statementScreen').style.display = 'block';

    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }

    // Enable scrolling for statement tool
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';

    // Scroll to top
    window.scrollTo(0, 0);
}

// Show splash screen (if needed for refresh/reload)
function showSplash() {
    const canvas = document.getElementById('matrix');

    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    document.getElementById('statementScreen').style.display = 'none';
    
    // Show matrix canvas
    if (canvas) {
        canvas.style.display = 'block';
        canvas.style.opacity = '1';
    }
    
    // Disable scrolling for splash
    document.body.style.overflow = 'hidden';
}

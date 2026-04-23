<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;

/**
 * Home Controller
 */
class HomeController
{
    public function index(): void
    {
        if (Auth::check()) {
            // Redirect based on role
            $role = Auth::role();
            
            switch ($role) {
                case 'super_admin':
                    header('Location: /super-admin/dashboard');
                    break;
                case 'admin':
                    header('Location: /admin/dashboard');
                    break;
                case 'staff':
                    header('Location: /staff/dashboard');
                    break;
                case 'kitchen':
                    header('Location: /kitchen/display');
                    break;
                default:
                    header('Location: /guest/menu');
            }
            exit;
        }
        
        // Show guest menu for unauthenticated users
        header('Location: /guest/menu');
        exit;
    }
}

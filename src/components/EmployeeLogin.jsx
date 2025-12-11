
import React from "react"; // useState is no longer needed
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card"; // CardHeader, CardTitle are no longer needed
import { Button } from "@/components/ui/button";
// Input, Label, Alert, AlertDescription are no longer needed
import { Mail } from "lucide-react"; // Loader2, Lock, Building2 are no longer needed
import Logo from "./Logo";

// Google Icon SVG is no longer used
// const GoogleIcon = () => (
//   <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5">
//     <title>Google</title>
//     <path
//       fill="#4285F4"
//       d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.47-1.94 3.21v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.02z"
//     />
//     <path
//       fill="#34A853"
//       d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//     />
//     <path
//       fill="#FBBC05"
//       d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
//     />
//     <path
//       fill="#EA4335"
//       d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//     />
//   </svg>
// );

export default function EmployeeLogin() {
  // State variables and handlers for email/password login removed
  // const [loginData, setLoginData] = useState({
  //   email: "",
  //   password: ""
  // });
  // const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  // const [error, setError] = useState("");

  // const handleInputChange = (field, value) => {
  //   setLoginData(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };

  // const handleEmailLogin = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");

  //   try {
  //     if (loginData.email === "gbengashafe@gmail.com") {
  //       await User.loginWithRedirect(window.location.origin);
  //     } else {
  //       await User.loginWithRedirect(window.location.origin);
  //     }
  //   } catch (error) {
  //     console.error('Error authenticating employee:', error);
  //     setError("Login failed. Please check your credentials and try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleGoogleLogin = async () => {
  //   setGoogleLoading(true);
  //   setError("");
  //   try {
  //     await User.login();
  //   } catch (err) {
  //     setError("Google Sign-In failed. Please try again.");
  //     setGoogleLoading(false);
  //     console.error(err);
  //   }
  // };

  const handleLogin = () => {
    // This now handles the primary sign-in action, likely Google or a similar SSO
    User.login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="large" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Orbit360</h1>
          <p className="text-lg text-gray-600 mb-8">360° Business Management Platform</p>
          <p className="text-gray-500 mb-8">
            Access your comprehensive business management dashboard
          </p>
        </div>
        
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-gray-200">
          <CardContent className="p-8">
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white py-3 text-lg"
            >
              <Mail className="w-5 h-5 mr-2" /> {/* Changed from GoogleIcon to Mail as per outline, assumed intent is general SSO via email */}
              Sign in with Google
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-6">
              By signing in, you agree to Orbit360's terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact your system administrator.</p>
        </div>
      </div>
    </div>
  );
}

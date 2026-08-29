import { useEffect, useState } from "react";
import { getFarmerProfile } from "../services/farmer";
import { User, Phone, MapPin } from "lucide-react";

function FarmerProfilePage() {
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFarmerProfile()
      .then(setFarmer)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-600">View and manage your profile information</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <User className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-800">{farmer?.fullName || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <Phone className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Mobile Number</p>
              <p className="font-medium text-slate-800">{farmer?.mobileNumber || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Village</p>
              <p className="font-medium text-slate-800">{farmer?.village || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Address</p>
              <p className="font-medium text-slate-800">{farmer?.address || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <User className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Aadhaar Number</p>
              <p className="font-medium text-slate-800">{farmer?.aadhaarNumber || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <User className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Bank Account</p>
              <p className="font-medium text-slate-800">{farmer?.bankAccountNumber || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
              <User className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">IFSC Code</p>
              <p className="font-medium text-slate-800">{farmer?.ifscCode || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerProfilePage;

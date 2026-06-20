import { useState, useEffect } from "react";
import apiClient from "../services/http/client";
import PageLoader from "../components/ui/PageLoader";
import FarmerSelect from "../components/ui/FarmerSelect";
import { getErrorMessage } from "../utils/errorMessage";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function AdvancedMilkReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    farmerId: ""
  });
  const [farmers, setFarmers] = useState([]);
  const [searchFarmer, setSearchFarmer] = useState("");
  const [searchVillage, setSearchVillage] = useState("");

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const response = await apiClient.get("/farmers");
        setFarmers(asArray(response.data));
      } catch (err) {
        setFarmers([]);
      }
    };
    fetchFarmers();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters.from, filters.to, filters.farmerId]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    
    try {
      const params = {
        from: filters.from,
        to: filters.to,
      };
      if (filters.farmerId) {
        params.farmerId = Number(filters.farmerId);
      }
      const response = await apiClient.get("/reports/milk/advanced/summary", { params });
      const data = response?.data && typeof response.data === "object" ? response.data : {};
      setReportSummary(data);
      setReports(asArray(data.farmers));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch reports"));
      setReportSummary(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const exportToExcel = async () => {
    try {
      const params = {
        from: filters.from,
        to: filters.to,
        format: "xlsx",
      };
      if (filters.farmerId) {
        params.farmerId = Number(filters.farmerId);
      }
      const res = await apiClient.get("/reports/milk/advanced/export", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `milk-advanced-${filters.from}-to-${filters.to}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to export report"));
    }
  };

  const visibleReports = reports.filter((report) => {
    const farmerName = String(report?.farmerName || "").toLowerCase();
    const village = String(report?.village || report?.farmerVillage || "").toLowerCase();
    const farmerMatch = !searchFarmer || farmerName.includes(searchFarmer.toLowerCase());
    const villageMatch = !searchVillage || village.includes(searchVillage.toLowerCase());
    return farmerMatch && villageMatch;
  });

  if (loading && reports.length === 0) return <PageLoader label="Loading reports..." />;

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Advanced Milk Reports</h2>
        <p className="text-slate-600 mt-2">Detailed milk collection reports with analytics</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <FarmerSelect
            farmers={asArray(farmers)}
            name="farmerId"
            value={filters.farmerId}
            onChange={handleFilterChange}
            label="Farmer"
            emptyOption="All Farmers"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Farmer Name Search</label>
            <input
              type="text"
              value={searchFarmer}
              onChange={(e) => setSearchFarmer(e.target.value)}
              placeholder="Search by farmer name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Village Search</label>
            <input
              type="text"
              value={searchVillage}
              onChange={(e) => setSearchVillage(e.target.value)}
              placeholder="Search by village"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {reportSummary ? (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Stat title="Farmers" value={reportSummary.farmerCount ?? 0} />
          <Stat title="Total Milk" value={reportSummary.totalMilkQuantity ?? 0} />
          <Stat title="Total Amount" value={`₹ ${reportSummary.totalAmount ?? 0}`} />
          <Stat title="Net After Feed" value={`₹ ${reportSummary.netAmountAfterFeed ?? 0}`} />
        </div>
      ) : null}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Milk (L)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Average Fat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Average SNF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Feed Deduction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleReports.map((report, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {report.farmerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {report.totalMilkQuantity ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {report.averageFat || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {report.averageSnf || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ₹{report.averageRatePerLiter ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-700">
                    ₹{report.feedDeductionAmount ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                    ₹{report.netAmountAfterFeed ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {visibleReports.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-slate-500">No milk collection records found</p>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default AdvancedMilkReportsPage;

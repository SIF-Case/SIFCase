"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";

type Report = {
  _id?: string;
  monthKey: string;
  slug: string;
  label: string;
  summary: string;
  niftyReturn: number | null;
  published: boolean;
};

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load reports" });
    } finally {
      setLoading(false);
    }
  };

  const addReport = () => {
    setReports([
      ...reports,
      {
        monthKey: "",
        slug: "",
        label: "",
        summary: "",
        niftyReturn: null,
        published: false,
      },
    ]);
  };

  const updateReport = (index: number, field: keyof Report, value: any) => {
    const updated = [...reports];
    updated[index] = { ...updated[index], [field]: value };
    setReports(updated);
  };

  const deleteReport = async (index: number) => {
    const report = reports[index];
    if (!report._id) {
      setReports(reports.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`Delete ${report.label}?`)) return;

    try {
      const res = await fetch(`/api/admin/reports/${report._id}`, { method: "DELETE" });
      if (res.ok) {
        setReports(reports.filter((_, i) => i !== index));
        setMessage({ type: "success", text: "Report deleted" });
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete report" });
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Reports saved successfully!" });
        await fetchReports();
      } else {
        throw new Error("Save failed");
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save reports" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monthly Reports</h1>
            <p className="text-gray-600 mt-1">Manage performance report publications</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addReport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              <Plus className="w-4 h-4" />
              Add Report
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Label</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Month Key</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Slug</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nifty Return</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={report.label}
                      onChange={(e) => updateReport(idx, "label", e.target.value)}
                      placeholder="June 2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={report.monthKey}
                      onChange={(e) => updateReport(idx, "monthKey", e.target.value)}
                      placeholder="2026-06"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={report.slug}
                      onChange={(e) => updateReport(idx, "slug", e.target.value)}
                      placeholder="june-2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.01"
                      value={report.niftyReturn ?? ""}
                      onChange={(e) => updateReport(idx, "niftyReturn", e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="3.45"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => updateReport(idx, "published", !report.published)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        report.published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {report.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {report.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteReport(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reports.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No reports yet. Click "Add Report" to create one.
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Guide:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Month Key:</strong> Format YYYY-MM (e.g., 2026-06 for June 2026)</li>
            <li><strong>Slug:</strong> URL-friendly (e.g., june-2026)</li>
            <li><strong>Published:</strong> Only published reports appear on homepage</li>
            <li><strong>PDF:</strong> Place PDF at public/reports/SIF-Monthly-Report-[Label].pdf</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

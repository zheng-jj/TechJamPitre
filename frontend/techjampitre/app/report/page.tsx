"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Download,
  FileText,
  Scale,
  Info,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LawProvision {
  id: number;
  provision_title: string;
  provision_body: string;
  provision_code: string;
  country: string;
  region: string;
  relevant_labels?: string[];
  law_code: string;
  reference_file: string;
  reasoning: string;
}

interface Feature {
  feature_id: number;
  feature_title: string;
  feature_description: string;
  feature_type: string;
  project_name: string;
  reference_file: string;
  project_id: number;
  reasoning?: string;
}

// Updated interfaces to handle both response types
interface FeatureUploadResponse {
  success: boolean;
  response: {
    conflict: Record<string, LawProvision[]>[];
    features: Feature[];
    message: string;
    type: "feature";
  };
}

interface LawUploadResponse {
  success: boolean;
  response: {
    conflict: Record<string, Feature[]>[];
    provisions: LawProvision[];
    message: string;
    type: "law";
  };
}

type ApiResponse = FeatureUploadResponse | LawUploadResponse;

interface ReportData {
  type: "feature" | "law";
  conflicts: (LawProvision | Feature)[];
  features: Feature[];
  provisions: LawProvision[];
  message: string;
  success: boolean;
}

export default function Report() {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem("uploadResult");
    console.log(data);
    if (data) {
      try {
        const parsedData: ApiResponse = JSON.parse(data);

        // Handle different response structures based on type
        const conflicts: (LawProvision | Feature)[] = [];
        let features: Feature[] = [];
        let provisions: LawProvision[] = [];

        if (parsedData.response.type === "feature") {
          // Feature upload - conflicts contain law provisions
          const featureResponse = parsedData as FeatureUploadResponse;
          features = featureResponse.response.features || [];

          if (featureResponse.response.conflict) {
            featureResponse.response.conflict.forEach((conflictGroup) => {
              Object.values(conflictGroup).forEach((conflictArray) => {
                conflicts.push(...conflictArray);
              });
            });
          }
        } else {
          // Law upload - conflicts contain features, provisions are separate
          const lawResponse = parsedData as LawUploadResponse;
          provisions = lawResponse.response.provisions || [];

          if (lawResponse.response.conflict) {
            lawResponse.response.conflict.forEach((conflictGroup) => {
              Object.values(conflictGroup).forEach((conflictArray) => {
                conflicts.push(...conflictArray);
              });
            });
          }
        }

        const transformedData: ReportData = {
          type: parsedData.response.type,
          conflicts,
          features,
          provisions,
          message: parsedData.response.message || "",
          success: parsedData.success || false,
        };

        setReportData(transformedData);
      } catch (error) {
        console.error("Error parsing upload result:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const isFeatureReport = reportData.type === "feature";
  const hasConflicts = reportData.conflicts && reportData.conflicts.length > 0;
  const hasFeatures = reportData.features && reportData.features.length > 0;
  const hasProvisions =
    reportData.provisions && reportData.provisions.length > 0;

  // Type guard functions
  const isLawProvision = (
    item: LawProvision | Feature
  ): item is LawProvision => {
    return "provision_title" in item;
  };

  const isFeature = (item: LawProvision | Feature): item is Feature => {
    return "feature_title" in item;
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    try {
      // Create a temporary div with the content to export
      const exportElement = document.createElement("div");
      exportElement.style.padding = "40px";
      exportElement.style.backgroundColor = "white";
      exportElement.style.fontFamily = "Arial, sans-serif";
      exportElement.style.maxWidth = "210mm";
      exportElement.style.margin = "0 auto";
      exportElement.style.lineHeight = "1.5";

      // Generate the HTML content
      const currentDate = new Date().toLocaleDateString();
      const isFeatureReport = reportData.type === "feature";
      const hasConflicts =
        reportData.conflicts && reportData.conflicts.length > 0;
      const hasFeatures = reportData.features && reportData.features.length > 0;
      const hasProvisions =
        reportData.provisions && reportData.provisions.length > 0;

      exportElement.innerHTML = `
      <div style="margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 10px; margin-top: 0;">
          Compliance Report
        </h1>
        <p style="font-size: 18px; color: #6b7280; margin-bottom: 5px; margin-top: 0;">
          ${
            isFeatureReport
              ? "Feature analysis against existing laws"
              : "Law analysis against existing features"
          }
        </p>
        ${
          reportData.message
            ? `<p style="font-size: 12px; color: #9ca3af; margin-top: 0;">${reportData.message}</p>`
            : ""
        }
        <p style="font-size: 12px; color: #9ca3af; text-align: right; margin-top: 10px;">
          Generated on ${currentDate}
        </p>
      </div>

      <div style="padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${
        hasConflicts ? "#ef4444" : "#22c55e"
      }; background-color: ${hasConflicts ? "#fef2f2" : "#f0fdf4"};">
        <h3 style="font-size: 16px; font-weight: bold; color: ${
          hasConflicts ? "#dc2626" : "#16a34a"
        }; margin-bottom: 8px; margin-top: 0;">
          ${hasConflicts ? "Compliance Issues Found" : "No Compliance Issues"}
        </h3>
        <p style="font-size: 14px; color: ${
          hasConflicts ? "#dc2626" : "#16a34a"
        }; line-height: 1.5; margin-top: 0;">
          ${
            hasConflicts
              ? `Found ${reportData.conflicts.length} ${
                  isFeatureReport ? "law provision" : "feature"
                }${
                  reportData.conflicts.length > 1 ? "s" : ""
                } that may conflict with your ${
                  isFeatureReport ? "feature" : "law"
                }.`
              : "Your submission appears to be compliant with all applicable regulations."
          }
        </p>
      </div>

      ${
        isFeatureReport && hasFeatures
          ? `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 22px; font-weight: bold; color: #111827; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-top: 0;">
            📄 Analyzed Features (${reportData.features.length})
          </h2>
          ${reportData.features
            .map(
              (feature) => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #fafafa;">
              <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 8px; margin-top: 0;">${feature.feature_title}</h3>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px; margin-top: 0;">${feature.feature_description}</p>
              <div style="margin-bottom: 10px;">
                <span style="font-size: 12px; margin-right: 20px;"><strong>Type:</strong> ${feature.feature_type}</span>
                <span style="font-size: 12px; margin-right: 20px;"><strong>ID:</strong> ${feature.feature_id}</span>
                <span style="font-size: 12px;"><strong>Project:</strong> ${feature.project_name}</span>
              </div>
              <p style="font-size: 12px; color: #374151; margin-bottom: 0;">Reference: ${feature.reference_file}</p>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        !isFeatureReport && hasProvisions
          ? `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 22px; font-weight: bold; color: #111827; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-top: 0;">
            ⚖️ Uploaded Law Provisions (${reportData.provisions.length})
          </h2>
          ${reportData.provisions
            .map(
              (provision) => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #fafafa;">
              <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 8px; margin-top: 0;">${
                provision.provision_title
              } (${provision.provision_code})</h3>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px; margin-top: 0;">${
                provision.provision_body
              }</p>
              <div style="margin-bottom: 10px;">
                <span style="font-size: 12px; margin-right: 20px;"><strong>Country:</strong> ${
                  provision.country
                }</span>
                <span style="font-size: 12px; margin-right: 20px;"><strong>Region:</strong> ${
                  provision.region
                }</span>
                <span style="font-size: 12px;"><strong>Law Code:</strong> ${
                  provision.law_code
                }</span>
              </div>
              ${
                provision.relevant_labels &&
                provision.relevant_labels.length > 0
                  ? `
                <div style="margin-top: 12px; margin-bottom: 10px;">
                  <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">Relevant Labels:</p>
                  <div style="line-height: 1.8;">
                    ${provision.relevant_labels
                      .map(
                        (label) =>
                          `<span style="display: inline-block; margin: 0 6px 6px 0; padding: 3px 8px; border-radius: 4px; background-color: #f3f4f6; border: 1px solid #d1d5db; font-size: 10px; color: #374151;">${label}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              <p style="font-size: 12px; color: #374151; margin-bottom: 0;">Reference: ${
                provision.reference_file
              }</p>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        hasConflicts
          ? `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 22px; font-weight: bold; color: #111827; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-top: 0;">
            ⚠️ ${
              isFeatureReport
                ? "Conflicting Law Provisions"
                : "Conflicting Features"
            } (${reportData.conflicts.length})
          </h2>
          ${reportData.conflicts
            .map((item) => {
              const isLawProvision = "provision_title" in item;
              return `
              <div style="border: 1px solid #e5e7eb; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #fafafa;">
                ${
                  isLawProvision
                    ? `
                  <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 8px; margin-top: 0; line-height: 1.4;">
                    ${item.provision_title} (${item.provision_code})
                    <span style="display: inline-block; background-color: #ef4444; color: white; font-weight: bold; padding: 2px 6px; margin-left: 8px; border-radius: 4px; font-size: 11px; vertical-align: middle;">CONFLICT</span>
                  </h3>
                  <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px; margin-top: 0;">${item.provision_body}</p>
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 12px; margin-right: 20px;"><strong>Country:</strong> ${item.country}</span>
                    <span style="font-size: 12px; margin-right: 20px;"><strong>Region:</strong> ${item.region}</span>
                    <span style="font-size: 12px;"><strong>Law Code:</strong> ${item.law_code}</span>
                  </div>
                `
                    : `
                  <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 8px; margin-top: 0; line-height: 1.4;">
                    ${item.feature_title} (${item.feature_type})
                    <span style="display: inline-block; background-color: #ef4444; color: white; font-weight: bold; padding: 2px 6px; margin-left: 8px; border-radius: 4px; font-size: 11px; vertical-align: middle;">CONFLICT</span>
                  </h3>
                  <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px; margin-top: 0;">${item.feature_description}</p>
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 12px; margin-right: 20px;"><strong>Project:</strong> ${item.project_name}</span>
                    <span style="font-size: 12px; margin-right: 20px;"><strong>ID:</strong> ${item.feature_id}</span>
                    <span style="font-size: 12px;"><strong>Project ID:</strong> ${item.project_id}</span>
                  </div>
                `
                }
                
                ${
                  (isLawProvision && isFeatureReport) ||
                  (!isLawProvision && !isFeatureReport)
                    ? `
                  <div style="background-color: ${
                    isFeatureReport ? "#eff6ff" : "#fff7ed"
                  }; padding: 15px; border-radius: 6px; border-left: 3px solid ${
                        isFeatureReport ? "#3b82f6" : "#f97316"
                      }; margin: 15px 0;">
                    <p style="font-size: 12px; font-weight: bold; color: ${
                      isFeatureReport ? "#1e40af" : "#ea580c"
                    }; margin-bottom: 5px; margin-top: 0;">
                      ${
                        isFeatureReport
                          ? "Why this law conflicts with your feature:"
                          : "Why this feature conflicts with your law:"
                      }
                    </p>
                    <p style="font-size: 11px; color: ${
                      isFeatureReport ? "#1e3a8a" : "#9a3412"
                    }; line-height: 1.4; margin-bottom: 0; margin-top: 0;">
                      ${
                        isLawProvision
                          ? item.reasoning
                          : item.reasoning ||
                            "This feature's implementation may not comply with the requirements of the uploaded law provision."
                      }
                    </p>
                  </div>
                `
                    : ""
                }
                
                ${
                  isLawProvision &&
                  item.relevant_labels &&
                  item.relevant_labels.length > 0
                    ? `
                  <div style="margin: 15px 0;">
                    <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">Relevant Labels:</p>
                    <div style="line-height: 1.8;">
                      ${item.relevant_labels
                        .map(
                          (label) =>
                            `<span style="display: inline-block; margin: 0 6px 6px 0; padding: 3px 8px; border-radius: 4px; background-color: #f3f4f6; border: 1px solid #d1d5db; font-size: 10px; color: #374151;">${label}</span>`
                        )
                        .join("")}
                    </div>
                  </div>
                `
                    : ""
                }
                
                <p style="font-size: 12px; color: #374151; margin-top: 15px; margin-bottom: 0; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <strong>Reference:</strong> ${item.reference_file}
                </p>
              </div>
            `;
            })
            .join("")}
        </div>
      `
          : ""
      }

      <div style="margin-top: 40px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; padding: 10px; width: 33.33%;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 8px;">
                ${
                  isFeatureReport
                    ? reportData.features.length
                    : reportData.provisions.length
                }
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                ${isFeatureReport ? "Features" : "Provisions"} Analyzed
              </div>
            </td>
            <td style="text-align: center; padding: 10px; width: 33.33%;">
              <div style="font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 8px;">
                ${reportData.conflicts.length}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                ${isFeatureReport ? "Law" : "Feature"} Conflicts Found
              </div>
            </td>
            <td style="text-align: center; padding: 10px; width: 33.33%;">
              <div style="font-size: 24px; font-weight: bold; color: #22c55e; margin-bottom: 8px;">
                ${reportData.success ? "✓" : "✗"}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Analysis Status</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        This report was generated automatically by the Compliance Checker system.
      </div>
    `;

      // Temporarily add to document
      document.body.appendChild(exportElement);

      // Generate canvas from the element
      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
      });

      // Remove the temporary element
      document.body.removeChild(exportElement);

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Create filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `compliance-report-${reportData.type}-${timestamp}.pdf`;

      // Save the PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Compliance Report
              </h1>
              <p className="text-xl text-gray-600">
                {isFeatureReport
                  ? "Feature analysis against existing laws"
                  : "Law analysis against existing features"}
              </p>
              {reportData.message && (
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.message}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Status Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Alert
            className={
              hasConflicts
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }
          >
            {hasConflicts ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertTitle
              className={hasConflicts ? "text-red-800" : "text-green-800"}
            >
              {hasConflicts
                ? "Compliance Issues Found"
                : "No Compliance Issues"}
            </AlertTitle>
            <AlertDescription
              className={hasConflicts ? "text-red-700" : "text-green-700"}
            >
              {hasConflicts
                ? `Found ${reportData.conflicts.length} ${
                    isFeatureReport ? "law provision" : "feature"
                  }${
                    reportData.conflicts.length > 1 ? "s" : ""
                  } that may conflict with your ${
                    isFeatureReport ? "feature" : "law"
                  }.`
                : "Your submission appears to be compliant with all applicable regulations."}
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Analyzed Features Section (for feature uploads) */}
        {isFeatureReport && hasFeatures && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-500" />
              Analyzed Features ({reportData.features.length})
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {reportData.features.map((feature, index) => (
                <Card
                  key={feature.feature_id}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent>
                    <div className="text-lg flex flex-col space-y-1.5 pt-6 pb-4 text-2xl font-semibold leading-none tracking-tight">
                      {feature.feature_title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feature.feature_description}
                      <div className="flex items-center justify-between pt-3 pb-3">
                        <Badge variant="outline">{feature.feature_type}</Badge>
                        <span className="text-sm text-gray-500">
                          ID: {feature.feature_id}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Project:
                        </p>
                        <p className="text-sm text-gray-600">
                          {feature.project_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Reference:
                        </p>
                        <p className="text-sm text-gray-600">
                          {feature.reference_file}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analyzed Provisions Section (for law uploads) */}
        {!isFeatureReport && hasProvisions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Scale className="w-6 h-6 mr-2 text-purple-500" />
              Uploaded Law Provisions ({reportData.provisions.length})
            </h2>

            <div className="grid gap-4">
              {reportData.provisions.map((provision, index) => (
                <Card
                  key={provision.id}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center">
                          {provision.provision_title}
                          <Badge variant="secondary" className="ml-2">
                            {provision.provision_code}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-base mb-3">
                          {provision.provision_body}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <strong>Country:</strong> {provision.country}
                          </span>
                          <span>
                            <strong>Region:</strong> {provision.region}
                          </span>
                          <span>
                            <strong>Law Code:</strong> {provision.law_code}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Relevant Labels */}
                      {provision.relevant_labels &&
                        provision.relevant_labels.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Relevant Labels:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {provision.relevant_labels.map(
                                (label, labelIndex) => (
                                  <Badge
                                    key={labelIndex}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {label}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Reference File:
                          </p>
                          <p className="text-sm text-gray-600">
                            {provision.reference_file}
                          </p>
                        </div>
                        <Button size="sm" className="flex items-center gap-2">
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Conflicts List */}
        {hasConflicts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
              {isFeatureReport
                ? "Conflicting Law Provisions"
                : "Conflicting Features"}{" "}
              ({reportData.conflicts.length})
            </h2>

            {reportData.conflicts.map((item, index) => (
              <Card
                key={isLawProvision(item) ? item.id : item.feature_id}
                className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-red-400"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isLawProvision(item) ? (
                        // Display law provision
                        <>
                          <CardTitle className="text-xl mb-2 flex items-center">
                            {item.provision_title}
                            <Badge variant="secondary" className="ml-2">
                              {item.provision_code}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-base mb-3">
                            {item.provision_body}
                          </CardDescription>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              <strong>Country:</strong> {item.country}
                            </span>
                            <span>
                              <strong>Region:</strong> {item.region}
                            </span>
                            <span>
                              <strong>Law Code:</strong> {item.law_code}
                            </span>
                          </div>
                        </>
                      ) : (
                        // Display feature
                        <>
                          <CardTitle className="text-xl mb-2 flex items-center">
                            {item.feature_title}
                            <Badge variant="secondary" className="ml-2">
                              {item.feature_type}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-base mb-3">
                            {item.feature_description}
                          </CardDescription>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              <strong>Project:</strong> {item.project_name}
                            </span>
                            <span>
                              <strong>ID:</strong> {item.feature_id}
                            </span>
                            <span>
                              <strong>Project ID:</strong> {item.project_id}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <Badge variant="destructive" className="ml-4">
                      Conflict
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Reasoning Section - Show for both law provisions and features */}
                    {((isLawProvision(item) && isFeatureReport) ||
                      (isFeature(item) && !isFeatureReport)) && (
                      <div
                        className={`p-4 rounded-lg ${
                          isFeatureReport ? "bg-blue-50" : "bg-orange-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Info
                            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              isFeatureReport
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-medium mb-1 ${
                                isFeatureReport
                                  ? "text-blue-800"
                                  : "text-orange-800"
                              }`}
                            >
                              {isFeatureReport
                                ? "Why this law conflicts with your feature:"
                                : "Why this feature conflicts with your law:"}
                            </p>
                            <p
                              className={`text-sm ${
                                isFeatureReport
                                  ? "text-blue-700"
                                  : "text-orange-700"
                              }`}
                            >
                              {isLawProvision(item)
                                ? item.reasoning
                                : item.reasoning ||
                                  "This feature's implementation may not comply with the requirements of the uploaded law provision."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Relevant Labels (only for law provisions) */}
                    {isLawProvision(item) &&
                      item.relevant_labels &&
                      item.relevant_labels.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Relevant Labels:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.relevant_labels.map((label, labelIndex) => (
                              <Badge
                                key={labelIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Reference File:
                        </p>
                        <p className="text-sm text-gray-600">
                          {isLawProvision(item)
                            ? item.reference_file
                            : item.reference_file}
                        </p>
                      </div>
                      <Button size="sm" className="flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Summary Stats */}
        {reportData.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {isFeatureReport
                    ? reportData.features.length
                    : reportData.provisions.length}
                </div>
                <div className="text-sm text-gray-600">
                  {isFeatureReport ? "Features" : "Provisions"} Analyzed
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {reportData.conflicts.length}
                </div>
                <div className="text-sm text-gray-600">
                  {isFeatureReport ? "Law" : "Feature"} Conflicts Found
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {reportData.success ? "✓" : "✗"}
                </div>
                <div className="text-sm text-gray-600">Analysis Status</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button onClick={() => router.push("/features")} size="lg">
            View Features
          </Button>
          <Button onClick={() => router.push("/laws")} size="lg">
            View Laws
          </Button>
          <Button onClick={() => router.push("/")} variant="outline">
            Upload Another File
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Law {
  country: string;
  region: string;
  law: string;
  lawDesc: string;
  relevantLabels: string[];
  source: string;
}

interface Feature {
  featureName: string;
  featureType: string;
  featureDescription: string;
  relevantLabels: string[];
  source: string;
}

interface ReportData {
  type: "feature" | "law";
  conflicts: (Law | Feature)[];
  message?: string;
}

export default function Report() {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem("uploadResult");
    if (data) {
      setReportData(JSON.parse(data));
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
            </div>
            <Button variant="outline" className="flex items-center gap-2">
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
                ? `Found ${reportData.conflicts.length} potential ${
                    isFeatureReport ? "law conflicts" : "feature conflicts"
                  } that require attention.`
                : "Your submission appears to be compliant with all applicable regulations."}
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Conflicts List */}
        {hasConflicts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {isFeatureReport ? "Conflicting Laws" : "Affected Features"}
            </h2>

            {reportData.conflicts.map((item, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {isFeatureReport
                          ? `${(item as Law).country} - ${(item as Law).law}`
                          : (item as Feature).featureName}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {isFeatureReport
                          ? (item as Law).lawDesc
                          : `${(item as Feature).featureType}: ${
                              (item as Feature).featureDescription
                            }`}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive" className="ml-4">
                      Conflict
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isFeatureReport && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Region:
                        </p>
                        <p className="text-sm text-gray-600">
                          {(item as Law).region}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Relevant Labels:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.relevantLabels.map((label, labelIndex) => (
                          <Badge key={labelIndex} variant="secondary">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Source:
                        </p>
                        <p className="text-sm text-gray-600">{item.source}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => router.push("/features")}
            variant="outline"
            size="lg"
          >
            Manage Features
          </Button>
          <Button
            onClick={() => router.push("/laws")}
            variant="outline"
            size="lg"
          >
            Manage Laws
          </Button>
          <Button onClick={() => router.push("/")} size="lg">
            Upload Another File
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

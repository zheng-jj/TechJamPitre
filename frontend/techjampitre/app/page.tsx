/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
import { Upload, FileText, Scale, List, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface UploadResponse {
  type: "feature" | "law";
  conflicts?: any[];
  message?: string;
}

export default function Home() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"feature" | "law" | null>(null);

  const handleFileUpload = async (file: File, type: "feature" | "law") => {
    setIsUploading(true);
    setUploadType(type);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      // Commented out API call - replace with actual endpoint
      /*
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const result: UploadResponse = await response.json()
      
      if (response.ok) {
        // Store the result in sessionStorage to pass to report page
        sessionStorage.setItem('uploadResult', JSON.stringify(result))
        router.push('/report')
      } else {
        toast.error('Upload failed. Please try again.')
      }
      */

      // Simulate upload and redirect for demo
      setTimeout(() => {
        const mockResult: UploadResponse = {
          type,
          conflicts:
            type === "feature"
              ? [
                  {
                    country: "USA",
                    region: "California",
                    law: "CCPA",
                    lawDesc: "California Consumer Privacy Act",
                    relevantLabels: ["privacy", "data"],
                    source: "state-law",
                  },
                  {
                    country: "EU",
                    region: "All",
                    law: "GDPR",
                    lawDesc: "General Data Protection Regulation",
                    relevantLabels: ["privacy", "consent"],
                    source: "eu-regulation",
                  },
                ]
              : [
                  {
                    featureName: "Auto-tracking",
                    featureType: "Analytics",
                    featureDescription: "Automatic user behavior tracking",
                    relevantLabels: ["tracking", "analytics"],
                    source: "product-spec",
                  },
                  {
                    featureName: "Data Export",
                    featureType: "Data Management",
                    featureDescription: "Bulk data export functionality",
                    relevantLabels: ["data", "export"],
                    source: "api-docs",
                  },
                ],
          message: `${type} uploaded successfully`,
        };
        sessionStorage.setItem("uploadResult", JSON.stringify(mockResult));
        router.push("/report");
      }, 2000);
    } catch (error) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleDrop = (e: React.DragEvent, type: "feature" | "law") => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "feature" | "law"
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Compliance Checker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload feature documentation or legal documents to check for
            compliance issues
          </p>
        </motion.div>

        {/* Upload Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Feature Upload */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">
                  Feature Documentation
                </CardTitle>
                <CardDescription>
                  Upload feature specs to check against existing laws
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onDrop={(e) => handleDrop(e, "feature")}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() =>
                    document.getElementById("feature-upload")?.click()
                  }
                >
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drop your feature documentation here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, TXT files accepted
                  </p>
                  <input
                    id="feature-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileSelect(e, "feature")}
                    disabled={isUploading}
                  />
                </div>
                {isUploading && uploadType === "feature" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center"
                  >
                    <div className="inline-flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Analyzing feature...
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Law Upload */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Legal Documentation</CardTitle>
                <CardDescription>
                  Upload laws to check against existing features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onDrop={(e) => handleDrop(e, "law")}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("law-upload")?.click()}
                >
                  <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drop your legal documentation here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, TXT files accepted
                  </p>
                  <input
                    id="law-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileSelect(e, "law")}
                    disabled={isUploading}
                  />
                </div>
                {isUploading && uploadType === "law" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center"
                  >
                    <div className="inline-flex items-center text-purple-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      Analyzing law...
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => router.push("/features")}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 hover:bg-blue-50"
          >
            <List className="w-5 h-5" />
            View All Features
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => router.push("/laws")}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 hover:bg-purple-50"
          >
            <List className="w-5 h-5" />
            View All Laws
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

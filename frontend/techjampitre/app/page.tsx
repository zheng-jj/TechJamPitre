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
import { Upload, FileText, Scale, List } from "lucide-react";
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

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result: UploadResponse = await response.json();
      if (response.ok) {
        console.log(JSON.stringify(result));
        sessionStorage.setItem("uploadResult", JSON.stringify(result));
        router.push("/report");
      } else {
        toast.error("Upload failed. Please try again.");
      }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-6 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
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
        <div className="grid md:grid-cols-2 gap-8">
          {/* Feature Upload */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-none">
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
                    PDF, CSV files accepted
                  </p>
                  <input
                    id="feature-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf, .csv"
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

            {/* View Features Button - Desktop only, centered below this card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="hidden md:flex justify-center"
            >
              <Button
                onClick={() => router.push("/features")}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                View All Features
              </Button>
            </motion.div>
          </motion.div>

          {/* Law Upload */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-none">
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
                    PDF, CSV files accepted
                  </p>
                  <input
                    id="law-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf, .csv"
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

            {/* View Laws Button - Desktop only, centered below this card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="hidden md:flex justify-center"
            >
              <Button
                onClick={() => router.push("/laws")}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                View All Laws
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Navigation Buttons - Static positioning, stacked vertically */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="md:hidden mt-12 space-y-3"
        >
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button
              onClick={() => router.push("/features")}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              View All Features
            </Button>

            <Button
              onClick={() => router.push("/laws")}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              View All Laws
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

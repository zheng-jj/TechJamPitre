"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  FileText,
  Folder,
} from "lucide-react";
import { toast } from "sonner";

// Updated interface to match your API response
interface Feature {
  feature_id: string;
  feature_title: string;
  feature_description: string;
  feature_type: string;
  project_name: string;
  reference_file: string;
  project_id: string;
}

interface ApiResponse {
  success: boolean;
  response: Feature[];
}

export default function Features() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getFeatures = async () => {
    try {
      const response = await fetch("/api/feature", {
        method: "POST",
      });
      const result: ApiResponse = await response.json();

      if (response.ok && result.success) {
        setFeatures(result.response); // Access the response array
        setIsLoading(false);
      } else {
        toast.error("Failed to load features. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to load features. Please try again.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFeatures();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = features;

    if (searchTerm) {
      filtered = filtered.filter(
        (feature) =>
          feature.feature_title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          feature.feature_description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          feature.project_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(
        (feature) => feature.feature_type === filterType
      );
    }

    if (filterProject !== "all") {
      filtered = filtered.filter(
        (feature) => feature.project_name === filterProject
      );
    }

    setFilteredFeatures(filtered);
  }, [features, searchTerm, filterType, filterProject]);

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this feature?")) {
      // API call would go here
      setFeatures(features.filter((f) => f.feature_id !== id));
      toast.success("Feature deleted successfully");
    }
  };

  const handleSave = async () => {
    if (!editingFeature) return;

    try {
      // API call would go here
      setFeatures(
        features.map((f) =>
          f.feature_id === editingFeature.feature_id ? editingFeature : f
        )
      );
      setIsDialogOpen(false);
      setEditingFeature(null);
      toast.success("Feature updated successfully");
    } catch (error) {
      toast.error("Failed to update feature");
    }
  };

  // Get unique values for filters
  // Get unique values for filters
  const uniqueTypes = Array.from(new Set(features.map((f) => f.feature_type)));
  const uniqueProjects = Array.from(
    new Set(features.map((f) => f.project_name))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
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

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Features
              </h1>
              <p className="text-xl text-gray-600">
                Manage your feature documentation ({features.length} features
                found)
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search features, descriptions, or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.feature_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {feature.feature_title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          ID: {feature.feature_id}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="mb-2">
                        {feature.feature_type}
                      </Badge>
                      <CardDescription className="text-sm line-clamp-3">
                        {feature.feature_description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(feature)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(feature.feature_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {feature.project_name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Project ID: {feature.project_id}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600 truncate">
                        {feature.reference_file}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredFeatures.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">
              {features.length === 0
                ? "No features found. Try uploading some documents first."
                : "No features found matching your criteria."}
            </p>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Feature</DialogTitle>
              <DialogDescription>
                Make changes to the feature information below.
              </DialogDescription>
            </DialogHeader>
            {editingFeature && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Feature Title</Label>
                  <Input
                    id="name"
                    value={editingFeature.feature_title}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        feature_title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Feature Type</Label>
                  <Input
                    id="type"
                    value={editingFeature.feature_type}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        feature_type: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingFeature.feature_description}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        feature_description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Project Name</Label>
                  <Input
                    id="project"
                    value={editingFeature.project_name}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        project_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference File</Label>
                  <Input
                    id="reference"
                    value={editingFeature.reference_file}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        reference_file: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

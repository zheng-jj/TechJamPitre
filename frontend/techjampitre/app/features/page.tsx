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
import { ArrowLeft, Search, Plus, Edit, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

interface Feature {
  id: string;
  featureName: string;
  featureType: string;
  featureDescription: string;
  relevantLabels: string[];
  source: string;
  createdAt: string;
}

export default function Features() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockFeatures: Feature[] = [
      {
        id: "1",
        featureName: "Auto-tracking",
        featureType: "Analytics",
        featureDescription:
          "Automatic user behavior tracking without explicit consent",
        relevantLabels: ["tracking", "analytics", "privacy"],
        source: "product-spec",
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        featureName: "Data Export",
        featureType: "Data Management",
        featureDescription: "Bulk data export functionality for user data",
        relevantLabels: ["data", "export", "privacy"],
        source: "api-docs",
        createdAt: "2024-01-20",
      },
      {
        id: "3",
        featureName: "Geolocation Services",
        featureType: "Location",
        featureDescription: "Real-time location tracking and storage",
        relevantLabels: ["location", "tracking", "gps"],
        source: "mobile-app",
        createdAt: "2024-02-01",
      },
      {
        id: "4",
        featureName: "Cookie Management",
        featureType: "Web",
        featureDescription: "Third-party cookie integration and management",
        relevantLabels: ["cookies", "web", "tracking"],
        source: "web-platform",
        createdAt: "2024-02-10",
      },
    ];

    setTimeout(() => {
      setFeatures(mockFeatures);
      setFilteredFeatures(mockFeatures);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = features;

    if (searchTerm) {
      filtered = filtered.filter(
        (feature) =>
          feature.featureName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          feature.featureDescription
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          feature.relevantLabels.some((label) =>
            label.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(
        (feature) => feature.featureType === filterType
      );
    }

    if (filterSource !== "all") {
      filtered = filtered.filter((feature) => feature.source === filterSource);
    }

    setFilteredFeatures(filtered);
  }, [features, searchTerm, filterType, filterSource]);

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this feature?")) {
      // API call would go here
      setFeatures(features.filter((f) => f.id !== id));
      toast.success("Feature deleted successfully");
    }
  };

  const handleSave = async () => {
    if (!editingFeature) return;

    try {
      // API call would go here
      setFeatures(
        features.map((f) => (f.id === editingFeature.id ? editingFeature : f))
      );
      setIsDialogOpen(false);
      setEditingFeature(null);
      toast.success("Feature updated successfully");
    } catch (error) {
      toast.error("Failed to update feature");
    }
  };

  const uniqueTypes = [...new Set(features.map((f) => f.featureType))];
  const uniqueSources = [...new Set(features.map((f) => f.source))];

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
                Manage your feature documentation
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Feature
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search features..."
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
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
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
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {feature.featureName}
                      </CardTitle>
                      <Badge variant="secondary" className="mb-2">
                        {feature.featureType}
                      </Badge>
                      <CardDescription className="text-sm">
                        {feature.featureDescription}
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
                        onClick={() => handleDelete(feature.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Labels:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {feature.relevantLabels.map((label, labelIndex) => (
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
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Source: {feature.source}</span>
                      <span>{feature.createdAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredFeatures.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">
              No features found matching your criteria.
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
                  <Label htmlFor="name">Feature Name</Label>
                  <Input
                    id="name"
                    value={editingFeature.featureName}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        featureName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Feature Type</Label>
                  <Input
                    id="type"
                    value={editingFeature.featureType}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        featureType: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingFeature.featureDescription}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        featureDescription: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="labels">
                    Relevant Labels (comma-separated)
                  </Label>
                  <Input
                    id="labels"
                    value={editingFeature.relevantLabels.join(", ")}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        relevantLabels: e.target.value
                          .split(", ")
                          .map((s) => s.trim()),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={editingFeature.source}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        source: e.target.value,
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

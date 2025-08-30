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
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface Law {
  id: string;
  country: string;
  region: string;
  law: string;
  lawDesc: string;
  relevantLabels: string[];
  source: string;
  createdAt: string;
}

export default function Laws() {
  const router = useRouter();
  const [laws, setLaws] = useState<Law[]>([]);
  const [filteredLaws, setFilteredLaws] = useState<Law[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingLaw, setEditingLaw] = useState<Law | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockLaws: Law[] = [
      {
        id: "1",
        country: "USA",
        region: "California",
        law: "CCPA",
        lawDesc:
          "California Consumer Privacy Act - Provides consumers with rights to know, delete, and opt-out of the sale of their personal information",
        relevantLabels: ["privacy", "data", "consumer-rights"],
        source: "state-law",
        createdAt: "2024-01-10",
      },
      {
        id: "2",
        country: "EU",
        region: "All Member States",
        law: "GDPR",
        lawDesc:
          "General Data Protection Regulation - Comprehensive data protection law governing how personal data is collected, processed, and stored",
        relevantLabels: ["privacy", "consent", "data-protection"],
        source: "eu-regulation",
        createdAt: "2024-01-15",
      },
      {
        id: "3",
        country: "Canada",
        region: "Federal",
        law: "PIPEDA",
        lawDesc:
          "Personal Information Protection and Electronic Documents Act - Federal privacy law for private sector organizations",
        relevantLabels: ["privacy", "personal-information", "consent"],
        source: "federal-law",
        createdAt: "2024-01-20",
      },
      {
        id: "4",
        country: "Brazil",
        region: "Federal",
        law: "LGPD",
        lawDesc:
          "Lei Geral de Proteção de Dados - General Data Protection Law regulating data processing activities",
        relevantLabels: ["data-protection", "privacy", "consent"],
        source: "federal-law",
        createdAt: "2024-02-01",
      },
      {
        id: "5",
        country: "USA",
        region: "Federal",
        law: "COPPA",
        lawDesc:
          "Children's Online Privacy Protection Act - Protects the privacy of children under 13 years old online",
        relevantLabels: ["children", "privacy", "online"],
        source: "federal-law",
        createdAt: "2024-02-05",
      },
    ];

    setTimeout(() => {
      setLaws(mockLaws);
      setFilteredLaws(mockLaws);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = laws;

    if (searchTerm) {
      filtered = filtered.filter(
        (law) =>
          law.law.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.lawDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.relevantLabels.some((label) =>
            label.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (filterCountry !== "all") {
      filtered = filtered.filter((law) => law.country === filterCountry);
    }

    if (filterSource !== "all") {
      filtered = filtered.filter((law) => law.source === filterSource);
    }

    setFilteredLaws(filtered);
  }, [laws, searchTerm, filterCountry, filterSource]);

  const handleEdit = (law: Law) => {
    setEditingLaw(law);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this law?")) {
      // API call would go here
      setLaws(laws.filter((l) => l.id !== id));
      toast.success("Law deleted successfully");
    }
  };

  const handleSave = async () => {
    if (!editingLaw) return;

    try {
      // API call would go here
      setLaws(laws.map((l) => (l.id === editingLaw.id ? editingLaw : l)));
      setIsDialogOpen(false);
      setEditingLaw(null);
      toast.success("Law updated successfully");
    } catch (error) {
      toast.error("Failed to update law");
    }
  };

  const uniqueCountries = [...new Set(laws.map((l) => l.country))];
  const uniqueSources = [...new Set(laws.map((l) => l.source))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
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
                Laws & Regulations
              </h1>
              <p className="text-xl text-gray-600">
                Manage your legal documentation
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search laws..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
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
          </div>
        </motion.div>

        {/* Laws Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredLaws.map((law, index) => (
            <motion.div
              key={law.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        <Badge variant="outline">{law.country}</Badge>
                        <Badge variant="secondary">{law.region}</Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{law.law}</CardTitle>
                      <CardDescription className="text-sm">
                        {law.lawDesc}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(law)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(law.id)}
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
                        Relevant Labels:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {law.relevantLabels.map((label, labelIndex) => (
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
                      <span>Source: {law.source}</span>
                      <span>{law.createdAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredLaws.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">
              No laws found matching your criteria.
            </p>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Law</DialogTitle>
              <DialogDescription>
                Make changes to the law information below.
              </DialogDescription>
            </DialogHeader>
            {editingLaw && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editingLaw.country}
                      onChange={(e) =>
                        setEditingLaw({
                          ...editingLaw,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={editingLaw.region}
                      onChange={(e) =>
                        setEditingLaw({
                          ...editingLaw,
                          region: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="law">Law Name</Label>
                  <Input
                    id="law"
                    value={editingLaw.law}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
                        law: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingLaw.lawDesc}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
                        lawDesc: e.target.value,
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
                    value={editingLaw.relevantLabels.join(", ")}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
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
                    value={editingLaw.source}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
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

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
  Scale,
  FileText,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

// Updated interface to match your API response
interface LawProvision {
  id: string;
  provision_title: string;
  provision_body: string;
  provision_code: string;
  country: string;
  region: string;
  relevant_labels: string[];
  law_code: string;
  reference_file: string;
}

interface ApiResponse {
  success: boolean;
  response: LawProvision[];
}

export default function Laws() {
  const router = useRouter();
  const [laws, setLaws] = useState<LawProvision[]>([]);
  const [filteredLaws, setFilteredLaws] = useState<LawProvision[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterLawCode, setFilterLawCode] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingLaw, setEditingLaw] = useState<LawProvision | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getLaws = async () => {
    try {
      const response = await fetch("/api/law", {
        method: "POST",
      });
      const result: ApiResponse = await response.json();

      if (response.ok && result.success) {
        setLaws(result.response);
        setIsLoading(false);
      } else {
        toast.error("Failed to load law provisions. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching law provisions:", error);
      toast.error("Failed to load law provisions. Please try again.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLaws();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = laws;

    if (searchTerm) {
      filtered = filtered.filter(
        (law) =>
          law.provision_title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          law.provision_body.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.provision_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.law_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          law.relevant_labels.some((label) =>
            label.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (filterCountry !== "all") {
      filtered = filtered.filter((law) => law.country === filterCountry);
    }

    if (filterRegion !== "all") {
      filtered = filtered.filter((law) => law.region === filterRegion);
    }

    if (filterLawCode !== "all") {
      filtered = filtered.filter((law) => law.law_code === filterLawCode);
    }

    setFilteredLaws(filtered);
  }, [laws, searchTerm, filterCountry, filterRegion, filterLawCode]);

  const handleEdit = (law: LawProvision) => {
    setEditingLaw(law);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this law provision?")) {
      // API call would go here
      setLaws(laws.filter((l) => l.id !== id));
      toast.success("Law provision deleted successfully");
    }
  };

  const handleSave = async () => {
    if (!editingLaw) return;

    try {
      // API call would go here
      setLaws(laws.map((l) => (l.id === editingLaw.id ? editingLaw : l)));
      setIsDialogOpen(false);
      setEditingLaw(null);
      toast.success("Law provision updated successfully");
    } catch (error) {
      toast.error("Failed to update law provision");
    }
  };

  // Get unique values for filters using Array.from to avoid Set iteration issues
  const uniqueCountries = Array.from(new Set(laws.map((l) => l.country)));
  const uniqueRegions = Array.from(new Set(laws.map((l) => l.region)));
  const uniqueLawCodes = Array.from(new Set(laws.map((l) => l.law_code)));

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
                Law Provisions
              </h1>
              <p className="text-xl text-gray-600">
                Manage your legal provision documentation ({laws.length}{" "}
                provisions found)
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search provisions, titles, codes..."
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
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLawCode} onValueChange={setFilterLawCode}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by law" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Laws</SelectItem>
                {uniqueLawCodes.map((lawCode) => (
                  <SelectItem key={lawCode} value={lawCode}>
                    {lawCode}
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
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Scale className="w-4 h-4 text-purple-600" />
                        <Badge variant="outline" className="text-xs">
                          {law.country}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {law.region}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          ID: {law.id}
                        </Badge>
                      </div>

                      <CardTitle className="text-lg mb-2 leading-tight">
                        {law.provision_title}
                      </CardTitle>

                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-3 h-3 text-gray-500" />
                        <Badge variant="outline" className="text-xs font-mono">
                          {law.provision_code}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {law.law_code}
                        </Badge>
                      </div>

                      <CardDescription className="text-sm leading-relaxed">
                        {law.provision_body}
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
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Relevant Labels:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {law.relevant_labels.map((label, labelIndex) => (
                          <Badge
                            key={labelIndex}
                            variant="outline"
                            className="text-xs bg-purple-50 border-purple-200"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600 truncate">
                        {law.reference_file}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredLaws.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">
              {laws.length === 0
                ? "No law provisions found. Try uploading some legal documents first."
                : "No law provisions found matching your criteria."}
            </p>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Law Provision</DialogTitle>
              <DialogDescription>
                Make changes to the law provision information below.
              </DialogDescription>
            </DialogHeader>
            {editingLaw && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Provision Title</Label>
                  <Input
                    id="title"
                    value={editingLaw.provision_title}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
                        provision_title: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Provision Code</Label>
                    <Input
                      id="code"
                      value={editingLaw.provision_code}
                      onChange={(e) =>
                        setEditingLaw({
                          ...editingLaw,
                          provision_code: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lawCode">Law Code</Label>
                    <Input
                      id="lawCode"
                      value={editingLaw.law_code}
                      onChange={(e) =>
                        setEditingLaw({
                          ...editingLaw,
                          law_code: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="body">Provision Body</Label>
                  <Textarea
                    id="body"
                    value={editingLaw.provision_body}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
                        provision_body: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>

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
                  <Label htmlFor="labels">
                    Relevant Labels (comma-separated)
                  </Label>
                  <Input
                    id="labels"
                    value={editingLaw.relevant_labels.join(", ")}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
                        relevant_labels: e.target.value
                          .split(", ")
                          .map((s) => s.trim()),
                      })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference File</Label>
                  <Input
                    id="reference"
                    value={editingLaw.reference_file}
                    onChange={(e) =>
                      setEditingLaw({
                        ...editingLaw,
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

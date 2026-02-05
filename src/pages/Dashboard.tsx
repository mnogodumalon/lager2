import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Boxes, TrendingUp, AlertTriangle, Plus, Search, Pencil, Trash2, RefreshCw, Tags, MapPin } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { InventoryItems, Categories, Locations } from '@/types/app';

export default function Dashboard() {
  // Inventory Items
  const [items, setItems] = useState<InventoryItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItems | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    min_quantity: 10,
    unit_price: 0,
    location: '',
  });
  const [saving, setSaving] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Categories[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categories | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });

  // Locations
  const [locations, setLocations] = useState<Locations[]>([]);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Locations | null>(null);
  const [locationFormData, setLocationFormData] = useState({ name: '', description: '' });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, categoriesData, locationsData] = await Promise.all([
        LivingAppsService.getInventoryItems(),
        LivingAppsService.getCategories(),
        LivingAppsService.getLocations(),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to get category name
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.record_id === categoryId);
    return cat?.fields.name || categoryId;
  };

  // Helper to get location name
  const getLocationName = (locationId: string) => {
    const loc = locations.find(l => l.record_id === locationId);
    return loc?.fields.name || locationId;
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.fields.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.fields.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.fields.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + (item.fields.quantity || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + ((item.fields.quantity || 0) * (item.fields.unit_price || 0)), 0);
  const lowStockItems = items.filter(item => (item.fields.quantity || 0) <= (item.fields.min_quantity || 0)).length;

  // Item Handlers
  const handleAddItem = async () => {
    setSaving(true);
    try {
      await LivingAppsService.createInventoryItem(formData);
      await loadData();
      setFormData({ name: '', sku: '', category: '', quantity: 0, min_quantity: 10, unit_price: 0, location: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Fehler beim Erstellen des Artikels');
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await LivingAppsService.updateInventoryItem(editingItem.record_id, formData);
      await loadData();
      setEditingItem(null);
      setFormData({ name: '', sku: '', category: '', quantity: 0, min_quantity: 10, unit_price: 0, location: '' });
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Fehler beim Aktualisieren des Artikels');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) return;
    try {
      await LivingAppsService.deleteInventoryItem(id);
      setItems(prev => prev.filter(item => item.record_id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Fehler beim Löschen des Artikels');
    }
  };

  const openEditItemDialog = (item: InventoryItems) => {
    setEditingItem(item);
    setFormData({
      name: item.fields.name || '',
      sku: item.fields.sku || '',
      category: item.fields.category || '',
      quantity: item.fields.quantity || 0,
      min_quantity: item.fields.min_quantity || 10,
      unit_price: item.fields.unit_price || 0,
      location: item.fields.location || '',
    });
  };

  // Category Handlers
  const handleAddCategory = async () => {
    setSaving(true);
    try {
      await LivingAppsService.createCategorie(categoryFormData);
      await loadData();
      setCategoryFormData({ name: '' });
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Fehler beim Erstellen der Kategorie');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    setSaving(true);
    try {
      await LivingAppsService.updateCategorie(editingCategory.record_id, categoryFormData);
      await loadData();
      setEditingCategory(null);
      setCategoryFormData({ name: '' });
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Fehler beim Aktualisieren der Kategorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;
    try {
      await LivingAppsService.deleteCategorie(id);
      setCategories(prev => prev.filter(cat => cat.record_id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Fehler beim Löschen der Kategorie');
    }
  };

  // Location Handlers
  const handleAddLocation = async () => {
    setSaving(true);
    try {
      await LivingAppsService.createLocation(locationFormData);
      await loadData();
      setLocationFormData({ name: '', description: '' });
      setIsLocationDialogOpen(false);
    } catch (error) {
      console.error('Failed to create location:', error);
      alert('Fehler beim Erstellen des Lagerorts');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLocation = async () => {
    if (!editingLocation) return;
    setSaving(true);
    try {
      await LivingAppsService.updateLocation(editingLocation.record_id, locationFormData);
      await loadData();
      setEditingLocation(null);
      setLocationFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Fehler beim Aktualisieren des Lagerorts');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Möchten Sie diesen Lagerort wirklich löschen?')) return;
    try {
      await LivingAppsService.deleteLocation(id);
      setLocations(prev => prev.filter(loc => loc.record_id !== id));
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Fehler beim Löschen des Lagerorts');
    }
  };

  const getStockStatus = (item: InventoryItems) => {
    const quantity = item.fields.quantity || 0;
    const minQuantity = item.fields.min_quantity || 0;
    if (quantity === 0) return { variant: 'destructive' as const, label: 'Ausverkauft' };
    if (quantity <= minQuantity) return { variant: 'warning' as const, label: 'Niedriger Bestand' };
    return { variant: 'success' as const, label: 'Auf Lager' };
  };

  // Item Form Dialog Content
  const ItemFormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor={isEdit ? "edit-name" : "name"}>Artikelname</Label>
        <Input id={isEdit ? "edit-name" : "name"} value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? "edit-sku" : "sku"}>SKU</Label>
          <Input id={isEdit ? "edit-sku" : "sku"} value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? "edit-category" : "category"}>Kategorie</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.record_id} value={cat.record_id}>{cat.fields.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? "edit-quantity" : "quantity"}>Menge</Label>
          <Input id={isEdit ? "edit-quantity" : "quantity"} type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? "edit-min_quantity" : "min_quantity"}>Mindestbestand</Label>
          <Input id={isEdit ? "edit-min_quantity" : "min_quantity"} type="number" value={formData.min_quantity} onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 0 }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? "edit-unit_price" : "unit_price"}>Stückpreis (€)</Label>
          <Input id={isEdit ? "edit-unit_price" : "unit_price"} type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={isEdit ? "edit-location" : "location"}>Lagerort</Label>
          <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
            <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc.record_id} value={loc.record_id}>{loc.fields.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-header">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-foreground/10">
                <Boxes className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Lagerverwaltung</h1>
                <p className="text-primary-foreground/80 text-sm">Inventar und Bestandsübersicht</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Artikel gesamt</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-20" /> : (
                <>
                  <div className="text-3xl font-bold">{totalItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">verschiedene Produkte</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtbestand</CardTitle>
              <Boxes className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-24" /> : (
                <>
                  <div className="text-3xl font-bold">{totalStock.toLocaleString('de-DE')}</div>
                  <p className="text-xs text-muted-foreground mt-1">Einheiten im Lager</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Warenwert</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-32" /> : (
                <>
                  <div className="text-3xl font-bold">{totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
                  <p className="text-xs text-muted-foreground mt-1">Gesamtwert des Lagers</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-warning/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Niedriger Bestand</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-16" /> : (
                <>
                  <div className="text-3xl font-bold text-warning">{lowStockItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">Artikel nachbestellen</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Inventar
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              Kategorien
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" />
              Lagerorte
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Inventar</CardTitle>
                    <CardDescription>Übersicht aller Artikel im Lager</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full sm:w-64"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Kategorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.record_id} value={cat.record_id}>{cat.fields.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4" />
                          Artikel hinzufügen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Neuen Artikel hinzufügen</DialogTitle>
                        </DialogHeader>
                        <ItemFormContent />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" disabled={saving}>Abbrechen</Button>
                          </DialogClose>
                          <Button onClick={handleAddItem} disabled={saving}>
                            {saving ? 'Speichern...' : 'Hinzufügen'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Artikel</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead className="text-right">Menge</TableHead>
                        <TableHead className="text-right">Stückpreis</TableHead>
                        <TableHead>Lagerort</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {items.length === 0 ? 'Noch keine Artikel vorhanden. Fügen Sie Ihren ersten Artikel hinzu!' : 'Keine Artikel gefunden'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map(item => {
                          const status = getStockStatus(item);
                          return (
                            <TableRow key={item.record_id}>
                              <TableCell className="font-medium">{item.fields.name}</TableCell>
                              <TableCell className="text-muted-foreground font-mono text-sm">{item.fields.sku}</TableCell>
                              <TableCell>{getCategoryName(item.fields.category || '')}</TableCell>
                              <TableCell className="text-right font-medium">{item.fields.quantity}</TableCell>
                              <TableCell className="text-right">{(item.fields.unit_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</TableCell>
                              <TableCell>{getLocationName(item.fields.location || '')}</TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Dialog open={editingItem?.record_id === item.record_id} onOpenChange={(open) => !open && setEditingItem(null)}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon-sm" onClick={() => openEditItemDialog(item)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Artikel bearbeiten</DialogTitle>
                                      </DialogHeader>
                                      <ItemFormContent isEdit />
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="outline" disabled={saving}>Abbrechen</Button>
                                        </DialogClose>
                                        <Button onClick={handleEditItem} disabled={saving}>
                                          {saving ? 'Speichern...' : 'Speichern'}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteItem(item.record_id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Kategorien</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Produktkategorien</CardDescription>
                  </div>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4" />
                        Kategorie hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neue Kategorie hinzufügen</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cat-name">Kategoriename</Label>
                          <Input id="cat-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ name: e.target.value })} placeholder="z.B. Elektronik" />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" disabled={saving}>Abbrechen</Button>
                        </DialogClose>
                        <Button onClick={handleAddCategory} disabled={saving || !categoryFormData.name.trim()}>
                          {saving ? 'Speichern...' : 'Hinzufügen'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Kategoriename</TableHead>
                        <TableHead className="text-right">Artikel</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            Noch keine Kategorien vorhanden. Fügen Sie Ihre erste Kategorie hinzu!
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map(cat => {
                          const itemCount = items.filter(item => item.fields.category === cat.record_id).length;
                          return (
                            <TableRow key={cat.record_id}>
                              <TableCell className="font-medium">{cat.fields.name}</TableCell>
                              <TableCell className="text-right">{itemCount}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Dialog open={editingCategory?.record_id === cat.record_id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditingCategory(cat); setCategoryFormData({ name: cat.fields.name || '' }); }}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Kategorie bearbeiten</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label htmlFor="edit-cat-name">Kategoriename</Label>
                                          <Input id="edit-cat-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ name: e.target.value })} />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="outline" disabled={saving}>Abbrechen</Button>
                                        </DialogClose>
                                        <Button onClick={handleEditCategory} disabled={saving || !categoryFormData.name.trim()}>
                                          {saving ? 'Speichern...' : 'Speichern'}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteCategory(cat.record_id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Lagerorte</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Lagerorte</CardDescription>
                  </div>
                  <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4" />
                        Lagerort hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neuen Lagerort hinzufügen</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="loc-name">Lagerort</Label>
                          <Input id="loc-name" value={locationFormData.name} onChange={(e) => setLocationFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="z.B. A-01-02" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="loc-desc">Beschreibung (optional)</Label>
                          <Input id="loc-desc" value={locationFormData.description} onChange={(e) => setLocationFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="z.B. Regal A, Fach 1, Ebene 2" />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" disabled={saving}>Abbrechen</Button>
                        </DialogClose>
                        <Button onClick={handleAddLocation} disabled={saving || !locationFormData.name.trim()}>
                          {saving ? 'Speichern...' : 'Hinzufügen'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Lagerort</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead className="text-right">Artikel</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : locations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Noch keine Lagerorte vorhanden. Fügen Sie Ihren ersten Lagerort hinzu!
                          </TableCell>
                        </TableRow>
                      ) : (
                        locations.map(loc => {
                          const itemCount = items.filter(item => item.fields.location === loc.record_id).length;
                          return (
                            <TableRow key={loc.record_id}>
                              <TableCell className="font-medium font-mono">{loc.fields.name}</TableCell>
                              <TableCell className="text-muted-foreground">{loc.fields.description || '-'}</TableCell>
                              <TableCell className="text-right">{itemCount}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Dialog open={editingLocation?.record_id === loc.record_id} onOpenChange={(open) => !open && setEditingLocation(null)}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditingLocation(loc); setLocationFormData({ name: loc.fields.name || '', description: loc.fields.description || '' }); }}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Lagerort bearbeiten</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label htmlFor="edit-loc-name">Lagerort</Label>
                                          <Input id="edit-loc-name" value={locationFormData.name} onChange={(e) => setLocationFormData(prev => ({ ...prev, name: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="edit-loc-desc">Beschreibung (optional)</Label>
                                          <Input id="edit-loc-desc" value={locationFormData.description} onChange={(e) => setLocationFormData(prev => ({ ...prev, description: e.target.value }))} />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="outline" disabled={saving}>Abbrechen</Button>
                                        </DialogClose>
                                        <Button onClick={handleEditLocation} disabled={saving || !locationFormData.name.trim()}>
                                          {saving ? 'Speichern...' : 'Speichern'}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteLocation(loc.record_id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

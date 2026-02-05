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
import { Package, Boxes, TrendingUp, AlertTriangle, Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { InventoryItems, CreateInventoryItems } from '@/types/app';

// Category lookup
const categories = [
  { key: 'all', value: 'Alle Kategorien' },
  { key: 'electronics', value: 'Elektronik' },
  { key: 'furniture', value: 'Möbel' },
  { key: 'office', value: 'Bürobedarf' },
];

const getCategoryLabel = (key: string) => categories.find(c => c.key === key)?.value || key;

export default function Dashboard() {
  const [items, setItems] = useState<InventoryItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItems | null>(null);
  const [formData, setFormData] = useState<CreateInventoryItems>({
    name: '',
    sku: '',
    category: 'electronics',
    quantity: 0,
    min_quantity: 10,
    unit_price: 0,
    location: '',
  });
  const [saving, setSaving] = useState(false);

  // Load data from API
  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await LivingAppsService.getInventoryItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

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

  // Handlers
  const handleAdd = async () => {
    setSaving(true);
    try {
      await LivingAppsService.createInventoryItem(formData);
      await loadItems();
      setFormData({ name: '', sku: '', category: 'electronics', quantity: 0, min_quantity: 10, unit_price: 0, location: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Fehler beim Erstellen des Artikels');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await LivingAppsService.updateInventoryItem(editingItem.record_id, formData);
      await loadItems();
      setEditingItem(null);
      setFormData({ name: '', sku: '', category: 'electronics', quantity: 0, min_quantity: 10, unit_price: 0, location: '' });
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Fehler beim Aktualisieren des Artikels');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) return;
    try {
      await LivingAppsService.deleteInventoryItem(id);
      setItems(prev => prev.filter(item => item.record_id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Fehler beim Löschen des Artikels');
    }
  };

  const openEditDialog = (item: InventoryItems) => {
    setEditingItem(item);
    setFormData({
      name: item.fields.name || '',
      sku: item.fields.sku || '',
      category: item.fields.category || 'electronics',
      quantity: item.fields.quantity || 0,
      min_quantity: item.fields.min_quantity || 10,
      unit_price: item.fields.unit_price || 0,
      location: item.fields.location || '',
    });
  };

  const getStockStatus = (item: InventoryItems) => {
    const quantity = item.fields.quantity || 0;
    const minQuantity = item.fields.min_quantity || 0;
    if (quantity === 0) return { variant: 'destructive' as const, label: 'Ausverkauft' };
    if (quantity <= minQuantity) return { variant: 'warning' as const, label: 'Niedriger Bestand' };
    return { variant: 'success' as const, label: 'Auf Lager' };
  };

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
            <Button variant="secondary" size="sm" onClick={loadItems} disabled={loading}>
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
              {loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
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
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
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
              {loading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
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
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-warning">{lowStockItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">Artikel nachbestellen</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
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
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>{cat.value}</SelectItem>
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
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Artikelname</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="sku">SKU</Label>
                          <Input id="sku" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Kategorie</Label>
                          <Select value={formData.category} onValueChange={(value: 'electronics' | 'furniture' | 'office') => setFormData(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => c.key !== 'all').map(cat => (
                                <SelectItem key={cat.key} value={cat.key}>{cat.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="quantity">Menge</Label>
                          <Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="min_quantity">Mindestbestand</Label>
                          <Input id="min_quantity" type="number" value={formData.min_quantity} onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 0 }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="unit_price">Stückpreis (€)</Label>
                          <Input id="unit_price" type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="location">Lagerort</Label>
                          <Input id="location" placeholder="z.B. A-01-02" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" disabled={saving}>Abbrechen</Button>
                      </DialogClose>
                      <Button onClick={handleAdd} disabled={saving}>
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
                          <TableCell>{getCategoryLabel(item.fields.category || '')}</TableCell>
                          <TableCell className="text-right font-medium">{item.fields.quantity}</TableCell>
                          <TableCell className="text-right">{(item.fields.unit_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</TableCell>
                          <TableCell className="font-mono text-sm">{item.fields.location}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Dialog open={editingItem?.record_id === item.record_id} onOpenChange={(open) => !open && setEditingItem(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(item)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Artikel bearbeiten</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-name">Artikelname</Label>
                                      <Input id="edit-name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-sku">SKU</Label>
                                        <Input id="edit-sku" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-category">Kategorie</Label>
                                        <Select value={formData.category} onValueChange={(value: 'electronics' | 'furniture' | 'office') => setFormData(prev => ({ ...prev, category: value }))}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            {categories.filter(c => c.key !== 'all').map(cat => (
                                              <SelectItem key={cat.key} value={cat.key}>{cat.value}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-quantity">Menge</Label>
                                        <Input id="edit-quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-min_quantity">Mindestbestand</Label>
                                        <Input id="edit-min_quantity" type="number" value={formData.min_quantity} onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 0 }))} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-unit_price">Stückpreis (€)</Label>
                                        <Input id="edit-unit_price" type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))} />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-location">Lagerort</Label>
                                        <Input id="edit-location" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} />
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline" disabled={saving}>Abbrechen</Button>
                                    </DialogClose>
                                    <Button onClick={handleEdit} disabled={saving}>
                                      {saving ? 'Speichern...' : 'Speichern'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.record_id)} className="text-destructive hover:text-destructive">
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
      </main>
    </div>
  );
}

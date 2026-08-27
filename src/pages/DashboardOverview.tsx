import { useDashboardData } from '@/hooks/useDashboardData';
import type { Testdaten } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { TestdatenDialog } from '@/components/dialogs/TestdatenDialog';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconSearch, IconPencil, IconTrash,
  IconMail, IconPhone, IconCalendar, IconUsers,
  IconTag, IconNotes,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a9014f2ee67a2efb71b9687';
const REPAIR_ENDPOINT = '/claude/build/repair';

const KATEGORIE_OPTIONS = LOOKUP_OPTIONS['testdaten']?.['kategorie'] ?? [];

export default function DashboardOverview() {
  const { testdaten, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [filterKategorie, setFilterKategorie] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Testdaten | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testdaten | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return testdaten.filter((r) => {
      const matchKat =
        filterKategorie === 'all' ||
        (r.fields.kategorie?.key ?? '') === filterKategorie;
      if (!matchKat) return false;
      if (!q) return true;
      const hay = [
        r.fields.vorname,
        r.fields.nachname,
        r.fields.email,
        r.fields.telefon,
        r.fields.bemerkungen,
        r.fields.kategorie?.label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [testdaten, search, filterKategorie]);

  const stats = useMemo(() => {
    const total = testdaten.length;
    const withEmail = testdaten.filter((r) => r.fields.email).length;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = testdaten.filter(
      (r) => r.fields.datum?.slice(0, 10) === today,
    ).length;
    const byKat: Record<string, number> = {};
    for (const r of testdaten) {
      const k = r.fields.kategorie?.label ?? 'Keine';
      byKat[k] = (byKat[k] ?? 0) + 1;
    }
    const topKat =
      Object.entries(byKat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { total, withEmail, todayCount, topKat };
  }, [testdaten]);

  const handleCreate = async (fields: Testdaten['fields']) => {
    await LivingAppsService.createTestdatenEntry(fields);
    fetchAll();
  };

  const handleUpdate = async (fields: Testdaten['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateTestdatenEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTestdatenEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Einträge gesamt"
          value={String(stats.total)}
          description="Alle Testdaten"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit E-Mail"
          value={String(stats.withEmail)}
          description="E-Mail vorhanden"
          icon={<IconMail size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Heute"
          value={String(stats.todayCount)}
          description="Datum heute"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Top-Kategorie"
          value={stats.topKat}
          description="Häufigste Kategorie"
          icon={<IconTag size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0"
            />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterKategorie('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterKategorie === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Alle
            </button>
            {KATEGORIE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() =>
                  setFilterKategorie(
                    filterKategorie === opt.key ? 'all' : opt.key,
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterKategorie === opt.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={() => {
            setEditRecord(null);
            setDialogOpen(true);
          }}
          className="shrink-0 w-full sm:w-auto"
        >
          <IconPlus size={16} className="mr-2 shrink-0" />
          Neuer Eintrag
        </Button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <IconUsers size={48} stroke={1.5} />
          <p className="text-sm">
            {testdaten.length === 0
              ? 'Noch keine Einträge vorhanden.'
              : 'Keine Einträge gefunden.'}
          </p>
          {testdaten.length === 0 && (
            <Button
              size="sm"
              onClick={() => {
                setEditRecord(null);
                setDialogOpen(true);
              }}
            >
              <IconPlus size={16} className="mr-1" /> Ersten Eintrag erstellen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((record) => (
            <ContactCard
              key={record.record_id}
              record={record}
              onEdit={() => {
                setEditRecord(record);
                setDialogOpen(true);
              }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} von {testdaten.length} Einträgen
        </p>
      )}

      {/* Dialogs */}
      <TestdatenDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditRecord(null);
        }}
        onSubmit={editRecord ? handleUpdate : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Testdaten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Testdaten']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`Soll der Eintrag von ${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''} wirklich gelöscht werden?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ContactCard({
  record,
  onEdit,
  onDelete,
}: {
  record: Testdaten;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { vorname, nachname, email, telefon, datum, kategorie, bemerkungen } =
    record.fields;
  const initials = [vorname?.[0], nachname?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-5 pt-5 pb-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">
            {[vorname, nachname].filter(Boolean).join(' ') || '—'}
          </p>
          {kategorie && (
            <Badge
              variant="secondary"
              className="mt-1 text-xs bg-primary/10 text-primary border-0"
            >
              {kategorie.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-2 flex-1">
        {email && (
          <div className="flex items-center gap-2 min-w-0">
            <IconMail size={14} className="shrink-0 text-muted-foreground" />
            <a
              href={`mailto:${email}`}
              className="text-sm text-primary truncate hover:underline"
            >
              {email}
            </a>
          </div>
        )}
        {telefon && (
          <div className="flex items-center gap-2 min-w-0">
            <IconPhone size={14} className="shrink-0 text-muted-foreground" />
            <a
              href={`tel:${telefon}`}
              className="text-sm text-foreground truncate hover:underline"
            >
              {telefon}
            </a>
          </div>
        )}
        {datum && (
          <div className="flex items-center gap-2 min-w-0">
            <IconCalendar size={14} className="shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{formatDate(datum)}</span>
          </div>
        )}
        {bemerkungen && (
          <div className="flex items-start gap-2 min-w-0">
            <IconNotes size={14} className="shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground line-clamp-2">{bemerkungen}</p>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 border-t border-border flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          title="Bearbeiten"
        >
          <IconPencil size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Löschen"
        >
          <IconTrash size={15} />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" /> Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>
          Erneut versuchen
        </Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && (
        <p className="text-sm text-destructive">
          Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.
        </p>
      )}
    </div>
  );
}

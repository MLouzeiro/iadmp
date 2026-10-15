'use client';

import { useEffect, useState, useCallback } from 'react';
import { HardDrive, AlertTriangle, CheckCircle, Clock, FileWarning, Settings, RefreshCw, Trash2 } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface Uso {
  totalBytes: number;
  fileCount: number;
  buckets: Record<string, { bytes: number; count: number }>;
  fonte: string;
  ultimaMedicao: string | null;
  integraao: string;
  observacao?: string;
}
interface Config {
  limiteBytes: number;
  alertaAtencao: number;
  alertaCritico: number;
  alertaUrgente: number;
}
interface Alerta {
  id: string;
  nivel: number;
  titulo: string;
  mensagem: string;
  sugestoes: unknown;
  fonte: string;
  status: string;
  emitidoEm: string;
}
interface Arquivo {
  id: string;
  fileName: string;
  sizeBytes: number;
  path: string;
  bucket: string;
  createdAt: string;
  organizacaoNome: string;
}

function formatarBytes(b: number): string {
  if (b === 0) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(i > 1 ? 2 : 0)} ${s[i]}`;
}

function nivelBadge(nivel: string): { variant: 'ok' | 'warn' | 'err' | 'info' | 'mut'; label: string } {
  switch (nivel) {
    case 'NORMAL': return { variant: 'ok', label: 'NORMAL' };
    case 'ATENCAO': return { variant: 'warn', label: 'ATENÇÃO' };
    case 'CRITICO': return { variant: 'err', label: 'CRÍTICO' };
    case 'URGENTE': return { variant: 'err', label: 'URGENTE' };
    case 'CHEIO': return { variant: 'err', label: 'CHEIO' };
    case 'INDISPONIVEL': return { variant: 'mut', label: 'INDISPONÍVEL' };
    default: return { variant: 'mut', label: nivel };
  }
}

export default function ArmazenamentoPage() {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [uso, setUso] = useState<Uso | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [nivel, setNivel] = useState('INDISPONIVEL');
  const [pct, setPct] = useState(0);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [maiores, setMaiores] = useState<Arquivo[]>([]);
  const [historico, setHistorico] = useState<{ medidoEm: string; totalBytes: number; fileCount: number }[]>([]);
  const [editandoConfig, setEditandoConfig] = useState(false);
  const [formConfig, setFormConfig] = useState({ limiteGB: '1', alertaAtencao: '70', alertaCritico: '85', alertaUrgente: '95' });

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/storage/monitoramento');
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Erro ao carregar monitoramento.', 'err');
        return;
      }
      const d = await res.json();
      setUso(d.uso);
      setConfig(d.config);
      setNivel(d.nivel);
      setPct(d.pct);
      setAlertas(d.alertas || []);
      setMaiores(d.maiores || []);
      setHistorico(d.historico || []);
      if (d.config) {
        setFormConfig({
          limiteGB: (d.config.limiteBytes / 1024 / 1024 / 1024).toString(),
          alertaAtencao: d.config.alertaAtencao.toString(),
          alertaCritico: d.config.alertaCritico.toString(),
          alertaUrgente: d.config.alertaUrgente.toString(),
        });
      }
    } catch {
      toast('Falha de conexão ao carregar monitoramento.', 'err');
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/storage/monitoramento');
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (!cancelled) toast(d.error || 'Erro ao carregar monitoramento.', 'err');
          return;
        }
        const d = await res.json();
        if (cancelled) return;
        setUso(d.uso);
        setConfig(d.config);
        setNivel(d.nivel);
        setPct(d.pct);
        setAlertas(d.alertas || []);
        setMaiores(d.maiores || []);
        setHistorico(d.historico || []);
        if (d.config) {
          setFormConfig({
            limiteGB: (d.config.limiteBytes / 1024 / 1024 / 1024).toString(),
            alertaAtencao: d.config.alertaAtencao.toString(),
            alertaCritico: d.config.alertaCritico.toString(),
            alertaUrgente: d.config.alertaUrgente.toString(),
          });
        }
      } catch {
        if (!cancelled) toast('Falha de conexão ao carregar monitoramento.', 'err');
      } finally {
        if (!cancelled) setCarregando(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const salvarConfig = async () => {
    const limiteBytes = parseFloat(formConfig.limiteGB) * 1024 * 1024 * 1024;
    if (!limiteBytes || limiteBytes <= 0) { toast('Limite inválido.', 'warn'); return; }
    const res = await fetch('/api/storage/monitoramento', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limiteBytes,
        alertaAtencao: parseInt(formConfig.alertaAtencao, 10),
        alertaCritico: parseInt(formConfig.alertaCritico, 10),
        alertaUrgente: parseInt(formConfig.alertaUrgente, 10),
      }),
    });
    if (res.ok) { toast('Configuração salva.', 'ok'); setEditandoConfig(false); carregar(); }
    else { const d = await res.json().catch(() => ({})); toast(d.error || 'Erro ao salvar.', 'err'); }
  };

  const marcarAlerta = async (id: string, acao: 'lido' | 'resolvido') => {
    const res = await fetch(`/api/storage/alertas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao }),
    });
    if (res.ok) { toast(`Alerta marcado como ${acao}.`, 'ok'); carregar(); }
    else toast('Erro ao atualizar alerta.', 'err');
  };

  if (carregando) return <div className={styles.loadingState}>Carregando armazenamento...</div>;

  const nb = nivelBadge(nivel);
  const corBarra = pct >= (config?.alertaUrgente ?? 95) ? 'var(--color-danger, #E4574F)' : pct >= (config?.alertaCritico ?? 85) ? '#E67E22' : pct >= (config?.alertaAtencao ?? 70) ? '#F1C40F' : 'var(--color-primary, #C8960C)';

  return (
    <div>
      <PageHead
        title="Armazenamento e Alertas"
        subtitle="Monitoramento do Supabase Storage (uso, limites, alertas e limpeza)"
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={carregar} size="sm">Atualizar</Button>
            <Button variant="secondary" icon={<Settings size={16} />} onClick={() => setEditandoConfig(!editandoConfig)} size="sm">Limites</Button>
          </>
        }
      />

      {/* Integração */}
      {uso?.integraao && uso.integraao !== 'NORMAL' && (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(228,87,79,.12)', border: '1px solid var(--color-danger, #E4574F)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--color-danger, #E4574F)' }}>Monitoramento indisponível.</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>{uso.observacao || 'Verifique as variáveis de ambiente do Supabase.'}</span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Kpi label="Espaço ocupado" valor={uso ? formatarBytes(uso.totalBytes) : '—'} icon={<HardDrive size={18} />} />
        <Kpi label="Espaço livre (estimado)" valor={config && uso ? formatarBytes(Math.max(0, config.limiteBytes - uso.totalBytes)) : '—'} icon={<CheckCircle size={18} />} />
        <Kpi label="Limite considerado" valor={config ? formatarBytes(config.limiteBytes) : '—'} icon={<Settings size={18} />} sub="Configurável pelo admin" />
        <Kpi label="Arquivos" valor={uso?.fileCount?.toString() ?? '—'} icon={<FileWarning size={18} />} />
        <Kpi label="Estado" valor={nb.label} icon={<AlertTriangle size={18} />} cor={corBarra} />
        <Kpi label="Última verificação" valor={uso?.ultimaMedicao ? new Date(uso.ultimaMedicao).toLocaleString('pt-BR') : '—'} icon={<Clock size={18} />} />
      </div>

      {/* Barra de uso */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Utilização</span>
          <Badge variant={nb.variant}>{pct}%</Badge>
        </div>
        <div style={{ height: 18, background: 'var(--bg-input)', borderRadius: 9, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: corBarra, borderRadius: 9, transition: 'width .4s' }} />
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          Fonte: {uso?.fonte === 'INVENTARIO' ? 'inventário interno (arquivos registrados no sistema)' : uso?.fonte}
          {uso?.observacao ? ` · ${uso.observacao}` : ''}
        </p>
      </div>

      {/* Config de limites */}
      {editandoConfig && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Configurar limites (SUPER_ADMIN)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            O limite é a cota considerada nos cálculos. Não é obtido automaticamente do Supabase — configure conforme o plano contratado.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <Campo label="Limite (GB)" value={formConfig.limiteGB} onChange={(v) => setFormConfig({ ...formConfig, limiteGB: v })} />
            <Campo label="Atenção (%)" value={formConfig.alertaAtencao} onChange={(v) => setFormConfig({ ...formConfig, alertaAtencao: v })} />
            <Campo label="Crítico (%)" value={formConfig.alertaCritico} onChange={(v) => setFormConfig({ ...formConfig, alertaCritico: v })} />
            <Campo label="Urgente (%)" value={formConfig.alertaUrgente} onChange={(v) => setFormConfig({ ...formConfig, alertaUrgente: v })} />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Button onClick={salvarConfig} size="sm">Salvar limites</Button>
            <Button variant="secondary" onClick={() => setEditandoConfig(false)} size="sm">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Alertas */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-primary)' }} /> Histórico de alertas
        </h3>
        {alertas.length === 0 ? (
          <EmptyState icon={<CheckCircle size={28} />} title="Nenhum alerta" message="O armazenamento está dentro dos limites configurados." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alertas.map((a) => {
              const nbA = a.nivel >= 100 ? nivelBadge('CHEIO') : a.nivel >= 95 ? nivelBadge('URGENTE') : a.nivel >= 85 ? nivelBadge('CRITICO') : nivelBadge('ATENCAO');
              return (
                <div key={a.id} style={{ padding: '0.9rem 1.1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: a.status === 'ATIVO' ? 'rgba(228,87,79,.06)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <Badge variant={nbA.variant}>{nbA.label}</Badge>
                        <Badge variant={a.status === 'ATIVO' ? 'warn' : a.status === 'LIDO' ? 'info' : 'ok'}>{a.status}</Badge>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(a.emitidoEm).toLocaleString('pt-BR')}</span>
                      </div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{a.titulo}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.mensagem}</p>
                      {Array.isArray(a.sugestoes) && a.sugestoes.length > 0 && (
                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {(a.sugestoes as string[]).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {a.status === 'ATIVO' && (
                        <Button size="sm" variant="secondary" onClick={() => marcarAlerta(a.id, 'lido')}>Lido</Button>
                      )}
                      {a.status !== 'RESOLVIDO' && (
                        <Button size="sm" variant="secondary" onClick={() => marcarAlerta(a.id, 'resolvido')}>Resolver</Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Maiores arquivos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileWarning size={18} style={{ color: 'var(--color-primary)' }} /> Arquivos maiores
        </h3>
        {maiores.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum arquivo registrado no inventário.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', color: 'var(--color-primary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Arquivo</th>
                <th style={{ padding: '0.5rem', color: 'var(--color-primary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Tamanho</th>
                <th style={{ padding: '0.5rem', color: 'var(--color-primary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Congregação</th>
                <th style={{ padding: '0.5rem', color: 'var(--color-primary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {maiores.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.fileName}</td>
                  <td style={{ padding: '0.5rem' }}>{formatarBytes(m.sizeBytes)}</td>
                  <td style={{ padding: '0.5rem' }}>{m.organizacaoNome}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Histórico tendência */}
      {historico.length > 1 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Tendência (últimas medições)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 80 }}>
            {historico.slice().reverse().map((h, i) => {
              const max = Math.max(...historico.map((x) => x.totalBytes), 1);
              const alt = Math.max(4, (h.totalBytes / max) * 76);
              return (
                <div key={i} title={`${new Date(h.medidoEm).toLocaleString('pt-BR')} — ${formatarBytes(h.totalBytes)}`}
                  style={{ flex: 1, height: alt, background: 'var(--color-primary)', borderRadius: '3px 3px 0 0', opacity: 0.7 }} />
              );
            })}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {historico.length} medições · última: {historico[0] ? new Date(historico[0].medidoEm).toLocaleString('pt-BR') : '—'}
          </p>
        </div>
      )}

      {/* Limpeza */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={18} style={{ color: 'var(--color-primary)' }} /> Limpeza (diagnóstico)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Esta ferramenta lista candidatos a limpeza para revisão manual. Nada é excluído automaticamente.
        </p>
        <Button variant="secondary" size="sm" onClick={() => window.open('/api/storage/limpeza', '_blank')}>Ver candidatos (JSON)</Button>
      </div>
    </div>
  );
}

function Kpi({ label, valor, icon, cor, sub }: { label: string; valor: string; icon: React.ReactNode; cor?: string; sub?: string }) {
  return (
    <div style={{ padding: '1rem 1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {icon} {label}
      </div>
      <p style={{ fontSize: '1.3rem', fontWeight: 700, color: cor || 'var(--text-primary)' }}>{valor}</p>
      {sub && <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</p>}
    </div>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '0.5rem 0.7rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
      />
    </label>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './upload-field.module.css';

interface UploadFieldProps {
  organizacaoId: string;
  value: string;
  onChange: (url: string) => void;
  pasta: string;
  entityTipo?: string;
  entityId?: string;
  label?: string;
  accept?: string;
  disabled?: boolean;
  onStatusChange?: (status: 'idle' | 'uploading' | 'ok' | 'erro') => void;
}

export default function UploadField({
  organizacaoId,
  value,
  onChange,
  pasta,
  entityTipo,
  entityId,
  label = 'Enviar imagem',
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml',
  disabled = false,
  onStatusChange,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const selecionar = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErro(null);
    setSucesso(false);
    onStatusChange?.('uploading');

    if (!organizacaoId) {
      const msg = 'Selecione a organização antes de enviar o arquivo.';
      setErro(msg);
      onStatusChange?.('erro');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const msg = 'Arquivo muito grande. Máximo 5 MB.';
      setErro(msg);
      onStatusChange?.('erro');
      return;
    }

    const mimeOk = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!mimeOk.includes(file.type)) {
      const msg = 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP, GIF ou SVG.';
      setErro(msg);
      onStatusChange?.('erro');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('arquivo', file);
      fd.append('organizacaoId', organizacaoId);
      fd.append('pasta', pasta);
      if (entityTipo) fd.append('entityTipo', entityTipo);
      if (entityId) fd.append('entityId', entityId);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        onChange(data.url);
        setSucesso(true);
        setErro(null);
        onStatusChange?.('ok');
      } else {
        const msg = data.error || 'Erro ao enviar o arquivo.';
        setErro(msg);
        onStatusChange?.('erro');
      }
    } catch {
      setErro('Falha de conexão no upload.');
      onStatusChange?.('erro');
    } finally {
      setUploading(false);
    }
  };

  const bloqueado = disabled || uploading || !organizacaoId;

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.btn}
          onClick={selecionar}
          disabled={bloqueado}
        >
          {uploading ? <Loader2 size={16} className={styles.spin} /> : <Upload size={16} />}
          {uploading ? 'Enviando...' : 'Escolher arquivo'}
        </button>
        <span className={styles.hint}>
          JPEG, PNG, WebP, GIF ou SVG · máx. 5 MB
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFile}
        style={{ display: 'none' }}
        aria-label="Selecionar arquivo para upload"
      />

      {sucesso && value && (
        <div className={styles.preview}>
          <img src={value} alt="Preview do arquivo enviado" />
          <span className={styles.ok}>
            <CheckCircle2 size={14} /> Enviado com sucesso
          </span>
        </div>
      )}

      {erro && (
        <div className={styles.erro}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
    </div>
  );
}

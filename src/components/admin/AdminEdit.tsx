'use client';

import * as React from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { XCircle, RotateCcw } from 'lucide-react';

type AdminEditProps = {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
};

function parseOrderNumbers(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ActionKind = 'Возврат' | 'Отменен';

export function AdminEdit({ orders, onUpdateStatus }: AdminEditProps) {
  const { toast } = useToast();

  const [openKind, setOpenKind] = React.useState<ActionKind | null>(null);
  const [rawInput, setRawInput] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);

  const tokens = React.useMemo(() => parseOrderNumbers(rawInput), [rawInput]);
  const found = React.useMemo(() => tokens.map((num) => orders.find((o) => o.orderNumber === num) || null), [tokens, orders]);

  const foundOrders = found.filter((o): o is Order => !!o);
  const notFound = tokens.filter((num, i) => !found[i]);
  const eligible = foundOrders.filter((o) => o.status === 'Отправлен');
  const ineligible = foundOrders.filter((o) => o.status !== 'Отправлен');

  const handleApply = async () => {
    if (!openKind) return;
    if (eligible.length === 0) {
      toast({ title: 'Нет подходящих заказов', description: 'Статус изменяется только у заказов со статусом "Отправлен"', variant: 'destructive' });
      return;
    }
    try {
      setIsApplying(true);
      for (const o of eligible) {
        await onUpdateStatus(o.id!, openKind);
      }
      toast({ title: 'Готово', description: `Изменено: ${eligible.length}. Пропущено: ${ineligible.length + notFound.length}.` });
      setOpenKind(null);
      setRawInput('');
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось обновить статусы', variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  const DialogUi = (kind: ActionKind, trigger: React.ReactNode) => (
    <Dialog open={openKind === kind} onOpenChange={(v) => setOpenKind(v ? kind : null)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Массовое изменение статусов — {kind}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Вставьте номера заказов (через запятую, пробел или с новой строки):</label>
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="#12345, #67890\n#ABCDE"
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Подходят (Отправлен):</div>
              <div className="font-medium">{eligible.length}</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Неподходят (не Отправлен):</div>
              <div className="font-medium">{ineligible.length}</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Не найдены:</div>
              <div className="font-medium">{notFound.length}</div>
            </div>
          </div>

          {(ineligible.length > 0 || notFound.length > 0) && (
            <div className="text-xs text-muted-foreground">Будут изменены только заказы со статусом "Отправлен".</div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpenKind(null); setRawInput(''); }} disabled={isApplying}>Отмена</Button>
            <Button onClick={handleApply} disabled={isApplying || eligible.length === 0} variant={kind === 'Возврат' ? 'outline' : 'destructive'}>
              {isApplying ? 'Изменение…' : 'Изменить статусы'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Редактирование статусов</h1>
        <p className="text-muted-foreground">Массовое изменение статусов заказов по номерам</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {DialogUi('Возврат', (
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Возврат
          </Button>
        ))}
        {DialogUi('Отменен', (
          <Button variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            Отменен
          </Button>
        ))}
      </div>

      {foundOrders.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Предпросмотр найденных заказов:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {foundOrders.slice(0, 20).map((o) => (
              <div key={o.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">#{o.orderNumber}</div>
                  <div className="text-xs text-muted-foreground">{o.productType} {o.size} — {o.seller}</div>
                </div>
                <Badge variant={o.status === 'Отправлен' ? 'warning' : 'outline'}>{o.status}</Badge>
              </div>
            ))}
          </div>
          {foundOrders.length > 20 && (
            <div className="text-xs text-muted-foreground">Показаны первые 20…</div>
          )}
        </div>
      )}
    </div>
  );
}



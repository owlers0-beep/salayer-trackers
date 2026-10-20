import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'salary_tracker_v1';
const AR = '٠١٢٣٤٥٦٧٨٩';
const num = (s) => {
  const t = String(s).replace(/[٠-٩]/g, (d) => AR.indexOf(d)).replace('٫', '.').replace(/,/g, '');
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
};
const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString('en-US');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export default function App() {
  const [st, setSt] = useState({ salaries: [], withdrawals: [] });
  const [loaded, setLoaded] = useState(false);
  const [sName, setSName] = useState('');
  const [sAmt, setSAmt] = useState('');
  const [wSid, setWSid] = useState('');
  const [wAmt, setWAmt] = useState('');
  const [wDate, setWDate] = useState(today());
  const [wNote, setWNote] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((r) => { if (r) { const p = JSON.parse(r); if (p.salaries && p.withdrawals) setSt(p); } })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(st)).catch(() => {}); }, [st, loaded]);

  const taken = (id) => st.withdrawals.filter((w) => w.sid === id).reduce((a, w) => a + w.amount, 0);
  let tRem = 0, tTaken = 0, cnt = 0, cur = null;
  st.salaries.forEach((s) => {
    const t = taken(s.id), r = s.amount - t;
    tTaken += t; tRem += Math.max(r, 0);
    if (r > 0) { cnt++; if (cur === null) cur = r; }
  });
  const firstOpen = st.salaries.find((s) => s.amount - taken(s.id) > 0);
  const selId = st.salaries.some((s) => s.id === wSid) ? wSid : (firstOpen || st.salaries[0] || {}).id;

  const addSalary = () => {
    const a = num(sAmt);
    if (!sName.trim() || a <= 0) return Alert.alert('تنبيه', 'اكتب الشهر ومبلغ الراتب');
    setSt({ ...st, salaries: [...st.salaries, { id: uid(), name: sName.trim(), amount: a }] });
    setSName(''); setSAmt('');
  };
  const doAddW = (a) => {
    setSt({ ...st, withdrawals: [...st.withdrawals, { id: uid(), sid: selId, amount: a, date: wDate || today(), note: wNote.trim() }] });
    setWAmt(''); setWNote('');
  };
  const addW = () => {
    const a = num(wAmt);
    if (!selId) return Alert.alert('تنبيه', 'أضف راتبًا أولًا');
    if (a <= 0) return Alert.alert('تنبيه', 'اكتب المبلغ');
    const s = st.salaries.find((x) => x.id === selId);
    if (a > s.amount - taken(selId)) {
      return Alert.alert('تنبيه', 'المبلغ أكبر من الباقي من هذا الراتب. تسجله؟', [
        { text: 'إلغاء', style: 'cancel' }, { text: 'تسجيل', onPress: () => doAddW(a) }]);
    }
    doAddW(a);
  };
  const delSalary = (id) => Alert.alert('حذف', 'حذف هذا الراتب وكل مبالغه؟', [
    { text: 'إلغاء', style: 'cancel' },
    { text: 'حذف', style: 'destructive', onPress: () => setSt({ salaries: st.salaries.filter((s) => s.id !== id), withdrawals: st.withdrawals.filter((w) => w.sid !== id) }) }]);
  const delW = (id) => Alert.alert('حذف', 'حذف هذا المبلغ؟', [
    { text: 'إلغاء', style: 'cancel' },
    { text: 'حذف', style: 'destructive', onPress: () => setSt({ ...st, withdrawals: st.withdrawals.filter((w) => w.id !== id) }) }]);

  return (
    <ScrollView style={s.bg} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="dark-content" />
      <Text style={s.h1}>متابعة الراتب</Text>

      <View style={[s.card, s.grid]}>
        {[['إجمالي الباقي', fmt(tRem)], ['رواتب باقية', String(cnt)], ['إجمالي المأخوذ', fmt(tTaken)], ['باقي الراتب الحالي', fmt(cur || 0)]].map(([l, v]) => (
          <View key={l} style={s.cell}><Text style={s.big}>{v}</Text><Text style={s.mu}>{l}</Text></View>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>تسجيل مبلغ مأخوذ</Text>
        <View style={s.chips}>
          {st.salaries.length === 0 && <Text style={s.mu}>أضف راتبًا أولًا</Text>}
          {st.salaries.map((x) => (
            <TouchableOpacity key={x.id} onPress={() => setWSid(x.id)} style={[s.chip, selId === x.id && s.chipOn]}>
              <Text style={selId === x.id ? s.chipTxOn : s.tx}>{x.name} · باقي {fmt(x.amount - taken(x.id))}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={s.in} value={wAmt} onChangeText={setWAmt} placeholder="المبلغ" keyboardType="decimal-pad" />
        <TextInput style={s.in} value={wDate} onChangeText={setWDate} placeholder="التاريخ (2026-10-20)" />
        <TextInput style={s.in} value={wNote} onChangeText={setWNote} placeholder="ملاحظة (اختياري)" />
        <TouchableOpacity style={s.btn} onPress={addW}><Text style={s.btnTx}>تسجيل</Text></TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>إضافة راتب</Text>
        <TextInput style={s.in} value={sName} onChangeText={setSName} placeholder="الشهر (مثال: أكتوبر)" />
        <TextInput style={s.in} value={sAmt} onChangeText={setSAmt} placeholder="مبلغ الراتب" keyboardType="decimal-pad" />
        <TouchableOpacity style={s.btn} onPress={addSalary}><Text style={s.btnTx}>إضافة</Text></TouchableOpacity>
      </View>

      {st.salaries.map((x) => {
        const t = taken(x.id), r = x.amount - t, p = Math.min(100, x.amount ? (t / x.amount) * 100 : 0);
        const ws = st.withdrawals.filter((w) => w.sid === x.id).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <View key={x.id} style={s.card}>
            <View style={s.hd}>
              <Text style={s.h2}>{x.name}</Text>
              <TouchableOpacity onPress={() => delSalary(x.id)}><Text style={s.del}>حذف</Text></TouchableOpacity>
            </View>
            <View style={s.bar}><View style={[s.fill, { width: p + '%' }]} /></View>
            <View style={s.hd}>
              <Text style={s.mu}>المأخوذ {fmt(t)} من {fmt(x.amount)}</Text>
              <Text style={[s.tx, { fontWeight: '700' }]}>{r <= 0 ? 'مكتمل' : 'باقي ' + fmt(r)}</Text>
            </View>
            {ws.map((w) => (
              <View key={w.id} style={s.w}>
                <Text style={s.tx}>{fmt(w.amount)} <Text style={s.mu}>· {w.date}{w.note ? ' · ' + w.note : ''}</Text></Text>
                <TouchableOpacity onPress={() => delW(w.id)}><Text style={s.del}>✕</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const A = '#0f766e';
const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f5f6f8' },
  pad: { padding: 14, paddingTop: 48, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '700', textAlign: 'right', marginBottom: 12, color: '#1b1f24' },
  h2: { fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 10, color: '#1b1f24' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e3e6ea' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '48.5%', backgroundColor: '#f5f6f8', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 8 },
  big: { fontSize: 20, fontWeight: '700', color: A },
  mu: { color: '#6b7280', fontSize: 13, textAlign: 'right' },
  tx: { color: '#1b1f24', fontSize: 14, textAlign: 'right' },
  in: { borderWidth: 1, borderColor: '#e3e6ea', borderRadius: 10, padding: 10, marginBottom: 8, textAlign: 'right', fontSize: 16, color: '#1b1f24' },
  btn: { backgroundColor: A, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnTx: { color: '#fff', fontWeight: '700', fontSize: 16 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#e3e6ea', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginLeft: 6, marginBottom: 6 },
  chipOn: { backgroundColor: A, borderColor: A },
  chipTxOn: { color: '#fff', fontSize: 14 },
  hd: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  bar: { height: 8, backgroundColor: '#f5f6f8', borderRadius: 6, overflow: 'hidden', marginVertical: 8 },
  fill: { height: '100%', backgroundColor: A },
  w: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e3e6ea', paddingVertical: 8, marginTop: 4 },
  del: { color: '#c62828', fontSize: 14, paddingHorizontal: 6 },
});

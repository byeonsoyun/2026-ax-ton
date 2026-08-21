import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { QuizResult, TrainingRecord } from "@/lib/types";

// F-03 증빙 PDF. 표준 라이브러리(@react-pdf/renderer)로 렌더링만 하고,
// 여기서는 "무엇을 채울지"를 결정하는 데이터 조립만 담당한다 (§4.3 개발 원칙).
//
// react-pdf 기본 내장 폰트(Helvetica)는 한글 글리프가 없어 한국어 텍스트가 깨진다.
// 감독관 제출용 문서는 한국어로 고정하기로 했으므로(§ 대화 결정), 한글 전체 글리프를
// 포함한 Noto Sans KR을 등록해서 쓴다.
Font.register({ family: "NotoSansKR", src: "/fonts/NotoSansKR.ttf" });

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "NotoSansKR" },
  title: { fontSize: 18, marginBottom: 16, fontWeight: 700 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 140, color: "#555" },
  value: { flex: 1 },
  section: { marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: 700 },
  itemRow: { flexDirection: "row", marginBottom: 4, paddingBottom: 4, borderBottom: "1 solid #eee" },
  disclaimer: { marginTop: 24, fontSize: 9, color: "#888" },
});

const ITEM_LABEL: Record<string, string> = {
  sequence: "절차 시뮬레이션형",
  hotspot: "위험지점 핫스팟형",
  branch: "분기 시나리오형",
};

export function TrainingCertificate({
  record,
  equipmentName,
}: {
  record: Omit<TrainingRecord, "workerAnonId">;
  equipmentName: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>안전교육 이수 및 이해도 검증 증빙</Text>

        <View style={styles.row}>
          <Text style={styles.label}>설비</Text>
          <Text style={styles.value}>{equipmentName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>교육 언어</Text>
          <Text style={styles.value}>{record.language}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>교육 일시</Text>
          <Text style={styles.value}>{new Date(record.startedAt).toLocaleString("ko-KR")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>완료 일시</Text>
          <Text style={styles.value}>
            {record.completedAt ? new Date(record.completedAt).toLocaleString("ko-KR") : "-"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>본인 확인 서명</Text>
          <Text style={styles.value}>{record.signatureName ?? "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>이해도 검증 결과</Text>
          <Text style={styles.value}>{record.passed ? "통과" : "미달"}</Text>
        </View>

        <Text style={styles.section}>이해도 검증 문항별 결과</Text>
        {record.quizResults.map((r: QuizResult, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={{ width: 160 }}>{ITEM_LABEL[r.itemType] ?? r.itemType}</Text>
            <Text style={{ width: 80 }}>{r.passed ? "통과" : "미달"}</Text>
            <Text style={{ width: 80 }}>시도 {r.attempts}회</Text>
            <Text>{Math.round(r.responseTimeMs / 1000)}초</Text>
          </View>
        ))}

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: "#555" }}>기록 무결성 해시: {record.integrityHash ?? "-"}</Text>
        </View>

        <Text style={styles.disclaimer}>
          이 문서는 교육 실시 및 이해도 검증의 증빙이며, 그 자체로 법적 면책을 보장하지 않습니다.
          (데모 단계 문서 — 실제 서비스에서는 서버에서 생성 시점에 SHA-256 해시로 무결성을 보장합니다.)
        </Text>
      </Page>
    </Document>
  );
}

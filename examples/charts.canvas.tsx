import {
  BarChart,
  Card,
  CardBody,
  CardHeader,
  Grid,
  H1,
  H2,
  LineChart,
  PieChart,
  Stack,
  Text,
} from "cursor/canvas";

export default function ChartKitchenSink() {
  return (
    <Stack gap={24} style={{ padding: 24 }}>
      <H1>图表预览</H1>
      <Text>柱状 / 折线 / 饼图，对齐 canvas SDK 的 categories + series API。</Text>

      <H2>分组柱状图</H2>
      <Card>
        <CardHeader title="请求量" />
        <CardBody>
          <BarChart
            categories={["Mon", "Tue", "Wed", "Thu", "Fri"]}
            series={[
              { name: "IDE", data: [120, 90, 150, 130, 160] },
              { name: "CLI", data: [30, 40, 25, 35, 28] },
            ]}
            valueSuffix=""
            height={220}
          />
        </CardBody>
      </Card>

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader title="堆叠 + 参考线" />
          <CardBody>
            <BarChart
              categories={["Q1", "Q2", "Q3", "Q4"]}
              series={[
                { name: "Accepted", data: [70, 80, 60, 90], tone: "success" },
                { name: "Rejected", data: [30, 20, 40, 15], tone: "danger" },
              ]}
              stacked
              referenceLines={[{ value: 100, label: "容量", tone: "warning" }]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="折线面积" />
          <CardBody>
            <LineChart
              categories={["Jan", "Feb", "Mar", "Apr"]}
              series={[
                { name: "p95", data: [80, 95, 110, 90], tone: "info" },
                { name: "errors", data: [2, 4, 9, 3], tone: "danger" },
              ]}
              fill
            />
          </CardBody>
        </Card>
      </Grid>

      <H2>饼图</H2>
      <Card>
        <CardBody>
          <PieChart
            donut
            data={[
              { label: "Passing", value: 70, tone: "success" },
              { label: "Failing", value: 20, tone: "danger" },
              { label: "Skipped", value: 10, tone: "neutral" },
            ]}
          />
        </CardBody>
      </Card>
    </Stack>
  );
}

from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

from config import get_config, logger

config = get_config()

# Empty means the shared OTel Collector isn't configured for this
# environment (e.g. minikube, or plain docker-compose) -- same
# graceful-absence shape as adapters/queue's QUEUE_AVAILABLE, checked once
# at startup rather than crashing if unset.
OTEL_AVAILABLE = bool(config.OTEL_EXPORTER_OTLP_ENDPOINT)


def setup_telemetry(app) -> None:
    """Traces + metrics go to the shared, cluster-wide OTel Collector
    (terraform/observability), which fans them out to Tempo and Prometheus
    -- this app never talks to Tempo/Prometheus directly. Logging
    instrumentation ships nothing itself; it only injects trace_id/span_id
    into existing log records (still just print()'d to stdout) so they
    correlate with traces once Grafana has both Loki and Tempo as
    datasources. Must be called once, before the app starts serving."""
    if not OTEL_AVAILABLE:
        logger.info("OTEL_EXPORTER_OTLP_ENDPOINT not set -- telemetry disabled")
        return

    resource = Resource.create({"service.name": config.OTEL_SERVICE_NAME})
    endpoint = config.OTEL_EXPORTER_OTLP_ENDPOINT.rstrip("/")

    tracer_provider = TracerProvider(resource=resource)
    tracer_provider.add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{endpoint}/v1/traces"))
    )
    trace.set_tracer_provider(tracer_provider)

    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=f"{endpoint}/v1/metrics")
    )
    metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=[metric_reader]))

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument()
    RequestsInstrumentor().instrument()
    LoggingInstrumentor().instrument(set_logging_format=True)

    logger.info(f"Telemetry enabled -- exporting to {endpoint}")

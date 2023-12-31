import { Component, ElementRef, ViewChild, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Chart } from 'chart.js';
import html2canvas from 'html2canvas';

interface Point {
    PunktDimension0: number;
    PunktDimension1: number;
    ZentDimension0: number;
    ZentDimension1: number;
}

interface GroupedPoints {
    ZentDimension0: number;
    ZentDimension1: number;
    points: Point[];
}


@Component({
    selector: 'app-charts',
    templateUrl: './charts.component.html',
    styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit, OnChanges {
    // Deklaration von Klassenvariablen und Interfaces

    @ViewChild('chartContainer') chartContainer!: ElementRef;
    // Referenz zum HTML-Element "chartContainer"

    data: any;
    options: any;
    @Input() apiResponse: any;
    // Eingangsparameter apiResponse

    sortedApiResponse: any;
    @Input() localResponse: any;
    // Eingangsparameter localResponse

    sortedLocalResponse: any;
    public chart: any;
    datasets: any = [];

    // Event-Handler für Änderungen
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['apiResponse'].currentValue !== undefined) {
            // Wenn sich der Eingangsparameter apiResponse geändert hat

            if (this.apiResponse.cluster) {
                // Wenn die apiResponse Clusterinformationen enthält
                console.log(this.apiResponse)
                this.sortedLocalResponse = this.apiResponse;
                this.generateLocalDatasets()
                if (this.chart) {
                    this.chart.destroy()
                }
                this.renderChart()
            }
            else {
                // Wenn apiResponse keine Clusterinformationen enthält
                console.log(this.apiResponse)
                this.sortedApiResponse = this.groupPointsByZentDimensions(this.apiResponse);
                this.generateAPIDatasets()
                if (this.chart) {
                    this.chart.destroy()
                }
                this.renderChart()
            }

        }
    }

    ngOnInit() {

    }

    // Funktion zum Herunterladen des Charts als JPEG
    downloadChart() {
        const chartContainerElement = this.chartContainer.nativeElement;

        html2canvas(chartContainerElement).then((canvas) => {
            const downloadLink = document.createElement('a');

            downloadLink.href = canvas.toDataURL('image/jpeg');

            downloadLink.download = 'chart.jpg';

            document.body.appendChild(downloadLink);
            downloadLink.click();

            document.body.removeChild(downloadLink);
        });
    }

    // Funktion zum Gruppieren von Punkten nach Zentroid-Dimensionen
    groupPointsByZentDimensions(data: any): GroupedPoints[] {
        const groupedPointsMap = new Map<string, GroupedPoints>();

        const avgDistance = parseFloat(data[0].avgDistance);
        const k = parseInt(data[0].k, 10);
        const pointsArray = data[1] as Point[];

        for (const point of pointsArray) {
            const key = `${point.ZentDimension0},${point.ZentDimension1}`;
            if (groupedPointsMap.has(key)) {
                groupedPointsMap.get(key)!.points.push(point);
            } else {
                groupedPointsMap.set(key, { ZentDimension0: point.ZentDimension0, ZentDimension1: point.ZentDimension1, points: [point] });
            }
        }

        const groupedPoints: GroupedPoints[] = [];
        for (const group of groupedPointsMap.values()) {
            groupedPoints.push(group);
        }

        console.log(groupedPoints)
        return groupedPoints;
    }

    // Funktion zum Rendern des Charts
    renderChart() {
        this.chart = new Chart('Chart', {
            type: 'scatter',
            data: {
                datasets: this.datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'K-Means Clustering'
                    }
                }
            },
        })
    }

    generateAPIDatasets(): void {
        this.datasets = []
        const centroids: any[] = []
        const clusterArray: any[] = []
        console.log("sortedApiResponse", this.sortedApiResponse)
        this.sortedApiResponse.map((cluster: any) => {
            const dataset: any = {
                label: 'Cluster',
                data: cluster.points,
                parsing: {
                    xAxisKey: 'PunktDimension0',
                    yAxisKey: 'PunktDimension1',
                }
            }
            let centroid = {
                'PunktDimension0': cluster.ZentDimension0,
                'PunktDimension1': cluster.ZentDimension1
            }
            centroids.push(centroid)
            clusterArray.push(dataset)
        })
        const centroidDataset: any = {
            label: 'Centroids',
            data: centroids,
            parsing: {
                xAxisKey: 'PunktDimension0',
                yAxisKey: 'PunktDimension1',
            },
            pointStyle: 'rectRot',
            radius: 10
        }
        this.datasets.push(centroidDataset)
        clusterArray.map(cluster => {
            this.datasets.push(cluster)
        })
        console.log(this.datasets)
    }

    generateLocalDatasets(): void {
        this.datasets = []
        const centroids: any[] = []
        const clusterArray: any[] = []
        this.sortedLocalResponse.cluster.map((cluster: any) => {
            const dataset: any = {
                label: 'Cluster ' + (cluster.clusterNr + 1),
                data: cluster.points
            }
            centroids.push(cluster.centroid)
            clusterArray.push(dataset)
        })
        const centroidDataset: any = {
            label: 'Centroids',
            data: centroids,
            pointStyle: 'rectRot',
            radius: 10
        }
        this.datasets.push(centroidDataset)
        clusterArray.map(cluster => {
            this.datasets.push(cluster)
        })
    }

}

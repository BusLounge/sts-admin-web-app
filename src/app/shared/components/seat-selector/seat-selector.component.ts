import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seat-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selector.component.html',
  styleUrls: ['./seat-selector.component.scss']
})
export class SeatSelectorComponent implements OnInit, OnChanges {
  @Input() totalRows: number = 5;
  @Output() seatMapChange = new EventEmitter<boolean[][]>();

  seatMap: boolean[][] = [];
  seatsPerRow = 6; // 3 left + 3 right

  ngOnInit() {
    this.initializeSeatMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalRows']) {
      this.initializeSeatMap();
    }
  }

  initializeSeatMap() {
    // Initialize with all seats selected by default
    this.seatMap = Array(this.totalRows).fill(null).map(() =>
      Array(this.seatsPerRow).fill(true)
    );
    this.emitSeatMap();
  }

  toggleSeat(rowIndex: number, seatIndex: number) {
    this.seatMap[rowIndex][seatIndex] = !this.seatMap[rowIndex][seatIndex];
    this.emitSeatMap();
  }

  emitSeatMap() {
    this.seatMapChange.emit([...this.seatMap.map(row => [...row])]);
  }

  getRowLabel(rowIndex: number): string {
    // Convert 0-based index to alphabetic label (A, B, C...)
    if (rowIndex < 26) {
      return String.fromCharCode(65 + rowIndex);
    }
    // For rows > 26, use AA, AB, etc.
    const firstLetter = String.fromCharCode(65 + Math.floor(rowIndex / 26) - 1);
    const secondLetter = String.fromCharCode(65 + (rowIndex % 26));
    return firstLetter + secondLetter;
  }

  isSeatSelected(rowIndex: number, seatIndex: number): boolean {
    return this.seatMap[rowIndex]?.[seatIndex] ?? false;
  }

  getSeatPositionClass(seatIndex: number): string {
    if (seatIndex === 0 || seatIndex === 5) return 'window-seat';
    if (seatIndex === 2 || seatIndex === 3) return 'aisle-seat';
    return 'middle-seat';
  }

  getTotalSeats(): number {
    return this.seatMap.reduce((total, row) =>
      total + row.filter(seat => seat).length, 0
    );
  }
}

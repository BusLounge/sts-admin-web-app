package main
import ("database/sql"; "fmt"; "os"; _ "github.com/lib/pq")
func main() {
db, _ := sql.Open("postgres", os.Getenv("DATABASE_URL"))
defer db.Close()
var busNum string
query := `SELECT CASE 
WHEN bus.bus_number IS NOT NULL AND bus.bus_number != '' THEN bus.bus_number
ELSE 'BUS-' || SUBSTRING(st.id::text, 1, 8)
END as bus_number
FROM scheduled_trips st LEFT JOIN buses bus ON st.permit_id = bus.permit_id LIMIT 1`
db.QueryRow(query).Scan(&busNum)
fmt.Printf("Bus Number: '%s'\n", busNum)
}
